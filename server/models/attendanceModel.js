/**
 * Attendance Model - Handles all DB operations for attendance
 */

const { pool } = require("./db");

// Get all users in a class
async function fetchDirectory() {
  const query = `
    SELECT id AS user_id, name, email, photo_url
    FROM users
    ORDER BY name;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// Insert or update a single attendance record
async function recordStudentAttendance({ user_id, group_id, session_id, date, status, meeting_type, recorded_by, is_excused = false, reason = null }) {
  const query = `
    INSERT INTO attendance (user_id, group_id, session_id, date, status, meeting_type, recorded_by, is_excused, reason)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (user_id, date)
    DO UPDATE SET status = EXCLUDED.status,
                  meeting_type = EXCLUDED.meeting_type,
                  recorded_by = EXCLUDED.recorded_by,
                  is_excused = EXCLUDED.is_excused,
                  reason = EXCLUDED.reason;
  `;
  await pool.query(query, [user_id, group_id, session_id,  date, status, meeting_type, recorded_by, is_excused, reason]);
}

// Fetch aggregate attendance counts by status
async function fetchStudentAttendanceHistory(user_id) {
  const query = `
    SELECT status, COUNT(*) AS count
    FROM attendance
    WHERE user_id = $1
    GROUP BY status;
  `;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
}

// Fetch attendance data by date OR date range
async function fetchAttendanceByDate({ date, start_date, end_date }) {
  let query;
  let params;

  if (date) {
    query = `
      SELECT *
      FROM attendance
      WHERE date = $1
      ORDER BY user_id;
    `;
    params = [date];
  } else if (start_date && end_date) {
    query = `
      SELECT *
      FROM attendance
      WHERE date BETWEEN $1 AND $2
      ORDER BY date, user_id;
    `;
    params = [start_date, end_date];
  }

  const { rows } = await pool.query(query, params);
  return rows;
}

async function createSession(user_id, sessionID){
    const query =  `
    INSERT INTO attendance_sessions(created_by, session_code)
    VALUES ($1, $2)
    RETURNING *
    `;
    await pool.query(query,[user_id,sessionID]);

}

async function endSession(sessionID){
    const query = `
    UPDATE attendance_sessions
    SET is_active = FALSE, ended_at = NOW()
    WHERE session_code = $1
    RETURNING *`;

    const result = await pool.query(query,[sessionID]);

    return result.rows[0];

}

async function getSession(session_id) {
    const query = `SELECT * FROM attendance_sessions WHERE session_code = $1`;
    const result = await db.query(query, [session_id]);
    return result.rows[0];
  
}
async function updateStudents({ user_id, group_id, session_id, date, meeting_type, recorded_by}){
    query = `
    INSERT INTO attendance(user_id, group_id, session_id, date, status, meeting_type, recorded_by, is_excused, reason)
    VALUES ($1, $2, $3, $4, 'Present', $5, $6, FALSE, NULL)
    ON CONFLICT (user_id, session_id) DO NOTHING`

    await pool.query(query, [user_id, group_id, session_id, date, meeting_type, recorded_by])


}

module.exports = {
  fetchDirectory,
  recordStudentAttendance,
  fetchStudentAttendanceHistory,
  fetchAttendanceByDate,
  createSession,
  endSession,
  getSession,
  updateStudents
};
