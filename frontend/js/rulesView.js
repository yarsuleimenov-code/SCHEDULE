(function () {
  function render(state) {
    const rows = state.schedule_rules.map((rule) => `
      <tr>
        <td>${rule.id}</td>
        <td>${rule.route_code}</td>
        <td>${rule.departure_interval_days}</td>
        <td>${rule.pickup_window_days}</td>
        <td>${rule.transit_days}</td>
        <td>${rule.delivery_window_days}</td>
        <td>${rule.unloading_offset_days}</td>
        <td>${rule.holiday_policy}</td>
        <td>${rule.active_from}</td>
        <td>${rule.active_to || ""}</td>
        <td>${rule.active ? "yes" : "no"}</td>
      </tr>
    `).join("");

    return `
      <section class="view-header">
        <div>
          <h2>Generation Rules</h2>
          <p>Rules are stored as parameters and used by the generator.</p>
        </div>
      </section>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Route</th><th>Departure interval</th><th>Pickup window</th><th>Transit</th><th>Delivery window</th><th>Unloading offset</th><th>Holiday policy</th><th>Active from</th><th>Active to</th><th>Active</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  window.RulesView = { render };
})();
