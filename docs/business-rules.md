# Business Rules

## Вывод

Правила Schedule должны быть параметрами, а не текстом или цветами в календаре.

Recommended baseline for Phase 0:

| Rule | Value | Status |
|---|---:|---|
| Schedule period | 3 months | confirmed from instruction |
| Route | NJ1_CA1 | discovered from workbook |
| Departure interval | 9 days | confirmed from `Rules` sheet |
| NJ -> CA transit | 4 days | confirmed from `Rules` sheet |
| Unloading | 5th day after transit start / after arrival rule to confirm | needs clarification |
| Total trip cycle | 9 days | confirmed from `Rules` sheet |
| Federal holidays | mark and process by policy | confirmed from `Rules` sheet |

## Users

- Operations Manager: генерирует и подтверждает schedule.
- Dispatcher / Broker: смотрит календарь, даты pickup/delivery, статусы.
- Admin: управляет зонами, holidays, rules.
- Developer / BA: использует JSON/API для backend, CRM и отчетов.

## Main Business Question

Когда и по каким зонам будут pickup, departure, delivery и unloading для каждого рейса, и какие события были изменены вручную?

## Core Scenario

1. User selects route `NJ1_CA1`.
2. User selects start date and 3-month period.
3. Schedule Engine reads active `schedule_rules`, `zones`, and `holidays`.
4. System creates `trips`.
5. System creates atomic `trip_events`.
6. Calendar View renders from `trip_events`.
7. User can override event date/status/zone with a reason.
8. Override creates `audit_log`.

## Generation Logic

For each route and date range:

1. Find active route.
2. Find active schedule rule.
3. Generate departure dates using `departure_interval_days`.
4. For each departure date, create one `trip`.
5. Calculate dates:
   - `pickup_start_date`
   - `pickup_end_date`
   - `loading_date`
   - `departure_date`
   - `transit_start_date`
   - `transit_end_date`
   - `delivery_start_date`
   - `delivery_end_date`
   - `unloading_date`
6. Create `trip_events` for every event day/zone.
7. Apply holiday policy.
8. Return warnings for conflicts.

## Date Formula Draft

Assumption until confirmed:

```text
departure_date = generated anchor date
pickup_end_date = departure_date - 1 day
pickup_start_date = pickup_end_date - pickup_window_days + 1
loading_date = departure_date - 1 day
transit_start_date = departure_date
transit_end_date = departure_date + transit_days
delivery_start_date = transit_end_date + 1 day
delivery_end_date = delivery_start_date + delivery_window_days - 1
unloading_date = delivery_start_date + unloading_offset_days
```

Risk: `Schedule.xlsx` contains mixed pickup week / delivery week logic, so offsets must be validated with operations before implementation.

## Holiday Rules

If an event date matches `holidays.holiday_date` and `affects_schedule = true`:

1. Set `trip_events.is_holiday = true`.
2. Apply `schedule_rules.holiday_policy`.
3. Preserve original date in audit or generated metadata.
4. Create warning.
5. If shifted, create `audit_log` or generation trace entry.

Recommended first policy: `mark_and_shift`.

## Manual Override Rules

- User may change event date, zone, status, notes.
- Every override must have `override_reason`.
- Changed event gets `source = manual_override`.
- Every changed field creates `audit_log`.
- Regeneration must not overwrite manual overrides unless user explicitly confirms.

## Calendar View Rules

- Calendar uses `trip_events` as input.
- Calendar may group by route, region, zone, truck, event type, status.
- Calendar must not store schedule data in cells.
- Colors are display metadata only.

## Open Questions

1. Confirm exact pickup window length and whether pickup is by zone or route-level window.
2. Confirm delivery window for southern vs northern California noted in workbook.
3. Confirm meaning of zone codes `N`, `S`, `NY`, `LI`, `DC`, `TR`, `SF`.
4. Confirm holiday behavior: mark only, skip, shift next business day, or mark and shift.
5. Confirm whether unloading offset is counted from departure, arrival, or delivery start.
6. Confirm if `trucks` and `drivers` are required in Phase 1 or only optional fields.

