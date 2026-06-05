(function () {
  const statuses = ["planned", "confirmed", "completed", "skipped", "moved", "cancelled"];

  function selectedTrip(state) {
    if (state.selectedTripId) {
      return state.trips.find((trip) => trip.id === state.selectedTripId) || state.trips[0];
    }
    return state.trips[0];
  }

  function renderTripPicker(state, trip) {
    return `
      <label class="wide">
        Select trip
        <select id="trip-picker">
          ${state.trips.map((item) => `<option value="${item.id}" ${trip && item.id === trip.id ? "selected" : ""}>${item.departure_date} / ${item.id}</option>`).join("")}
        </select>
      </label>
    `;
  }

  function render(state) {
    const trip = selectedTrip(state);
    if (!trip) {
      return `
        <section class="view-header">
          <div>
            <h2>Trip Details</h2>
            <p>Inspect trip events and create manual overrides.</p>
          </div>
        </section>
        <div class="empty-state">Generate schedule to inspect a trip.</div>
      `;
    }

    const events = state.trip_events
      .filter((event) => event.trip_id === trip.id)
      .sort((a, b) => a.sequence_no - b.sequence_no);

    const eventRows = events.map((event) => `
      <tr>
        <td><input type="radio" name="selected-event" value="${event.id}" ${state.selectedEventId === event.id ? "checked" : ""}></td>
        <td>${event.event_date}</td>
        <td>${event.event_type}</td>
        <td>${event.region_code}</td>
        <td>${event.zone_code}</td>
        <td>${event.status}</td>
        <td>${event.source}</td>
        <td>${event.is_holiday ? "yes" : "no"}</td>
      </tr>
    `).join("");

    const selectedEvent = events.find((event) => event.id === state.selectedEventId) || events[0];
    const zones = state.zones.filter((zone) => zone.active);

    return `
      <section class="view-header">
        <div>
          <h2>Trip Details</h2>
          <p>Manual changes update trip_events and create audit_log records.</p>
        </div>
      </section>
      <div class="two-column">
        <section class="panel">
          <h3>Trip Summary</h3>
          <div class="form-grid">
            ${renderTripPicker(state, trip)}
            <label>Route<input value="${trip.route_code}" readonly></label>
            <label>Status<input value="${trip.trip_status}" readonly></label>
            <label>Pickup<input value="${trip.pickup_start_date} - ${trip.pickup_end_date}" readonly></label>
            <label>Departure<input value="${trip.departure_date}" readonly></label>
            <label>Delivery<input value="${trip.delivery_start_date} - ${trip.delivery_end_date}" readonly></label>
            <label>Unloading<input value="${trip.unloading_date}" readonly></label>
          </div>
        </section>

        <section class="panel">
          <h3>Event Override</h3>
          ${selectedEvent ? `
            <form id="event-override-form" class="form-grid">
              <input type="hidden" name="event_id" value="${selectedEvent.id}">
              <label>Event date<input name="event_date" type="date" value="${selectedEvent.event_date}"></label>
              <label>Status
                <select name="status">
                  ${statuses.map((status) => `<option value="${status}" ${status === selectedEvent.status ? "selected" : ""}>${status}</option>`).join("")}
                </select>
              </label>
              <label>Zone
                <select name="zone_code">
                  ${zones.map((zone) => `<option value="${zone.region_code}|${zone.zone_code}" ${zone.region_code === selectedEvent.region_code && zone.zone_code === selectedEvent.zone_code ? "selected" : ""}>${zone.region_code} / ${zone.zone_code} / ${zone.zone_name}</option>`).join("")}
                </select>
              </label>
              <label>Override reason<input name="override_reason" value="${selectedEvent.override_reason || ""}" placeholder="Required for manual override"></label>
              <label class="wide">Notes<textarea name="notes">${selectedEvent.notes || ""}</textarea></label>
              <button type="submit">Save override</button>
            </form>
          ` : `<div class="empty-state">No events for this trip.</div>`}
        </section>
      </div>

      <section class="panel" style="margin-top: 16px;">
        <h3>Trip Events</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th></th><th>Date</th><th>Type</th><th>Region</th><th>Zone</th><th>Status</th><th>Source</th><th>Holiday</th></tr></thead>
            <tbody>${eventRows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  window.TripDetails = { render };
})();

