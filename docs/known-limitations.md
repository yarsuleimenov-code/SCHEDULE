# Known Limitations

## Вывод

Главное ограничение: текущий Excel показывает операционный intent, но не является надежной моделью данных. Перед разработкой нужно подтвердить правила и зоны.

## Current Limitations

1. `Schedule.xlsx` is a horizontal calendar, not normalized data.
2. Pickup and delivery week logic is mixed visually.
3. Zone codes are not fully defined.
4. Holiday behavior is stated but exact policy is not confirmed.
5. Unloading offset needs precise business definition.
6. Truck and driver assignment are optional in the first model.
7. No confirmed source for federal holiday list yet.
8. No confirmed API consumer requirements from CRM/calculator yet.

## Product Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Building a copy of Google Sheet | High | Keep calendar generated from `trip_events` |
| Rules remain free text | High | Store rules as parameters in `schedule_rules` |
| Manual override breaks generation | High | Use `source`, `override_reason`, `audit_log` |
| Holidays become only colors | Medium | Use `holidays`, `is_holiday`, `holiday_policy` |
| Route/trip/event are mixed | High | Separate entities and validation |
| Unknown zone semantics | Medium | Confirm zones during Phase 0 |

## Not In First Phase

- automatic order-to-trip assignment;
- truck load optimization;
- full CRM integration;
- role-based authorization;
- drag-and-drop calendar;
- price calculation;
- margin forecast;
- dispatch optimization.

## Assumptions To Validate

- Route `NJ1_CA1` is the first MVP route.
- 3-month generation is enough for operations.
- Departure interval is every 9 days.
- Transit from NJ to CA is 4 days.
- Federal holidays affect schedule.
- Manual override must always require reason.

## Decision Log

| Decision | Status |
|---|---|
| Calendar is generated view only | Accepted |
| Source of truth is normalized data | Accepted |
| UI/backend implementation waits for document confirmation | Accepted |
| Exact offset formulas require operations confirmation | Open |

