const express = require("express");
const {
  getEvents,
  createCalendarEvent,
  getEventById,
  markEventAttendance,
  getWeekSummary,
  editEvent
} = require("../controllers/eventsController");

const router = express.Router();

router.get("/", getEvents);
router.get("/summary/week", getWeekSummary);
router.post("/", createCalendarEvent);
router.get("/:eventId", getEventById);
router.put("/:eventId", editEvent);
router.post("/:eventId/attendance", markEventAttendance);

module.exports = router;
 
