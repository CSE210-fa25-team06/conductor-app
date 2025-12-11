# Class Directory

## What the feature does
- Provides a searchable and filterable class directory.
- Only renders for users with the `VIEW_CLASS_DIRECTORY` permission.
- Displays each user’s name, role(s), group, email, and attendance count.

---

## How it works (frontend)
- The `renderClassDirectory` function is wrapped in `protectComponent`, ensuring only authorized users see the UI.
- The component builds:
  - search bar  
  - role dropdown  
  - results table
- Search input is **debounced** to reduce server calls.
- If any `/users` request returns **403**, the entire container is replaced with an **Access Denied** panel.

---

## How it works (backend)
- The `/users` endpoint enforces `requirePermission(VIEW_CLASS_DIRECTORY)`.
- The controller:
  - tokenizes search input  
  - applies role and group filters  
  - runs SQL joins to aggregate attendance counts
- The backend returns structured row data used directly by the frontend.

---

## Data flow (frontend to backend to database)

1. User types in the search bar.  
2. Frontend sends `GET /users?query=...&role=...`  
3. Controller calls the directory search service.  
4. SQL joins users, roles, groups, and attendance.  
5. Results are returned as JSON and rendered into the table.

---

## API endpoints used or created
- `GET /users`

---

## UI components involved
- Search bar  
- Role dropdown  
- Results table  
- Access-denied panel  

---

## Database tables involved
- `users`  
- `roles`  
- `user_roles`  
- `groups`  
- `attendance`

---

## Edge cases, limitations, or special rules
- **403 responses** replace the entire UI with an access-denied message.
- Empty searches show a **“No results found”** row.
- Network failures display an inline error message.
- Very large result sets may eventually require **pagination**.
