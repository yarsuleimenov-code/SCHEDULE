const { all, get, boolToInt, intToBool } = require("./baseRepository");

function map(row) {
  return row && Object.assign({}, row, { affects_schedule: intToBool(row.affects_schedule) });
}

function list(db) {
  return all(db, "SELECT * FROM holidays ORDER BY holiday_date").map(map);
}

function findByDate(db, date) {
  return map(get(db, "SELECT * FROM holidays WHERE holiday_date = ? AND affects_schedule = 1", [date]));
}

function upsert(db, holiday) {
  db.prepare(`
    INSERT INTO holidays (id, holiday_date, holiday_name, country, state, affects_schedule)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      holiday_date = excluded.holiday_date,
      holiday_name = excluded.holiday_name,
      country = excluded.country,
      state = excluded.state,
      affects_schedule = excluded.affects_schedule
  `).run(holiday.id, holiday.holiday_date, holiday.holiday_name, holiday.country, holiday.state || "", boolToInt(holiday.affects_schedule));
}

module.exports = { list, findByDate, upsert };

