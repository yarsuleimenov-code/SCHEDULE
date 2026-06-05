const express = require("../http/express");
const routesRepository = require("../repositories/routesRepository");
const zonesRepository = require("../repositories/zonesRepository");
const rulesRepository = require("../repositories/rulesRepository");
const holidaysRepository = require("../repositories/holidaysRepository");
const tripsRepository = require("../repositories/tripsRepository");
const tripEventsRepository = require("../repositories/tripEventsRepository");
const auditLogRepository = require("../repositories/auditLogRepository");
const scheduleGenerationService = require("../services/scheduleGenerationService");
const validationService = require("../services/validationService");

function createScheduleApi(db) {
  const router = express.Router();

  router.post("/schedule/generate", (req, res) => {
    const result = scheduleGenerationService.generateSchedule(db, req.body);
    res.json(result);
  });

  router.get("/schedule/calendar", (req, res) => {
    const events = tripEventsRepository.list(db, req.query);
    res.json({
      start_date: req.query.start_date || "",
      end_date: req.query.end_date || "",
      route_code: req.query.route_code || "",
      events
    });
  });

  router.get("/schedule/export", (req, res) => {
    res.json({
      routes: routesRepository.list(db),
      zones: zonesRepository.list(db),
      schedule_rules: rulesRepository.list(db),
      holidays: holidaysRepository.list(db),
      trips: tripsRepository.list(db),
      trip_events: tripEventsRepository.list(db, req.query),
      audit_log: auditLogRepository.list(db),
      validation: validationService.validate(db)
    });
  });

  return router;
}

module.exports = createScheduleApi;
