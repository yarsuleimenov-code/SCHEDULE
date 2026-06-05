CREATE TABLE routes (
  id TEXT PRIMARY KEY,
  route_code TEXT NOT NULL UNIQUE,
  origin_region TEXT NOT NULL,
  destination_region TEXT NOT NULL,
  route_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

CREATE TABLE zones (
  id TEXT PRIMARY KEY,
  region_code TEXT NOT NULL,
  zone_code TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  state TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL,
  UNIQUE (region_code, zone_code)
);

CREATE TABLE schedule_rules (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  route_code TEXT NOT NULL,
  departure_interval_days INTEGER NOT NULL,
  pickup_window_days INTEGER NOT NULL,
  loading_offset_days INTEGER NOT NULL,
  transit_days INTEGER NOT NULL,
  delivery_window_days INTEGER NOT NULL,
  unloading_offset_days INTEGER NOT NULL,
  total_cycle_days INTEGER NOT NULL,
  holiday_policy TEXT NOT NULL,
  active_from TEXT NOT NULL,
  active_to TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

CREATE TABLE holidays (
  id TEXT PRIMARY KEY,
  holiday_date TEXT NOT NULL,
  holiday_name TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  affects_schedule INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  route_code TEXT NOT NULL,
  truck_id TEXT,
  driver_id TEXT,
  trip_status TEXT NOT NULL,
  pickup_start_date TEXT NOT NULL,
  pickup_end_date TEXT NOT NULL,
  loading_date TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  delivery_start_date TEXT NOT NULL,
  delivery_end_date TEXT NOT NULL,
  unloading_date TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

CREATE TABLE trip_events (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  region_code TEXT NOT NULL,
  zone_code TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  status TEXT NOT NULL,
  is_holiday INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  override_reason TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  UNIQUE (trip_id, event_date, event_type)
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  reason TEXT,
  changed_at TEXT NOT NULL
);

CREATE INDEX idx_trips_route_departure ON trips(route_code, departure_date);
CREATE INDEX idx_trip_events_date ON trip_events(event_date);
CREATE INDEX idx_trip_events_trip ON trip_events(trip_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

