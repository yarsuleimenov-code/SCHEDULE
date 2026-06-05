const express = require("../http/express");
const zonesRepository = require("../repositories/zonesRepository");

function createZonesApi(db) {
  const router = express.Router();
  router.get("/zones", (req, res) => {
    res.json({ zones: zonesRepository.list(db) });
  });
  return router;
}

module.exports = createZonesApi;
