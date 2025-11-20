/*
  Attendance Routes - Defines all API endpoints for attendance operations.
*/

const express = require("express");
const { requirePermission } = require('../middleware/role-checker');
const PERMISSIONS = require('../config/permissions/permissions')

const { 
  getDirectory,
  markAttendance,
  getStudentAttendanceHistory,
  getAttendanceByDate,
  startAttendance,
  endAttendance,
  scanAttendance,
  professorView,
  submitAttendance,
  viewMyAttendance
} = require("../controllers/attendanceController");

const router = express.Router();

// Get directory of students to display
router.get("/directory", requirePermission(PERMISSIONS.VIEW_CLASS_DIRECTORY), getDirectory);

// Submit or update attendance for a student
router.post("/", markAttendance);

// Get full attendance history of a student
router.get("/history/:user_id", getStudentAttendanceHistory);

// Get full history for a specific date
router.get("/by-date/:date", getAttendanceByDate);

// Get full history for a date range
router.get("/by-date", getAttendanceByDate);

// Start attendance
router.post("/start/:user_id", startAttendance)

// End attendance
router.post("/end/:session_id", endAttendance)

//Scan students for who attended
router.post("/scan", scanAttendance)

// Show which students attended class (Professor view)
router.get("/session/:session_id/students", professorView)

// Allows students to submit attendance
router.post("/submit", submitAttendance)

// Student view for attendance
router.get("/mine/:class_id", viewMyAttendance)

module.exports = router;