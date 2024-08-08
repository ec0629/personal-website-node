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

export { nflTeams, playerPositions };
