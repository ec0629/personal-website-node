import { dbPrepare, dbRun } from "../db.js";

const insertPlayerProfileStatement = dbPrepare(`
  insert into player 
    (id, first_name, last_name, name_matcher, uniform_number, image_url, team_id, position_id)
    values (@playerId, @firstName, @lastName, @nameMatcher, @uniformNumber, @imageUrl, @teamId, @positionId)
`);

export function insertPlayerProfile(data) {
  return dbRun(insertPlayerProfileStatement, data);
}

const insertYahooADPStatement = dbPrepare(`
  insert into yahoo_player_data (player_id, adp, rank, created_on)
    values (@playerId, @adp, @rank, @createdOn)
`);

export function insertYahooData(data) {
  return dbRun(insertYahooADPStatement, data);
}

const insertUnderdogDataStatement = dbPrepare(`
  insert into underdog_player_data (player_id, adp, created_on)
    values (@playerId, @adp, @createdOn)
`);

export function insertUnderdogData(data) {
  return dbRun(insertUnderdogDataStatement, data);
}

const insertEtrDataStatement = dbPrepare(`
  insert into etr_player_data (player_id, rank, created_on)
    values (@playerId, @rank, @createdOn)
`);

export function insertEtrData(data) {
  return dbRun(insertEtrDataStatement, data);
}

const getAllNFLTeamsStatement = dbPrepare(`
  SELECT id, name, abbr FROM nfl_team
  `);

export function getAllNFLTeams() {
  return getAllNFLTeamsStatement.all();
}

const getAllPlayerPositionsStatement = dbPrepare(`
  SELECT id, abbr FROM player_position
  `);

export function getAllPlayerPositions() {
  return getAllPlayerPositionsStatement.all();
}

const getPlayerIdFromNameIdStatement = dbPrepare(`
  SELECT id FROM player WHERE name_matcher=? 
  `);

export function getPlayerIdFromNameMatcher(nameMatcher) {
  return getPlayerIdFromNameIdStatement.all(nameMatcher);
}
