# Journals and Emotional Tracker

## What the feature does
- Allows students to submit weekly journal entries and emotional tracker (sentiment) updates.
- Users can view, edit, or delete **their own** entries.
- Users with elevated permissions may view or edit additional entries depending on their role.

---

## How it works (frontend)
- `initJournals` loads the current user session and displays journal creation capabilities based on permissions.
- The journal feed is wrapped in `protectComponent`, restricting visibility based on permission checks.
- The frontend fetches:
  - journal entries  
  - sentiment entries  
- It then **merges them into a chronological feed** and renders them with edit/delete controls.
- Modal forms handle creation and editing, and all operations are sent through `fetch` to backend endpoints.

---

## How it works (backend)
- Journal routes enforce permission rules such as:
  - `VIEW_ALL_JOURNALS`
  - `VIEW_OWN_GROUP_JOURNALS`
- Backend validates:
  - required journal fields  
  - owner-or-admin permissions for editing and deleting  
- Sentiment operations:
  - validate allowed values (`happy`, `neutral`, `sad`)  
  - enforce ownership rules before writing to the database  

---

## Data flow (frontend to backend to database)

1. User fills out a modal form.  
2. Frontend sends `POST /journals/create` or `/sentiments/create`.  
3. Backend validates fields and permissions.  
4. Database inserts into `journals` or `sentiments`.  
5. Frontend fetches updates from `/journals` and `/sentiments/user`.  
6. UI merges and sorts the combined feed by timestamp.  

---

## API endpoints used or created

### Journals
- `GET /journals`
- `POST /journals/create`
- `PUT /journals/:id`
- `DELETE /journals/:id`

### Sentiments
- `POST /sentiments/create`
- `GET /sentiments/user`
- `PUT /sentiments/:id`
- `DELETE /sentiments/:id`

---

## UI components involved
- Journal feed container  
- Page header  
- **Submit Journal** button  
- **Emotional Tracker** button  
- Modal creation/editing forms  
- Edit and delete buttons  

---

## Database tables involved
- `journals`  
- `sentiments`  
Each table links to `users` and optionally to `groups`.

---

## Edge cases, limitations, or special rules
- Journal creation requires specific fields (e.g., `did`, `doing_next`).
- Sentiment values must be one of: `happy`, `neutral`, `sad`.
- Unauthorized actions return **401** or **403**.
- If `protectComponent` fails, the journal feed is fully hidden.
- Combined feed requires **chronological sorting** on the frontend.
