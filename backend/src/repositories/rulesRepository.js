const { all, get, boolToInt, intToBool } = require("./baseRepository");

function map(row) {
  return row && Object.assign({}, row, { active: intToBool(row.active) });
}

function list(db) {
  return all(db, "SELECT * FROM schedule_rules ORDER BY route_code, active_from").map(map);
}

function findActive(db, routeCode, startDate) {
  return map(get(db, `
    SELECT * FROM schedule_rules
    WHERE route_code = ?
      AND active = 1
      AND active_from <= ?
      AND (active_to IS NULL OR active_to = '' OR active_to >= ?)
    ORDER BY active_from DESC
    LIMIT 1
  `, [routeCode, startDate, startDate]));
}

function upsert(db, rule) {
  db.prepare(`
    INSERT INTO schedule_rules (
      id, route_id, route_code, departure_interval_days, pickup_window_days,
      loading_offset_days, transit_days, delivery_window_days, unloading_offset_days,
      total_cycle_days, holiday_policy, active_from, active_to, active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      route_id = excluded.route_id,
      route_code = excluded.route_code,
      departure_interval_days = excluded.departure_interval_days,
      pickup_window_days = excluded.pickup_window_days,
      loading_offset_days = excluded.loading_offset_days,
      transit_days = excluded.transit_days,
      delivery_window_days = excluded.delivery_window_days,
      unloading_offset_days = excluded.unloading_offset_days,
      total_cycle_days = excluded.total_cycle_days,
      holiday_policy = excluded.holiday_policy,
      active_from = excluded.active_from,
      active_to = excluded.active_to,
      active = excluded.active
  `).run(
    rule.id,
    rule.route_id,
    rule.route_code,
    rule.departure_interval_days,
    rule.pickup_window_days,
    rule.loading_offset_days,
    rule.transit_days,
    rule.delivery_window_days,
    rule.unloading_offset_days,
    rule.total_cycle_days,
    rule.holiday_policy,
    rule.active_from,
    rule.active_to || "",
    boolToInt(rule.active)
  );
}

module.exports = { list, findActive, upsert };

