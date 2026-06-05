function boolToInt(value) {
  return value ? 1 : 0;
}

function intToBool(value) {
  return Boolean(value);
}

function all(db, sql, params = []) {
  return db.prepare(sql).all(...params);
}

function get(db, sql, params = []) {
  return db.prepare(sql).get(...params);
}

module.exports = {
  all,
  get,
  boolToInt,
  intToBool
};

