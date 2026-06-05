(function () {
  function eventLabel(event) {
    return `${event.event_type.replace("_", " ")} / ${event.status}`;
  }

  function render(state) {
    const events = [...state.trip_events].sort((a, b) => a.event_date.localeCompare(b.event_date) || a.sequence_no - b.sequence_no);
    if (!events.length) {
      return `
        <section class="view-header">
          <div>
            <h2>Calendar View</h2>
            <p>Generated from trip_events only.</p>
          </div>
        </section>
        <div class="empty-state">Generate schedule to render the calendar.</div>
      `;
    }

    const firstDate = events[0].event_date;
    const lastDate = events[events.length - 1].event_date;
    const dates = ScheduleEngine.dateRange(firstDate, lastDate);
    const rows = new Map();

    events.forEach((event) => {
      const trip = state.trips.find((item) => item.id === event.trip_id);
      const routeCode = trip ? trip.route_code : "unknown";
      const key = `${routeCode}|${event.region_code}|${event.zone_code}`;
      if (!rows.has(key)) {
        rows.set(key, {
          label: `${routeCode} / ${event.region_code} / ${event.zone_code}`,
          cells: new Map()
        });
      }
      const row = rows.get(key);
      if (!row.cells.has(event.event_date)) {
        row.cells.set(event.event_date, []);
      }
      row.cells.get(event.event_date).push(event);
    });

    const body = [...rows.values()].map((row) => {
      const cells = dates.map((date) => {
        const chips = (row.cells.get(date) || []).map((event) => {
          const classes = ["event-chip", `event-${event.source}`];
          if (event.is_holiday) classes.push("event-holiday");
          return `<button class="${classes.join(" ")}" type="button" data-action="open-trip" data-trip-id="${event.trip_id}">${eventLabel(event)}</button>`;
        }).join("");
        return `<td class="calendar-day">${chips}</td>`;
      }).join("");
      return `<tr><td><strong>${row.label}</strong></td>${cells}</tr>`;
    }).join("");

    const header = dates.map((date) => {
      const d = new Date(date + "T00:00:00");
      return `<th class="calendar-day">${date}<br><span class="muted">${d.toLocaleDateString(undefined, { weekday: "short" })}</span></th>`;
    }).join("");

    return `
      <section class="view-header">
        <div>
          <h2>Calendar View</h2>
          <p>Derived from ${events.length} trip_events. No calendar cells are persisted.</p>
        </div>
      </section>
      <div class="table-wrap">
        <table class="calendar-table">
          <thead><tr><th>Route / Region / Zone</th>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  window.CalendarView = { render };
})();

