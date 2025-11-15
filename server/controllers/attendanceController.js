/**
 * Attendance Controller - Handles HTTP requests for attendance entries and retrieval
 */

const { 
  fetchDirectory,
  recordStudentAttendance,
  fetchStudentAttendanceHistory,
  fetchAttendanceByDate
} = require("../models/attendanceModel");

// Get all attendance entries for a student
async function getDirectory(req, res) {
  try {
    const students = await fetchDirectory();
    res.json(students);
  } catch (err) {
    console.error("Error fetching student directory:", err);
    res.status(500).json({ error: "Failed to fetch student directory" });
  }
}

// Submit or update attendance
async function markAttendance(req, res) {
  try {
    const { user_id, group_id, date, status, meeting_type, recorded_by, is_excused, reason } = req.body;
    await recordStudentAttendance({ user_id, group_id, date, status, meeting_type, recorded_by, is_excused, reason });
    res.json({ message: "Attendance recorded successfully" });
  } catch (err) {
    console.error("Error recording attendance:", err);
    res.status(500).json({ error: "Failed to record attendance" });
  }
}

// Get aggregate attendance history for a student
async function getStudentAttendanceHistory(req, res) {
  try {
    const { user_id } = req.params;
    const history = await fetchStudentAttendanceHistory(user_id);
    res.json(history);
  } catch (err) {
    console.error("Error fetching attendance history:", err);
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
}

// Get attendance by date OR date range
async function getAttendanceByDate(req, res) {
  try {
    const { date } = req.params;
    const { start_date, end_date } = req.query;

    let attendance;

    if (date) {
      attendance = await fetchAttendanceByDate({ date });
    } else if (start_date && end_date) {
      attendance = await fetchAttendanceByDate({ start_date, end_date });
    } else {
      return res.status(400).json({
        error: "Please provide either date or start_date and end_date"
      });
    }

    res.json(attendance);
  } catch (err) {
    console.error("Error fetching attendance by date:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
}

module.exports = {
  getDirectory,
  markAttendance,
  getStudentAttendanceHistory,
  getAttendanceByDate
};
