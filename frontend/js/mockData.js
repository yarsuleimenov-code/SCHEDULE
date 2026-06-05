(function () {
  window.ScheduleMockData = {
    routes: [
      {
        id: "ROUTE-NJ1-CA1",
        route_code: "NJ1_CA1",
        origin_region: "NJ1",
        destination_region: "CA1",
        route_name: "NJ to CA",
        active: true,
        notes: "Initial MVP route discovered from Schedule.xlsx"
      }
    ],
    zones: [
      { id: "ZONE-NJ1-N", region_code: "NJ1", zone_code: "N", zone_name: "North NJ", state: "NJ", active: true, sort_order: 10 },
      { id: "ZONE-NJ1-S", region_code: "NJ1", zone_code: "S", zone_name: "South NJ", state: "NJ", active: true, sort_order: 20 },
      { id: "ZONE-NJ1-NY", region_code: "NJ1", zone_code: "NY", zone_name: "New York", state: "NY", active: true, sort_order: 30 },
      { id: "ZONE-NJ1-LI", region_code: "NJ1", zone_code: "LI", zone_name: "Long Island", state: "NY", active: true, sort_order: 40 },
      { id: "ZONE-NJ1-DC", region_code: "NJ1", zone_code: "DC", zone_name: "DC Area", state: "DC", active: true, sort_order: 50 },
      { id: "ZONE-NJ1-TR", region_code: "NJ1", zone_code: "TR", zone_name: "Terminal", state: "NJ", active: true, sort_order: 60 },
      { id: "ZONE-CA1-SF", region_code: "CA1", zone_code: "SF", zone_name: "San Francisco", state: "CA", active: true, sort_order: 10 },
      { id: "ZONE-CA1-N", region_code: "CA1", zone_code: "N", zone_name: "Northern California", state: "CA", active: true, sort_order: 20 },
      { id: "ZONE-CA1-S", region_code: "CA1", zone_code: "S", zone_name: "Southern California", state: "CA", active: true, sort_order: 30 }
    ],
    schedule_rules: [
      {
        id: "RULE-NJ1-CA1-2026",
        route_id: "ROUTE-NJ1-CA1",
        route_code: "NJ1_CA1",
        departure_interval_days: 9,
        pickup_window_days: 4,
        loading_offset_days: 1,
        transit_days: 4,
        delivery_window_days: 5,
        unloading_offset_days: 5,
        total_cycle_days: 9,
        holiday_policy: "mark_only",
        active_from: "2026-05-01",
        active_to: "2026-12-31",
        active: true
      }
    ],
    holidays: [
      { id: "HOL-2026-05-25", holiday_date: "2026-05-25", holiday_name: "Memorial Day", country: "US", state: "federal", affects_schedule: true },
      { id: "HOL-2026-06-19", holiday_date: "2026-06-19", holiday_name: "Juneteenth", country: "US", state: "federal", affects_schedule: true },
      { id: "HOL-2026-07-04", holiday_date: "2026-07-04", holiday_name: "Independence Day", country: "US", state: "federal", affects_schedule: true }
    ],
    trips: [],
    trip_events: [],
    audit_log: []
  };
})();

