const fs = require("fs");
const path = require("path");

const testDbPath = path.join(__dirname, "..", "data", "schedule.test.sqlite");
process.env.SCHEDULE_DB_PATH = testDbPath;

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const { getDb, runMigrations, closeDb } = require("../src/db");
const { seed } = require("../src/seed/seedFromMockData");
const { createApp } = require("../src/server");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    headers: {
      "content-type": "application/json"
    },
    ...options
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathName} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  runMigrations();
  seed();

  const db = getDb();
  const app = createApp(db);
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    const health = await request(baseUrl, "/health");
    assert(health.status === "OK", "health endpoint should return OK");

    const generated = await request(baseUrl, "/schedule/generate", {
      method: "POST",
      body: JSON.stringify({
        route_code: "NJ1_CA1",
        start_date: "2026-05-01",
        months: 3
      })
    });
    assert(generated.generated_trips > 0, "generate endpoint should create trips");
    assert(generated.generated_events > 0, "generate endpoint should create trip_events");

    const trips = await request(baseUrl, "/trips");
    assert(trips.trips.length > 0, "GET /trips should return generated trips");

    const calendar = await request(baseUrl, "/schedule/calendar?start_date=2026-05-01&end_date=2026-07-31&route_code=NJ1_CA1");
    assert(calendar.events.length > 0, "calendar endpoint should return trip_events from DB");

    const event = calendar.events[0];
    const patched = await request(baseUrl, `/trip-events/${event.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "moved",
        zone_code: event.zone_code,
        notes: "Backend smoke override",
        override_reason: "Backend smoke test"
      })
    });
    assert(patched.trip_event.source === "manual_override", "PATCH should set source to manual_override");

    const audit = await request(baseUrl, "/audit-log");
    assert(audit.audit_log.some((entry) => entry.entity_id === event.id && entry.action === "override"), "PATCH should create audit_log record");

    const exported = await request(baseUrl, "/schedule/export");
    ["routes", "zones", "schedule_rules", "holidays", "trips", "trip_events", "audit_log"].forEach((key) => {
      assert(Array.isArray(exported[key]), `export should include ${key}`);
    });
    assert(exported.validation.errors.length === 0, "export validation errors should be 0");

    console.log(JSON.stringify({
      health: health.status,
      generated_trips: generated.generated_trips,
      generated_events: generated.generated_events,
      calendar_events: calendar.events.length,
      patched_source: patched.trip_event.source,
      audit_log_records: audit.audit_log.length,
      export_validation_errors: exported.validation.errors.length,
      export_validation_warnings: exported.validation.warnings.length
    }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  closeDb();
  process.exit(1);
});

