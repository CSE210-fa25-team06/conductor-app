/*
  Attendance Routes - Defines all API endpoints for attendance operations.
*/

const express = require("express");
const { requirePermission } = require('../middleware/role-checker'); //

const { 
  getDirectory,
  markAttendance,
  getStudentAttendanceHistory,
  getAttendanceByDate
} = require("../controllers/attendanceController");

const router = express.Router();

// Get directory of students to display
router.get("/directory", requirePermission('VIEW_DIRECTORY'), getDirectory);

// Submit or update attendance for a student
router.post("/", markAttendance);

// Get full attendance history of a student
router.get("/history/:user_id", getStudentAttendanceHistory);

// Get full history for a specific date
router.get("/by-date/:date", getAttendanceByDate);

// Get full history for a date range
router.get("/by-date", getAttendanceByDate);

module.exports = router;