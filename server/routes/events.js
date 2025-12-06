const express = require("express");
const router = express.Router();

// TEMP event endpoint
router.get("/", (req, res) => {
  res.json([]);
});

module.exports = router;
 