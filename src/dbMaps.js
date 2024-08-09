import {
  getAllNFLTeams,
  getAllPlayerNamesAndIds,
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

const playerNameToId = new Map();
for (const p of getAllPlayerNamesAndIds()) {
  if (playerPositions.get("DEF") !== p.positionId) {
    const nameFingerprint = p.firstName
      .concat(p.lastName)
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();
    playerNameToId.set(nameFingerprint, p.id);
  }
}

export { nflTeams, playerPositions, playerNameToId };
