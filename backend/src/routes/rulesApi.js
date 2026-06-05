const express = require("../http/express");
const rulesRepository = require("../repositories/rulesRepository");

function createRulesApi(db) {
  const router = express.Router();
  router.get("/schedule-rules", (req, res) => {
    res.json({ schedule_rules: rulesRepository.list(db) });
  });
  return router;
}

module.exports = createRulesApi;
