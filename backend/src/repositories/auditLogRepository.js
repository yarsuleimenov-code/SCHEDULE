const { all } = require("./baseRepository");

function list(db) {
  return all(db, "SELECT * FROM audit_log ORDER BY changed_at DESC, id DESC");
}

function insert(db, entry) {
  db.prepare(`
    INSERT INTO audit_log (
      id, entity_type, entity_id, action, field_name, old_value,
      new_value, changed_by, reason, changed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id,
    entry.entity_type,
    entry.entity_id,
    entry.action,
    entry.field_name || "",
    entry.old_value || "",
    entry.new_value || "",
    entry.changed_by || "",
    entry.reason || "",
    entry.changed_at
  );
}

module.exports = { list, insert };

