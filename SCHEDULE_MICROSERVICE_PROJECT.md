# Schedule Microservice Project

## 1. Цель проекта

Разработать отдельный микросервис **Schedule**, который заменит ручное ведение горизонтального графика отправок в Google Sheets на нормализованную систему планирования рейсов, событий, зон и правил.

Сервис должен:

- автоматически генерировать график отправок на 3 месяца вперёд;
- хранить данные в структуре, пригодной для БД, API и интеграций;
- показывать календарный view для операционной команды;
- позволять вручную корректировать события без потери исходной логики;
- учитывать зоны, маршруты, федеральные праздники и правила рейсов;
- стать источником данных для CRM, калькулятора, задач брокеров и операционного контроля.

---

## 2. Бизнес-контекст

Сейчас график отправок ведётся вручную в горизонтальном Google Sheets.

Проблемы текущего формата:

1. **Нет нормализованной структуры данных**  
   Даты, зоны, типы событий и правила смешаны в одном визуальном календаре.

2. **Невозможно надёжно автоматизировать**  
   Горизонтальные ячейки сложно передавать в БД, API, CRM и отчёты.

3. **Высокий риск ручных ошибок**  
   При сдвиге рейса вручную легко нарушить pickup / delivery логику.

4. **Нет единого источника правды**  
   Непонятно, что является фактическим расписанием: текст в ячейке, цвет, комментарий или правило.

5. **Нельзя нормально считать метрики**  
   Невозможно стабильно считать:
   - lead time;
   - delivery window;
   - загрузку по зонам;
   - отклонения от графика;
   - влияние праздников;
   - простои;
   - SLA.

6. **Нельзя масштабировать процесс**  
   При росте количества маршрутов, машин и зон текущая таблица станет неуправляемой.

---

## 3. Целевое состояние

Schedule должен работать по принципу:

```text
Rules + Zones + Holidays + Start Date
        ↓
Schedule Engine
        ↓
Trips + Trip Events
        ↓
Calendar View / API / CRM / Reports
```

Ключевой принцип:

> Источником данных является нормализованная таблица событий, а календарь является только визуальным отображением.

---

## 4. Scope проекта

### 4.1. Входит в проект

#### Нормализованная модель данных

Создать сущности:

- Routes;
- Trips;
- Trip Events;
- Zones;
- Schedule Rules;
- Holidays;
- Trucks;
- Drivers;
- Manual Overrides;
- Audit Log.

#### Schedule Engine

Разработать логику генерации расписания:

- создание рейсов на заданный период;
- генерация событий рейса;
- расчёт pickup window;
- расчёт departure date;
- расчёт transit period;
- расчёт delivery window;
- расчёт unloading date;
- учёт федеральных праздников;
- учёт правил маршрута;
- учёт ручных корректировок.

#### Интерфейс

Минимальные экраны:

1. Calendar View;
2. Trips List;
3. Trip Details;
4. Event Details;
5. Rules Settings;
6. Zones Reference;
7. Holidays;
8. Export / Import;
9. Audit Log.

#### API и БД

Подготовить сервис к интеграциям:

- REST API;
- JSON schema;
- структура БД;
- export/import JSON;
- документация для передачи в CRM, калькулятор и операционные отчёты.

### 4.2. Не входит в первую фазу

В первую фазу не включать:

- автоматическое назначение заказов на конкретный рейс;
- оптимизацию загрузки машин;
- полноценную CRM-интеграцию;
- авторизацию по ролям;
- drag-and-drop calendar;
- прогнозирование маржинальности;
- автоматический расчёт стоимости доставки;
- dispatch optimization.

Эти функции можно добавить после стабилизации базовой модели Schedule.

---

## 5. Основные бизнес-сценарии

### Use Case 1. Генерация графика на 3 месяца

**Роль:** Operations Manager  
**Цель:** создать план отправок на следующий квартал.

#### Сценарий

1. Пользователь открывает Schedule.
2. Выбирает маршрут, например `NJ1_CA1`.
3. Указывает дату начала.
4. Выбирает период генерации: 3 месяца.
5. Нажимает `Generate Schedule`.
6. Система создаёт:
   - trips;
   - trip events;
   - calendar view.
