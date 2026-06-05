(function () {
  function routeName(state, routeCode) {
    const route = state.routes.find((item) => item.route_code === routeCode);
    return route ? route.route_name : routeCode;
  }

  function tripEvents(state, trip) {
    return state.trip_events
      .filter((event) => event.trip_id === trip.id)
      .sort((a, b) => a.sequence_no - b.sequence_no);
  }

  function hasAlert(events) {
    return events.some((event) => event.is_holiday || event.source === "manual_override" || ["moved", "cancelled", "skipped"].includes(event.status));
  }

  function renderTripCard(state, trip) {
    const events = tripEvents(state, trip);
    const firstEvents = events.slice(0, 7).map((event) => {
      const classes = ["timeline-dot", `dot-${event.event_type}`];
      if (event.is_holiday) classes.push("dot-holiday");
      if (event.source === "manual_override") classes.push("dot-override");
      return `
        <span class="${classes.join(" ")}" title="${event.event_type} ${event.event_date}">
          <span>${event.event_type.replace("_", " ")}</span>
        </span>
      `;
    }).join("");

    return `
      <article class="trip-card ${hasAlert(events) ? "trip-card-alert" : ""}">
        <div class="trip-card-header">
          <div>
            <h3>${trip.departure_date} / ${routeName(state, trip.route_code)}</h3>
            <p>${trip.id}</p>
          </div>
          <span class="status-pill">${trip.trip_status}</span>
        </div>
        <div class="trip-card-dates">
          <span><strong>Pickup</strong>${trip.pickup_start_date} - ${trip.pickup_end_date}</span>
          <span><strong>Depart</strong>${trip.departure_date}</span>
          <span><strong>Deliver</strong>${trip.delivery_start_date} - ${trip.delivery_end_date}</span>
          <span><strong>Unload</strong>${trip.unloading_date}</span>
        </div>
        <div class="mini-timeline">${firstEvents}</div>
        <button class="secondary" type="button" data-action="open-trip" data-trip-id="${trip.id}">Open Trip Timeline</button>
      </article>
    `;
  }

  function render(state) {
    const trips = [...state.trips].sort((a, b) => a.departure_date.localeCompare(b.departure_date));
    const alertEvents = state.trip_events.filter((event) => event.is_holiday || event.source === "manual_override" || ["moved", "cancelled", "skipped"].includes(event.status));

    if (!trips.length) {
      return `
        <section class="view-header">
          <div>
            <h2>Schedule Board</h2>
            <p>Trip-first planning board for generated NJ1 -> CA1 schedule.</p>
          </div>
        </section>
        <div class="empty-state">Generate a 3-month schedule to create trip cards.</div>
      `;
    }

    return `
      <section class="view-header">
        <div>
          <h2>Schedule Board</h2>
          <p>Trip-first planning board. Use Zone Calendar only as an advanced zone/date view.</p>
        </div>
      </section>
      <div class="summary-grid">
        <div class="metric"><span>Trips</span><strong>${trips.length}</strong></div>
        <div class="metric"><span>Timeline records</span><strong>${state.trip_events.length}</strong></div>
        <div class="metric"><span>Schedule alerts</span><strong>${alertEvents.length}</strong></div>
        <div class="metric"><span>Manual overrides</span><strong>${state.trip_events.filter((event) => event.source === "manual_override").length}</strong></div>
      </div>
      <section class="board-grid">
        ${trips.map((trip) => renderTripCard(state, trip)).join("")}
      </section>
    `;
  }

  window.ScheduleBoard = { render };
})();

