import express from "express"
import {
    getDirectory,
    markAttendance,
    getStudentAttendanceHistory,
    getAttendanceByDate
  } from "../controllers/attendanceController.js";
  
  export const router = express.Router();
  
// Get directory of students to display
router.get("/directory", getDirectory);

// Submit or update attendance for a student
router.post("/", markAttendance);

// Get full attendance history of student
router.get("/history/:user_id", getStudentAttendanceHistory);

// Get full history for a specific date
router.get("/by-date/:date", getAttendanceByDate);

// Get full history for a date range
router.get("/by-date", getAttendanceByDate);