7. Пользователь проверяет результат.
8. Пользователь сохраняет график.

#### Результат

Создан нормализованный график рейсов и событий.

---

### Use Case 2. Просмотр календаря

**Роль:** Broker / Dispatcher / Manager  
**Цель:** понять, когда pickup, departure, delivery и unloading.

#### Сценарий

1. Пользователь открывает Calendar View.
2. Видит расписание по датам.
3. Фильтрует по:
   - route;
   - region;
   - truck;
   - event type;
   - status.
4. Открывает нужный рейс.
5. Видит детализацию событий.

#### Результат

Горизонтальный календарь остаётся удобным для просмотра, но не является источником данных.

---

### Use Case 3. Ручной перенос события

**Роль:** Operations Manager  
**Цель:** перенести delivery или loading date.

#### Сценарий

1. Пользователь открывает Trip Details.
2. Выбирает событие.
3. Меняет дату или статус.
4. Указывает причину изменения.
5. Система сохраняет событие как `manual_override`.
6. Calendar View обновляется автоматически.
7. Изменение попадает в Audit Log.

#### Результат

Ручные изменения разрешены, но контролируются и не ломают модель данных.

---

### Use Case 4. Учёт праздников

**Роль:** Admin / Operations Manager  
**Цель:** учитывать Federal Holidays при генерации графика.

#### Сценарий

1. Пользователь открывает Holidays.
2. Добавляет или импортирует список праздников.
3. Указывает, влияет ли праздник на расписание.
4. При генерации система:
   - отмечает праздник;
   - сдвигает событие или помечает его как affected;
   - фиксирует причину.

#### Результат

Праздники учитываются формально, а не вручную цветом в таблице.

---

### Use Case 5. Экспорт данных для БД / API

**Роль:** BA / Developer  
**Цель:** получить структуру данных для backend.

#### Сценарий

1. Пользователь открывает Export.
2. Выбирает период.
3. Нажимает `Export JSON`.
4. Система выгружает:
   - trips;
   - trip_events;
   - zones;
   - rules;
   - holidays;
   - audit_log.

#### Результат

Данные можно использовать для БД, API, CRM и тестирования микросервиса.

---

## 6. Модель данных

### 6.1. `routes`

Маршруты.

| Поле | Тип | Пример | Обязательное |
|---|---|---|---|
| id | uuid/text | ROUTE-NJ1-CA1 | да |
| route_code | text | NJ1_CA1 | да |
| origin_region | text | NJ1 | да |
| destination_region | text | CA1 | да |
| route_name | text | NJ to CA | да |
| active | boolean | true | да |
| notes | text | Main interstate route | нет |

---

### 6.2. `trips`

Рейсы.

| Поле | Тип | Пример | Обязательное |
|---|---|---|---|
| id | uuid/text | TRIP-2026-05-01-NJ1-CA1 | да |
| route_id | uuid/text | ROUTE-NJ1-CA1 | да |
| route_code | text | NJ1_CA1 | да |
| truck_id | uuid/text | TRUCK-01 | нет |
| driver_id | uuid/text | DRIVER-01 | нет |
| trip_status | enum | planned | да |
| pickup_start_date | date | 2026-05-01 | да |
| pickup_end_date | date | 2026-05-04 | да |
| loading_date | date | 2026-05-05 | да |
| departure_date | date | 2026-05-06 | да |
| delivery_start_date | date | 2026-05-15 | да |
| delivery_end_date | date | 2026-05-19 | да |
| unloading_date | date | 2026-05-20 | да |
| source | enum | generated | да |
| created_at | datetime | 2026-06-05T10:00:00Z | да |
| updated_at | datetime | 2026-06-05T10:00:00Z | да |

#### Допустимые `trip_status`

| Статус | Значение |
|---|---|
| draft | Черновик |
| planned | Запланирован |
| confirmed | Подтверждён |
| active | В работе |
| completed | Завершён |
| cancelled | Отменён |

---

### 6.3. `trip_events`

События рейсов.

