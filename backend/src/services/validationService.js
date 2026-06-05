const routesRepository = require("../repositories/routesRepository");
const rulesRepository = require("../repositories/rulesRepository");
const holidaysRepository = require("../repositories/holidaysRepository");
const tripsRepository = require("../repositories/tripsRepository");
const tripEventsRepository = require("../repositories/tripEventsRepository");

function validate(db) {
  const errors = [];
  const warnings = [];
  const routes = routesRepository.list(db);
  const trips = tripsRepository.list(db);
  const events = tripEventsRepository.list(db);
  const holidays = holidaysRepository.list(db).filter((holiday) => holiday.affects_schedule);
  const routeIds = new Set(routes.map((route) => route.id));
  const tripIds = new Set(trips.map((trip) => trip.id));
  const holidayDates = new Set(holidays.map((holiday) => holiday.holiday_date));
  const eventKeys = new Set();

  routes.forEach((route) => {
    if (!rulesRepository.findActive(db, route.route_code, "2026-05-01")) {
      errors.push(`missing rule for route ${route.route_code}`);
    }
  });

  trips.forEach((trip) => {
    if (!routeIds.has(trip.route_id)) {
      errors.push(`missing route for trip ${trip.id}`);
    }
    if (!rulesRepository.findActive(db, trip.route_code, trip.departure_date)) {
      errors.push(`missing rule for trip ${trip.id}`);
    }
  });

  events.forEach((event) => {
    if (!tripIds.has(event.trip_id)) {
      errors.push(`missing trip for event ${event.id}`);
    }
    if (!event.zone_code) {
      errors.push(`event without zone ${event.id}`);
    }
    const key = `${event.trip_id}|${event.event_date}|${event.event_type}`;
    if (eventKeys.has(key)) {
      errors.push(`duplicated event for same trip/date/type ${key}`);
    }
    eventKeys.add(key);
    if (holidayDates.has(event.event_date)) {
      warnings.push(`event on holiday ${event.id} ${event.event_date}`);
      if (!event.is_holiday) {
        errors.push(`holiday event not marked ${event.id}`);
      }
    }
    if (event.source === "manual_override" && !event.override_reason) {
      errors.push(`manual override without reason ${event.id}`);
    }
  });

  return { errors, warnings };
}

module.exports = { validate };

