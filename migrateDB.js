import { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { getDirName } from "./src/utils.js";
import { dbClose, dbExec, dbPrepare } from "./src/db.js";

const __dirname = getDirName(import.meta.url);

const migrationDir = join(__dirname, "migrations");

function startMigration() {
  dbExec(`
    CREATE TABLE IF NOT EXISTS __migrations__ (
        id INTEGER primary key,
        description TEXT NOT NULL,
        created_on TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const selectMax = dbPrepare("SELECT MAX(id) AS max FROM __migrations__");
  let { max } = selectMax.get();
  max = max || 0;

  const files = readdirSync(migrationDir);
  const scriptsToExecute = files
    .map((filename) => {
      let [migrationNumber, description] = filename.split("__");
      migrationNumber = parseInt(migrationNumber);
      return {
        migrationNumber,
        description,
        path: join(migrationDir, filename),
      };
    })
    .filter(({ migrationNumber }) => {
      return migrationNumber > max;
    });

  if (scriptsToExecute.length === 0) {
    console.log("Database is up to date.");
    dbClose();
  } else {
    try {
      dbExec("begin");
      const insertMigration = dbPrepare(
        "INSERT INTO __migrations__ (id, description) VALUES (?, ?)"
      );

      for (const { migrationNumber, description, path } of scriptsToExecute) {
        console.log(`Executing script: ${description}`);
        const sql = readFileSync(path, "utf-8");
        dbExec(sql);
        insertMigration.run(migrationNumber, description);
        console.log(
          `${migrationNumber}__${description} was migrated successfully.`
        );
      }

      dbExec("commit");
    } catch (err) {
      console.log(err);
      dbExec("rollback");
    } finally {
      dbClose();
    }
  }
}

startMigration();
