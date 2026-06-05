# Data Model

## Вывод

Источник правды Schedule - нормализованные таблицы. Calendar View не хранит данные и строится только из `trip_events`.

Обязательное ядро:

```text
routes -> trips -> trip_events
zones
schedule_rules
holidays
audit_log
```

## Entity Relationships

```text
routes 1--N trips
trips 1--N trip_events
routes 1--N schedule_rules
zones 1--N trip_events
holidays optionally affect trip_events by date
audit_log records changes to trips, trip_events, rules, zones, holidays
```

## routes

Постоянный маршрут.

| Field | Type | Required | Example |
|---|---|---:|---|
| id | text/uuid | yes | ROUTE-NJ1-CA1 |
| route_code | text | yes | NJ1_CA1 |
| origin_region | text | yes | NJ1 |
| destination_region | text | yes | CA1 |
| route_name | text | yes | NJ to CA |
| active | boolean | yes | true |
| notes | text | no | Main interstate route |

## trips

Конкретный рейс по маршруту.

| Field | Type | Required | Example |
|---|---|---:|---|
| id | text/uuid | yes | TRIP-2026-05-01-NJ1-CA1 |
| route_id | text/uuid | yes | ROUTE-NJ1-CA1 |
| route_code | text | yes | NJ1_CA1 |
| truck_id | text/uuid | no | TRUCK-01 |
| driver_id | text/uuid | no | DRIVER-01 |
| trip_status | enum | yes | planned |
| pickup_start_date | date | yes | 2026-05-01 |
| pickup_end_date | date | yes | 2026-05-04 |
| loading_date | date | yes | 2026-05-05 |
| departure_date | date | yes | 2026-05-06 |
| delivery_start_date | date | yes | 2026-05-15 |
| delivery_end_date | date | yes | 2026-05-19 |
| unloading_date | date | yes | 2026-05-20 |
| source | enum | yes | generated |
| created_at | datetime | yes | 2026-06-05T10:00:00Z |
| updated_at | datetime | yes | 2026-06-05T10:00:00Z |

Allowed `trip_status`: `draft`, `planned`, `confirmed`, `active`, `completed`, `cancelled`.

## trip_events

Атомарное событие рейса на конкретную дату.

| Field | Type | Required | Example |
|---|---|---:|---|
| id | text/uuid | yes | EVT-000001 |
| trip_id | text/uuid | yes | TRIP-2026-05-01-NJ1-CA1 |
| event_date | date | yes | 2026-05-01 |
| event_type | enum | yes | pickup |
| region_code | text | yes | NJ1 |
| zone_code | text | yes | NORTH |
| sequence_no | number | yes | 1 |
| status | enum | yes | planned |
| is_holiday | boolean | yes | false |
| source | enum | yes | generated |
| override_reason | text | no | Driver unavailable |
| notes | text | no | Manual delivery change |
| created_at | datetime | yes | 2026-06-05T10:00:00Z |
| updated_at | datetime | yes | 2026-06-05T10:00:00Z |

Allowed `event_type`: `pickup`, `off`, `truck_loading`, `departure`, `transit`, `delivery`, `unloading`, `holiday`.

Allowed `status`: `planned`, `confirmed`, `completed`, `skipped`, `moved`, `cancelled`.

Allowed `source`: `generated`, `manual`, `manual_override`, `imported`.

## zones

Справочник операционных зон.

| Field | Type | Required | Example |
|---|---|---:|---|
| id | text/uuid | yes | ZONE-NJ1-NORTH |
| region_code | text | yes | NJ1 |
| zone_code | text | yes | NORTH |
| zone_name | text | yes | North NJ |
| state | text | no | NJ |
| active | boolean | yes | true |
| sort_order | number | yes | 10 |

Initial zone discovery from `Schedule.xlsx`: `N`, `S`, `NY`, `LI`, `DC`, `TR`, `SF`. Эти коды требуют подтверждения с operations.

## schedule_rules

Параметризованные правила генерации.

| Field | Type | Required | Example |
|---|---|---:|---|
| id | text/uuid | yes | RULE-NJ1-CA1-2026 |
| route_id | text/uuid | yes | ROUTE-NJ1-CA1 |
| route_code | text | yes | NJ1_CA1 |
| departure_interval_days | number | yes | 9 |
| pickup_window_days | number | yes | 4 |
| loading_offset_days | number | yes | 5 |
| transit_days | number | yes | 4 |
| delivery_window_days | number | yes | 5 |
| unloading_offset_days | number | yes | 5 |
| total_cycle_days | number | yes | 9 |
| holiday_policy | enum | yes | mark_and_shift |
| active_from | date | yes | 2026-05-01 |
| active_to | date | no | 2026-12-31 |
| active | boolean | yes | true |

Allowed `holiday_policy`: `mark_only`, `skip`, `shift_next_business_day`, `mark_and_shift`.

## holidays

Federal/state holidays affecting schedule generation.

| Field | Type | Required | Example |
|---|---|---:|---|
| id | text/uuid | yes | HOL-2026-05-25 |
| holiday_date | date | yes | 2026-05-25 |
| holiday_name | text | yes | Memorial Day |
| country | text | yes | US |
| state | text | no | federal |
| affects_schedule | boolean | yes | true |

## audit_log

История изменений.

| Field | Type | Required | Example |
|---|---|---:|---|
| id | text/uuid | yes | AUD-000001 |
| entity_type | enum | yes | trip_event |
| entity_id | text/uuid | yes | EVT-000001 |
| action | enum | yes | update |
| field_name | text | no | event_date |
| old_value | text | no | 2026-05-15 |
| new_value | text | no | 2026-05-16 |
| changed_by | text | no | user@company.com |
| reason | text | no | Customer requested change |
| changed_at | datetime | yes | 2026-06-05T10:00:00Z |

Allowed `entity_type`: `route`, `trip`, `trip_event`, `zone`, `schedule_rule`, `holiday`.

Allowed `action`: `create`, `update`, `delete`, `override`, `generate`, `import`, `export`.

## Validation Rules

- `trip.route_id` must exist in `routes`.
- `trip_event.trip_id` must exist in `trips`.
- `trip_event.zone_code` must exist in `zones` for the same `region_code`, except event types where zone is explicitly not applicable.
- One trip must not have duplicate events with same `event_date`, `event_type`, and `zone_code`.
- `manual_override` events must have `override_reason`.
- Events falling on active holidays must set `is_holiday = true`.
- Confirmed manual overrides must not be overwritten by generation without explicit approval.

