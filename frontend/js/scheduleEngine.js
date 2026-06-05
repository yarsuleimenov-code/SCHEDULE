(function () {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function parseDate(value) {
    return new Date(value + "T00:00:00");
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(value, days) {
    const date = typeof value === "string" ? parseDate(value) : new Date(value);
    date.setDate(date.getDate() + days);
    return formatDate(date);
  }

  function addMonths(value, months) {
    const date = parseDate(value);
    date.setMonth(date.getMonth() + months);
    return formatDate(date);
  }

  function dateRange(startDate, endDate) {
    const dates = [];
    let cursor = parseDate(startDate);
    const end = parseDate(endDate);
    while (cursor <= end) {
      dates.push(formatDate(cursor));
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
    return dates;
  }

  function activeRuleFor(state, routeCode, startDate) {
    return state.schedule_rules.find((rule) => {
      return rule.route_code === routeCode &&
        rule.active &&
        rule.active_from <= startDate &&
        (!rule.active_to || rule.active_to >= startDate);
    });
  }

  function holidayFor(state, date) {
    return state.holidays.find((holiday) => holiday.holiday_date === date && holiday.affects_schedule);
  }

  function activeZones(state, regionCode) {
    return state.zones
      .filter((zone) => zone.region_code === regionCode && zone.active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function makeEvent(state, trip, date, type, regionCode, zoneCode, sequenceNo) {
    const holiday = holidayFor(state, date);
    return {
      id: `EVT-${trip.id}-${String(sequenceNo).padStart(3, "0")}`,
      trip_id: trip.id,
      event_date: date,
      event_type: type,
      region_code: regionCode,
      zone_code: zoneCode,
      sequence_no: sequenceNo,
      status: "planned",
      is_holiday: Boolean(holiday),
      source: "generated",
      override_reason: "",
      notes: holiday ? `Holiday: ${holiday.holiday_name}` : "",
      created_at: ScheduleStorage.nowIso(),
      updated_at: ScheduleStorage.nowIso()
    };
  }

  function createTripEvents(state, route, rule, trip) {
    const events = [];
    const originZones = activeZones(state, route.origin_region);
    const destinationZones = activeZones(state, route.destination_region);
    const terminalZone = originZones.find((zone) => zone.zone_code === "TR") || originZones[0];
    const pickupZones = originZones.filter((zone) => zone.zone_code !== "TR");
    let sequenceNo = 1;

    dateRange(trip.pickup_start_date, trip.pickup_end_date).forEach((date, index) => {
      const zone = pickupZones[index % pickupZones.length] || originZones[0];
      events.push(makeEvent(state, trip, date, "pickup", route.origin_region, zone.zone_code, sequenceNo));
      sequenceNo += 1;
    });

    events.push(makeEvent(state, trip, trip.loading_date, "truck_loading", route.origin_region, terminalZone.zone_code, sequenceNo));
    sequenceNo += 1;

    events.push(makeEvent(state, trip, trip.departure_date, "departure", route.origin_region, terminalZone.zone_code, sequenceNo));
    sequenceNo += 1;

    dateRange(trip.departure_date, addDays(trip.departure_date, rule.transit_days - 1)).forEach((date) => {
      events.push(makeEvent(state, trip, date, "transit", route.origin_region, terminalZone.zone_code, sequenceNo));
      sequenceNo += 1;
    });

    dateRange(trip.delivery_start_date, trip.delivery_end_date).forEach((date, index) => {
      const zone = destinationZones[index % destinationZones.length] || destinationZones[0];
      events.push(makeEvent(state, trip, date, "delivery", route.destination_region, zone.zone_code, sequenceNo));
      sequenceNo += 1;
    });

    const unloadZone = destinationZones[0] || { zone_code: "SF" };
    events.push(makeEvent(state, trip, trip.unloading_date, "unloading", route.destination_region, unloadZone.zone_code, sequenceNo));

    return events;
  }

  function buildTrip(route, rule, departureDate, index) {
    const pickupEnd = addDays(departureDate, -2);
    const pickupStart = addDays(pickupEnd, -(rule.pickup_window_days - 1));
    const loadingDate = addDays(departureDate, -rule.loading_offset_days);
    const deliveryStart = addDays(departureDate, rule.transit_days);
    const deliveryEnd = addDays(deliveryStart, rule.delivery_window_days - 1);
    const unloadingDate = addDays(deliveryStart, rule.unloading_offset_days - 1);
    const now = ScheduleStorage.nowIso();

    return {
      id: `TRIP-${departureDate}-${route.route_code}-${String(index + 1).padStart(2, "0")}`,
      route_id: route.id,
      route_code: route.route_code,
      truck_id: "",
      driver_id: "",
      trip_status: "planned",
      pickup_start_date: pickupStart,
      pickup_end_date: pickupEnd,
      loading_date: loadingDate,
      departure_date: departureDate,
      delivery_start_date: deliveryStart,
      delivery_end_date: deliveryEnd,
      unloading_date: unloadingDate,
      source: "generated",
      created_at: now,
      updated_at: now
    };
  }

  function generateSchedule(state, options) {
    const route = state.routes.find((item) => item.route_code === options.route_code && item.active);
    if (!route) {
      throw new Error("Missing route: " + options.route_code);
    }

    const rule = activeRuleFor(state, options.route_code, options.start_date);
    if (!rule) {
      throw new Error("Missing active rule for route: " + options.route_code);
    }

    const endDate = addDays(addMonths(options.start_date, Number(options.months || 3)), -1);
    const warnings = [];
    const generatedTripIds = new Set(
      state.trips
        .filter((trip) => trip.route_code === route.route_code && trip.source === "generated")
        .map((trip) => trip.id)
    );

    state.trips = state.trips.filter((trip) => {
      return !(generatedTripIds.has(trip.id) && trip.departure_date >= options.start_date && trip.departure_date <= endDate);
    });
    state.trip_events = state.trip_events.filter((event) => {
      return !(generatedTripIds.has(event.trip_id) && event.source === "generated");
    });

    let departureDate = options.start_date;
    let index = 0;
    const newTrips = [];
    const newEvents = [];

    while (departureDate <= endDate) {
      const trip = buildTrip(route, rule, departureDate, index);
      const events = createTripEvents(state, route, rule, trip);
      events.forEach((event) => {
        if (event.is_holiday) {
          warnings.push({
            type: "holiday_conflict",
            date: event.event_date,
            event_type: event.event_type,
            trip_id: trip.id
          });
        }
      });
      newTrips.push(trip);
      newEvents.push(...events);
      departureDate = addDays(departureDate, rule.departure_interval_days);
      index += 1;
    }

    state.trips.push(...newTrips);
    state.trip_events.push(...newEvents);
    state.audit_log.push({
      id: `AUD-GEN-${Date.now()}`,
      entity_type: "trip",
      entity_id: route.id,
      action: "generate",
      field_name: "route_code",
      old_value: "",
      new_value: route.route_code,
      changed_by: "wireframe-user",
      reason: `Generated ${newTrips.length} trips from ${options.start_date} to ${endDate}`,
      changed_at: ScheduleStorage.nowIso()
    });

    return {
      generated_trips: newTrips.length,
      generated_events: newEvents.length,
      warnings
    };
  }

  function validateState(state) {
    const errors = [];
    const warnings = [];
    const routeIds = new Set(state.routes.map((route) => route.id));
    const tripIds = new Set(state.trips.map((trip) => trip.id));
    const holidayDates = new Set(state.holidays.filter((holiday) => holiday.affects_schedule).map((holiday) => holiday.holiday_date));
    const eventKeys = new Set();

    state.trips.forEach((trip) => {
      if (!routeIds.has(trip.route_id)) {
        errors.push(`missing route for trip ${trip.id}`);
      }
      if (!activeRuleFor(state, trip.route_code, trip.departure_date)) {
        errors.push(`missing rule for trip ${trip.id}`);
      }
    });

    state.routes.forEach((route) => {
      if (!activeRuleFor(state, route.route_code, route.active_from || "2026-05-01")) {
        warnings.push(`missing rule for route ${route.route_code}`);
      }
    });

    state.trip_events.forEach((event) => {
      if (!tripIds.has(event.trip_id)) {
        errors.push(`missing trip for event ${event.id}`);
      }
      if (!event.zone_code) {
        errors.push(`event without zone ${event.id}`);
      }
      const key = `${event.trip_id}|${event.event_date}|${event.event_type}`;
      if (eventKeys.has(key)) {
        errors.push(`duplicated event for same trip/date/type ${key}`);
      }
      eventKeys.add(key);
      if (holidayDates.has(event.event_date)) {
        warnings.push(`event on holiday ${event.id} ${event.event_date}`);
        if (!event.is_holiday) {
          errors.push(`holiday event not marked ${event.id}`);
        }
      }
      if (event.source === "manual_override" && !event.override_reason) {
        errors.push(`manual override without reason ${event.id}`);
      }
    });

    return { errors, warnings };
  }

  window.ScheduleEngine = {
    addDays,
    addMonths,
    dateRange,
    generateSchedule,
    validateState
  };
})();

