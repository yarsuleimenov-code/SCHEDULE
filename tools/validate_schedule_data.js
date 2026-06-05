const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const mockDir = path.join(rootDir, "mock-data");

function readJson(fileName) {
  const filePath = path.join(mockDir, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function activeRuleFor(scheduleRules, routeCode, startDate) {
  return scheduleRules.find((rule) => {
    return rule.route_code === routeCode &&
      rule.active &&
      rule.active_from <= startDate &&
      (!rule.active_to || rule.active_to >= startDate);
  });
}

function validate(data) {
  const errors = [];
  const warnings = [];

  const routeIds = new Set(data.routes.map((route) => route.id));
  const tripIds = new Set(data.trips.map((trip) => trip.id));
  const holidayDates = new Set(data.holidays.filter((holiday) => holiday.affects_schedule).map((holiday) => holiday.holiday_date));
  const zoneKeys = new Set(data.zones.map((zone) => `${zone.region_code}|${zone.zone_code}`));
  const eventKeys = new Set();

  data.routes.forEach((route) => {
    if (!activeRuleFor(data.schedule_rules, route.route_code, route.active_from || "2026-05-01")) {
      errors.push(`missing rule for route ${route.route_code}`);
    }
  });

  data.trips.forEach((trip) => {
    if (!routeIds.has(trip.route_id)) {
      errors.push(`missing route for trip ${trip.id}`);
    }
    if (!activeRuleFor(data.schedule_rules, trip.route_code, trip.departure_date)) {
      errors.push(`missing rule for trip ${trip.id}`);
    }
  });

  data.trip_events.forEach((event) => {
    if (!tripIds.has(event.trip_id)) {
      errors.push(`missing trip for event ${event.id}`);
    }
    if (!event.zone_code) {
      errors.push(`event without zone ${event.id}`);
    }
    if (event.zone_code && !zoneKeys.has(`${event.region_code}|${event.zone_code}`)) {
      errors.push(`unknown zone for event ${event.id}: ${event.region_code}/${event.zone_code}`);
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

const data = {
  routes: readJson("routes.json"),
  zones: readJson("zones.json"),
  schedule_rules: readJson("schedule_rules.json"),
  holidays: readJson("holidays.json"),
  trips: readJson("trips.json"),
  trip_events: readJson("trip_events.json"),
  audit_log: readJson("audit_log.json")
};

const result = validate(data);

console.log(`Validation errors: ${result.errors.length}`);
result.errors.forEach((error) => console.log(`ERROR ${error}`));
console.log(`Validation warnings: ${result.warnings.length}`);
result.warnings.forEach((warning) => console.log(`WARN ${warning}`));

if (result.errors.length > 0) {
  process.exit(1);
}
