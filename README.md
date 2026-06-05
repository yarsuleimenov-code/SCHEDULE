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

