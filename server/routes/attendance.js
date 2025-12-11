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
  showScanPage,
  startAttendance,
  endAttendance,
  scanAttendance,
  getAttendanceStats
} = require("../controllers/attendanceController");

const router = express.Router();

router.get("/directory", requirePermission(PERMISSIONS.VIEW_CLASS_DIRECTORY), getDirectory
/**
 * @swagger
 * #swagger.summary = 'Get student directory'
 * #swagger.description = 'Returns the list of students for attendance.'
 * #swagger.security = [{ "sessionAuth": [] }]
 * #swagger.responses[200] = { description: "Student list" }
 */
);

router.post("/", (req, res) => {
  /** 
   *  @swagger
   *  #swagger.tags = ['Attendance']
   *  #swagger.summary = 'Mark or update attendance'
   *  #swagger.description = 'Creates or updates attendance for a student.'
   *  #swagger.responses[200] = { description: "Attendance saved" }
  */
  markAttendance(req, res);
});

router.get("/history/:user_id", getStudentAttendanceHistory
/**
 * @swagger
 * #swagger.summary = 'Get attendance history'
 * #swagger.description = 'Returns full attendance history for a student.'
 * #swagger.parameters['user_id'] = { description: 'User ID' }
 */
);

router.get("/by-date/:date", getAttendanceByDate
/**
 * @swagger
 * #swagger.summary = 'Get attendance for a specific date'
 * #swagger.parameters['date'] = { description: 'YYYY-MM-DD' }
 */
);

router.get("/by-date", (req, res) => {
  /**
   * @swagger
   * #swagger.summary = 'Get attendance for a date range'
   * #swagger.parameters['start'] = { in: 'query', required: false }
   * #swagger.parameters['end'] = { in: 'query', required: false }
   */
  getAttendanceByDate(req, res);
});

// Get redirect for users who scan QR code
router.get("/attend", showScanPage);

// Start attendance
router.post("/start", requirePermission(PERMISSIONS.MANAGE_ALL_ATTENDANCE), startAttendance) // Added permissions

// End attendance
router.post("/end", requirePermission(PERMISSIONS.MANAGE_ALL_ATTENDANCE), endAttendance) // Added permissions

//Scan students for who attended
router.post("/scan", scanAttendance)

router.get('/stats', getAttendanceStats);


// Show which students attended class (Professor view)
//router.get("/session/:session_id/students", professorView)

// Allows students to submit attendance
//router.post("/submit", submitAttendance)

// Student view for attendance
//router.get("/mine/:class_id", viewMyAttendance)

module.exports = router;