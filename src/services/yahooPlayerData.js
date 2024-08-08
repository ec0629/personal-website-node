import { dbTransaction } from "../db.js";
import { positionEnum, teamEnum } from "../enums.js";
import {
  insertPlayerProfile,
  insertYahooADP,
} from "../repositories/playerRepo.js";

const yahooUrl =
  "https://pub-api-ro.fantasysports.yahoo.com/fantasy/v2/league/449.l.public/players;position=ALL;start=0;count=500;sort=rank_season;out=ranks;ranks=season/draft_analysis?format=json_f";

async function getYahooPlayerData() {
  let response = await fetch(yahooUrl);

  if (!response.ok) {
    throw new Error("Yahoo request error.");
  }

  response = await response.json();
  return response["fantasy_content"]["league"]["players"];
}

function extractPlayerData({ player }) {
  const p = {
    playerId: player["player_id"],
    firstName: player["name"]["first"],
    teamName: player["editorial_team_full_name"],
    teamAbbr: player["editorial_team_abbr"],
    lastName: player["name"]["last"],
    adp: player["draft_analysis"]["average_pick"],
    adpRound: player["draft_analysis"]["average_round"],
    positionAbbr: player["primary_position"],
    uniformNumber: player["uniform_number"] || null,
    rank: player["player_ranks"][0]["player_rank"]["rank_value"],
    imageUrl: player["image_url"],
    positionId: positionEnum[player["primary_position"]],
    teamId: teamEnum[player["editorial_team_abbr"]],
  };

  if (p.positionAbbr == "DEF" && p.lastName === null) {
    p.lastName = p.teamName.replace(p.firstName, "").trim();
  }

  return p;
}

console.log("Beginning Yahoo db population...");
const playerResponse = await getYahooPlayerData();
console.log("Received player data from Yahoo...");
const players = playerResponse.map(extractPlayerData);
const playerProfileBulkInsert = dbTransaction((players) => {
  for (const player of players) {
    insertPlayerProfile(player);
    insertYahooADP(player);
  }
});
playerProfileBulkInsert(players);
console.log("Data successfully populated.");
