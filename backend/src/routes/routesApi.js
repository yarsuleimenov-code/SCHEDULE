const express = require("../http/express");
const routesRepository = require("../repositories/routesRepository");

function createRoutesApi(db) {
  const router = express.Router();
  router.get("/routes", (req, res) => {
    res.json({ routes: routesRepository.list(db) });
  });
  return router;
}

module.exports = createRoutesApi;
