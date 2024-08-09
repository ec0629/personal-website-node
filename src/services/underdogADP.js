import fs from "fs";
import { join } from "path";
import { parse } from "csv-parse";

import { getDirName } from "../utils.js";
import { playerNameToId } from "../dbMaps.js";
import { insertUnderdogADP } from "../repositories/footballRepo.js";

const __dirname = getDirName(import.meta.url);

const filePath = join(__dirname, "..", "..", "underdog_adp.csv");

const stream = fs.createReadStream(filePath, {
  encoding: "utf-8",
});

const parser = parse({ bom: true, from_line: 2 });

stream
  .pipe(parser)
  .on("data", (row) => {
    const [name, adp, dateString] = row;

    const createdOn = new Date(dateString).toISOString();

    const playerId = playerNameToId.get(
      name.replace(/[^a-zA-Z]/g, "").toLowerCase()
    );

    if (playerId) {
      insertUnderdogADP({ playerId, adp, createdOn });
    }
  })
  .on("end", () => {
    console.log("Successfully parsed the Underdog CSV file.");
  });
