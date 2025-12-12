const { pool } = require("./db");

async function listEventsByCourse(courseId, userId) {
  const normalizedCourseId =
    Number.isFinite(Number(courseId)) && Number(courseId) > 0
      ? Number(courseId)
      : 1;
  const normalizedUserId = Number(userId);
  if (!Number.isFinite(normalizedUserId)) {
    return [];
  }

  const query = `
    WITH me AS (
      SELECT id, group_id
      FROM users
      WHERE id = $2
    )
    SELECT e.id,
           e.title,
           e.start_time AS start,
           e.end_time AS "end",
           e.visibility
    FROM me
    JOIN events e ON e.course_id = $1
    LEFT JOIN attendance a
      ON a.event_id = e.id AND a.user_id = me.id
    WHERE (
      e.visibility = 'class'
      OR e.created_by = me.id
      OR (e.visibility LIKE 'group:%'
          AND me.group_id IS NOT NULL
          AND split_part(e.visibility, ':', 2)::int = me.group_id)
      OR a.user_id IS NOT NULL
    )
    GROUP BY e.id, e.title, e.start_time, e.end_time, e.visibility
    ORDER BY e.start_time;
  `;
  const { rows } = await pool.query(query, [normalizedCourseId, normalizedUserId]);
  return rows;
}

