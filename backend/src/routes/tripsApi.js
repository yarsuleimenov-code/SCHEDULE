const express = require("../http/express");
const tripsRepository = require("../repositories/tripsRepository");

function createTripsApi(db) {
  const router = express.Router();
  router.get("/trips", (req, res) => {
    res.json({ trips: tripsRepository.list(db) });
  });
  router.get("/trips/:id", (req, res) => {
    const trip = tripsRepository.findById(db, req.params.id);
    if (!trip) {
      res.status(404).json({ error: { code: "TRIP_NOT_FOUND", message: "Trip not found" } });
      return;
    }
    res.json({ trip });
  });
  return router;
}

module.exports = createTripsApi;
