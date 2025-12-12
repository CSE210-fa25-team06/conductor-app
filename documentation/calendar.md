# Calendar Feature

## What the feature does
- Calendar lets instructors create course events, invite attendees, and manage visibility (class-wide, group, private).
- Users see a personalized schedule: class events, their own events, group meetings, or invites.
- From each event panel they can edit details or mark attendance; attendance is only allowed during the event window.

---

## How it works (frontend)
- `dashboard.html` loads FullCalendar via CDN and injects `dashboard_widgets/calendar.html` (calendar layout, modal, details panel).
- `styles/calendar.css` styles the widget, modal, attendee chips, and responsive behavior.
- `scripts/dashboard.js` fetches the widget HTML, injects it, and imports `scripts/widgets/calendar.js`.
- `widgets/calendar.js`:
  - Instantiates FullCalendar.
  - Fetches events from `/api/events?courseId=…`.
  - Handles Add/Edit modals, attendee search, visibility choices, and the details panel.
  - The **Mark Attendance** button is gated by invite/creator status and current time; it calls `/api/events/:id/attendance`.

---

## How it works (backend)
- Express routes in `server/routes/events.js` expose `/api/events` CRUD plus attendance and summary endpoints.
- `server/controllers/eventsController.js` validates requests, applies user context, and calls the data layer.
- `server/models/eventsModel.js` handles DB operations:
  - Listing filtered events (visibility rules)
  - Creating/editing events
  - Seeding invites into attendance
  - Fetching details
  - Updating attendance
  - Marking missed events as absent

---

## Data flow (frontend → backend → database)
1. FullCalendar requests `/api/events?courseId=…`.
2. Controller resolves the user and calls `listEventsByCourse`, which queries the `events` and `attendance` tables with visibility filters.
3. JSON events are returned to the client and rendered by FullCalendar.
4. Creating/editing events:
   - Modal POSTs to `/api/events`  
   - Or PUTs to `/api/events/:id`
   - Controller stores the event and updates invites.
5. Mark attendance:
   - POST `/api/events/:id/attendance`
   - Backend updates attendance.
6. UI refetches events/details to reflect changes.

---

## API endpoints used/created
- `GET /api/events?courseId=…` — list user-visible events  
- `POST /api/events` — create event  
- `PUT /api/events/:eventId` — edit event  
- `GET /api/events/:eventId` — fetch details + attendees  
- `POST /api/events/:eventId/attendance` — mark attendance  
- `GET /api/events/summary/week` — summary for KPI cards  

(Existing `/users` and `/groups` endpoints are reused for attendee search and group visibility lists.)

---

## UI components involved
- Calendar container (FullCalendar grid)
- **Add Event** modal with:
  - Inputs
  - Visibility selector
  - Attendee chips/suggestions
- Event details panel:
  - Metadata
  - Attendees
  - Edit button
  - Attendance button
- Responsive toolbar buttons for month/week/day navigation

---

## Database tables involved
- `events` — stores event metadata  
  *(course_id, title, start_time, visibility, created_by, etc.)*
- `attendance` — tracks invites and attendance status  
  *(user_id, event_id, status, recorded_by, meeting_type)*
- `users` and `groups` — referenced via foreign keys when filtering or auto-inviting group members.

---

## Edge cases, limitations, and special rules
- **Visibility filtering**:
  - Class events → visible to everyone  
  - Group events → only to matching group members  
  - Private events → only to the creator or explicit invitees
- **Attendance button rules**:
  - Disabled outside the event start/end window  
  - Disabled for non-invitees  
  - Shows reason when clicked if disabled
- Times entered via `datetime-local` are converted to **UTC** before saving.
- Class-wide events still require invites if you want them to appear outside the default filter.
- Event creation currently has no RBAC restrictions — any logged-in user can add events unless permission checks are added.
