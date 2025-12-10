/**
 * Attendance Controller - Handles HTTP requests for attendance entries and retrieval
 */

const crypto = require("crypto");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../', '.env') });
const { 
  fetchDirectory,
  recordStudentAttendance,
  fetchStudentAttendanceHistory,
  fetchAttendanceByDate,
  createSession,
  getSession,
  endSession,
  updateStudents,
  fetchAttendanceStats
} = require("../models/attendanceModel");

const QRCode = require("qrcode")

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
// Create QR Code:
async function createQRCode(sessionId){
    const BASE_URL = process.env.BASE_URL // Fixed issue, BASE_URL is stored in .env file
    const qrPayload = `${BASE_URL}/attend?session=${sessionId}`;

    const qrImageDataUrl = await QRCode.toDataURL(qrPayload);

    return { qrPayload, qrImageDataUrl };
}
// Creates a unique sessionID
function createSessionID(){
    return crypto.randomBytes(16).toString("hex");

}
// Start an attendance session
async function startAttendance(req,res){
    try{
        // Store the creator of the attendance tracker
        const { user_id } = req.body;

        if (!user_id) {
          return res.status(400).json({ error: "user_id is required" });
        }
        const sessionID = createSessionID();

        await createSession(user_id, sessionID);

        const {qrPayload, qrImageDataUrl} = await createQRCode(sessionID);

        return res.status(201).json({
            success: true,
            user_id,
            session_id: sessionID,
            qrPayload,
            qrImageDataUrl

        });

    }
    catch (err){
        console.error("Error starting session:", err);
    return res.status(500).json({ error: "Server error starting attendance session" });

    }
    
}
// End attendance session
async function endAttendance(req,res){
    try{
        const {session_id} = req.body;
        const ended = await endSession(session_id);
        return res.json({
            success: true,
            is_active : ended.is_active
          });
        } catch (err) {
          console.error("Error ending attendance session:", err);
          return res.status(500).json({ error: "Server error ending session" });
        }

}
// Update attendance session
async function scanAttendance(req, res){
    try{
        const{user_id, group_id, session_id, date, meeting_type, recorded_by, is_excused, reason} = req.body;

        //Grab the session
        const session = await getSession(session_id);
        // If session is not active throw an error
        if(!session || session.is_active == false){
            return res.status(400).json({ error: "Invalid or inactive session" });
        }

        // Update the student attendance
        await updateStudents({user_id, group_id, session_id, date, meeting_type, recorded_by, is_excused, reason});
        res.json({message : "Student attendance recorded sucessfully!"});
    } catch(err){
        console.error("Error recording attendance:", err);
        res.status(500).json({ error: "Failed to record attendance" });
    }
}

// Fetch attendance stats
async function getAttendanceStats(req, res) {
  try {
    const stats = await fetchAttendanceStats();
    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch attendance statistics" });
  }
}


module.exports = {
  getDirectory,
  markAttendance,
  getStudentAttendanceHistory,
  getAttendanceByDate,
  startAttendance,
  endAttendance,
  scanAttendance,
  getAttendanceStats
};
