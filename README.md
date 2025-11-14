# Team 6 - Fleetwood Stack - Conductor

Conductor is a lightweight platform to help instructors, TAs, and students manage course activities like attendance, scheduling, and group tracking.

The repository is organized into folders that separate the frontend, backend, database, and testing components. Each team can work independently while keeping the project consistent and maintainable.

---

### **client/**
Contains all frontend code written in standard **HTML, CSS, and JavaScript**.

- **index.html** – main entry point for the web interface  
- **scripts/** – JavaScript files for frontend logic  
  - `main.js` – handles UI behavior and event handling  
  - `api.js` – makes API calls to the backend  
- **styles/** – CSS files for layout and design  
  - `base.css` – default styling and typography  
  - `layout.css` – page structure and spacing  
  - `components.css` – reusable button and component styles  

---

### **server/**
Holds the backend logic built with **Node.js and Express**.

- **app.js** – Main Express server file. Now initializes **Passport** and **express-session** middleware for authentication.
- **routes/** – Defines API endpoints.
  - `routes/api/auth/auth-router.js`: Defines **universal authentication API endpoints** (`/session`, `/logout`, `/login-fail`) that are strategy-independent.
- **services/auth/** – Dedicated directory for all plug-and-play authentication strategies.
  - `google/`: Contains `google-authenticator.js` for **Passport Google OAuth 2.0** and its specific routes.
  - `mock/`: Contains `mock-authenticator.js` for a **simple development/testing login**.
  - `sso/`: Contains the **SSO Factory** (`sso-authenticator.js`) and mode-specific handlers (e.g., `mock-sso-handler.js`).
- **config/auth/** – Centralized configuration for the dynamic authentication system (`auth-strategies.js`, `sso-modes.js`).
- **controllers/** – Handles request logic and connects routes to models.
- **models/** – Manages PostgreSQL queries and data operations. `db.js` now contains **transactional functions for user provisioning and account linking**.
- **middleware/** – Includes authentication and validation layers. Contains `auth-mounter.js`, which **dynamically loads the active strategy's router** at runtime.
- **utils/** – Helper functions and shared utilities.

---

### **db/**
Contains all database setup and migration scripts for **PostgreSQL**.

- **schema.sql** – defines database tables and relationships
- **seed.sql** – inserts sample data for local testing
- **verify_data.sql** - verifies that the database schema and seed data work properly
- **migrations/** – includes SQL files for versioned schema updates

---

### **tests/**
Stores automated test files for both frontend and backend.

- **frontend/** – HTML and accessibility tests (`html_test.js`)  
- **backend/** – route and API tests (`routes_test.js`)  

---