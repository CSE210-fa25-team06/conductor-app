/*
  This file defines all API endpoints related to group data.
  It connects incoming requests to the groupController for processing.
*/
const express = require("express");
const { getGroups } = require("../controllers/groupController");

const router = express.Router();

router.get("/", getGroups);

module.exports = router;