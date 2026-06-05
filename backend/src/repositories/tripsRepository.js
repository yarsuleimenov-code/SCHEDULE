const { all, get } = require("./baseRepository");

function list(db) {
  return all(db, "SELECT * FROM trips ORDER BY departure_date, id");
}

function findById(db, id) {
  return get(db, "SELECT * FROM trips WHERE id = ?", [id]);
}

function listGeneratedIdsInRange(db, routeCode, startDate, endDate) {
  return all(db, `
    SELECT id FROM trips
    WHERE route_code = ?
      AND source = 'generated'
      AND departure_date >= ?
      AND departure_date <= ?
  `, [routeCode, startDate, endDate]).map((row) => row.id);
}

function removeGeneratedInRange(db, routeCode, startDate, endDate) {
  db.prepare(`
    DELETE FROM trips
    WHERE route_code = ?
      AND source = 'generated'
      AND departure_date >= ?
      AND departure_date <= ?
      AND id NOT IN (
        SELECT DISTINCT trip_id FROM trip_events WHERE source = 'manual_override'
      )
  `).run(routeCode, startDate, endDate);
}

function insert(db, trip) {
  db.prepare(`
    INSERT INTO trips (
      id, route_id, route_code, truck_id, driver_id, trip_status,
      pickup_start_date, pickup_end_date, loading_date, departure_date,
      delivery_start_date, delivery_end_date, unloading_date, source, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    trip.id,
    trip.route_id,
    trip.route_code,
    trip.truck_id || "",
    trip.driver_id || "",
    trip.trip_status,
    trip.pickup_start_date,
    trip.pickup_end_date,
    trip.loading_date,
    trip.departure_date,
    trip.delivery_start_date,
    trip.delivery_end_date,
    trip.unloading_date,
    trip.source,
    trip.created_at,
    trip.updated_at
  );
}

module.exports = { list, findById, listGeneratedIdsInRange, removeGeneratedInRange, insert };

