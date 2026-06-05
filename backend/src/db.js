const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const backendRoot = path.resolve(__dirname, "..");
const defaultDbPath = path.join(backendRoot, "data", "schedule.sqlite");

let db;

function getDbPath() {
  return process.env.SCHEDULE_DB_PATH || defaultDbPath;
}

function getDb() {
  if (!db) {
    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}

function runMigrations() {
  const database = getDb();
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  files.forEach((file) => {
    const applied = database.prepare("SELECT id FROM schema_migrations WHERE id = ?").get(file);
    if (applied) return;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    database.exec("BEGIN;");
    try {
      database.exec(sql);
      database.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run(file, new Date().toISOString());
      database.exec("COMMIT;");
      console.log(`Applied migration ${file}`);
    } catch (error) {
      database.exec("ROLLBACK;");
      throw error;
    }
  });
}

if (require.main === module) {
  const command = process.argv[2];
  if (command === "migrate") {
    runMigrations();
    closeDb();
  } else {
    console.log(`Database path: ${getDbPath()}`);
  }
}

module.exports = {
  getDb,
  getDbPath,
  closeDb,
  runMigrations
};

