# Business Demo Script

## Цель демо

Показать бизнесу, как ручной горизонтальный Google Sheets schedule заменяется демонстрационным Schedule MVP:

```text
normalized data -> generated Gantt/calendar view -> controlled manual override -> exportable JSON
```

Главный тезис:

```text
Calendar is not the source of truth.
Source of truth: routes / trips / trip_events / zones / schedule_rules / holidays / audit_log.
```

## Что показываем бизнесу

- Demo работает локально без backend.
- Default route: `NJ1 -> CA1`.
- Schedule генерируется на 3 месяца.
- Gantt/calendar view строится из `trip_events`.
- Trip Details показывает конкретный рейс и его timeline.
- Manual Override требует причину.
- Change History фиксирует изменение.
- Export Demo JSON показывает backend/API-ready структуру.

## Какие проблемы Google Sheets закрываем

| Проблема в Google Sheets | Что показывает demo |
|---|---|
| Горизонтальные ячейки являются ручным источником правды | Calendar строится из нормализованных `trip_events` |
| Смешаны даты, зоны, события, цвета и комментарии | Данные разделены на routes, trips, trip_events, zones, rules, holidays |
| Ручной перенос легко ломает логику | Override требует reason и пишет Change History |
| Праздники видны только цветом | Holiday хранится как флаг `is_holiday` |
| Нельзя стабильно экспортировать данные | Export Demo JSON содержит все сущности |
| Сложно считать SLA и отклонения | Trip Timeline дает структурированные события |

## Demo Flow на 5-7 минут

1. Открыть `frontend/index.html`.
2. Показать заголовок `Schedule Demo MVP` и объяснить demo mode:
   - localStorage;
   - mock data;
   - default route `NJ1 -> CA1`;
   - no backend dependency for demo.
3. Нажать `Generate 3-Month Schedule`.
4. Показать Calendar View:
   - Gantt/calendar view;
   - legend: Pickup, Truck Loading, Departure, Transit, Delivery, Unloading, Holiday, Manual Override;
   - объяснить, что view построен из `trip_events`.
5. Открыть любой trip из Calendar View или Trips List.
6. В Trip Details выбрать событие, изменить date/status/zone/notes и указать override reason.
7. Вернуться в Calendar View и показать, что событие обновилось.
8. Открыть `Change History` и показать audit запись.
9. Нажать `Export Demo JSON` или открыть `Export / Import` и показать normalized payload.

## Вопросы для сбора обратной связи

- Достаточно ли Gantt/calendar view для ежедневной операционной проверки?
- Какие зоны должны быть подтверждены или переименованы?
- Какой точный смысл pickup window для `NJ1 -> CA1`?
- Как считать unloading date: от departure, arrival или delivery start?
- Какая holiday policy нужна в MVP: mark only или shift?
- Какие события должны быть обязательными для каждого trip?
- Какие поля нужны брокерам/dispatchers в Trip Details?
- Нужен ли truck/driver в первом backend-connected MVP?

## Что не входит в MVP

- backend/API mode в demo;
- CRM integration;
- auth/roles;
- order-to-trip assignment;
- dispatch optimization;
- production calendar;
- drag-and-drop;
- pricing;
- capacity planning;
- automated holiday shifting without approved policy.

