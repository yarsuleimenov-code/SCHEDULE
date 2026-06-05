const { all, get, boolToInt, intToBool } = require("./baseRepository");

function map(row) {
  return row && Object.assign({}, row, { is_holiday: intToBool(row.is_holiday) });
}

function list(db, filters = {}) {
  const where = [];
  const params = [];
  if (filters.start_date) {
    where.push("event_date >= ?");
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    where.push("event_date <= ?");
    params.push(filters.end_date);
  }
  if (filters.route_code) {
    where.push("trip_id IN (SELECT id FROM trips WHERE route_code = ?)");
    params.push(filters.route_code);
  }
  const sql = `SELECT * FROM trip_events ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY event_date, sequence_no`;
  return all(db, sql, params).map(map);
}

function findById(db, id) {
  return map(get(db, "SELECT * FROM trip_events WHERE id = ?", [id]));
}

function insert(db, event) {
  db.prepare(`
    INSERT INTO trip_events (
      id, trip_id, event_date, event_type, region_code, zone_code, sequence_no,
      status, is_holiday, source, override_reason, notes, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.trip_id,
    event.event_date,
    event.event_type,
    event.region_code,
    event.zone_code,
    event.sequence_no,
    event.status,
    boolToInt(event.is_holiday),
    event.source,
    event.override_reason || "",
    event.notes || "",
    event.created_at,
    event.updated_at
  );
}

function updateManualOverride(db, id, patch) {
  db.prepare(`
    UPDATE trip_events
    SET event_date = ?,
        status = ?,
        region_code = ?,
        zone_code = ?,
        notes = ?,
        override_reason = ?,
        source = 'manual_override',
        is_holiday = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    patch.event_date,
    patch.status,
    patch.region_code,
    patch.zone_code,
    patch.notes || "",
    patch.override_reason,
    boolToInt(patch.is_holiday),
    patch.updated_at,
    id
  );
  return findById(db, id);
}

module.exports = { list, findById, insert, updateManualOverride };

