import { dbTransaction } from "../db.js";
import { nflTeams, playerPositions } from "../dbMaps.js";
import {
  insertPlayerProfile,
  insertYahooData,
} from "../repositories/footballRepo.js";
import { createNameMatcher } from "../utils.js";

const yahooUrl =
  "https://pub-api-ro.fantasysports.yahoo.com/fantasy/v2/league/449.l.public/players;position=ALL;start=0;count=750;sort=rank_season;out=ranks;ranks=season/draft_analysis?format=json_f";

async function getYahooPlayerData() {
  let response = await fetch(yahooUrl);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Yahoo player api error: ${message}`);
  }

  response = await response.json();
  return response["fantasy_content"]["league"]["players"];
}

function extractPlayerData({ player }, idx) {
  const calculatedRank = idx + 1;
  const positionAbbr = player["primary_position"];
  const teamAbbr = player["editorial_team_abbr"];
  const teamName = player["editorial_team_full_name"];
  const positionId = playerPositions.get(positionAbbr);
  const teamId = nflTeams.get(teamAbbr);

  const firstName = player["name"]["first"];
  let lastName = player["name"]["last"];

  if (positionAbbr == "DEF" && lastName === null) {
    lastName = teamName.replace(firstName, "").trim();
  }

  const nameMatcher = createNameMatcher(firstName.concat(lastName));

  const rank = player["player_ranks"][0]["player_rank"]["rank_value"];
  const adp = parseFloat(player["draft_analysis"]["average_pick"]) || null;

  const p = {
    playerId: player["player_id"],
    firstName,
    lastName,
    nameMatcher,
    teamName,
    teamAbbr,
    adp,
    adpRound: player["draft_analysis"]["average_round"],
    positionAbbr,
    uniformNumber: player["uniform_number"] || null,
    rank,
    calculatedRank,
    imageUrl: player["image_url"],
    positionId,
    teamId,
  };

  if (Math.abs(rank - calculatedRank) > 1) {
    console.warn(
      `Rank differential calculated: ${firstName} ${lastName} rank=${rank}, calculatedRank=${calculatedRank}`
    );
  }

  return p;
}

console.log("Beginning Yahoo db population...");
const playerResponse = await getYahooPlayerData();
console.log("Received player data from Yahoo...");
const players = playerResponse.map(extractPlayerData);
const createdOn = new Date().toISOString();
const playerProfileBulkInsert = dbTransaction((players) => {
  for (const player of players) {
    insertPlayerProfile(player);
    insertYahooData({ ...player, createdOn });
  }
});
playerProfileBulkInsert(players);
console.log("Data successfully populated.");
