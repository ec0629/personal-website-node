import { parse } from "csv-parse";

import {
  getPlayerIdFromNameMatcher,
  insertEtrData,
} from "../repositories/footballRepo.js";
import { createNameMatcher } from "../utils.js";
import { dbTransaction } from "../db.js";

export default (data) => {
  const records = [];
  const createdOn = new Date().toISOString();
  parse(data, { bom: true, from_line: 2 })
    .on("readable", function () {
      let row;

      while ((row = this.read()) !== null) {
        const [name, rank] = row;
        const nameMatcher = createNameMatcher(name);
        const playerIds = getPlayerIdFromNameMatcher(nameMatcher);

        if (playerIds.length === 0) {
          throw new Error(
            `No player id matches were found for: ${name},  rank: ${rank}.`
          );
        }

        if (playerIds.length > 1) {
          throw new Error("Multiple player ids were found for nameId: " + name);
        }

        const playerId = playerIds[0].id;
        records.push({ playerId, rank });
      }
    })
    .on("end", function () {
      console.log("Successfully parsed the ETR CSV file.");
      console.log("Inserting ETR data into database.");
      dbTransaction((record) => {
        for (const data of record) {
          insertEtrData({ ...data, createdOn });
        }
      })(records);
      console.log("Successfully updated the ETR database table.");
    });
};
