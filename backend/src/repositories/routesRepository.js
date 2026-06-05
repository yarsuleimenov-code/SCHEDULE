const { all, get, boolToInt, intToBool } = require("./baseRepository");

function map(row) {
  return row && Object.assign({}, row, { active: intToBool(row.active) });
}

function list(db) {
  return all(db, "SELECT * FROM routes ORDER BY route_code").map(map);
}

function findByCode(db, routeCode) {
  return map(get(db, "SELECT * FROM routes WHERE route_code = ?", [routeCode]));
}

function upsert(db, route) {
  db.prepare(`
    INSERT INTO routes (id, route_code, origin_region, destination_region, route_name, active, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      route_code = excluded.route_code,
      origin_region = excluded.origin_region,
      destination_region = excluded.destination_region,
      route_name = excluded.route_name,
      active = excluded.active,
      notes = excluded.notes
  `).run(route.id, route.route_code, route.origin_region, route.destination_region, route.route_name, boolToInt(route.active), route.notes || "");
}

module.exports = { list, findByCode, upsert };

