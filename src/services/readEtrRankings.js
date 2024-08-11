import path from "node:path";
import fs from "node:fs/promises";
import { getDirName } from "../utils.js";
import parseEtrRanks from "./parseEtrRanks.js";

const __dirname = getDirName(import.meta.url);

const filePath = path.join(__dirname, "..", "..", "etr_ranks.csv");

const contents = await fs.readFile(filePath, {
  encoding: "utf-8",
});

parseEtrRanks(contents);
