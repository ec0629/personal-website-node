import {
  getAllNFLTeams,
  getAllPlayerPositions,
} from "./repositories/footballRepo.js";

const nflTeams = new Map();
for (const { id, abbr } of getAllNFLTeams()) {
  nflTeams.set(abbr, id);
}

const playerPositions = new Map();
for (const { id, abbr } of getAllPlayerPositions()) {
  playerPositions.set(abbr, id);
}

const tableMetaData = [
  {
    id: "name",
    headerName: "Name",
    orderBy: "p.last_name, p.first_name",
  },
  {
    id: "pos",
    headerName: "Position",
    orderBy: "position",
  },
  {
    id: "etr_rank",
    headerName: "ETR Rank",
    orderBy: '"etrRank"',
  },
  {
    id: "y_rank",
    headerName: "Yahoo Rank",
    orderBy: '"yahooRank"',
  },
  {
    id: "rank_diff",
    headerName: "Rank +/-",
    orderBy: '"rankDiff"',
  },
  {
    id: "ud_adp",
    headerName: "Underdog ADP",
    orderBy: '"udAdp"',
  },
  {
    id: "y_adp",
    headerName: "Yahoo ADP",
    orderBy: '"yahooAdp"',
  },
  {
    id: "adp_diff",
    headerName: "ADP +/-",
    orderBy: "adpDiff",
  },
];

for (const entry of tableMetaData) {
  entry.sortAsc = '<i class="fa-solid fa-chevron-up"></i>';
  entry.sortDesc = '<i class="fa-solid fa-chevron-down"></i>';
}

export { nflTeams, playerPositions, tableMetaData };
