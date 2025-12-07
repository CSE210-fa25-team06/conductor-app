const {
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
} = require("../models/eventsModel");

function resolveUserId(req) {
  return req.session?.userId || req.user || null;
}

async function getEvents(req, res) {
  try {
    const userId = resolveUserId(req);
    if (userId) {
      await markMissedEventsAsAbsentForUser(userId);
    }
    const courseId = Number(req.query.courseId) || 1;
    const events = await listEventsByCourse(courseId);
    return res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    return res.status(500).json({ error: "Failed to load events" });
  }
}

async function createCalendarEvent(req, res) {
  try {
    const {
      courseId = 1,
      title,
      description,
      location,
      start,
      end,
      visibility = "class",
      attendeeIds = []
    } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ error: "Missing required event fields" });
    }

    const numericCourseId = Number(courseId);
    const normalizedCourseId =
      Number.isFinite(numericCourseId) && numericCourseId > 0
        ? numericCourseId
        : 1;

    const createdBy = resolveUserId(req);
    const event = await createEvent({
      courseId: normalizedCourseId,
      title,
      description,
      location,
      start,
      end,
      visibility,
      createdBy,
      attendeeIds
    });

    return res.status(201).json(event);
  } catch (err) {
    console.error("Error creating event:", err);
    return res.status(500).json({ error: "Failed to create event" });
  }
}

async function getEventById(req, res) {
  try {
    const eventId = Number(req.params.eventId);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const userId = resolveUserId(req);
    if (userId) {
      await markMissedEventsAsAbsentForUser(userId);
    }

    const details = await fetchEventDetails(eventId);
    if (!details) {
      return res.status(404).json({ error: "Event not found" });
    }

    const myAttendance = userId
      ? details.attendees.find((a) => a.user_id === Number(userId))
      : null;

    const canAttend = Boolean(
      (userId && details.event.created_by === userId) ||
        (userId &&
          details.attendees.some(a => a.user_id === Number(userId)))
    );

    return res.json({
      event: details.event,
      attendees: details.attendees,
      myAttendance: myAttendance ? { status: myAttendance.status } : null,
      canAttend,
      canEdit: Boolean(
        userId && details.event.created_by && details.event.created_by === userId
      )
    });
  } catch (err) {
    console.error("Error loading event:", err);
    return res.status(500).json({ error: "Failed to load event details" });
  }
}

async function markEventAttendance(req, res) {
  try {
    const eventId = Number(req.params.eventId);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const status = req.body.status || "present";
    const userId = resolveUserId(req) || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: "User must be authenticated" });
    }

    const [invited, creator] = await Promise.all([
      isUserInvitedToEvent(eventId, userId),
      isEventCreator(eventId, userId)
    ]);

    if (!invited && !creator) {
      return res.status(403).json({ error: "You are not an attendee for this event." });
    }

    await upsertAttendance(eventId, userId, status);
    return res.json({ success: true });
  } catch (err) {
    console.error("Error marking attendance:", err);
    return res.status(500).json({ error: "Failed to update attendance" });
  }
}

async function getWeekSummary(req, res) {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await markMissedEventsAsAbsentForUser(userId);

    const [upcoming, stats] = await Promise.all([
      listUpcomingWeekEventsForUser(userId),
      getAttendanceStatsForUser(userId)
    ]);

    return res.json({
      upcoming,
      stats: {
        attended: Number(stats?.attended ?? 0),
        missed: Number(stats?.missed ?? 0)
      }
    });
  } catch (err) {
    console.error("Error loading attendance summary:", err);
    return res.status(500).json({ error: "Failed to load attendance summary" });
  }
}

async function editEvent(req, res) {
  try {
    const eventId = Number(req.params.eventId);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User must be authenticated" });
    }

    const {
      title,
      description,
      location,
      start,
      end,
      visibility = "class",
      attendeeIds = [],
      courseId = 1
    } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const result = await updateEvent(eventId, userId, {
      title,
      description,
      location,
      start,
      end,
      visibility,
      attendeeIds,
      courseId
    });

    if (result?.notFound) {
      return res.status(404).json({ error: "Event not found." });
    }
    if (result?.forbidden) {
      return res.status(403).json({ error: "Only the creator can edit this event." });
    }

    return res.json(result.event);
  } catch (err) {
    console.error("Error editing event:", err);
    return res.status(500).json({ error: "Failed to update event." });
  }
}

module.exports = {
  getEvents,
  createCalendarEvent,
  getEventById,
  markEventAttendance,
  getWeekSummary,
  editEvent
};
