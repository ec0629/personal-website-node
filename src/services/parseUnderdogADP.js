import { parse } from "csv-parse";

import { createNameMatcher } from "../utils.js";
import {
  getPlayerIdFromNameMatcher,
  insertUnderdogData,
} from "../repositories/footballRepo.js";
import { dbTransaction } from "../db.js";

export default (data) => {
  const records = [];
  const createdOn = new Date().toISOString();
  parse(data, { bom: true, from_line: 2 })
    .on("readable", function () {
      let row;

      while ((row = this.read()) !== null) {
        const [name, adp] = row;
        const nameMatcher = createNameMatcher(name);
        const playerIds = getPlayerIdFromNameMatcher(nameMatcher);

        if (playerIds.length === 0 && adp < 216) {
          throw new Error(
            `No player id matches were found for: ${name},  adp: ${adp}.`
          );
        }

        if (playerIds.length > 1) {
          throw new Error("Multiple player ids were found for nameId: " + name);
        }

        if (playerIds.length === 1 && adp < 216) {
          const playerId = playerIds[0].id;
          records.push({ playerId, adp });
        }
      }
    })
    .on("end", function () {
      console.log("Successfully parsed the Underdog CSV file.");
      console.log("Inserting Underdog data into database.");
      dbTransaction((record) => {
        for (const data of record) {
          insertUnderdogData({ ...data, createdOn });
        }
      })(records);
      console.log("Successfully updated the Underdog database table.");
    });
};
