const fs = require("fs");
const path = require("path");
const { getDb, runMigrations, closeDb } = require("../db");
const routesRepository = require("../repositories/routesRepository");
const zonesRepository = require("../repositories/zonesRepository");
const rulesRepository = require("../repositories/rulesRepository");
const holidaysRepository = require("../repositories/holidaysRepository");
const tripsRepository = require("../repositories/tripsRepository");
const tripEventsRepository = require("../repositories/tripEventsRepository");
const auditLogRepository = require("../repositories/auditLogRepository");

const rootDir = path.resolve(__dirname, "../../..");
const mockDir = path.join(rootDir, "mock-data");

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(mockDir, fileName), "utf8"));
}

function seed() {
  runMigrations();
  const db = getDb();
  const data = {
    routes: readJson("routes.json"),
    zones: readJson("zones.json"),
    schedule_rules: readJson("schedule_rules.json"),
    holidays: readJson("holidays.json"),
    trips: readJson("trips.json"),
    trip_events: readJson("trip_events.json"),
    audit_log: readJson("audit_log.json")
  };

  db.exec("BEGIN;");
  try {
    data.routes.forEach((item) => routesRepository.upsert(db, item));
    data.zones.forEach((item) => zonesRepository.upsert(db, item));
    data.schedule_rules.forEach((item) => rulesRepository.upsert(db, item));
    data.holidays.forEach((item) => holidaysRepository.upsert(db, item));
    data.trips.forEach((item) => tripsRepository.insert(db, item));
    data.trip_events.forEach((item) => tripEventsRepository.insert(db, item));
    data.audit_log.forEach((item) => auditLogRepository.insert(db, item));
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  console.log("Seeded mock data into SQLite");
}

if (require.main === module) {
  seed();
  closeDb();
}

module.exports = { seed };

