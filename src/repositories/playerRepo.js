import { dbPrepare } from "../db.js";

const insertPlayerProfileStatement = dbPrepare(`
  insert into player (id, first_name, last_name, uniform_number, image_url, team_id, position_id)
    values (@playerId, @firstName, @lastName, @uniformNumber, @imageUrl, @teamId, @positionId)
`);

export function insertPlayerProfile(data) {
  return insertPlayerProfileStatement.run(data);
}

const insertYahooADPStatement = dbPrepare(`
  insert into player_adp (player_id, adp, source)
    values (@playerId, @adp, 'yahoo')
`);

export function insertYahooADP(data) {
  return insertYahooADPStatement.run(data);
}

const insertYahooRankStatement = dbPrepare(`
  insert into player_rank (player_id, rank, source)
    values (@playerId, @rank, 'yahoo')
`);

export function insertYahooRank(data) {
  return insertYahooRankStatement.run(data);
}
