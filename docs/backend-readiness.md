# Backend Readiness

## Вывод

Phase 1 is ready to inform backend design, but backend implementation should not start until the remaining business-rule risks are confirmed.

The frontend already proves the core backend contract:

```text
rules + zones + holidays -> trips + trip_events -> generated calendar view
```

## Entities Ready For Backend

| Entity | Backend readiness | Notes |
|---|---|---|
| `routes` | Ready | MVP has `NJ1_CA1`; additional routes can follow same structure |
| `zones` | Mostly ready | Zone codes need operations confirmation |
| `schedule_rules` | Mostly ready | Offsets still need final business confirmation |
| `holidays` | Ready | Needs authoritative federal holiday source/import later |
| `trips` | Ready for MVP | Truck/driver optional for Phase 1 |
| `trip_events` | Ready for MVP | Source of truth for Calendar View |
| `audit_log` | Ready for MVP | Current model supports generation and override history |

## Required Fields For First Backend Version

### routes

- `id`
- `route_code`
- `origin_region`
- `destination_region`
- `route_name`
- `active`

### zones

- `id`
- `region_code`
- `zone_code`
- `zone_name`
- `active`
- `sort_order`

### schedule_rules

- `id`
- `route_id`
- `route_code`
- `departure_interval_days`
- `pickup_window_days`
- `loading_offset_days`
- `transit_days`
- `delivery_window_days`
- `unloading_offset_days`
- `total_cycle_days`
- `holiday_policy`
- `active_from`
- `active`

### holidays

- `id`
- `holiday_date`
- `holiday_name`
- `country`
- `affects_schedule`

### trips

- `id`
- `route_id`
- `route_code`
- `trip_status`
- `pickup_start_date`
- `pickup_end_date`
- `loading_date`
- `departure_date`
- `delivery_start_date`
- `delivery_end_date`
- `unloading_date`
- `source`
- `created_at`
- `updated_at`

### trip_events

- `id`
- `trip_id`
- `event_date`
- `event_type`
- `region_code`
- `zone_code`
- `sequence_no`
- `status`
- `is_holiday`
- `source`
- `created_at`
- `updated_at`

For `manual_override`, also require:

- `override_reason`

### audit_log

- `id`
- `entity_type`
- `entity_id`
- `action`
- `changed_at`

For field-level changes, also store:

- `field_name`
- `old_value`
- `new_value`
- `changed_by`
- `reason`

## First API Endpoints

Recommended minimum backend API order:

1. `GET /api/schedule/routes`
2. `GET /api/schedule/zones`
3. `GET /api/schedule/schedule-rules`
4. `GET /api/schedule/holidays`
5. `POST /api/schedule/generate`
6. `GET /api/schedule/trips`
7. `GET /api/schedule/trips/{id}`
8. `GET /api/schedule/trip-events`
9. `PATCH /api/schedule/trip-events/{id}`
10. `GET /api/schedule/calendar`
11. `GET /api/schedule/audit-log`
12. `GET /api/schedule/export`
13. `POST /api/schedule/import`
14. `POST /api/schedule/validate`

## Backend Behavior To Preserve

- Calendar endpoint must derive output from `trip_events`.
- Generation creates `trips` and `trip_events`, not calendar cells.
- Manual override sets `source = manual_override`.
- Manual override requires `override_reason`.
- Manual override writes `audit_log`.
- Generation must not silently overwrite manual overrides.
- Holiday matches set `is_holiday = true`.
- Export includes all normalized entities.

## Risks To Close Before Backend

| Risk | Why it matters | Required decision |
|---|---|---|
| Pickup window offsets are still assumptions | Backend migrations will lock behavior into production logic | Confirm pickup date formula |
| Delivery window differs by CA subregion | Current rule uses simple destination-zone rotation | Confirm zone-specific delivery rules |
| Unloading offset is ambiguous | Impacts promises and SLA | Confirm whether offset starts from departure, arrival, or delivery start |
| Holiday policy is `mark_only` in wireframe | Production may need shifting logic | Confirm first production policy |
| Zone codes are discovered, not approved | Bad zone semantics will break operations | Approve zone dictionary |
| Truck/driver are optional | Backend schema can stay nullable, but dispatch may need them later | Confirm Phase 2 requirement |

## Not Ready For Backend Yet

- automatic order assignment to trips;
- dispatch optimization;
- truck capacity;
- CRM integration;
- pricing;
- role-based authorization;
- drag-and-drop calendar.

These should remain outside the first backend skeleton unless business priority changes.

## Phase 2 Backend Skeleton Result

Status: implemented.

Created backend skeleton:

- Express server;
- SQLite database;
- SQL migration runner;
- seed from `mock-data/*.json`;
- repositories for normalized entities;
- schedule generation service;
- validation service;
- API routers;
- backend smoke test.

Implemented endpoints:

- `GET /api/health`
- `GET /api/routes`
- `GET /api/zones`
- `GET /api/schedule-rules`
- `GET /api/holidays`
- `GET /api/trips`
- `GET /api/trips/:id`
- `GET /api/trip-events`
- `PATCH /api/trip-events/:id`
- `POST /api/schedule/generate`
- `GET /api/schedule/calendar`
- `GET /api/schedule/export`
- `GET /api/audit-log`

Backend rule preserved:

```text
Calendar endpoint returns records derived from trip_events in SQLite.
No calendar cells are stored as source data.
```
