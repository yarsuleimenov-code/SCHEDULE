(function () {
  function render(state) {
    const rows = [...state.audit_log]
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at))
      .map((entry) => `
        <tr>
          <td>${entry.changed_at}</td>
          <td>${entry.action}</td>
          <td>${entry.entity_type}</td>
          <td>${entry.entity_id}</td>
          <td>${entry.field_name || ""}</td>
          <td>${entry.old_value || ""}</td>
          <td>${entry.new_value || ""}</td>
          <td>${entry.reason || ""}</td>
        </tr>
      `).join("");

    return `
      <section class="view-header">
        <div>
          <h2>Change History</h2>
          <p>Generation and manual overrides are recorded here.</p>
        </div>
      </section>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Changed at</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Field</th><th>Old</th><th>New</th><th>Reason</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="8">No audit records yet.</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }

  window.AuditLogView = { render };
})();
