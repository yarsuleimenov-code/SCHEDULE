const fs = require("fs");
const vm = require("vm");

function runBrowserScript(filePath) {
  vm.runInThisContext(fs.readFileSync(filePath, "utf8"), { filename: filePath });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

global.window = global;
global.ScheduleStorage = {
  nowIso: () => "2026-06-05T00:00:00.000Z",
  clone: (value) => JSON.parse(JSON.stringify(value))
};

runBrowserScript("frontend/js/mockData.js");
runBrowserScript("frontend/js/scheduleEngine.js");

const state = JSON.parse(JSON.stringify(global.ScheduleMockData));
const result = global.ScheduleEngine.generateSchedule(state, {
  route_code: "NJ1_CA1",
  start_date: "2026-05-01",
  months: 3
});

assert(result.generated_trips > 0, "generate 3-month schedule should create trips");
assert(result.generated_events > 0, "generate 3-month schedule should create trip_events");
assert(state.trips.length > 0, "trips count should be > 0");
assert(state.trip_events.length > 0, "trip_events count should be > 0");

const calendarRows = new Map();
state.trip_events.forEach((event) => {
  const trip = state.trips.find((item) => item.id === event.trip_id);
  assert(trip, `calendar derivation requires trip for event ${event.id}`);
  const rowKey = `${trip.route_code}|${event.region_code}|${event.zone_code}`;
  if (!calendarRows.has(rowKey)) {
    calendarRows.set(rowKey, []);
  }
  calendarRows.get(rowKey).push(event);
});
assert(calendarRows.size > 0, "calendar can be derived from trip_events");

const event = state.trip_events[0];
const oldStatus = event.status;
event.status = "moved";
event.source = "manual_override";
event.override_reason = "Smoke test override";
event.notes = "Smoke test note";
event.updated_at = global.ScheduleStorage.nowIso();
state.audit_log.push({
  id: "AUD-SMOKE-001",
  entity_type: "trip_event",
  entity_id: event.id,
  action: "override",
  field_name: "status",
  old_value: oldStatus,
  new_value: event.status,
  changed_by: "smoke-test",
  reason: event.override_reason,
  changed_at: global.ScheduleStorage.nowIso()
});

assert(event.source === "manual_override", "manual override should change source to manual_override");
assert(state.audit_log.some((entry) => entry.entity_id === event.id && entry.action === "override"), "audit_log record should be created");

const exportShape = ["routes", "trips", "trip_events", "zones", "schedule_rules", "holidays", "audit_log"]
  .every((key) => Array.isArray(state[key]));
assert(exportShape, "export JSON shape should include all entities");

const validation = global.ScheduleEngine.validateState(state);
assert(validation.errors.length === 0, `validation errors should be 0, got ${validation.errors.join("; ")}`);

console.log(JSON.stringify({
  generated_trips: result.generated_trips,
  generated_events: result.generated_events,
  calendar_rows: calendarRows.size,
  manual_override_source: event.source,
  audit_log_records: state.audit_log.length,
  export_shape_valid: exportShape,
  validation_errors: validation.errors.length,
  validation_warnings: validation.warnings.length
}, null, 2));
