import { importJWK, jwtVerify } from "jose";
import oauth from "./oauth.js";
import {
  getDraftData,
  getDraftSelectionsAfterPick,
  getPreviousDraftPickNumber,
  hasLeagueData,
  insertBulkDraftSelections,
  insertDraftData,
} from "../repositories/draftRepo.js";

let index; // delete this line later

export function getYahooOAuthConfig() {
  return {
    clientId: process.env.YAHOO_CLIENT_ID_OIDC,
    clientSecret: process.env.YAHOO_CLIENT_SECRET_OIDC,
    redirectUri: process.env.REDIRECT_URI,
  };
}

export function getYahooAuthorizationUrl() {
  return oauth.getAuthorizationUrl(getYahooOAuthConfig());
}

export function requestYahooAccessToken(code) {
  const config = getYahooOAuthConfig();
  return oauth.requestAccessToken({ code, ...config });
}

export async function getDraftUpdatesFromApi(leagueKey, client) {
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey};out=draftresults,teams?format=json_f`;

  const response = await client.fetchJson(url);

  const { league: l } = response.fantasy_content;

  const previousPickNumber = getPreviousDraftPickNumber(leagueKey) ?? 0;

  const randomNumber = 1; // Math.floor(Math.random() * 3) + 1; // delete this line later
  index = previousPickNumber + randomNumber; // delete this line later

  const draftResults = l.draft_results.slice(0, index); // delete this slice call later

  const newDraftSelections = draftResults.slice(previousPickNumber).map((d) => {
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

  const teamsOrderedByDraftPosition = l.teams
    .map((t) => t.team)
    .sort((a, b) => a.draft_position - b.draft_position);

  insertBulkDraftSelections(newDraftSelections);
  const selections = getDraftSelectionsAfterPick(leagueKey, previousPickNumber);
  const totalPreviousPicks = draftResults.length;
  const currentPickNum = totalPreviousPicks + 1;
  const teamIndex = findTeamIndexFromPick(totalPreviousPicks, l.teams.length);
  const currentTeam = teamsOrderedByDraftPosition[teamIndex];
  const currentTeamName = currentTeam.name;
  return { selections, currentPickNum, currentTeamName };
}

function findTeamIndexFromPick(totalPreviousPicks, numTeams) {
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
  index = getPreviousDraftPickNumber(leagueKey) ?? 0; // delete this line

  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey};out=settings,draftresults,teams?format=json_f`;

  const response = await client.fetchJson(url);

  const { league: l } = response.fantasy_content;
  const { settings } = response.fantasy_content.league;

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
    draftSelections: l.draft_results.slice(0, index).map((d) => {
      // delete the slice here later
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

export async function verifyYahooJwtAndDecode(token) {
  const jwksUrl = "https://api.login.yahoo.com/openid/v1/certs";

  const response = await fetch(jwksUrl);

  if (!response.ok) {
    // TODO: YAHOO_ERROR?
    const message = await response.text();
    throw new Error(
      `Response message: ${message}. Response status: ${response.status}`
    );
  }

  const jwks = await response.json();

  const [encodedTokenHeader] = token.split(".");

  const decodedTokenHeader = JSON.parse(
    Buffer.from(encodedTokenHeader, "base64").toString("utf8")
  );
  const kid = decodedTokenHeader.kid;

  const jwk = jwks.keys.find((key) => key.kid === kid);

  if (!jwk) {
    throw new Error("Public key not found in JWKS");
  }

  const key = await importJWK(jwk, jwk.alg);

  const { payload } = await jwtVerify(token, key);

  return payload;
}
