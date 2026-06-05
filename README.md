# Schedule Microservice

## Вывод

Проект подготовлен как документационная основа для Schedule microservice. Реализация UI/backend не начата.

Главный принцип:

```text
routes / trips / trip_events / zones / schedule_rules / holidays / audit_log
        -> generated Calendar View
```

Горизонтальный календарь из `Schedule.xlsx` используется только как discovery-артефакт и пример текущего процесса. Источником данных будущего сервиса должны быть нормализованные события `trip_events`.

## Цель

Заменить ручное ведение горизонтального schedule в Google Sheets на микросервис, который:

- генерирует график отправок на 3 месяца;
- хранит рейсы и события в нормализованной модели;
- учитывает маршруты, зоны, правила и federal holidays;
- поддерживает controlled manual overrides;
- готовит данные для API, CRM, калькулятора и операционных отчетов.

## Scope текущего этапа

Входит:

- фиксация бизнес-правил;
- фиксация data model;
- фиксация API contract;
- тестовые сценарии;
- UAT checklist;
- known limitations;
- целевая структура проекта.

Не входит:

- UI;
- backend;
- schedule engine implementation;
- база данных;
- интеграции;
- импорт текущего Excel как production storage.

## Исходные артефакты

- `SCHEDULE_MICROSERVICE_PROJECT.md` - основная проектная инструкция.
- `Schedule.xlsx` - текущий горизонтальный schedule / discovery source.

Наблюдения по `Schedule.xlsx`:

- есть лист `NJ1-CA1` с горизонтальным календарем до сотен колонок;
- есть лист `Rules` с правилами: период 3 месяца, federal holidays, departure every 9 days, NJ -> CA transit 4 days, unloading on 5th day, total cycle 9 days;
- есть черновые заметки по зонам и SLA: fastest delivery 7 days, normal scenario up to 20 days, worst scenario up to 29 days;
- текущий формат смешивает даты, зоны, события и визуальное представление.

## Документы

- [Data Model](docs/data-model.md)
- [Business Rules](docs/business-rules.md)
- [API Contract](docs/api-contract.md)
- [Test Scenarios](docs/test-scenarios.md)
- [UAT Checklist](docs/uat-checklist.md)
- [Known Limitations](docs/known-limitations.md)

## Рекомендуемая структура после подтверждения

```text
schedule-service/
  README.md
  AGENTS.md
  docs/
    data-model.md
    business-rules.md
    api-contract.md
    test-scenarios.md
    uat-checklist.md
    known-limitations.md
  mock-data/
    routes.json
    zones.json
    schedule_rules.json
    holidays.json
    trips.json
    trip_events.json
    audit_log.json
  backend/
    src/
      routes/
      controllers/
      services/
      models/
      validators/
      migrations/
    tests/
  frontend/
    index.html
    css/
    js/
  tools/
    generate_mock_schedule.js
    validate_schedule_data.js
    export_schedule_json.js
```

На текущем этапе созданы только документы. Каталоги `mock-data`, `backend`, `frontend`, `tools` создавать после подтверждения плана.

## Минимальный готовый результат Phase 0

Phase 0 считается готовой, если:

- подтвержден route `NJ1_CA1`;
- подтвержден список зон;
- правила расписания переведены из текста в параметры;
- определены спорные места pickup/delivery windows;
- согласованы поля сущностей;
- утверждены тестовые сценарии и UAT checklist.

## Рекомендуемый следующий шаг

Подтвердить документы и спорные бизнес-правила из [Business Rules](docs/business-rules.md), затем переходить к mock-data и функциональному wireframe.

## Phase 1 Functional Wireframe

Локальный frontend-прототип находится в `frontend/`.

Запуск:

```text
Открыть frontend/index.html в браузере
```

Что доступно:

- генерация schedule на 3 месяца;
- хранение state в `localStorage`;
- normalized source of truth: `routes`, `trips`, `trip_events`, `zones`, `schedule_rules`, `holidays`, `audit_log`;
- Calendar View из `trip_events`;
- Trips List;
- Trip Details;
- manual override event date / status / zone / notes;
- audit log для генерации и override;
- Export / Import JSON;
- справочники rules, zones, holidays.

Проверка mock data:

```bash
node tools/validate_schedule_data.js
```

## Phase 1.1 Stabilization Before Backend

Status: completed.

Purpose:

- document frontend module responsibilities;
- document backend readiness;
- add smoke coverage for the schedule engine before backend work;
- keep Calendar View as generated output from `trip_events`.

Documents:

- [Frontend Architecture](docs/frontend-architecture.md)
- [Backend Readiness](docs/backend-readiness.md)

Smoke test:

```bash
node tools/smoke_test_schedule_engine.js
```

The smoke test verifies:

- 3-month generation creates trips;
- 3-month generation creates trip_events;
- calendar rows can be derived from trip_events;
- manual override sets `source = manual_override`;
- audit_log record is created;
- export JSON shape contains all normalized entities.

Recommended checks:

```bash
node tools/validate_schedule_data.js
node tools/smoke_test_schedule_engine.js
node --check frontend/js/app.js
node --check frontend/js/storage.js
node --check frontend/js/mockData.js
node --check frontend/js/scheduleEngine.js
node --check frontend/js/calendarView.js
node --check frontend/js/tripsView.js
node --check frontend/js/tripDetails.js
node --check frontend/js/rulesView.js
node --check frontend/js/zonesView.js
node --check frontend/js/holidaysView.js
node --check frontend/js/exportImport.js
node --check frontend/js/auditLog.js
node --check tools/validate_schedule_data.js
node --check tools/smoke_test_schedule_engine.js
```

Codex bundled Node on this Windows workspace:

```powershell
& 'C:\Users\YarSuleimenov\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\validate_schedule_data.js
& 'C:\Users\YarSuleimenov\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\smoke_test_schedule_engine.js
```

## Phase 2 Backend Skeleton

Status: implemented as minimal backend skeleton.

Backend stack:

- Node.js;
- Express;
- SQLite through built-in `node:sqlite`;
- plain JavaScript;
- SQL migrations;
- repository/service/router structure;
- no ORM;
- no auth;
- no CRM integration.

Note for this Codex Windows runtime:

```text
Bundled Node is available, but npm is not available in PATH.
The backend includes a small Express fallback adapter so smoke tests can run here.
In a normal developer environment, run npm install and the real Express package will be used.
```

Install backend dependencies:

```bash
cd backend
npm install
```

Run migration and seed:

```bash
cd backend
npm run migrate
npm run seed
```

Start backend:

```bash
cd backend
npm start
```

Default URL:

```text
http://localhost:3001
```

Check health:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "OK"
}
```

Run backend smoke test:

```bash
cd backend
npm run smoke
```

Codex bundled Node example:

```powershell
& 'C:\Users\YarSuleimenov\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' backend\tests\smoke_test_backend.js
```

Backend smoke test verifies:

- SQLite DB is created;
- migrations run;
- mock data seed works;
- health endpoint returns OK;
- schedule generation creates `trips` and `trip_events`;
- calendar endpoint returns events from DB;
- manual override via PATCH sets `source = manual_override`;
- PATCH creates `audit_log`;
- export endpoint returns normalized entities.
