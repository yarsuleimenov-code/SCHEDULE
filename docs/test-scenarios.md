# Test Scenarios

## Вывод

Тесты должны доказывать не внешний вид календаря, а корректность нормализованных данных и generated view.

## Scenario 1. Generate Base Schedule

Given:

- route `NJ1_CA1`;
- active rule with `departure_interval_days = 9`;
- period `2026-05-01` to `2026-07-31`.

When:

- user runs schedule generation.

Then:

- system creates `trips`;
- system creates `trip_events`;
- each trip has pickup, loading, departure, transit, delivery, unloading events;
- calendar can be rendered from `trip_events`.

## Scenario 2. Calendar Is Generated From Events

Given:

- existing `trip_events`.

When:

- user opens Calendar View.

Then:

- calendar displays events from `trip_events`;
- no schedule data is stored in calendar cells;
- changing `trip_events.event_date` changes the calendar output.

## Scenario 3. Manual Override

Given:

- delivery event on `2026-05-15`.

When:

- user moves event to `2026-05-16`;
- user provides override reason.

Then:

- `event_date` changes;
- `source = manual_override`;
- `status = moved` if selected;
- `audit_log` records old and new values;
- Calendar View updates.

## Scenario 4. Manual Override Without Reason

Given:

- existing generated event.

When:

- user changes event date without `override_reason`.

Then:

- validation fails;
- event is not saved;
- user sees a clear error.

## Scenario 5. Holiday Conflict

Given:

- event date matches active federal holiday.

When:

- schedule is generated.

Then:

- `is_holiday = true`;
- holiday policy is applied;
- warning is returned;
- shifted events preserve traceability.

## Scenario 6. Missing Rule

Given:

- route exists;
- no active schedule rule exists for route/date.

When:

- user runs schedule generation.

Then:

- generation fails;
- no partial trips/events are saved;
- API returns `MISSING_RULE`.

## Scenario 7. Duplicate Event Detection

Given:

- one trip already has a pickup event for same date/type/zone.

When:

- import or generation creates the same event again.

Then:

- validation flags duplicate;
- duplicate is not silently accepted.

## Scenario 8. Export JSON

Given:

- schedule exists for 3 months.

When:

- user exports JSON.

Then:

- export includes `routes`, `trips`, `trip_events`, `zones`, `schedule_rules`, `holidays`, `audit_log`;
- payload is backend/API-ready;
- calendar-only data is not exported as source storage.

## Scenario 9. Import JSON

Given:

- valid export payload.

When:

- user imports JSON.

Then:

- all entities are restored;
- relationships are valid;
- Calendar View renders from imported `trip_events`.

## Scenario 10. Regeneration Does Not Overwrite Overrides

Given:

- event has `source = manual_override`.

When:

- user regenerates schedule for same period with `overwrite_existing = false`.

Then:

- manual override remains unchanged;
- generation returns warning about protected override.

