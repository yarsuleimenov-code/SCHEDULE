# MVP Scope

## Вывод

Текущий приоритет - Business Demo MVP, а не полноценный production Schedule service.

Demo MVP должен помочь бизнесу принять модель:

```text
normalized schedule data -> generated Gantt/calendar view
```

## Входит в Demo MVP

- Local frontend opened via `frontend/index.html`.
- Demo mode with `localStorage` and mock data.
- Default route `NJ1 -> CA1`.
- Generate 3-month schedule.
- Normalized source data:
  - `routes`;
  - `trips`;
  - `trip_events`;
  - `zones`;
  - `schedule_rules`;
  - `holidays`;
  - `audit_log`.
- Calendar/Gantt View generated from `trip_events`.
- Schedule Board as the main trip-first planning screen.
- Zone Calendar as the advanced zone/date view.
- Trips List.
- Trip Timeline.
- Schedule Alerts.
- Manual Override with required reason.
- Change History.
- Holidays visible in view.
- Export Demo JSON.

## Отложено

- frontend API mode;
- connecting frontend to backend;
- production backend hardening;
- CRM integration;
- authentication and roles;
- advanced rules UI;
- full production calendar;
- drag-and-drop calendar;
- dispatch optimization;
- order assignment;
- pricing and margin logic;
- capacity planning.

## Почему backend/API mode временно остановлен

Backend Phase 2 already exists as a technical skeleton, but the business value now is faster validation of the operating model.

Reasons to pause backend/API mode:

- business users need to validate workflow before production plumbing;
- pickup/delivery/unloading rules still need feedback;
- zone dictionary is not fully approved;
- API integration work can wait until demo flow is accepted;
- avoiding backend work prevents scope creep into CRM/auth/dispatch modules.

## Критерии готовности к бизнес-показу

- User can open `frontend/index.html`.
- Header clearly says `Schedule Demo MVP`.
- User can click `Generate 3-Month Schedule`.
- User lands on Schedule Board after generation.
- Trips are created.
- `trip_events` are created.
- Schedule Board renders trips from normalized data.
- Zone Calendar renders from `trip_events`.
- Legend explains event types and manual override.
- User can open a trip.
- User can make manual override with reason.
- Change History records the override.
- Schedule Alerts shows holiday/manual override exceptions.
- Holidays are visible.
- Export Demo JSON includes normalized entities.
- Smoke tests pass.
- Backend is not required for the demo.

## Demo Mode Decision

```text
Accepted for business demo:
frontend + mock data + localStorage
```

```text
Deferred:
backend/API connected mode
```
