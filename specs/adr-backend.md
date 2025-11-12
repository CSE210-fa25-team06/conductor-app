# Architecture Decision Record (ADR) Backend Technology Choices

**ADR #:** 3  
**Title:** Backend Technology Choice  
**Date:** 2025-11-09  
**Status:** [Proposed | Accepted | Rejected | Superseded by ADR-XXX]

---

## 1. Context
The Conductor application requires a reliable backend to manage user authentication, attendance tracking, journal entries, and group coordination. The backend must integrate smoothly with the frontend to provide secure and efficient APIs and support long-term maintainability.  

The system must handle data for 500–1000 users concurrently, store tens of thousands of records, and remain performant when deployed on low-cost instances. Since this project will be maintained by different course teams each quarter, the backend stack must be simple to understand and easy to deploy without advanced infrastructure knowledge.

Key constraints include:

- Five-week development timeline.  
- Requirement to use standard web technologies.  
- Must support authentication and role-based access control.  
- Should be easy to debug, test, and deploy locally or in lightweight containers.  

---

## 2. Decision
The backend will be implemented using Node.js with the Express framework and connected to a PostgreSQL database.  

Node.js provides a fast and non-blocking runtime environment that allows concurrent request handling, while Express simplifies route handling and middleware management. PostgreSQL offers strong relational data support, reliability, and long-term stability.  

This stack maintains a consistent language (JavaScript) across frontend and backend to reduce context switching and simplify collaboration between teams.  

---

## 3. Alternatives Considered
- **Option 1:** Django Framework with Python  
Django provides built-in tools for authentication and ORM but would introduce a new language and ecosystem. This creates inconsistency with the JavaScript-based frontend and increases maintenance effort which could lead to reduced developer flexibility.  

- **Option 2:** Flask Framework with Python  
Flask is lightweight and flexible but lacks structure for larger applications and again introduces a mixed-language stack. It also requires additional packages for authentication, ORM, and configuration that Express can already handle natively.  

- **Option 3:** Using a NoSQL Database (e.g., MongoDB)  
A document-based database like MongoDB could simplify schema evolution but would not fit the project’s need for clear relationships between users, roles, and groups. PostgreSQL’s relational model better reflects the structured nature of course data.  

---

## 4. Consequences
**Positive Outcomes**
- Single-language stack (JavaScript) across frontend and backend reduces overhead in converting between different programming languages.  
- Express offers flexible routing and middleware integration for authentication and logging.  
- PostgreSQL provides robust data integrity and transactional safety.  
- Node.js supports scalable and responsive performance even on modest hardware.  

**Negative Outcomes**
- Requires more manual configuration compared to full frameworks like Django.  
- Team members new to Express will need to learn its middleware and routing conventions.  
- Lack of a built-in admin interface means extra setup for database management tools.  

**Impact on Other Systems**
- The frontend (HTMX) will depend on backend routes returning HTML snippets and JSON responses when necessary.  
- Database schemas will define relationships for users, roles, attendance, and journals.  
- Security measures such as role-based access control, encrypted tokens, and HTTPS will be integrated through Express middleware.  

---

## 5. Implementation Notes
- Follow a Model–View–Controller (MVC)-like structure for maintainability.  
- Use Auth.js for Google OAuth integration and session management.  
- Manage environment variables (DB credentials, API keys) using `.env` files.  
- Containerize backend services using Docker for consistent local testing.  
- Use ESLint for JavaScript code quality checks.  
- Store SQL scripts for database migration and seeding in a versioned `/db` folder.  
- Log requests and errors using middleware for auditing and debugging.  

---

## 6. References
- [Design doc link](https://github.com/CSE210-fa25-team06/conductor-app/blob/main/specs/pitch/design-spec.pdf)  
- [Express Documentation](https://expressjs.com/)  
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)  
- [Auth.js Documentation](https://authjs.dev/)  
- [ADR-1: Overall System Architecture](adr.md)