| Поле | Тип | Пример | Обязательное |
|---|---|---|---|
| id | uuid/text | EVT-000001 | да |
| trip_id | uuid/text | TRIP-2026-05-01-NJ1-CA1 | да |
| event_date | date | 2026-05-01 | да |
| event_type | enum | pickup | да |
| region_code | text | NJ1 | да |
| zone_code | text | NORTH | да |
| sequence_no | number | 1 | да |
| status | enum | planned | да |
| is_holiday | boolean | false | да |
| source | enum | generated | да |
| override_reason | text | Driver unavailable | нет |
| notes | text | Manual delivery change | нет |
| created_at | datetime | 2026-06-05T10:00:00Z | да |
| updated_at | datetime | 2026-06-05T10:00:00Z | да |

#### Допустимые `event_type`

| Тип | Значение |
|---|---|
| pickup | Pickup zone day |
| off | Off day |
| truck_loading | Truck loading |
| departure | Departure |
| transit | Transit |
| delivery | Delivery zone day |
| unloading | Unloading |
| holiday | Holiday |

#### Допустимые `status`

| Статус | Значение |
|---|---|
| planned | Запланировано |
| confirmed | Подтверждено |
| completed | Выполнено |
| skipped | Пропущено |
| moved | Перенесено |
| cancelled | Отменено |

#### Допустимые `source`

| Source | Значение |
|---|---|
| generated | Создано системой |
| manual | Создано вручную |
| manual_override | Изменено вручную |
| imported | Импортировано |

---

### 6.4. `zones`

Справочник зон.

| Поле | Тип | Пример | Обязательное |
|---|---|---|---|
| id | uuid/text | ZONE-NJ1-NORTH | да |
| region_code | text | NJ1 | да |
| zone_code | text | NORTH | да |
| zone_name | text | North NJ | да |
| state | text | NJ | нет |
| active | boolean | true | да |
| sort_order | number | 10 | да |

---

### 6.5. `schedule_rules`

Правила генерации.

| Поле | Тип | Пример | Обязательное |
|---|---|---|---|
| id | uuid/text | RULE-NJ1-CA1-2026 | да |
| route_id | uuid/text | ROUTE-NJ1-CA1 | да |
| route_code | text | NJ1_CA1 | да |
| departure_interval_days | number | 9 | да |
| pickup_window_days | number | 4 | да |
| loading_offset_days | number | 5 | да |
| transit_days | number | 4 | да |
| delivery_window_days | number | 5 | да |
| unloading_offset_days | number | 5 | да |
| total_cycle_days | number | 9 | да |
| holiday_policy | enum | mark_and_shift | да |
| active_from | date | 2026-05-01 | да |
| active_to | date | 2026-12-31 | нет |
| active | boolean | true | да |

#### Допустимые `holiday_policy`

| Policy | Значение |
|---|---|
| mark_only | Только отметить праздник |
| skip | Пропустить рабочий день |
| shift_next_business_day | Сдвинуть на следующий рабочий день |
| mark_and_shift | Отметить и сдвинуть |

---

### 6.6. `holidays`

| Поле | Тип | Пример | Обязательное |
|---|---|---|---|
| id | uuid/text | HOL-2026-05-25 | да |
| holiday_date | date | 2026-05-25 | да |
| holiday_name | text | Memorial Day | да |
| country | text | US | да |
| state | text | federal | нет |
| affects_schedule | boolean | true | да |

---

### 6.7. `audit_log`

История изменений.

| Поле | Тип | Пример | Обязательное |
|---|---|---|---|
| id | uuid/text | AUD-000001 | да |
| entity_type | enum | trip_event | да |
| entity_id | uuid/text | EVT-000001 | да |
| action | enum | update | да |
| field_name | text | event_date | нет |
| old_value | text | 2026-05-15 | нет |
| new_value | text | 2026-05-16 | нет |
| changed_by | text | user@company.com | нет |
| reason | text | Customer requested change | нет |
| changed_at | datetime | 2026-06-05T10:00:00Z | да |

---

## 7. Правила генерации расписания

### 7.1. Базовые правила из текущего Schedule

