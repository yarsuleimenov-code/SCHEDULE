try {
  module.exports = require("express");
} catch (error) {
  module.exports = require("./expressFallback");
}

