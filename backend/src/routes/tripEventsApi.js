const express = require("../http/express");
const tripEventsRepository = require("../repositories/tripEventsRepository");
const holidaysRepository = require("../repositories/holidaysRepository");
const auditLogRepository = require("../repositories/auditLogRepository");

function createTripEventsApi(db) {
  const router = express.Router();

  router.get("/trip-events", (req, res) => {
    res.json({ trip_events: tripEventsRepository.list(db, req.query) });
  });

  router.patch("/trip-events/:id", (req, res) => {
    const event = tripEventsRepository.findById(db, req.params.id);
    if (!event) {
      res.status(404).json({ error: { code: "EVENT_NOT_FOUND", message: "Trip event not found" } });
      return;
    }
    if (!req.body.override_reason) {
      res.status(400).json({ error: { code: "OVERRIDE_REASON_REQUIRED", message: "override_reason is required" } });
      return;
    }

    const regionCode = req.body.region_code || event.region_code;
    const zoneCode = req.body.zone_code || event.zone_code;
    const next = {
      event_date: req.body.event_date || event.event_date,
      status: req.body.status || event.status,
      region_code: regionCode,
      zone_code: zoneCode,
      notes: req.body.notes === undefined ? event.notes : req.body.notes,
      override_reason: req.body.override_reason,
      is_holiday: Boolean(holidaysRepository.findByDate(db, req.body.event_date || event.event_date)),
      updated_at: new Date().toISOString()
    };

    db.exec("BEGIN;");
    try {
      Object.entries(next).forEach(([field, value]) => {
        if (["is_holiday", "updated_at"].includes(field)) return;
        if (String(event[field] || "") !== String(value || "")) {
          auditLogRepository.insert(db, {
            id: `AUD-${Date.now()}-${field}`,
            entity_type: "trip_event",
            entity_id: event.id,
            action: "override",
            field_name: field,
            old_value: String(event[field] || ""),
            new_value: String(value || ""),
            changed_by: "backend",
            reason: req.body.override_reason,
            changed_at: new Date().toISOString()
          });
        }
      });
      const updated = tripEventsRepository.updateManualOverride(db, event.id, next);
      db.exec("COMMIT;");
      res.json({ trip_event: updated });
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }
  });

  return router;
}

module.exports = createTripEventsApi;
