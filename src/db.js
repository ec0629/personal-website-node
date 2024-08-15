import Database from "better-sqlite3";
import { join } from "node:path";
import { getDirName } from "./utils.js";

const __dirname = getDirName(import.meta.url);

const db = new Database(join(__dirname, "..", "football.db"));

export function dbExec(statement) {
  return db.exec(statement);
}

export function dbRun(statement, data) {
  return statement.run(data);
}

export function dbGet(statement, data) {
  return statement.get(data);
}

export function dbPrepare(statement) {
  return db.prepare(statement);
}

export function dbClose() {
  return db.close();
}

export function dbTransaction(func) {
  return db.transaction(func);
}
