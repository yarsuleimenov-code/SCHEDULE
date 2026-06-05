const routesRepository = require("../repositories/routesRepository");
const zonesRepository = require("../repositories/zonesRepository");
const rulesRepository = require("../repositories/rulesRepository");
const holidaysRepository = require("../repositories/holidaysRepository");
const tripsRepository = require("../repositories/tripsRepository");
const tripEventsRepository = require("../repositories/tripEventsRepository");
const auditLogRepository = require("../repositories/auditLogRepository");

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

function nowIso() {
  return new Date().toISOString();
}

function makeEvent(db, trip, date, type, regionCode, zoneCode, sequenceNo) {
  const holiday = holidaysRepository.findByDate(db, date);
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
    created_at: nowIso(),
    updated_at: nowIso()
  };
}

function createTripEvents(db, route, rule, trip) {
  const events = [];
  const originZones = zonesRepository.listActiveByRegion(db, route.origin_region);
  const destinationZones = zonesRepository.listActiveByRegion(db, route.destination_region);
  const terminalZone = originZones.find((zone) => zone.zone_code === "TR") || originZones[0];
  const pickupZones = originZones.filter((zone) => zone.zone_code !== "TR");
  let sequenceNo = 1;

  dateRange(trip.pickup_start_date, trip.pickup_end_date).forEach((date, index) => {
    const zone = pickupZones[index % pickupZones.length] || originZones[0];
    events.push(makeEvent(db, trip, date, "pickup", route.origin_region, zone.zone_code, sequenceNo));
    sequenceNo += 1;
  });

  events.push(makeEvent(db, trip, trip.loading_date, "truck_loading", route.origin_region, terminalZone.zone_code, sequenceNo));
  sequenceNo += 1;
  events.push(makeEvent(db, trip, trip.departure_date, "departure", route.origin_region, terminalZone.zone_code, sequenceNo));
  sequenceNo += 1;

  dateRange(trip.departure_date, addDays(trip.departure_date, rule.transit_days - 1)).forEach((date) => {
    events.push(makeEvent(db, trip, date, "transit", route.origin_region, terminalZone.zone_code, sequenceNo));
    sequenceNo += 1;
  });

  dateRange(trip.delivery_start_date, trip.delivery_end_date).forEach((date, index) => {
    const zone = destinationZones[index % destinationZones.length] || destinationZones[0];
    events.push(makeEvent(db, trip, date, "delivery", route.destination_region, zone.zone_code, sequenceNo));
    sequenceNo += 1;
  });

  const unloadZone = destinationZones[0] || { zone_code: "SF" };
  events.push(makeEvent(db, trip, trip.unloading_date, "unloading", route.destination_region, unloadZone.zone_code, sequenceNo));
  return events;
}

function buildTrip(route, rule, departureDate, index) {
  const pickupEnd = addDays(departureDate, -2);
  const pickupStart = addDays(pickupEnd, -(rule.pickup_window_days - 1));
  const loadingDate = addDays(departureDate, -rule.loading_offset_days);
  const deliveryStart = addDays(departureDate, rule.transit_days);
  const deliveryEnd = addDays(deliveryStart, rule.delivery_window_days - 1);
  const unloadingDate = addDays(deliveryStart, rule.unloading_offset_days - 1);
  const current = nowIso();

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
    created_at: current,
    updated_at: current
  };
}

function generateSchedule(db, options) {
  const routeCode = options.route_code;
  const startDate = options.start_date;
  const months = Number(options.months || 3);
  const endDate = options.end_date || addDays(addMonths(startDate, months), -1);
  const route = routesRepository.findByCode(db, routeCode);
  if (!route) {
    const error = new Error(`Missing route: ${routeCode}`);
    error.status = 400;
    throw error;
  }

  const rule = rulesRepository.findActive(db, routeCode, startDate);
  if (!rule) {
    const error = new Error(`Missing active rule for route: ${routeCode}`);
    error.status = 400;
    throw error;
  }

  const warnings = [];
  const protectedGeneratedIds = tripsRepository.listGeneratedIdsInRange(db, routeCode, startDate, endDate);
  tripsRepository.removeGeneratedInRange(db, routeCode, startDate, endDate);

  let departureDate = startDate;
  let index = 0;
  const newTrips = [];
  const newEvents = [];

  while (departureDate <= endDate) {
    const trip = buildTrip(route, rule, departureDate, index);
    const events = createTripEvents(db, route, rule, trip);
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

  db.exec("BEGIN;");
  try {
    newTrips.forEach((trip) => tripsRepository.insert(db, trip));
    newEvents.forEach((event) => tripEventsRepository.insert(db, event));
    auditLogRepository.insert(db, {
      id: `AUD-GEN-${Date.now()}`,
      entity_type: "trip",
      entity_id: route.id,
      action: "generate",
      field_name: "route_code",
      old_value: "",
      new_value: route.route_code,
      changed_by: "backend",
      reason: `Generated ${newTrips.length} trips from ${startDate} to ${endDate}`,
      changed_at: nowIso()
    });
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  return {
    success: true,
    generated_trips: newTrips.length,
    generated_events: newEvents.length,
    warnings,
    protected_generated_trip_ids_before_regeneration: protectedGeneratedIds
  };
}

module.exports = {
  addDays,
  addMonths,
  dateRange,
  generateSchedule
};

