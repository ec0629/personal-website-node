import { dbGet, dbPrepare, dbRun, dbTransaction } from "../db.js";

export function insertDraftData(league) {
  dbTransaction(() => {
    const leagueKey = league.leagueKey;

    insertDraftLeague(league);

    for (const team of league.teams) {
      insertDraftTeam({ leagueKey, ...team });
    }

    for (const selection of league.draftSelections) {
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
      where league_key=?
    ) as present
`);

export function hasLeagueData(leagueKey) {
  const { present } = dbGet(hasLeagueDataStatement, leagueKey);
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
    (league_key, league_id, league_name, league_logo, draft_status, draft_time, total_draft_rounds, last_accessed)
    values (@leagueKey, @leagueId, @leagueName, @leagueLogo, @draftStatus, @draftTime, @totalDraftRounds, @lastAccessed)
`);

function insertDraftLeague(league) {
  const lastAccessed = Date.now();
  return dbRun(insertDraftLeagueStatement, { lastAccessed, ...league });
}

const insertDraftTeamStatement = dbPrepare(`
  insert into draft_team
    (team_key, team_key, team_id, team_name, draft_position, team_logo, league_key)
    values (@teamKey, @teamKey, @teamId, @teamName, @draftPosition, @teamLogo, @leagueKey)
`);

function insertDraftTeam(team) {
  return dbRun(insertDraftTeamStatement, team);
}

const insertDraftSelectionStatement = dbPrepare(`
  insert into draft_selection
    (league_key, team_key, player_id, pick, round)
    values (@leagueKey, @teamKey, @playerId, @pick, @round)
`);

function insertDraftSelection(selection, leagueKey) {
  const transaction = dbTransaction((s) => {
    dbRun(insertDraftSelectionStatement, s);
    updateAccessTime(s.leagueKey);
  });
  return transaction({ leagueKey, ...selection });
}

const deleteLeagueStatement = dbPrepare(`
  delete from draft_league where league_key=?  
`);

function deleteLeague(leagueKey) {
  dbRun(deleteLeagueStatement, leagueKey);
}

setInterval(() => {
  const leagueAccessTimes = getLeagueAccessTimes();
  for (const { leagueKey, lastAccessed } of leagueAccessTimes) {
    const expired = lastAccessed + 3 * 3600 * 1000 < Date.now(); // allow 3 hours between accesses
    if (expired) {
      console.log(
        `Deleting league with key: ${leagueKey}, last accessed: ${new Date(
          lastAccessed
        ).toISOString()}`
      );
      deleteLeague(leagueKey);
    }
  }
}, 15 * 60 * 1000); // Every 1 minutes

const getDraftLeagueStatement = dbPrepare(`
  select
    league_key as "leagueKey",
    league_name as "leagueName",
    league_id as "leagueId",
    league_logo as "leagueLogo",
    draft_status as "draftStatus",
    draft_time as "draftTime",
    total_draft_rounds as "totalDraftRounds"
  from draft_league
  where league_key=?
`);

const getDraftTeamsStatement = dbPrepare(`
  select
    league_key as "leagueKey",
    team_key as "teamKey",
    team_name as "teamName",
    team_logo as "teamLogo",
    draft_position as "draftPosition"
  from draft_team
  where league_key=?
`);

const getDraftSelectionsStatement = dbPrepare(`
  select
    ds.team_key as "teamKey",
    ds.pick,
    ds.round,
    p.first_name as "firstName",
    p.last_name as "lastName",
    p.image_url as "imageUrl",
    pp.abbr as "position",
    t.abbr as "teamAbbr",
    t.name as "teamName"
  from draft_selection as ds
  join player as p on p.id=ds.player_id
  join nfl_team as t on t.id=p.team_id
  join player_position as pp on pp.id=p.position_id
  where ds.league_key=?
  order by ds.pick
`);

export function getDraftData(leagueKey) {
  const league = dbGet(getDraftLeagueStatement, leagueKey);
  const teams = getDraftTeamsStatement.all(leagueKey);
  const draftSelections = getDraftSelectionsStatement.all(leagueKey);
  league.teams = teams;
  league.draftSelections = draftSelections;

  return league;
}
