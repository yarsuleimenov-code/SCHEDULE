# API Contract

## Вывод

API v1 должен отдавать нормализованные сущности и generated calendar view. Calendar endpoint возвращает события, а не горизонтальные ячейки.

Base path:

```text
/api/schedule
```

## Common Conventions

- Dates: ISO `YYYY-MM-DD`.
- DateTimes: ISO 8601 UTC.
- IDs: UUID or stable text IDs.
- Pagination for list endpoints: `limit`, `offset`.
- Filtering by period: `start_date`, `end_date`.
- Errors return `code`, `message`, `details`.

## Routes

```http
GET /api/schedule/routes
POST /api/schedule/routes
GET /api/schedule/routes/{id}
PATCH /api/schedule/routes/{id}
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
GET /api/schedule/trips
POST /api/schedule/trips
GET /api/schedule/trips/{id}
PATCH /api/schedule/trips/{id}
DELETE /api/schedule/trips/{id}
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
GET /api/schedule/trip-events
POST /api/schedule/trip-events
GET /api/schedule/trip-events/{id}
PATCH /api/schedule/trip-events/{id}
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
GET /api/schedule/zones
POST /api/schedule/zones
GET /api/schedule/zones/{id}
PATCH /api/schedule/zones/{id}
```

Delete is not recommended for Phase 1. Use `active = false`.

## Schedule Rules

```http
GET /api/schedule/schedule-rules
POST /api/schedule/schedule-rules
GET /api/schedule/schedule-rules/{id}
PATCH /api/schedule/schedule-rules/{id}
```

Rules should be versioned by `active_from`, `active_to`, and `active`.

## Holidays

```http
GET /api/schedule/holidays
POST /api/schedule/holidays
GET /api/schedule/holidays/{id}
PATCH /api/schedule/holidays/{id}
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

