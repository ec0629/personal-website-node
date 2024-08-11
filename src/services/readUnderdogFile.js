import path from "node:path";
import fs from "node:fs/promises";
import { getDirName } from "../utils.js";
import parseUnderdogADP from "./parseUnderdogADP.js";

const __dirname = getDirName(import.meta.url);

const filePath = path.join(__dirname, "..", "..", "underdog_adp.csv");

const contents = await fs.readFile(filePath, {
  encoding: "utf-8",
});

parseUnderdogADP(contents);