async function createEvent({
  courseId,
  title,
  description,
  location,
  start,
  end,
  visibility = "class",
  createdBy = null,
  attendeeIds = []
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const normalizedCourseId =
      Number.isFinite(Number(courseId)) && Number(courseId) > 0
        ? Number(courseId)
        : 1;
    const insertQuery = `
      INSERT INTO events
        (course_id, title, description, location, start_time, end_time, visibility, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, course_id, title, description, location,
        start_time, end_time, visibility, created_by;
    `;
    const { rows } = await client.query(insertQuery, [
      normalizedCourseId,
      title,
      description,
      location,
      start,
      end,
      visibility,
      createdBy
    ]);
    const event = rows[0];

    await insertInitialInvites(client, event, attendeeIds, createdBy);

    await client.query("COMMIT");
    return event;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function fetchEventDetails(eventId) {
  const eventQuery = `
    SELECT id, course_id, title, description, location,
           start_time, end_time, visibility, created_by
    FROM events
    WHERE id = $1;
  `;
  const eventResult = await pool.query(eventQuery, [eventId]);
  if (eventResult.rowCount === 0) {
    return null;
  }

  const attendeeQuery = `
    SELECT a.user_id, a.status, u.name, u.email
    FROM attendance a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.event_id = $1
    ORDER BY u.name NULLS LAST;
  `;
  const attendeesResult = await pool.query(attendeeQuery, [eventId]);

  return {
    event: eventResult.rows[0],
    attendees: attendeesResult.rows
  };
}

async function upsertAttendance(eventId, userId, status) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const event = await fetchBasicEvent(client, eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const query = `
      INSERT INTO attendance (user_id, group_id, date, status, recorded_by, meeting_type, event_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, event_id)
      DO UPDATE SET status = EXCLUDED.status,
                    recorded_by = EXCLUDED.recorded_by,
                    date = EXCLUDED.date;
    `;
    const resolvedGroupId = normalizeGroupId(event.group_id);

    await client.query(query, [
      userId,
      resolvedGroupId,
      event.start_time,
      status,
      userId,
      event.title,
      eventId
    ]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function insertInitialInvites(client, event, attendeeIds, recordedBy) {
  if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
    return;
  }

  const inviteQuery = `
    INSERT INTO attendance (user_id, group_id, date, status, recorded_by, meeting_type, event_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, event_id) DO NOTHING;
  `;

  for (const attendeeId of attendeeIds) {
    if (!attendeeId) continue;
    const resolvedGroupId = normalizeGroupId(event.group_id);
    await client.query(inviteQuery, [
      attendeeId,
      resolvedGroupId,
      event.start_time,
      "invited",
      recordedBy,
      event.title,
      event.id
    ]);
  }
}

async function fetchBasicEvent(client, eventId) {
  const { rows } = await client.query(
    `SELECT id, course_id, start_time, end_time, title
     FROM events
     WHERE id = $1`,
    [eventId]
  );
  if (rows.length === 0) return null;
  const event = rows[0];
  event.group_id = normalizeGroupId(event.course_id);
  return event;
}

async function isUserInvitedToEvent(eventId, userId) {
  const res = await pool.query(
    `SELECT 1 FROM attendance WHERE event_id = $1 AND user_id = $2`,
    [eventId, userId]
  );
  return res.rowCount > 0;
}

async function isEventCreator(eventId, userId) {
  const res = await pool.query(
    `SELECT 1 FROM events WHERE id = $1 AND created_by = $2`,
    [eventId, userId]
  );
  return res.rowCount > 0;
}

async function markMissedEventsAsAbsentForUser(userId) {
  if (!userId) return;
  const query = `
    INSERT INTO attendance (user_id, group_id, date, status, recorded_by, meeting_type, event_id)
    SELECT $1,
           CASE
             WHEN e.course_id IS NULL OR e.course_id < 1 THEN 1
             ELSE e.course_id
           END,
           e.start_time,
           'absent',
           $1,
           e.title,
           e.id
    FROM events e
    WHERE e.end_time < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.event_id = e.id AND a.user_id = $1
      );
  `;
  await pool.query(query, [userId]);
}

async function listUpcomingWeekEventsForUser(userId) {
  const query = `
    WITH me AS (
      SELECT id, COALESCE(group_id, 1) AS group_id
      FROM users
      WHERE id = $1
    )
    SELECT e.id,
           e.title,
           e.location,
           e.start_time,
           e.end_time,
           COALESCE(a.status, NULL) AS status
    FROM me
    JOIN events e ON TRUE
    LEFT JOIN attendance a
      ON a.event_id = e.id AND a.user_id = me.id
    WHERE e.start_time::date >= CURRENT_DATE
      AND e.start_time::date <= CURRENT_DATE + INTERVAL '6 days'
      AND (
        e.visibility = 'class'
        OR e.created_by = me.id
        OR (e.visibility LIKE 'group:%' AND e.course_id = me.group_id)
        OR a.user_id IS NOT NULL
      )
    ORDER BY e.start_time;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

async function getAttendanceStatsForUser(userId) {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) AS attended,
      COALESCE(SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END), 0) AS missed
    FROM attendance
    WHERE user_id = $1 AND event_id IS NOT NULL;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

async function updateEvent(eventId, userId, updates) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT created_by FROM events WHERE id = $1`,
      [eventId]
    );
    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      return { notFound: true };
    }
    if (existing.rows[0].created_by !== userId) {
      await client.query("ROLLBACK");
      return { forbidden: true };
    }

    const normalizedCourseId =
      Number.isFinite(Number(updates.courseId)) && Number(updates.courseId) > 0
        ? Number(updates.courseId)
        : 1;

    const updateQuery = `
      UPDATE events
      SET title = $1,
          description = $2,
          location = $3,
          start_time = $4,
          end_time = $5,
          visibility = $6,
          course_id = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING id, course_id, title, description, location,
        start_time, end_time, visibility, created_by;
    `;

    const values = [
      updates.title,
      updates.description,
      updates.location,
      updates.start,
      updates.end,
      updates.visibility,
      normalizedCourseId,
      eventId
    ];

    const { rows } = await client.query(updateQuery, values);
    const event = rows[0];

    await syncEventAttendees(client, event, updates.attendeeIds || [], userId);

    await client.query("COMMIT");
    return { event };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listEventsByCourse,
  createEvent,
  fetchEventDetails,
  upsertAttendance,
  markMissedEventsAsAbsentForUser,
  listUpcomingWeekEventsForUser,
  getAttendanceStatsForUser,
  updateEvent,
  isUserInvitedToEvent,
  isEventCreator
};

function normalizeGroupId(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

async function syncEventAttendees(client, event, attendeeIds, recordedBy) {
  const normalizedIds = Array.isArray(attendeeIds)
    ? attendeeIds.map(Number).filter(id => Number.isFinite(id))
    : [];

  const keepArray =
    normalizedIds.length > 0 ? normalizedIds : [-1];

  await client.query(
    `
      DELETE FROM attendance
      WHERE event_id = $1
        AND NOT (user_id = ANY($2::int[]));
    `,
    [event.id, keepArray]
  );

  await insertInitialInvites(client, event, normalizedIds, recordedBy);
}
