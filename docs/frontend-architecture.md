# Frontend Architecture

## Вывод

Frontend Phase 1 is a local functional wireframe. It proves the normalized Schedule model before backend work starts.

Calendar View remains a generated view from `trip_events`. It does not store schedule data in calendar cells.

## Structure

```text
frontend/
  index.html
  css/
    styles.css
  js/
    app.js
    storage.js
    mockData.js
    scheduleEngine.js
    calendarView.js
    tripsView.js
    tripDetails.js
    rulesView.js
    zonesView.js
    holidaysView.js
    exportImport.js
    auditLog.js
```

## Module Responsibilities

| Module | Responsibility |
|---|---|
| `index.html` | Static shell, screen tabs, generation controls, script loading order |
| `styles.css` | Layout, tables, tabs, generated/manual/holiday event styles |
| `app.js` | Runtime orchestration, event handlers, view switching, generation action, override action |
| `storage.js` | `localStorage` load/save/reset/import and normalized state persistence |
| `mockData.js` | Initial seed data for routes, zones, schedule rules, holidays, empty trips/events/audit |
| `scheduleEngine.js` | Schedule generation, date helpers, trip creation, trip event creation, validation |
| `calendarView.js` | Generated Calendar View from `trip_events` only |
| `tripsView.js` | Trips List and trip summary metrics |
| `tripDetails.js` | Trip picker, trip events table, manual override form |
| `rulesView.js` | Read-only rules table |
| `zonesView.js` | Read-only zones reference |
| `holidaysView.js` | Read-only holidays reference |
| `exportImport.js` | Export/import JSON UI and validation summary |
| `auditLog.js` | Audit Log table |

## Data Flow

```text
mockData.js
  -> storage.js
  -> app.js
  -> scheduleEngine.generateSchedule()
  -> trips + trip_events
  -> calendarView.render()
```

Detailed flow:

1. On first load, `storage.js` seeds `localStorage` from `mockData.js`.
2. User clicks `Generate schedule`.
3. `app.js` calls `ScheduleEngine.generateSchedule(state, options)`.
4. `scheduleEngine.js` reads:
   - `routes`;
   - `zones`;
   - `schedule_rules`;
   - `holidays`.
5. `scheduleEngine.js` creates:
   - `trips`;
   - `trip_events`;
   - generation record in `audit_log`.
6. `storage.js` saves normalized state to `localStorage`.
7. `calendarView.js` groups and renders `trip_events` by route / region / zone / date.

## Calendar View Rule

Calendar View receives normalized state and derives display rows from `trip_events`.

It does not create or persist:

- horizontal calendar cells;
- spreadsheet-like schedule records;
- date columns as source data;
- visual colors as business rules.

## Manual Overrides

Manual overrides are created in `app.js` from the Trip Details form rendered by `tripDetails.js`.

When user saves an override:

1. `app.js` validates that `override_reason` is present.
2. Selected `trip_event` fields are updated:
   - `event_date`;
   - `status`;
   - `region_code`;
   - `zone_code`;
   - `notes`;
   - `override_reason`.
3. `source` is set to `manual_override`.
4. `updated_at` is refreshed.
5. `is_holiday` is recalculated for the new event date.
6. State is saved through `storage.js`.
7. Calendar View updates because it renders from `trip_events`.

## Audit Log

Audit records are written in two places:

| Flow | Location | Action |
|---|---|---|
| Schedule generation | `scheduleEngine.js` | Adds one `generate` record |
| Manual override | `app.js` | Adds one `override` record per changed field |

Audit records are persisted in the normalized `audit_log` array and exported with all other entities.

## Backend Boundary

Current frontend is intentionally local-only:

- no backend calls;
- no framework;
- no CRM integration;
- no authentication;
- no server-side persistence.

The portable parts for backend are the data model, generator rules, validation expectations, and API-ready JSON shape.

