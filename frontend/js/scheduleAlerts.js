(function () {
  function render(state) {
    const alerts = state.trip_events
      .filter((event) => event.is_holiday || event.source === "manual_override" || ["moved", "cancelled", "skipped"].includes(event.status))
      .sort((a, b) => a.event_date.localeCompare(b.event_date));

    const rows = alerts.map((event) => {
      const trip = state.trips.find((item) => item.id === event.trip_id);
      const reason = event.source === "manual_override"
        ? `Manual override: ${event.override_reason || "reason missing"}`
        : event.is_holiday
          ? "Holiday conflict"
          : `Status: ${event.status}`;
      return `
        <tr>
          <td>${event.event_date}</td>
          <td>${trip ? trip.route_code : ""}</td>
          <td><button class="secondary" type="button" data-action="open-trip" data-trip-id="${event.trip_id}">${event.trip_id}</button></td>
          <td>${event.event_type.replace("_", " ")}</td>
          <td>${event.region_code} / ${event.zone_code}</td>
          <td>${reason}</td>
        </tr>
      `;
    }).join("");

    return `
      <section class="view-header">
        <div>
          <h2>Schedule Alerts</h2>
          <p>Operational exceptions from holidays, manual overrides, and moved/cancelled events.</p>
        </div>
      </section>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Route</th><th>Trip</th><th>Event</th><th>Zone</th><th>Alert</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6">No alerts yet.</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }

  window.ScheduleAlerts = { render };
})();

