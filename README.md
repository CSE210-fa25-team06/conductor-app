# Team 6 - Fleetwood Stack - Conductor

Conductor is a lightweight platform to help instructors, TAs, and students manage course activities like attendance, scheduling, and group tracking.

The repository is organized into folders that separate the frontend, backend, database, and testing components. Each team can work independently while keeping the project consistent and maintainable.

---

### **client/**
Contains all frontend code written in standard **HTML, CSS, and JavaScript**.

- **index.html** – Main entry point for the web interface.
- **scripts/** – JavaScript files for frontend logic.
  - `main.js` - Handles UI behavior and event handling.  
  - `api.js` - Makes API calls to the backend.
- **styles/** – CSS files for layout and design.  
  - `base.css` - Default styling and typography. 
  - `layout.css` - Page structure and spacing.
  - `components.css` - Reusable button and component styles.  

---

### **server/**
Holds the backend logic built with **Node.js and Express**.

- **app.js** – Main Express server file. Initializes middleware, authentication, and routes.
- **routes/** – Defines API endpoints.
  - **api/** – General Application API routes.
    - `index.js` - **Main API Entry Point**. Aggregates and mounts all sub-routers (`users`, `groups`, `journal`, `attendance`) to handle requests to the root API path.
    - `attendance.js` - Defines endpoints for recording attendance, retrieving student history, and viewing the class directory.
    - `groups.js` - Handles requests for retrieving group data and lists.
    - `journals.js` - Manages journal entry operations, specifically creating new entries.
    - `users.js` - Handles user-related operations, such as searching the directory and retrieving user profiles.
  - **api/auth/**
    - `auth-router.js` - Handles generic session management (`/session`, `/logout`, `/login-fail`) and mounts strategy-specific routes.
  - **api/admin/**
    - `groups-roles-router.js` - Administrative routes for creating Groups, Roles, and Permissions.
    - `user-role-router.js` - Handles assigning specific roles to users (e.g., promoting a Student to Group Leader).
- **controllers/** – Handles request logic and connects routes to models.
  - `attendanceController.js` - Manages recording attendance, fetching student history, and retrieving directory data.
  - `groupController.js` - Handles requests for retrieving group lists.
  - `journalController.js` - Specific logic for creating and submitting weekly journal entries.
  - `userController.js` - Handles user directory searches and retrieval.
- **services/** – Business logic layers separating concerns from the database and controllers.
  - `user-provisioning.js` - Handles logic for creating new user accounts, assigning default roles/groups, and linking authentication providers.
  - `search.js` - Service for directory search logic (used by `userController`).
  - **auth/**
    - `auth-service.js` - Orchestrates the login process, retrieving user data, and logging activity.
    - **google/**
      - `google-authenticator.js` - **Passport Strategy**. Configures Google OAuth 2.0, handles user serialization, and manages the callback logic.
    - **mock/**
      - `mock-authenticator.js` - **Universal Mock Strategy**. A simplified dev-only strategy that sets a mock user ID directly into the session, bypassing external providers.
    - **sso/**
      - `sso-authenticator.js` - **Strategy Factory**. Creates a configured Express Router for SSO flows. It contains the common logic (DB lookup, session creation) while delegating specific steps to injected handlers.
      - **handlers/**
        - `mock-sso-handler.js` - **Concrete Handler**. Implements the mock-specific logic for the SSO factory, simulating redirects to and from an external provider.
- **models/** – Data Access Layer (DAL) and Provisioning logic.
  - `db.js` - Core database connection pool and low-level queries (user retrieval, auth linking, generic CRUD).
  - `user-provisioning.js` - Handles logic for creating new user accounts, assigning default roles/groups, and linking authentication providers.
  - `attendanceModel.js` - Handles database operations for attendance, including fetching student directories, recording attendance status, and retrieving history by date or user.
  - `groupModel.js` - Manage database queries related to group data, such as retrieving all active groups.
  - `journalModel.js` - Manages database operations for journal entries, specifically creating new submission records.
  - `journalModel-mock.js` - An in-memory mock implementation of the journal model, allowing for API testing without a live database connection.
  - `userModel.js` - Handles database queries related to user records, such as retrieving all users.
  - `attendanceModel.js` - DB queries for attendance records.
  - `journalModel.js` - DB queries for journal entries.
- **middleware/** – Authorization and Validation.
  - `role-checker.js` - **RBAC Middleware**. Contains `requirePermission` to protect routes based on user permissions.
  - **auth/**
    - `auth-mounter.js` - Dynamically loads the active authentication strategy's router.
- **utils/** – Helper functions.
  - `helpers.js` - Shared backend utility functions for tasks like date formatting and data validation.
  - `db-seeder.js` – **Node.js utility** that programmatically seeds the database with Roles, Permissions, Groups, and Activities based on the JSON files in `server/config/`.
  - `permission-resolver.js` - Implements **least-privileged precedence** logic for users with roles of multiple privilege levels. 
    - For **Unprivileged Users** (level ≤ 1) - Permissions are **additive**, stacking across multiple roles of the same privilege level (e.g., a user can be both a "Student" and "Group Leader").
    - For **Privileged Users** (level > 1) - Enforces a **single-role limit** (e.g., a user cannot be both "TA" and "Professor") to prevent privilege escalation.
- **config/** – System configuration and definitions.
  - `role-groups.json` - JSON definitions for default Roles (Student, TA, Professor) and Groups.
  - `permissions.json` - Master list of all system permissions (e.g., `EDIT_OWN_PROFILE_DATA`, `CREATE_GROUP`).
  - `activity-config.json` - Definitions for system activity logging events.
   - **auth/**
      - `auth-strategies.js` - Centralized map that dynamically integrates all available auth strategies (Mock, Google, SSO).
      - `sso-modes.js` - Defines operational modes (Mock vs. Real) for SSO handling.

---

### **db/**
Contains all database setup, migration scripts, and seeding utilities for **PostgreSQL**.

- **schema.sql** – Defines database tables and relationships.
- **seed.sql** – Inserts initial sample data for local testing.
- **verify_data.sql** - Verifies that the database schema and seed data work properly.
- **migrations/** – Includes SQL files for versioned schema updates.

---

### **tests/**
Stores automated test files and documentation for both client and server.

- **client/** – Contains HTML and accessibility tests.
  - `html_test.js` – Verifies HTML structure and checks for compliance with accessibility standards.
- **server/** – Backend integration and unit tests.
  - **Integration Scripts** (Standalone Node.js scripts)
    - **models/**
      - `test-db.js` – Validates `.env` loading and database connection.
    - **attendance/**   
      - `test-attendance.js` – Testing for Attendance API (validation, error handling).
      - `test-simple_attendance.js` – Basic success flow testing for Attendance.
    - **journal/**
      - `test-journal-api.js` – Tests journal creation, required fields, and optional blockers.
      - `test-direct.js` – Quick connection test for Journal API.
    - **class-directory/**
      - `test-class-directory.js` – Verifies user search, directory metadata, and query filtering.
  - **Unit Tests**
    - **models/**
      - `db.test.js` – Jest unit tests for the Data Access Layer (DAL), covering user retrieval, transactions, and logging.
    - **services/**
      - `user-provisioning.test.js` – Tests the provisioning logic (creation, linking, and defaults).
      - **auth/**
        - `auth-service.test.js` – Tests the orchestration of login logic and activity logging.
        - **google/**
          - `google-authenticator.test.js` – Tests the Passport Google Strategy configuration and callbacks.
    - **routes/**
      - `routes_test.js` – Basic API endpoint verification.
      - **api/auth/**
        - `auth-router.test.js` – Tests generic session management endpoints (`/session`, `/logout`).
      - **api/admin/**
        - `groups-role-router.test.js` – Tests group and role creation routes.
        - `user-role-router.test.js` – Tests the assignment of roles to Users and security checks.
    - **middleware/**
      - `role-checker.test.js` – Unit tests for **RBAC**, ensuring permissions are correctly enforced.
      - **auth/**
        - `require-auth.test.js` – Unit tests for the authentication middleware.
    - **utils/**
      - `permission-resolver.test.js` – Tests the **least-privileged precedence** logic, verifying that unprivileged permissions stack additively while unprivileged roles override higher levels.
    - **db/**
      - `db-seeder.test.js` – Tests the database seeding utility and configuration validation.
- **testing_docs/** – Detailed guides and change logs for testing specific features.
  - `attendance_testing.md` – Guide for setting up and running Attendance API tests.
  - `journal_testing_guide.md` – Guide for setting up and running Journal API tests.
  - `journal_changes.md` – Summary of modifications, mock models, and results for the Journal feature.

---