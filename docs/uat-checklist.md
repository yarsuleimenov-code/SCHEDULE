# UAT Checklist

## Вывод

UAT должен подтвердить, что Schedule пригоден для operations, а не просто повторяет Excel.

## Participants

- Operations Manager
- Dispatcher / Broker
- BA / Product owner
- Developer observer

## Pre-UAT Data

- Confirm route `NJ1_CA1`.
- Confirm zones discovered from workbook: `N`, `S`, `NY`, `LI`, `DC`, `TR`, `SF`.
- Confirm active schedule rule.
- Load federal holidays for tested period.
- Prepare at least 10 real or representative trips.

## Checklist

| Check | Expected Result | Status |
|---|---|---|
| Generate 3-month schedule | Trips and trip_events are created | TODO |
| View calendar | Calendar renders from trip_events | TODO |
| Filter by route | Only selected route events are visible | TODO |
| Filter by zone | Only selected zone events are visible | TODO |
| Open trip | Trip details show dates and events | TODO |
| Open event | Event details show date, type, zone, status, source | TODO |
| Move event date | Manual override is saved with reason | TODO |
| Audit override | audit_log records old/new values | TODO |
| Holiday conflict | Event is marked and warning appears | TODO |
| Export JSON | All normalized entities are included | TODO |
| Import JSON | Data restores and calendar renders | TODO |
| Regenerate period | Manual overrides are not overwritten silently | TODO |
| Compare with current Excel | Differences are documented | TODO |

## Acceptance Criteria

- Operations can understand pickup, departure, delivery, unloading dates without editing cells.
- At least 10 trips match expected operational logic or have documented exceptions.
- Holiday behavior is accepted.
- Manual override behavior is accepted.
- JSON export is accepted by BA/developer as backend-ready.
- Open issues are documented before MVP implementation.

## UAT Exit Criteria

UAT can pass with known limitations only if:

- limitation does not break normalized data model;
- limitation does not make calendar a source of truth;
- workaround is documented;
- owner and follow-up phase are assigned.

## Phase 1 UAT Result

Status: accepted.

Manual UAT result:

| Check | Result |
|---|---|
| `frontend/index.html` opens locally | Passed |
| Schedule generation works | Passed |
| `trips` are created from rules | Passed |
| `trip_events` are created from rules | Passed |
| Calendar View is built from `trip_events` | Passed |
| Trip Details works | Passed |
| Manual Override works | Passed |
| Override reason is required | Passed |
| Calendar View updates after override | Passed |
| Holidays are displayed | Passed |
| Export / Import works | Passed |
| Validation errors | 0 |
| Holiday warnings | Accepted as expected warnings |
| Phase 1 Functional Wireframe | Accepted |

Decision:

```text
Phase 1 Functional Wireframe accepted.
Proceed to Phase 1.1 Stabilization before backend.
```

