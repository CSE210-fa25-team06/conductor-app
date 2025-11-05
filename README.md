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

- **app.js** – main Express server file that runs the backend  
- **routes/** – defines API endpoints (`index.js`, `users.js`, `groups.js`)  
- **controllers/** – handles request logic and connects routes to models (`userController.js`, `groupController.js`)  
- **models/** – manages PostgreSQL queries and data operations (`db.js`, `userModel.js`, `groupModel.js`)  
- **middleware/** – includes authentication and validation layers (`auth.js`)  
- **utils/** – helper functions and shared utilities (`helpers.js`)  

---

### **db/**
Contains all database setup and migration scripts for **PostgreSQL**.

- **schema.sql** – defines database tables and relationships  
- **seed.sql** – inserts sample data for local testing
- **verify_data.sql** - verifies that the database schema and seed data work properly
- **migrations/** – includes SQL files for versioned schema updates  

---

### **tests/**
Stores automated test files for both frontend and backend. Make sure the files have a .test in the name as Jest automatically looks for files with the .test.js pattern to call.

- **frontend/** – HTML and UI-related tests  
  - `html.test.js` – accessibility and structural validation for HTML pages  
  - `journal_ui.test.js` – placeholder and future tests for the Evaluation Journal frontend behavior  

- **backend/** – database, route, and API tests  
  - `routes.test.js` – verifies Express routes and API endpoints  
  - `journal.test.js` – tests for the Evaluation Journal feature including database integrity, foreign key behavior, and future API route specifications

---