import { dbPrepare, dbRun } from "../db.js";

const insertPlayerProfileStatement = dbPrepare(`
  insert into player (id, first_name, last_name, uniform_number, image_url, team_id, position_id)
    values (@playerId, @firstName, @lastName, @uniformNumber, @imageUrl, @teamId, @positionId)
`);

export function insertPlayerProfile(data) {
  return dbRun(insertPlayerProfileStatement, data);
}

const insertYahooADPStatement = dbPrepare(`
  insert into player_adp (player_id, adp, source, created_on)
    values (@playerId, @adp, 'yahoo', @createdOn)
`);

export function insertYahooADP(data) {
  return dbRun(insertYahooADPStatement, data);
}

const insertUnderdogADPStatement = dbPrepare(`
  insert into player_adp (player_id, adp, source, created_on)
    values (@playerId, @adp, 'underdog', @createdOn)
`);

export function insertUnderdogADP(data) {
  return dbRun(insertUnderdogADPStatement, data);
}

const insertYahooRankStatement = dbPrepare(`
  insert into player_rank (player_id, rank, source, created_on)
    values (@playerId, @rank, 'yahoo', @createdOn)
`);

export function insertYahooRank(data) {
  return dbRun(insertYahooRankStatement, data);
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

const getAllPlayerNamesAndIdsStatement = dbPrepare(`
  SELECT id, first_name as "firstName", last_name as "lastName", position_id as "positionId" from player
  `);

export function getAllPlayerNamesAndIds() {
  return getAllPlayerNamesAndIdsStatement.all();
}