| Правило | Значение |
|---|---:|
| Schedule period | Next 3 months / quarter |
| Federal Holidays | учитывать |
| Departure interval | every 9 days |
| NJ → CA transit | 4 days |
| Unloading | 5th day |
| Total trip cycle | 9 days |

---

### 7.2. Логика генерации одного рейса

Для каждого рейса система должна рассчитать:

```text
pickup_start_date
pickup_end_date
loading_date
departure_date
transit_start_date
transit_end_date
delivery_start_date
delivery_end_date
unloading_date
```

Пример:

```text
Departure Date = 2026-05-10
Pickup Window = 2026-05-05 to 2026-05-08
Truck Loading = 2026-05-09
Transit = 2026-05-10 to 2026-05-14
Delivery Window = 2026-05-15 to 2026-05-19
Unloading = 2026-05-20
```

Важно: конкретные offsets нужно подтвердить с операционной командой, потому что текущая таблица содержит смешанную логику pickup week / delivery week.

---

### 7.3. Логика праздников

Если событие попадает на Federal Holiday:

1. система должна отметить `is_holiday = true`;
2. применить `holiday_policy`;
3. сохранить исходную дату;
4. при переносе создать audit log;
5. показать warning в интерфейсе.

Пример warning:

```text
Event falls on Federal Holiday: Memorial Day. Shifted to next business day.
```

---

## 8. Интерфейс проекта

### 8.1. Calendar View

Назначение: визуальный график для операций.

Функции:

- отображение 1/2/3 месяцев;
- группировка по route / region;
- строки по зонам;
- колонки по датам;
- цветовое выделение типов событий;
- фильтр по маршруту;
- фильтр по truck;
- фильтр по статусу;
- клик по событию открывает Trip / Event Details.

Правило:

> Calendar View не должен хранить данные. Он должен строиться из `trip_events`.

---

### 8.2. Trips List

Назначение: список рейсов.

Колонки:

| Поле |
|---|
| Trip ID |
| Route |
| Status |
| Truck |
| Driver |
| Pickup Window |
| Loading Date |
| Departure Date |
| Delivery Window |
| Unloading Date |
| Source |
| Updated At |

Функции:

- создать рейс;
- открыть рейс;
- изменить статус;
- фильтровать по периоду;
- фильтровать по маршруту;
- экспортировать список.

---

### 8.3. Trip Details

Назначение: управление конкретным рейсом.

Блоки:

1. Trip Summary;
2. Trip Dates;
3. Trip Events;
4. Manual Overrides;
5. Audit Log.

Функции:

- изменить truck;
- изменить driver;
- изменить статус;
- изменить даты событий;
- добавить комментарий;
- отменить рейс;
- восстановить generated schedule.

---

### 8.4. Event Details

Назначение: управление конкретным событием.

Поля:

| Поле |
|---|
| Event Date |
| Event Type |
| Region |
| Zone |
| Status |
| Holiday Flag |
| Source |
| Override Reason |
| Notes |

Функции:

- изменить дату;
- изменить статус;
- изменить зону;
- указать причину изменения;
- сохранить override;
- вернуть generated value.

---

### 8.5. Rules Settings

Назначение: управление правилами генерации.

Поля:

| Поле |
|---|
| Route |
| Departure Interval |
| Pickup Window Days |
| Loading Offset |
| Transit Days |
| Delivery Window Days |
| Unloading Offset |
| Holiday Policy |
| Active From |
| Active To |

Функции:

- создать rule version;
- включить / отключить правило;
- применить правило к новому периоду;
- не перезаписывать уже подтверждённые manual overrides без подтверждения.

---

### 8.6. Zones Reference

Назначение: справочник зон.

Функции:

- добавить зону;
- изменить название;
- изменить sort order;
- отключить зону;
- запретить удаление зоны, если она используется в событиях.

---

### 8.7. Holidays

Назначение: управление праздниками.

Функции:

- добавить праздник;
- импортировать список праздников;
- отметить affects_schedule;
- показать события, затронутые праздником.

---

### 8.8. Export / Import

Назначение: подготовка к интеграции.

