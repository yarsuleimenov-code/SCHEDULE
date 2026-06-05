const express = require("./http/express");
const { getDb, runMigrations } = require("./db");
const createRoutesApi = require("./routes/routesApi");
const createZonesApi = require("./routes/zonesApi");
const createRulesApi = require("./routes/rulesApi");
const createHolidaysApi = require("./routes/holidaysApi");
const createTripsApi = require("./routes/tripsApi");
const createTripEventsApi = require("./routes/tripEventsApi");
const createScheduleApi = require("./routes/scheduleApi");
const auditLogRepository = require("./repositories/auditLogRepository");

function createApp(db) {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
  });

  app.use("/api", createRoutesApi(db));
  app.use("/api", createZonesApi(db));
  app.use("/api", createRulesApi(db));
  app.use("/api", createHolidaysApi(db));
  app.use("/api", createTripsApi(db));
  app.use("/api", createTripEventsApi(db));
  app.use("/api", createScheduleApi(db));
  app.get("/api/audit-log", (req, res) => {
    res.json({ audit_log: auditLogRepository.list(db) });
  });

  app.use((error, req, res, next) => {
    const status = error.status || 500;
    res.status(status).json({
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: error.message
      }
    });
  });

  return app;
}

function start() {
  runMigrations();
  const db = getDb();
  const app = createApp(db);
  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => {
    console.log(`Schedule backend listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { createApp, start };
