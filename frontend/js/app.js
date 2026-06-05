(function () {
  let state = ScheduleStorage.loadState();
  let activeView = "calendar";
  let selectedTripId = "";
  let selectedEventId = "";

  const root = document.getElementById("app-root");
  const message = document.getElementById("app-message");
  const routeSelect = document.getElementById("generate-route");

  function setMessage(text, isError) {
    message.textContent = text || "";
    message.style.color = isError ? "var(--danger)" : "var(--muted)";
  }

  function saveAndRender(text) {
    ScheduleStorage.saveState(state);
    render();
    if (text) setMessage(text);
  }

  function populateRouteSelect() {
    routeSelect.innerHTML = state.routes
      .filter((route) => route.active)
      .map((route) => `<option value="${route.route_code}">${route.route_code} / ${route.route_name}</option>`)
      .join("");
  }

  function render() {
    populateRouteSelect();
    document.querySelectorAll(".tab").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === activeView);
    });

    const views = {
      calendar: CalendarView.render,
      trips: TripsView.render,
      "trip-details": TripDetails.render,
      rules: RulesView.render,
      zones: ZonesView.render,
      holidays: HolidaysView.render,
      "export-import": ExportImportView.render,
      "audit-log": AuditLogView.render
    };
    const viewState = Object.assign({}, state, { selectedTripId, selectedEventId });
    root.innerHTML = views[activeView](viewState);
  }

  function updateEvent(form) {
    const formData = new FormData(form);
    const event = state.trip_events.find((item) => item.id === formData.get("event_id"));
    if (!event) return;

    const overrideReason = String(formData.get("override_reason") || "").trim();
    if (!overrideReason) {
      setMessage("Override reason is required.", true);
      return;
    }

    const [regionCode, zoneCode] = String(formData.get("zone_code")).split("|");
    const changes = {
      event_date: formData.get("event_date"),
      status: formData.get("status"),
      region_code: regionCode,
      zone_code: zoneCode,
      notes: formData.get("notes") || "",
      override_reason: overrideReason
    };

    Object.entries(changes).forEach(([field, value]) => {
      if (String(event[field] || "") !== String(value || "")) {
        state.audit_log.push({
          id: `AUD-${Date.now()}-${field}`,
          entity_type: "trip_event",
          entity_id: event.id,
          action: "override",
          field_name: field,
          old_value: String(event[field] || ""),
          new_value: String(value || ""),
          changed_by: "wireframe-user",
          reason: overrideReason,
          changed_at: ScheduleStorage.nowIso()
        });
      }
      event[field] = value;
    });

    event.source = "manual_override";
    event.updated_at = ScheduleStorage.nowIso();
    event.is_holiday = state.holidays.some((holiday) => holiday.affects_schedule && holiday.holiday_date === event.event_date);
    saveAndRender("Manual override saved. Calendar View updated from trip_events.");
  }

  document.querySelector(".tabs").addEventListener("click", (event) => {
    const button = event.target.closest(".tab");
    if (!button) return;
    activeView = button.dataset.view;
    render();
  });

  document.getElementById("generate-schedule").addEventListener("click", () => {
    try {
      const result = ScheduleEngine.generateSchedule(state, {
        route_code: document.getElementById("generate-route").value,
        start_date: document.getElementById("generate-start").value,
        months: document.getElementById("generate-months").value
      });
      activeView = "calendar";
      saveAndRender(`Generated ${result.generated_trips} trips and ${result.generated_events} events. Holiday warnings: ${result.warnings.length}.`);
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  document.getElementById("reset-data").addEventListener("click", () => {
    state = ScheduleStorage.resetState();
    activeView = "calendar";
    selectedTripId = "";
    selectedEventId = "";
    setMessage("Mock data reset.");
    render();
  });

  root.addEventListener("click", (event) => {
    const openTrip = event.target.closest("[data-action='open-trip']");
    if (openTrip) {
      selectedTripId = openTrip.dataset.tripId;
      const firstEvent = state.trip_events.find((item) => item.trip_id === selectedTripId);
      selectedEventId = firstEvent ? firstEvent.id : "";
      activeView = "trip-details";
      render();
      return;
    }

    if (event.target.id === "refresh-export") {
      render();
    }

    if (event.target.id === "download-export") {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "schedule-export.json";
      link.click();
      URL.revokeObjectURL(link.href);
    }

    if (event.target.id === "import-json") {
      try {
        const payload = JSON.parse(document.getElementById("json-payload").value);
        state = ScheduleStorage.replaceState(payload);
        activeView = "calendar";
        selectedTripId = "";
        selectedEventId = "";
        saveAndRender("JSON imported.");
      } catch (error) {
        setMessage(error.message, true);
      }
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.id === "trip-picker") {
      selectedTripId = event.target.value;
      const firstEvent = state.trip_events.find((item) => item.trip_id === selectedTripId);
      selectedEventId = firstEvent ? firstEvent.id : "";
      render();
    }

    if (event.target.name === "selected-event") {
      selectedEventId = event.target.value;
      render();
    }
  });

  root.addEventListener("submit", (event) => {
    if (event.target.id === "event-override-form") {
      event.preventDefault();
      updateEvent(event.target);
    }
  });

  render();
})();
