const { all, boolToInt, intToBool } = require("./baseRepository");

function map(row) {
  return row && Object.assign({}, row, { active: intToBool(row.active) });
}

function list(db) {
  return all(db, "SELECT * FROM zones ORDER BY region_code, sort_order").map(map);
}

function listActiveByRegion(db, regionCode) {
  return all(db, "SELECT * FROM zones WHERE region_code = ? AND active = 1 ORDER BY sort_order", [regionCode]).map(map);
}

function upsert(db, zone) {
  db.prepare(`
    INSERT INTO zones (id, region_code, zone_code, zone_name, state, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      region_code = excluded.region_code,
      zone_code = excluded.zone_code,
      zone_name = excluded.zone_name,
      state = excluded.state,
      active = excluded.active,
      sort_order = excluded.sort_order
  `).run(zone.id, zone.region_code, zone.zone_code, zone.zone_name, zone.state || "", boolToInt(zone.active), zone.sort_order);
}

module.exports = { list, listActiveByRegion, upsert };