Функции:

- экспорт JSON;
- импорт JSON;
- экспорт CSV;
- validate data;
- показать ошибки структуры.

---

## 9. API Contract, первая версия

### 9.1. Routes

```http
GET /api/schedule/routes
POST /api/schedule/routes
PATCH /api/schedule/routes/{id}
```

---

### 9.2. Trips

```http
GET /api/schedule/trips
GET /api/schedule/trips/{id}
POST /api/schedule/trips
PATCH /api/schedule/trips/{id}
DELETE /api/schedule/trips/{id}
```

---

### 9.3. Trip Events

```http
GET /api/schedule/trip-events
GET /api/schedule/trip-events/{id}
POST /api/schedule/trip-events
PATCH /api/schedule/trip-events/{id}
```

---

### 9.4. Schedule Generation

```http
POST /api/schedule/generate
```

Request:

```json
{
  "route_code": "NJ1_CA1",
  "start_date": "2026-05-01",
  "end_date": "2026-07-31",
  "rule_id": "RULE-NJ1-CA1-2026",
  "overwrite_existing": false
}
```

Response:

```json
{
  "success": true,
  "generated_trips": 10,
  "generated_events": 120,
  "warnings": [
    {
      "type": "holiday_conflict",
      "date": "2026-05-25",
      "message": "Event falls on Memorial Day"
    }
  ]
}
```

---

### 9.5. Calendar View

```http
GET /api/schedule/calendar?start_date=2026-05-01&end_date=2026-07-31&route_code=NJ1_CA1
```

Response:

```json
{
  "start_date": "2026-05-01",
  "end_date": "2026-07-31",
  "route_code": "NJ1_CA1",
  "events": [
    {
      "trip_id": "TRIP-2026-05-01-NJ1-CA1",
      "event_id": "EVT-000001",
      "event_date": "2026-05-01",
      "event_type": "pickup",
      "region_code": "NJ1",
      "zone_code": "NORTH",
      "status": "planned",
      "source": "generated"
    }
  ]
}
```

---

## 10. План реализации

### Phase 0. Discovery и фиксация правил

#### Цель

Подтвердить бизнес-логику графика до разработки.

#### Что сделать

1. Разобрать текущий Google Sheets Schedule.
2. Зафиксировать все зоны.
3. Зафиксировать маршруты.
4. Зафиксировать правила:
   - departure interval;
   - pickup window;
   - transit days;
   - delivery window;
   - unloading offset;
   - holiday policy.
5. Подтвердить спорные места с операционной командой.
6. Подготовить sample dataset.

#### Результат

Документ:

```text
docs/schedule-business-rules.md
```

#### Критерии готовности

- правила описаны не текстом, а параметрами;
- список зон подтверждён;
- есть минимум 3 тестовых рейса;
- известны edge cases.

---

### Phase 1. Functional Wireframe

#### Цель

Быстро проверить модель данных и логику без backend.

#### Технологии

```text
HTML
CSS
JavaScript
localStorage
mock JSON
```

#### Что сделать

1. Создать проект `schedule-wireframe`.
2. Создать mock data:
   - routes;
   - zones;
   - rules;
   - holidays;
   - trips;
   - trip_events.
3. Реализовать schedule engine.
4. Реализовать Calendar View.
5. Реализовать Trips Table.
6. Реализовать Trip Details.
7. Реализовать ручной override.
8. Реализовать export/import JSON.
9. Подготовить test scenarios.

#### Результат

Рабочий интерактивный прототип.

#### Критерии готовности

- можно сгенерировать schedule на 3 месяца;
- calendar строится из `trip_events`;
- можно изменить дату события;
- override сохраняется;
- JSON экспортируется;
- данные пригодны для обсуждения backend.

---

### Phase 2. Data Model и Backend Skeleton

#### Цель

Подготовить backend-основу микросервиса.

#### Что сделать

1. Создать схему БД.
2. Создать миграции.
3. Реализовать базовые CRUD endpoints:
   - routes;
   - zones;
   - trips;
   - trip_events;
   - schedule_rules;
   - holidays.
