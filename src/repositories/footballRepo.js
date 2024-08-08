import { dbPrepare } from "../db.js";

const insertPlayerProfileStatement = dbPrepare(`
  insert into player (id, first_name, last_name, uniform_number, image_url, team_id, position_id)
    values (@playerId, @firstName, @lastName, @uniformNumber, @imageUrl, @teamId, @positionId)
`);

export function insertPlayerProfile(data) {
  return run(insertPlayerProfileStatement, data);
}

const insertYahooADPStatement = dbPrepare(`
  insert into player_adp (player_id, adp, source)
    values (@playerId, @adp, 'yahoo')
`);

export function insertYahooADP(data) {
  return run(insertYahooADPStatement, data);
}

const insertYahooRankStatement = dbPrepare(`
  insert into player_rank (player_id, rank, source)
    values (@playerId, @rank, 'yahoo')
`);

export function insertYahooRank(data) {
  return run(insertYahooRankStatement, data);
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

function run(stmt, data) {
  return stmt.run(data);
}
