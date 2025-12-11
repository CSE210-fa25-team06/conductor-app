# CI/CD Pipeline

## What the feature does
- Automates linting (HTML, CSS, JavaScript), accessibility checks, backend integration tests, and Playwright end-to-end tests.
- Runs on every push and pull request using GitHub Actions.
- Ensures code quality, accessibility compliance, and functional correctness before merging into `main`.

---

## How it works (frontend)
- Frontend files are automatically checked by:
  - **Stylelint** (CSS)
  - **HTMLHint** (HTML)
  - **Pa11y** (accessibility)
  - **Playwright** (end-to-end tests in a real browser)
- No manual steps are needed; workflows run on repository events.
- Playwright validates actual frontend behavior against the running application.

---

## How it works (backend)
- Each workflow:
  - Sets up Node.js  
  - Installs dependencies via `npm ci`  
  - Starts required services
- For HTML linting and accessibility checks:
  - Postgres is started so the server can boot
- For Playwright tests:
  - Docker Compose launches the full application stack (backend + Postgres + Redis if used)
- Before any tests run:
  - Database schema is loaded via `db/schema.sql`
  - Sample data is seeded via `db-seeder.js`
- Backend JavaScript is linted using **ESLint**.

---

## Data flow (frontend to backend to database)

1. A push or pull request triggers the GitHub Actions workflow.  
2. CI jobs check out the code, install Node dependencies, and start required services (Postgres or Docker Compose stack).  
3. Database schema and seed data are applied.  
4. Linters and tests run (ESLint, Stylelint, HTMLHint, Pa11y, Playwright).  
5. Playwright generates reports that upload as CI artifacts for reviewers.  

---

## API endpoints used or created
- No new endpoints created for CI.
- During tests, workflows call the existing app at `http://localhost:3000`, including routes like `/dashboard.html`.

---

## UI components involved
- Pa11y and Playwright interact with the existing UI:
  - dashboard  
  - menus  
  - pages  
- CI does **not** add or modify UI components; it validates them.

---

## Database tables involved
- Workflows initialize the **entire** application schema from `db/schema.sql`.
- Seed data populates all existing tables:
  - users  
  - roles  
  - attendance  
  - journals  
  - sentiments  
  - and others  
- No CI-specific tables are introduced.

---

## Edge cases, limitations, or special rules
- The HTML linting workflow installs Chrome dependencies required for Pa11y; if failures occur, server logs are automatically dumped.
- The Playwright workflow relies on Docker Compose and waits for `/dashboard.html` to respond before running tests.
- CI uses mock authentication and local-only secrets, appropriate for CI but not production.
- Pa11y and Playwright failures **block pull request merges** until resolved.
