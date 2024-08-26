import { dbGet, dbPrepare, dbRun, dbTransaction } from "../db.js";

export function insertDraftData(league) {
  dbTransaction(() => {
    const leagueKey = league.leagueKey;

    insertDraftLeague(league);

    for (const team of league.teams) {
      insertDraftTeam({ leagueKey, ...team });
    }

    for (const selection of league.draftResults) {
      insertDraftSelection(selection);
    }
  })();
}

const updateAccessTimeStatement = dbPrepare(`
  update draft_league
  set last_accessed=@lastAccessed
  where league_key=@leagueKey
`);

function updateAccessTime(leagueKey) {
  const lastAccessed = Date.now();
  dbRun(updateAccessTimeStatement, { leagueKey, lastAccessed });
}

const hasLeagueDataStatement = dbPrepare(`
  select
    exists(
      select 1 from draft_league 
      where league_key=@leagueKey
    ) as present
`);

export function hasLeagueData(leagueKey) {
  const { present } = dbGet(hasLeagueDataStatement, { leagueKey });
  return present === 1;
}

const getLeagueAccessTimesStatement = dbPrepare(`
  select
    league_key as "leagueKey",
    last_accessed as "lastAccessed"
  from draft_league  
`);

function getLeagueAccessTimes() {
  return getLeagueAccessTimesStatement.all();
}

const insertDraftLeagueStatement = dbPrepare(`
  insert into draft_league 
    (league_key, league_id, league_name, league_logo, draft_status, draft_time, last_accessed)
    values (@leagueKey, @leagueId, @leagueName, @leagueLogo, @draftStatus, @draftTime, @lastAccessed)
`);

function insertDraftLeague(league) {
  const lastAccessed = Date.now();
  return dbRun(insertDraftLeagueStatement, { lastAccessed, ...league });
}

const insertDraftTeamStatement = dbPrepare(`
  insert into draft_team
    (team_key, team_key, team_name, draft_position, team_logo, league_key)
    values (@teamKey, @teamKey, @teamName, @draftPosition, @teamLogo, @leagueKey)
`);

function insertDraftTeam(team) {
  return dbRun(insertDraftTeamStatement, team);
}

const insertDraftSelectionStatement = dbPrepare(`
  insert into draft_selection
    (team_key, player_id, pick, round)
    values (@teamKey, @playerId, @pick, @round)
`);

function insertDraftSelection(selection, leagueKey) {
  const transaction = dbTransaction((s) => {
    dbRun(insertDraftSelectionStatement, s);
    updateAccessTime(s.leagueKey);
  });
  return transaction({ leagueKey, ...selection });
}

setInterval(() => {
  const leagueAccessTimes = getLeagueAccessTimes();
  for (const { leagueKey, lastAccessed } of leagueAccessTimes) {
    const expired = lastAccessed + 3 * 3600 * 1000 < Date.now(); // allow 3 hours between accesses
    console.log(
      `League key: ${leagueKey}, Last accessed: ${lastAccessed}, Expired: ${expired}`
    );
  }
}, 1 * 60 * 1000); // Every 1 minutes

const getDraftLeagueStatement = dbPrepare(`
  select
    league_key as "leagueKey",
    league_name as "leagueName",
    league_id as "leagueId",
    league_logo as "leagueLogo",
    draft_status as "draftStatus",
    draft_time as "draftTime"
  from draft_league
  where league_key=@leagueKey
`);

export function getDraftData(leagueKey) {
  const league = dbGet(getDraftLeagueStatement, { leagueKey });
  return league;
}

// return {
//   leagueName: l.name,
//   leagueId: l.league_id,
//   leagueLogo: l.logo_url,
//   // possible values: predraft, draft, postdraft
//   draftStatus: l.draft_status,
//   draftTime: settings.draft_time * 1000,
//   rosterPositions: settings.roster_positions.map((p) => p.roster_position),
//   leagueKey,
//   teams: l.teams.map((t) => {
//     const team = t.team;
//     return {
//       name: team.name,
//       teamId: parseInt(team.team_id),
//       teamKey: team.team_key,
//       draftPosition: team.draft_position,
//       teamLogo: team.team_logos[0].team_logo.url,
//     };
//   }),
//   draftResults: l.draft_results.map((d) => {
//     const { pick, round, playerKey, teamKey } = d.draft_result;
//     const [gameId, l, leagueId, ...teamValues] = teamKey;
//     const playerId = playerKey.split(".").at(-1);
//     return {
//       pick,
//       round,
//       leagueKey: [gameId, l, leagueId].join("."),
//       teamId: teamValues[1],
//       playerId,
//     };
//   }),
// };
