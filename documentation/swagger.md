# Swagger / OpenAPI Documentation

## What the feature does
- Provides live, interactive Swagger/OpenAPI documentation for all REST endpoints.
- Stays synchronized with the codebase because the OpenAPI spec is generated directly from annotated comments placed next to each route handler.
- Eliminates the need for a static YAML file; documentation is auto-generated.

---

## How it works (frontend)
- Users visit the Swagger UI page (e.g., `/api-docs`) to explore:
  - available endpoints  
  - request parameters  
  - payload schemas  
  - authentication requirements  
  - example responses
- Swagger UI displays the **latest generated OpenAPI JSON**, ensuring new or updated endpoint comments appear immediately after a server restart.
- “Try it out” mode allows users to send real requests to the server from within the UI.

---

## How it works (backend)
- A Swagger generator scans Express router files for **JSDoc-style annotation blocks** containing OpenAPI metadata.
- These annotations are compiled into a full OpenAPI specification during server startup.
- The server mounts Swagger UI middleware, which serves:
  - the interactive HTML documentation viewer  
  - the raw JSON spec (`/api-docs.json`)  
- No static YAML is required; everything is generated programmatically.

---

## Data flow (frontend to backend to database)

1. A developer adds or updates JSDoc-style OpenAPI comments in an Express route file.  
2. On server start, the Swagger generator reads these comments and rebuilds the OpenAPI document.  
3. A user visits `/api-docs`, and Swagger UI fetches the generated OpenAPI specification.  
4. The interactive UI displays endpoints and allows “Try it out” requests, which call the actual Express route handlers interacting with the database.  

---

## API endpoints used or created
- `GET /api-docs` — serves the Swagger UI interface  
- `GET /api-docs.json` — serves the raw OpenAPI JSON document for external tooling  

---

## UI components involved
- Swagger UI explorer, which automatically generates:
  - operation list for all endpoints  
  - schema/model viewers  
  - “Try it out” panels for interactive API calls  

---

## Database tables involved
- None directly. Swagger itself does not access the database.
- However, the documented endpoints correspond to routes interacting with tables such as:
  - `users`  
  - `journals`  
  - `attendance`  
  - `roles`  
  - others  

---

## Edge cases, limitations, or special rules
- Documentation quality depends entirely on inline comment accuracy; missing annotations produce incomplete or outdated Swagger entries.
- Since the OpenAPI spec is rebuilt at server startup, changes require a restart for updates to appear.
- Permission and role requirements should be clearly reflected in comments so the generated documentation accurately represents authorization rules.
