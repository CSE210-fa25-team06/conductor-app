import { pool } from "./db.js";

// Get all users in a class
export async function fetchDirectory() {
    const query = `
      SELECT id AS user_id, name, email, photo_url
      FROM users
      ORDER BY name;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
  
  // Insert or update a single attendance record
  export async function recordStudentAttendance({ user_id, date, status, meeting_type, recorded_by, is_excused = false, reason = null }) {
    const query = `
      INSERT INTO attendance (user_id, date, status, meeting_type, recorded_by, is_excused, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, date)
      DO UPDATE SET status = EXCLUDED.status,
                    meeting_type = EXCLUDED.meeting_type,
                    recorded_by = EXCLUDED.recorded_by,
                    is_excused = EXCLUDED.is_excused,
                    reason = EXCLUDED.reason;
    `;
    await pool.query(query, [user_id, date, status, meeting_type, recorded_by, is_excused, reason]);
  }
  
  // Fetch aggregate attendance counts by status
  export async function fetchStudentAttendanceHistory(user_id) {
    const query = `
      SELECT status, COUNT(*) AS count
      FROM attendance
      WHERE user_id = $1
      GROUP BY status;
    `;
    const { rows } = await pool.query(query, [user_id]);
    return rows;
  }
  // Fetch attendance data by date
  export async function fetchAttendanceByDate({ date, start_date, end_date }) {
    let query, params;
  
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