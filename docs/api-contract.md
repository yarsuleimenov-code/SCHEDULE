# API Contract

## Вывод

API v1 должен отдавать нормализованные сущности и generated calendar view. Calendar endpoint возвращает события, а не горизонтальные ячейки.

Phase 2 backend base path:

```text
/api
```

Schedule-specific endpoints keep `/api/schedule/...`.

## Common Conventions

- Dates: ISO `YYYY-MM-DD`.
- DateTimes: ISO 8601 UTC.
- IDs: UUID or stable text IDs.
- Pagination for list endpoints: `limit`, `offset`.
- Filtering by period: `start_date`, `end_date`.
- Errors return `code`, `message`, `details`.

## Routes

```http
GET /api/routes
```

Minimal response item:

```json
{
  "id": "ROUTE-NJ1-CA1",
  "route_code": "NJ1_CA1",
  "origin_region": "NJ1",
  "destination_region": "CA1",
  "route_name": "NJ to CA",
  "active": true
}
```

## Trips

```http
GET /api/trips
GET /api/trips/{id}
```

Recommended filters:

```text
route_code
trip_status
start_date
end_date
truck_id
driver_id
source
```

## Trip Events

```http
GET /api/trip-events
PATCH /api/trip-events/{id}
```

Manual override request:

```json
{
  "event_date": "2026-05-16",
  "status": "moved",
  "override_reason": "Customer requested change",
  "notes": "Moved delivery by one day"
}
```

Expected behavior:

- update event;
- set `source = manual_override`;
- create `audit_log`;
- return updated event.

## Zones

```http
GET /api/zones
```

Delete is not recommended for Phase 1. Use `active = false`.

## Schedule Rules

```http
GET /api/schedule-rules
```

Rules should be versioned by `active_from`, `active_to`, and `active`.

## Holidays

```http
GET /api/holidays
```

Recommended filters:

```text
country
state
start_date
end_date
affects_schedule
```

## Generate Schedule

```http
POST /api/schedule/generate
```

Request:

```json
{
  "route_code": "NJ1_CA1",
  "start_date": "2026-05-01",
  "end_date": "2026-07-31",
  "rule_id": "RULE-NJ1-CA1-2026",
  "overwrite_existing": false
}
```

Response:

```json
{
  "success": true,
  "generated_trips": 10,
  "generated_events": 120,
  "warnings": [
    {
      "type": "holiday_conflict",
      "date": "2026-05-25",
      "message": "Event falls on Memorial Day"
    }
  ]
}
```

Validation:

- route must exist;
- active rule must exist;
- date range must be valid;
- overlapping generated trips must not be overwritten unless `overwrite_existing = true`;
- manual overrides must not be overwritten without explicit confirmation.

## Calendar View

```http
GET /api/schedule/calendar?start_date=2026-05-01&end_date=2026-07-31&route_code=NJ1_CA1
```

Response:

```json
{
  "start_date": "2026-05-01",
  "end_date": "2026-07-31",
  "route_code": "NJ1_CA1",
  "events": [
    {
      "trip_id": "TRIP-2026-05-01-NJ1-CA1",
      "event_id": "EVT-000001",
      "event_date": "2026-05-01",
      "event_type": "pickup",
      "region_code": "NJ1",
      "zone_code": "NORTH",
      "status": "planned",
      "source": "generated",
      "is_holiday": false
    }
  ]
}
```

Rule: this endpoint may format data for calendar rendering, but it must not create a separate calendar storage model.

## Export / Import

```http
GET /api/schedule/export?start_date=2026-05-01&end_date=2026-07-31&route_code=NJ1_CA1
POST /api/schedule/import
POST /api/schedule/validate
```

Phase 2 implemented only:

```http
GET /api/schedule/export
```

Import and validate endpoints remain planned.

## Health

```http
GET /api/health
```

Response:

```json
{
  "status": "OK"
}
```

## Audit Log

```http
GET /api/audit-log
```

Export payload must include:

```json
{
  "routes": [],
  "trips": [],
  "trip_events": [],
  "zones": [],
  "schedule_rules": [],
  "holidays": [],
  "audit_log": []
}
```

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "MISSING_RULE",
    "message": "Active schedule rule was not found for route NJ1_CA1",
    "details": {
      "route_code": "NJ1_CA1"
    }
  }
}
```
