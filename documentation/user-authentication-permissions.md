# RBAC and Permission System

## Role-Based Access Control and Permission Guards

### What the feature does
- Enforces permission checks on backend routes and frontend UI components using a role-based access control (RBAC) model.
- Computes a user’s effective permissions based on assigned roles and privilege levels to maintain least-privilege behavior.
- Provides admin tooling for assigning roles, managing permissions, and provisioning users with correctly guarded access.

---

## How it works (frontend)

- Frontend modules import shared permission constants from `/api/config/js/permissions.js`.
- Protected UI sections use `protectComponent`, which verifies that the current session contains the required permissions before rendering.
- If the user lacks permissions, protected components are replaced with an **Access Denied** panel.
- The **Admin Role Assignment** page initializes only after passing the `ASSIGN_ROLES` permission check.
- Once loaded, visible actions—assigning groups, modifying permissions, deleting users—are tailored based on the permissions returned in the user session.

---

## How it works (backend)

- The `requirePermission` middleware validates that the authenticated user has the required permission before a controller runs.
- It extracts the user ID from the active session, loads full user data (roles and permissions), and returns:
  - **401** if unauthenticated  
  - **403** if authenticated but lacking permissions
- The `getFullUserData` service queries:
  - user info  
  - assigned roles  
  - permissions mapped to those roles
- It then calls `resolveUserPermissions`, which applies **least-privileged precedence**: only roles with the lowest `privilege_level` contribute permissions.
- Permission constants originate from a shared JSON definition. The backend syncs these with the frontend via `/api/config/js/permissions.js`.

---

## Data flow (frontend to backend to database)

1. A protected UI module loads and fetches the authenticated session to read the user’s effective permissions.
2. When the user triggers an action (viewing the class directory, starting attendance, managing roles), the request goes to a backend route protected by `requirePermission`.
3. The middleware retrieves the user ID, loads roles and permissions from the database, and checks whether the required permission exists.
4. If authorized, the controller executes and interacts with the database using the requester’s identity and permissions.

---

## API endpoints used or created

Permission-protected endpoints include:

- `GET /users`
- `GET /attendance/directory`
- `POST /attendance/start`
- `POST /attendance/end`
- Admin routes:
  - `GET /api/admin/roles/:roleId/permissions`
  - `PUT /api/admin/roles/:roleId/permissions`

All endpoints use the `requirePermission` middleware.

The system also exposes:

- `/api/config/js/permissions.js` — serves flattened permission constants to the frontend.

---

## UI components involved

- `protectComponent` wrapper used throughout the UI:
  - class directory  
  - journals  
  - attendance  
  - admin console
- Admin Role Assignment dashboard:
  - Conditionally renders search tables, action buttons, import tools, permission-management modals, and setup utilities depending on the logged-in user’s permissions.

---

## Database tables involved

| Table | Purpose |
|-------|---------|
| **users** | User identity |
| **user_roles** | Mapping of users to roles |
| **roles** | Role metadata including `privilege_level` |
| **role_permissions** | Mapping of permissions assigned to a role |
| **permissions** | Canonical permission definitions |

These tables support `getFullUserData` and the permission resolver.

---

## Edge cases, limitations, or special rules

- **Least-privileged precedence:**  
  When a user has multiple roles, only roles with the lowest `privilege_level` contribute permissions.
- **Missing authentication:**  
  Produces **401** before permission checks.
- **Missing permissions:**  
  Produces **403** with an explanatory error.
- **Frontend guards use OR logic:**  
  If the user lacks all listed permissions, guarded DOM sections become **Access Denied**.
- **Updating permissions:**  
  Adding or modifying permissions requires updating the backend JSON definition.  
  The frontend stays aligned because permissions are served dynamically through `/api/config/js/permissions.js`.