4. Реализовать endpoint генерации schedule.
5. Реализовать audit log.
6. Реализовать validation layer.

#### Результат

Backend skeleton Schedule Service.

#### Критерии готовности

- данные сохраняются в БД;
- API возвращает trips и events;
- генерация создаёт записи в БД;
- manual override сохраняет audit log;
- calendar endpoint возвращает события за период.

---

### Phase 3. Frontend MVP

#### Цель

Создать рабочий UI поверх backend.

#### Что сделать

1. Подключить frontend к API.
2. Перенести wireframe-логику на реальные данные.
3. Реализовать:
   - Calendar View;
   - Trips List;
   - Trip Details;
   - Rules Settings;
   - Zones;
   - Holidays;
   - Export.
4. Добавить validation warnings.
5. Добавить basic error handling.

#### Результат

Рабочий Schedule MVP.

#### Критерии готовности

- пользователь может создать график;
- пользователь может просмотреть календарь;
- пользователь может изменить событие;
- изменения сохраняются в БД;
- audit log фиксирует изменения.

---

### Phase 4. Интеграционная подготовка

#### Цель

Подготовить Schedule к подключению CRM, калькулятора и операционных процессов.

#### Что сделать

1. Описать API для CRM.
2. Описать API для калькулятора.
3. Подготовить webhooks или scheduled export.
4. Добавить external IDs:
   - CRM order ID;
   - lead ID;
   - quote ID;
   - truck ID.
5. Подготовить интеграционные тесты.

#### Результат

Schedule готов к подключению внешних систем.

---

### Phase 5. UAT и запуск

#### Цель

Проверить работу на реальных сценариях.

#### Что сделать

1. Загрузить реальный график.
2. Сравнить с текущей Google Sheet.
3. Проверить 10–20 рейсов вручную.
4. Проверить праздники.
5. Проверить ручные переносы.
6. Проверить экспорт.
7. Подготовить инструкцию для пользователей.
8. Зафиксировать known limitations.

#### Результат

Schedule MVP готов к эксплуатации.

---

## 11. Структура проекта

```text
schedule-service/
  README.md

  docs/
    schedule-business-rules.md
    data-model.md
    api-contract.md
    test-scenarios.md
    uat-checklist.md
    known-limitations.md

  frontend/
    index.html
    css/
      styles.css
    js/
      app.js
      apiClient.js
      calendarView.js
      tripsView.js
      tripDetails.js
      rulesView.js
      zonesView.js
      holidaysView.js

  backend/
    src/
      routes/
      controllers/
      services/
      models/
      validators/
      migrations/
    tests/

  mock-data/
    routes.json
    zones.json
    schedule_rules.json
    holidays.json
    trips.json
    trip_events.json

  tools/
    generate_mock_schedule.js
    validate_schedule_data.js
    export_schedule_json.js
```

---

## 12. Тестовые сценарии

### Scenario 1. Generate base schedule

**Дано:**  
Route `NJ1_CA1`, start date `2026-05-01`, period 3 months.

**Когда:**  
Пользователь нажимает `Generate Schedule`.

**Тогда:**  
Система создаёт trips и trip_events на 3 месяца.

---

### Scenario 2. Calendar is generated from events

**Дано:**  
Есть `trip_events`.

**Когда:**  
Пользователь открывает Calendar View.

**Тогда:**  
Календарь показывает события из `trip_events`, а не из ручных ячеек.

---

### Scenario 3. Manual override

**Дано:**  
Delivery event на `2026-05-15`.

**Когда:**  
Пользователь переносит событие на `2026-05-16`.

**Тогда:**

- event_date меняется;
- source становится `manual_override`;
- audit_log получает запись;
- Calendar View обновляется.

---

### Scenario 4. Holiday conflict

**Дано:**  
Событие попадает на Federal Holiday.

**Когда:**  
Система генерирует schedule.

**Тогда:**

- событие получает `is_holiday = true`;
- применяется holiday policy;
- появляется warning.

---

### Scenario 5. Export JSON

**Дано:**  
Есть график на 3 месяца.

**Когда:**  
Пользователь нажимает `Export JSON`.

