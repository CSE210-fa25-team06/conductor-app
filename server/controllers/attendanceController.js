import {
    fetchDirectory,
    recordStudentAttendance,
    fetchStudentAttendanceHistory,
    fetchAttendanceByDate
  } from "../models/attendanceModel.js";
  
 // 1. Get all attendance entries for a student
 export async function getDirectory(req, res) {
    try {
      const students = await fetchDirectory();
      res.json(students);
    } catch (err) {
      console.error("Error fetching student directory:", err);
      res.status(500).json({ error: "Failed to fetch student directory" });
    }
  }
  
  // 2. Submit or update attendance
  export async function markAttendance(req, res) {
    try {
      const { user_id, date, status, meeting_type, recorded_by, is_excused, reason } = req.body;
      await recordStudentAttendance({ user_id, date, status, meeting_type, recorded_by, is_excused, reason });
      res.json({ message: "Attendance recorded successfully" });
    } catch (err) {
      console.error("Error recording attendance:", err);
      res.status(500).json({ error: "Failed to record attendance" });
    }
  }
  
  // 3. Get aggregate attendance history for a student
  export async function getStudentAttendanceHistory(req, res) {
    try {
      const { user_id } = req.params;
      const history = await fetchStudentAttendanceHistory(user_id);
      res.json(history);
    } catch (err) {
      console.error("Error fetching attendance history:", err);
      res.status(500).json({ error: "Failed to fetch attendance history" });
    }
  }
  export async function getAttendanceByDate(req, res) {
    try {
      const { date, start_date, end_date } = req.query;
  
      let attendance;
      if (date) {
        attendance = await fetchAttendanceByDate({ date });
      } else if (start_date && end_date) {
        attendance = await fetchAttendanceByDate({ start_date, end_date });
      } else {
        return res.status(400).json({ error: "Please provide either date or start_date and end_date" });
      }
  
      res.json(attendance);
    } catch (err) {
      console.error("Error fetching attendance by date:", err);
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  }