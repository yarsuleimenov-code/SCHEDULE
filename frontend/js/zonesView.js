(function () {
  function render(state) {
    const rows = [...state.zones]
      .sort((a, b) => a.region_code.localeCompare(b.region_code) || a.sort_order - b.sort_order)
      .map((zone) => `
        <tr>
          <td>${zone.id}</td>
          <td>${zone.region_code}</td>
          <td>${zone.zone_code}</td>
          <td>${zone.zone_name}</td>
          <td>${zone.state || ""}</td>
          <td>${zone.sort_order}</td>
          <td>${zone.active ? "yes" : "no"}</td>
        </tr>
      `).join("");

    return `
      <section class="view-header">
        <div>
          <h2>Zones Reference</h2>
          <p>Zones are referenced by trip_events and should not be deleted when used.</p>
        </div>
      </section>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Region</th><th>Zone</th><th>Name</th><th>State</th><th>Sort</th><th>Active</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  window.ZonesView = { render };
})();

