import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationDir = join(__dirname, "migrations");
const db = new Database(join(__dirname, "football.db"));

function startMigration(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS __migrations__ (
        id INTEGER primary key,
        description TEXT NOT NULL,
        created_on TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const selectMax = db.prepare("SELECT MAX(id) AS max FROM __migrations__");
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
    db.close();
  } else {
    try {
      db.exec("begin");
      const insertMigration = db.prepare(
        "INSERT INTO __migrations__ (id, description) VALUES (?, ?)"
      );

      for (const { migrationNumber, description, path } of scriptsToExecute) {
        console.log(`Executing script: ${description}`);
        const sql = readFileSync(path, "utf-8");
        db.exec(sql);
        insertMigration.run(migrationNumber, description);
        console.log(
          `${migrationNumber}__${description} was migrated successfully.`
        );
      }

      db.exec("commit");
    } catch (err) {
      console.log(err);
      db.exec("rollback");
    } finally {
      db.close();
    }
  }
}

startMigration(db);
