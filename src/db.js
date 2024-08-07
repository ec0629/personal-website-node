import Database from "better-sqlite3";
import { join } from "node:path";
import { getDirName } from "./utils.js";

const __dirname = getDirName(import.meta.url);

const db = new Database(join(__dirname, "football.db"));

export function dbExec(statement) {
  db.exec(statement);
}

export function dbPrepare(statement) {
  return db.prepare(statement);
}

export function dbClose() {
  db.close();
}
