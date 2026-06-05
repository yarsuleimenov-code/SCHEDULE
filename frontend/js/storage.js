(function () {
  const STORAGE_KEY = "schedule_wireframe_state_v1";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function defaultState() {
    return clone(window.ScheduleMockData);
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = defaultState();
      saveState(seeded);
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      const seeded = defaultState();
      saveState(seeded);
      return seeded;
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState() {
    const seeded = defaultState();
    saveState(seeded);
    return seeded;
  }

  function replaceState(nextState) {
    const required = ["routes", "trips", "trip_events", "zones", "schedule_rules", "holidays", "audit_log"];
    required.forEach((key) => {
      if (!Array.isArray(nextState[key])) {
        throw new Error("Import payload is missing array: " + key);
      }
    });
    saveState(nextState);
    return nextState;
  }

  window.ScheduleStorage = {
    loadState,
    saveState,
    resetState,
    replaceState,
    nowIso,
    clone
  };
})();

