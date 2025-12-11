# Analytics using ZingChart

## What the feature does
- Displays attendance analytics on the dashboard using **ZingChart**.
- Visualizes:
  - presence rates over time  
  - attendance distribution by meeting type  
- All chart data is fetched from backend attendance statistics.

---

## How it works (frontend)
- `renderStatistics` replaces dashboard content with `statistics.html` and then fetches `/attendance/stats`.
- After receiving statistics, it initializes two ZingChart visualizations:
  - **Line chart** — daily attendance counts  
  - **Pie chart** — attendance by meeting type
- `statistics.html` provides ARIA-labeled containers:
  - `presenceRateChart`
  - `meetingTypeChart`
- The page loads:
  - ZingChart CDN script  
  - `statistics.js` module via `dashboard.html`

---

## How it works (backend)
- `GET /attendance/stats` calls `getAttendanceStats`.
- This triggers `fetchAttendanceStats`, which aggregates from the `attendance` table:
  - total attendance entries  
  - total present entries  
  - daily attendance counts  
  - attendance grouped by meeting type  
- The aggregated results return as structured JSON for the frontend charts.

---

## Data flow (frontend to backend to database)

1. User navigates to **Statistics** in the dashboard.  
2. `statistics.html` loads and the frontend fetches `/attendance/stats`.  
3. Backend queries the `attendance` table for all required aggregates.  
4. Backend returns totals, daily presence data, and meeting-type breakdown.  
5. ZingChart renders the graphs using the JSON response.  

---

## API endpoints used or created
- `GET /attendance/stats` — returns aggregated attendance statistics.

---

## UI components involved
- Statistics tab in the dashboard  
- `statistics.html` card containers:  
  - `presenceRateChart`  
  - `meetingTypeChart`  
- ZingChart-rendered line and pie charts  

---

## Database tables involved
- `attendance` — used to compute totals, presence counts, daily aggregates, and meeting-type distribution.

---

## Edge cases, limitations, or special rules
- Charts expect `stats.daily` and `stats.byType` to exist; if empty, charts render with no data.
- Meeting type labels appear exactly as stored in the database.
- If the fetch request fails, errors only show in the browser console; the statistics UI does not display a fallback message.
