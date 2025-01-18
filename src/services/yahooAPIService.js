import {
  getDraftData,
  getDraftSelectionsAfterPick,
  getPreviousDraftPickNumber,
  hasLeagueData,
  insertBulkDraftSelections,
  insertDraftData,
} from "../repositories/draftRepo.js";

// Delete this segment, just used for demonstration
let simulatedDraftResultsIncrement = 0;

export async function getDraftUpdatesFromApi(leagueKey, client) {
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey};out=draftresults,teams?format=json_f`;

  const response = await client.fetchJson(url);

  const { league: l } = response.fantasy_content;

  const previousPickNumber = getPreviousDraftPickNumber(leagueKey) ?? 0;

  const draftResults = l.draft_results.filter((ds) => {
    if (ds.draft_result.player_key) {
      return true;
    }
    return false;
  });

  // Delete this segment, just used for demonstration
  if (draftResults.length > previousPickNumber) {
    simulatedDraftResultsIncrement = previousPickNumber;
    simulatedDraftResultsIncrement += 1;
  }

  const newDraftSelections = draftResults
    .slice(previousPickNumber, simulatedDraftResultsIncrement)
    .map((d) => {
      const { pick, round, player_key, team_key } = d.draft_result;

      const [gameId, l, leagueId] = team_key.split(".");
      const playerId = player_key.split(".").at(-1);
      return {
        pick,
        round,
        leagueKey: [gameId, l, leagueId].join("."),
        teamKey: team_key,
        playerId,
      };
    });

  insertBulkDraftSelections(newDraftSelections);
  const selections = getDraftSelectionsAfterPick(leagueKey, previousPickNumber);

  return selections;
}

export function findTeamIndexFromPick(totalPreviousPicks, numTeams) {
  const round = Math.ceil((totalPreviousPicks + 1) / numTeams);

  const index = totalPreviousPicks % numTeams;
  const upperBound = numTeams - 1;

  if (round % 2 === 0) {
    return upperBound - index;
  } else {
    return index;
  }
}

export async function getLeagueDraftData(leagueKey, client) {
  let league;

  if (hasLeagueData(leagueKey)) {
    league = getDraftData(leagueKey);
  } else {
    const response = await getLeagueDraftDataFromApi(leagueKey, client);
    insertDraftData(response);
    league = getDraftData(leagueKey);
  }

  const numTeams = league.teams.length;

  league.totalPreviousPicks = league.draftSelections.length;
  league.currentPickNum = league.draftSelections.length + 1;
  league.totalPicksInDraft = league.totalDraftRounds * numTeams;
  const teamIndexVal = findTeamIndexFromPick(
    league.totalPreviousPicks,
    numTeams
  );
  league.currentTeamName = league.teams[teamIndexVal].teamName;

  return league;
}

export async function getLeagueDraftDataFromApi(leagueKey, client) {
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey};out=settings,draftresults,teams?format=json_f`;

  const response = await client.fetchJson(url);

  const { league: l } = response.fantasy_content;
  const { settings, draft_results } = response.fantasy_content.league;
  const draftResults = draft_results.filter((ds) => {
    console.log(ds);
    if (ds.draft_result.player_key) {
      return true;
    }
    return false;
  });

  return {
    leagueName: l.name,
    leagueId: l.league_id,
    leagueLogo: l.logo_url,
    draftStatus: l.draft_status, // possible values: predraft, draft, postdraft
    draftTime: settings.draft_time * 1000,
    totalDraftRounds: settings.roster_positions.reduce(
      (count, { roster_position: rp }) =>
        rp.position !== "IR" ? count + rp.count : count,
      0
    ),
    leagueKey,
    teams: l.teams.map((t) => {
      const team = t.team;
      return {
        teamName: team.name,
        teamId: parseInt(team.team_id),
        teamKey: team.team_key,
        draftPosition: team.draft_position,
        teamLogo: team.team_logos[0].team_logo.url,
      };
    }),
    draftSelections: draftResults
      .filter((ds) => ds.player_key)
      .map((d) => {
        const { pick, round, player_key, team_key } = d.draft_result;
        const [gameId, l, leagueId] = team_key.split(".");
        const playerId = player_key.split(".").at(-1);
        return {
          pick,
          round,
          leagueKey: [gameId, l, leagueId].join("."),
          teamKey: team_key,
          playerId,
        };
      }),
  };
}

export async function getUsersLeaguesAndTeams(client) {
  const url =
    "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;seasons=2024;is_available=1;game_codes=nfl/leagues;out=settings/teams?format=json_f";

  const response = await client.fetchJson(url);

  const userInfo = response?.fantasy_content?.users[0]?.user;

  if (!userInfo) {
    throw new Error("No user information provided by request.");
  }

  // TODO: can i insert the leagues into the database here???
  return userInfo?.games[0]?.game?.leagues.map((l) => {
    const { draft_status, league_id, league_key, name, settings, teams } =
      l.league;
    const team = teams[0].team;
    return {
      leagueId: league_id,
      leagueKey: league_key,
      leagueName: name,
      draftStatus: draft_status,
      draftTime: settings.draft_time,
      team: {
        name: team.name,
        teamId: team.team_id,
        logoUrl: team.team_logos[0]?.team_logo?.url,
        draftPosition: team.draft_position,
      },
    };
  });
}
