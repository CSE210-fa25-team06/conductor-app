# Automatic Deployment Pipeline

## What the feature does
- Ensures the production server always runs the latest code from the `main` branch.
- Automates:
  - fetching updates  
  - rebuilding Docker containers  
  - restarting services  
- Eliminates the need for manual deployment steps.

---

## How it works (frontend)
- This is a backend/infrastructure feature.
- No frontend interaction is involved.

---

## How it works (backend)
- A shell script (`update_app.sh`) is scheduled via **cron** (e.g., every 2 minutes).
- The script:
  1. navigates to the application directory  
  2. checks the local Git repository against the remote `origin/main`  
  3. if updates exist, runs `git pull`  
  4. triggers `docker compose up --build` to rebuild and restart containers  
- Production deployment uses settings defined in `docker-compose.override.yml`.

For full installation instructions, see the deployment section in `README.md`.

---

## Data flow (Infrastructure)

1. Cron daemon triggers `update_app.sh`.  
2. Script checks the Git remote for updates.  
3. If updates are found, the local source code is updated.  
4. Docker Compose rebuilds images and recreates containers with the new code.  

---

## API endpoints used or created
- None.

---

## UI components involved
- None.

---

## Database tables involved
- None.

---

## Edge cases, limitations, or special rules
- Server must have SSH keys or Deploy Keys configured to allow **non-interactive** `git pull`.
- Local uncommitted changes on the server will block `git pull` and halt updates.
- Deployment uses `docker-compose.override.yml` for production-specific configurations (e.g., restart policies).
