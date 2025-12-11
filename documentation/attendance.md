# QR-Based Attendance Sessions

## What the feature does
- Allows instructors to start an attendance session, display a QR code for students to scan, and end the session.
- Backend validates scans and records attendance **only while the session is active**.

---

## How it works (frontend)
- The attendance page initializes click handlers for:
  - starting and ending sessions  
  - handling date inputs  
  - showing the QR modal
- Starting a session:
  - fetches the user session  
  - POSTs to `/attendance/start`  
  - receives a QR payload  
  - displays the QR in a modal
- Ending a session:
  - sends `POST /attendance/end`  
  - closes the modal

---

## How it works (backend)
- Routes enforce required permissions for managing attendance sessions.
- When a session begins:
  - server generates a random session code  
  - stores it in `attendance_sessions`  
  - returns a QR payload encoding the scan URL
- Scans hit `/attendance/attend`, which internally posts to `/attendance/scan`.
- The scan handler:
  - validates that the session is active  
  - inserts an attendance row into the `attendance` table

---

## Data flow (frontend to backend to database)

1. Instructor clicks **Start Meeting**.  
2. Frontend sends `POST /attendance/start` with `user_id`.  
3. Backend creates a record in `attendance_sessions` and returns a QR payload.  
4. Student scans QR → `/attendance/attend` → triggers `POST /attendance/scan`.  
5. Backend validates the active session and records attendance.  
6. Instructor ends session; `POST /attendance/end` sets `is_active = false`.  

---

## API endpoints used or created
- `POST /attendance/start`
- `POST /attendance/end`
- `POST /attendance/scan`
- `GET /attendance/attend`
- `GET /attendance/directory`
- `GET /attendance/by-date`
- `GET /attendance/history/:user_id`
- `GET /attendance/stats`

---

## UI components involved
- Meeting controls  
- Date input  
- Checkboxes for meeting types  
- Student list  
- **Start Meeting** button  
- QR modal with open / close / end controls  

---

## Database tables involved
- `attendance_sessions`
- `attendance`

---

## Edge cases, limitations, or special rules
- Session start requires a valid `user_id`.
- Scans fail if the session is inactive.
- Ending a session must return `is_active = false` before the UI hides the modal.
- Meeting type is currently hardcoded to `"Lecture"`.
