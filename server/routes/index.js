/*
  This file defines the base routes for the Conductor API.
  It handles requests made to the root endpoint ("/").
*/
const express = require("express");
const usersRouter = require("./users");
const groupsRouter = require("./groups");
const journalsRouter = require("./journals");
const attendanceRouter = require("./attendance");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the Conductor API");
});

router.use("/users", usersRouter);
router.use("/groups", groupsRouter);
router.use("/journal", journalsRouter);
router.use("/attendance", attendanceRouter);

module.exports = router;
