(function () {
  function render(state) {
    const rows = [...state.trips]
      .sort((a, b) => a.departure_date.localeCompare(b.departure_date))
      .map((trip) => `
        <tr>
          <td><button class="secondary" type="button" data-action="open-trip" data-trip-id="${trip.id}">${trip.id}</button></td>
          <td>${trip.route_code}</td>
          <td>${trip.trip_status}</td>
          <td>${trip.pickup_start_date} - ${trip.pickup_end_date}</td>
          <td>${trip.loading_date}</td>
          <td>${trip.departure_date}</td>
          <td>${trip.delivery_start_date} - ${trip.delivery_end_date}</td>
          <td>${trip.unloading_date}</td>
          <td>${trip.source}</td>
        </tr>
      `).join("");

    return `
      <section class="view-header">
        <div>
          <h2>Trips List</h2>
          <p>Trips are generated from schedule_rules and route data.</p>
        </div>
      </section>
      <div class="summary-grid">
        <div class="metric"><span>Trips</span><strong>${state.trips.length}</strong></div>
        <div class="metric"><span>Trip events</span><strong>${state.trip_events.length}</strong></div>
        <div class="metric"><span>Manual overrides</span><strong>${state.trip_events.filter((event) => event.source === "manual_override").length}</strong></div>
        <div class="metric"><span>Holiday events</span><strong>${state.trip_events.filter((event) => event.is_holiday).length}</strong></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Route</th>
              <th>Status</th>
              <th>Pickup Window</th>
              <th>Loading</th>
              <th>Departure</th>
              <th>Delivery Window</th>
              <th>Unloading</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="9">No trips yet.</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }

  window.TripsView = { render };
})();

