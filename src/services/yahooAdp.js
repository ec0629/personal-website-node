const yahooUrl =
  "https://pub-api-ro.fantasysports.yahoo.com/fantasy/v2/league/423.l.public/players;position=ALL;start=0;count=500;sort=rank_season;out=ranks;ranks=season/draft_analysis?format=json_f";

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
    first_name: player["name"]["first"],
    team_name: player["editorial_team_full_name"],
    team_abbr: player["editorial_team_abbr"],
    last_name: player["name"]["last"],
    adp: player["draft_analysis"]["average_pick"],
    adp_round: player["draft_analysis"]["average_round"],
    position_abbr: player["primary_position"],
    uniform_number: player["uniform_number"] || "-",
    rank: player["player_ranks"][0]["player_rank"]["rank_value"],
    image_url: player["image_url"],
  };

  if (p["position_abbr"] == "DEF" && p["last_name"] === null) {
    p["last_name"] = p["team_name"].replace(p["first_name"], "").trim();
  }

  return p;
}

const playerResponse = await getYahooPlayerData();
const players = playerResponse.map(extractPlayerData);
console.log(players);
