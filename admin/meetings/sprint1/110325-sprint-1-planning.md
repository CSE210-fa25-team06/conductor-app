# Meeting 11/3/2025  
**Time:** 3pm - 3:25pm  
**Scriber:** Adam  
**Attendance:** Melvyn, Austin, Tej, Akshay, Jared, Alex, Tongke, Patryk, Lei Hu, Junjie, Siri, Adam  

---

## Agenda

### ADR
- To be completed by **Melvyn, Jared, Tej, Isheta**

### Process
- Enforce **stand-up**: fill up the form every weekday at 9am in the stand-up Slack channel  
- Distribute tasks for **first milestone** (before presentation in 1–2 weeks)  

---

## By the Presentation
- You can log in as a **student, instructor, TA, tutor, or team lead**  
- Instructor can **view the Class Directory**  
- TA can **mark attendance**  
- Student can **submit a journal entry**  
- All routes are covered by **basic unit tests**  
- Frontend and backend are connected through **API calls or HTMX**  

---

## Feature 1 – Manager / Authentication / Roles

### Frontend
- Build `login.html` with username field and submit button  
- Create `dashboard.html` that displays user name and role  
- Add navigation links based on role:  
  - Instructor → Directory  
  - TA → Attendance  
  - Student → Journal  
- Connect dashboard to `/session` endpoint to show logged-in user  

### Backend
- Create `users`, `roles`, `user_roles` tables with seed data  
- Implement `/login` route using mock `Auth.js`  
- Implement `/session` route returning `{ name, role }`  
- Add simple middleware for **role-based access control**  
- Record login and logout events in `activity_logs`  

### Tests
- Write unit tests for `/login`, `/logout`, `/session`  
- Test that valid login returns correct role  
- Test that unauthorized access returns 403  

---

## Feature 2 – Class Directory

### Frontend
- Create `class-directory.html` showing table of **Name | Role | Team**  
- Add static filter dropdown for role  
- Use **HTMX** or `fetch()` to load data from `/api/class-directory`  
- Display loading and empty-state messages  

### Backend
- Create `teams` and `team_members` tables with seed data  
- Implement `/api/class-directory` route joining users and teams  
- Restrict access to **Instructor and TA** roles  

### Tests
- Write unit tests for `/api/class-directory` (success + 403)  
- Test DB join query returns correct users and teams  
- Validate JSON response structure  

---

## Feature 3 – Attendance System

### Frontend
- Create `attendance.html` listing group members with checkboxes  
- Send POST to `/attendance/mark` when checkbox toggled  
- Show confirmation or update row after marking  
- Add summary row (e.g., “3 / 5 present”)  

### Backend
- Create `attendance` table with `user_id`, `date`, `status`  
- Implement `/attendance/mark` (POST) and `/attendance/view` (GET)  
- Restrict POST access to **Instructor, TA, Team Lead** roles  
- Seed one group’s attendance data  

### Tests
- Write unit tests for marking and viewing attendance  
- Test permission checks (TA allowed, Student forbidden)  
- Test duplicate marks update existing record  

---

## Feature 4 – Work Journal / Stand-Up Tools

### Frontend
- Create `journal.html` with textarea and submit button  
- Display submitted entries below form (most recent first)  
- Refresh list via HTMX or fetch() after submission  
- Add basic validation for empty input  

### Backend
- Create `journals` table (`id`, `user_id`, `entry`, `timestamp`)  
- Implement `/journal/create` (POST) and `/journal/view` (GET by user)  
- Validate entry length before saving  

### Tests
- Write unit tests for create/view routes  
- Test invalid entries (empty or too long)  
- Test that only author can view their own entries  

---

## To Dos
- Complete ADR document  
- Fill daily stand-up form at 9am  
- Begin implementing features according to assignments  

---

## Adam's Meeting Notes
- Project **approved by the TA** — coding can begin  
- Explained development processes and workflow  
- Stand-up will be conducted daily in the **“stand up” Slack channel**, where everyone answers 3 questions to track progress  
- Technical explanation provided for development of different features  
- **Q:** Can we write our own tickets on GitHub?  
  - **A:** Yes, you can base your tickets on the tech spec in the Google Docs  