**Тогда:**  
Система выгружает валидный JSON со всеми сущностями.

---

## 13. Acceptance Criteria проекта

Проект считается готовым, если:

1. Расписание хранится в нормализованной структуре.
2. Горизонтальный календарь строится автоматически.
3. Есть генерация графика на 3 месяца.
4. Есть отдельные сущности `trips` и `trip_events`.
5. Есть справочники `zones`, `routes`, `rules`, `holidays`.
6. Manual override сохраняется без потери истории.
7. Federal Holidays учитываются.
8. Данные можно экспортировать в JSON.
9. Структура готова для БД и API.
10. Есть документация:
    - data model;
    - business rules;
    - API contract;
    - test scenarios;
    - UAT checklist.

---

## 14. Definition of Done

### 14.1. Для wireframe

- проект запускается локально;
- есть mock data;
- работает генерация schedule;
- работает calendar view;
- работает ручное изменение события;
- работает export JSON;
- есть README;
- есть тестовые сценарии.

### 14.2. Для backend

- есть миграции БД;
- CRUD endpoints работают;
- schedule generation endpoint работает;
- audit log работает;
- validation работает;
- есть API documentation.

### 14.3. Для frontend

- UI подключен к backend;
- пользователь может работать без ручного редактирования ячеек;
- ошибки и warnings видны;
- календарь обновляется после изменений.

### 14.4. Для UAT

- протестировано минимум 10 рейсов;
- результат сравнен с текущей Google Sheet;
- расхождения зафиксированы;
- операционная команда подтвердила базовый сценарий.

---

## 15. Риски и ограничения

### Риск 1. Разработчик сделает копию Google Sheet

Это главный риск.

Требование:

```text
Do not store schedule data in horizontal calendar cells.
Calendar must be generated from normalized trip_events.
```

---

### Риск 2. Правила останутся текстом

Правила должны быть параметрами.

Плохо:

```text
Departure on the 9th day since last departure
```

Хорошо:

```json
{
  "departure_interval_days": 9
}
```

---

### Риск 3. Manual override сломает generated schedule

Решение:

- хранить `source`;
- писать audit log;
- не перезаписывать override без подтверждения.

---

### Риск 4. Праздники будут только цветом

Решение:

- отдельная таблица `holidays`;
- поле `is_holiday`;
- holiday policy;
- warning.

---

### Риск 5. Смешаются route, trip и event

Разделить:

| Сущность | Значение |
|---|---|
| Route | Постоянный маршрут |
| Trip | Конкретный рейс |
| Event | Действие рейса в конкретную дату |

---

## 16. Приоритеты реализации

### Must Have

- normalized data model;
- schedule generator;
- calendar view;
- trips list;
- trip events;
- manual override;
- holidays;
- export JSON.

### Should Have

- audit log;
- filters;
- validation warnings;
- rules versioning;
- import JSON.

### Could Have

- drag-and-drop;
- truck capacity;
- driver assignment;
- CRM lead assignment;
- SLA dashboard.

### Won’t Have в первой версии

- optimization engine;
- automatic order-to-trip assignment;
- full dispatch module;
- pricing calculation;
- mobile app.

---

## 17. Prompt для Codex

