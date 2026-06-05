const express = require("../http/express");
const holidaysRepository = require("../repositories/holidaysRepository");

function createHolidaysApi(db) {
  const router = express.Router();
  router.get("/holidays", (req, res) => {
    res.json({ holidays: holidaysRepository.list(db) });
  });
  return router;
}

module.exports = createHolidaysApi;
