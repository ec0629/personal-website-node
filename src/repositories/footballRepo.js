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
  insert into yahoo_player_data (player_id, adp, rank, calculated_rank, created_on)
    values (@playerId, @adp, @rank, @calculatedRank, @createdOn)
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

export function getPlayerRankingsAndADP(orderBy, direction, leagueKey) {
  return dbPrepare(`
    select
      etr.player_id as "playerId",
      etr.rank as "etrRank",
      round(ds_count.count - etr.rank) as "etrRankVsPick",
      ud.adp as "udAdp",
      round(ds_count.count - ud.adp) as "udAdpVsPick",
      y.adp as "yahooAdp",
      round(ds_count.count - y.adp) as "yahooAdpVsPick",
      y.calculated_rank as "yahooRank",
      round(ds_count.count - y.calculated_rank) as "yahooRankVsPick",
      concat_ws(' ', p.first_name, p.last_name) as "name",
      pos.abbr as "position",
      lower(pos.abbr) as "positionClass",
      y.calculated_rank - etr.rank as "rankDiff",
      round(y.adp - ud.adp, 1) as "adpDiff",
      ds.pick as selected,
      ds_count.count as "currentPick"
    from etr_player_data as etr
    join yahoo_player_data as y on etr.player_id=y.player_id
    join player as p on etr.player_id=p.id
    join player_position as pos on p.position_id=pos.id
    left join underdog_player_data as ud on etr.player_id=ud.player_id
    left join draft_selection as ds on ds.league_key=@leagueKey and ds.player_id=etr.player_id
    left join (
      select
        count(*) + 1 as count
      from draft_selection
      where league_key=@leagueKey
    ) as ds_count
    where ds.pick is null
    order by ${orderBy} ${direction}
    `).all({ leagueKey });
}
