import express from "express"
import {
    getDirectory,
    markAttendance,
    getStudentAttendanceHistory,
    getAttendanceByDate
  } from "../controllers/attendanceController.js";
  
  export const router = express.Router();
  
// Get attendance for a specific student (optionally by date)
router.get("/directory", getDirectory);

// Submit or update attendance for a student
router.post("/", markAttendance);

// Get full history for a student
router.get("/history/:user_id", getStudentAttendanceHistory);

//Get full history for a specific date
router.get("/by-date", getAttendanceByDate);