```text
Build a full functional prototype for a new Schedule microservice.

Business goal:
Replace the current manually maintained horizontal Google Sheets schedule with a normalized, automation-ready schedule system.

Core principle:
The horizontal calendar is only a generated view.
The source of truth must be normalized data:
- routes
- trips
- trip_events
- zones
- schedule_rules
- holidays
- audit_log

Do not store schedule data in horizontal calendar cells.

Tech for prototype:
- Plain HTML/CSS/JavaScript
- No backend for Phase 1
- Use localStorage for persistence
- Use mock JSON data
- Provide export/import JSON
- Keep code modular

Project structure:
schedule-wireframe/
  index.html
  css/styles.css
  js/app.js
  js/mockData.js
  js/scheduleEngine.js
  js/storage.js
  js/calendarView.js
  js/tripsView.js
  js/tripDetails.js
  js/rulesView.js
  js/zonesView.js
  js/holidaysView.js
  docs/data-model.md
  docs/business-rules.md
  docs/test-scenarios.md
  README.md

Required screens:
1. Calendar View
2. Trips List
3. Trip Details
4. Event Details
5. Rules Settings
6. Zones Reference
7. Holidays
8. Export / Import
9. Audit Log

Required data model:

route:
- id
- route_code
- origin_region
- destination_region
- route_name
- active

trip:
- id
- route_id
- route_code
- truck_id
- driver_id
- trip_status
- pickup_start_date
- pickup_end_date
- loading_date
- departure_date
- delivery_start_date
- delivery_end_date
- unloading_date
- source
- created_at
- updated_at

trip_event:
- id
- trip_id
- event_date
- event_type
- region_code
- zone_code
- sequence_no
- status
- is_holiday
- source
- override_reason
- notes
- created_at
- updated_at

zone:
- id
- region_code
- zone_code
- zone_name
- state
- active
- sort_order

schedule_rule:
- id
- route_id
- route_code
- departure_interval_days
- pickup_window_days
- loading_offset_days
- transit_days
- delivery_window_days
- unloading_offset_days
- total_cycle_days
- holiday_policy
- active_from
- active_to
- active

holiday:
- id
- holiday_date
- holiday_name
- country
- state
- affects_schedule

audit_log:
- id
- entity_type
- entity_id
- action
- field_name
- old_value
- new_value
- changed_by
- reason
- changed_at

Required schedule rules:
- Generate schedule for the next 3 months
- Departure every 9 days
- NJ to CA transit = 4 days
- Unloading on the 5th day
- Total cycle = 9 days
- Federal holidays must be marked and processed by holiday_policy

Required event types:
- pickup
- off
- truck_loading
- departure
- transit
- delivery
- unloading
- holiday

Required statuses:
- planned
- confirmed
- completed
- skipped
- moved
- cancelled

Required source values:
- generated
- manual
- manual_override
- imported

Required logic:
1. User can generate schedule for a selected route and date range.
2. Schedule engine creates trips and trip_events.
3. Calendar View renders from trip_events only.
4. User can open a trip and inspect all trip events.
5. User can manually change event date, zone, status, or notes.
6. Manual changes must set source = manual_override.
7. Manual changes must create audit_log records.
8. Holidays must be marked with is_holiday = true.
9. Export JSON must include all entities.
10. Import JSON must restore all entities.
11. Validation must detect:
   - missing route
   - missing rule
   - duplicated event for same trip/date/type
   - event without zone
   - event on holiday
   - manual override without reason

Acceptance criteria:
- The prototype runs locally.
- User can generate a 3-month schedule.
- Calendar view updates from trip_events.
- User can edit event date/status.
- Manual override is saved and visible.
- Audit log records changes.
- Exported JSON is backend/API-ready.
- README explains how to run and test the project.
- docs/data-model.md explains all entities.
- docs/business-rules.md explains generation logic.
- docs/test-scenarios.md includes UAT scenarios.

Important restrictions:
- Do not build a visual copy of the existing spreadsheet as the data model.
- Do not hardcode schedule directly into calendar cells.
- Do not mix trip and trip_event entities.
- Do not store business rules as free text only.
- Keep implementation simple and readable.
```

---

## 18. Kanban Card

### Title

Build Schedule Microservice Functional Prototype

### Description

Разработать функциональный прототип Schedule для замены ручного горизонтального графика отправок. Источником данных должна быть нормализованная структура `routes / trips / trip_events / zones / schedule_rules / holidays / audit_log`. Горизонтальный календарь должен быть только автоматически сгенерированным отображением.

### Deliverables

- interactive wireframe;
- schedule generator;
- normalized mock data;
- calendar view;
- trips list;
- trip details;
- manual override;
- audit log;
- export/import JSON;
- documentation.

### Acceptance Criteria

- график на 3 месяца генерируется из правил;
- calendar строится из `trip_events`;
- manual override сохраняется отдельно;
- holidays учитываются;
- JSON готов для backend/API;
- структура не повторяет текущую Google Sheet как источник данных.
