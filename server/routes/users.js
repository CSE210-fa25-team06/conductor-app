/*
  This file defines all API endpoints related to group data.
  It connects incoming requests to the groupController for processing.
*/

const express = require("express");
const { getUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/", getUsers);

module.exports = router;
