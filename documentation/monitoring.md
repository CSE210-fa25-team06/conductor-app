# Monitoring

## What the feature does
- Provides real-time visibility into the application's health, performance, and behavior.
- Aggregates:
  - CPU and memory usage  
  - request rates  
  - distributed traces (request latency, database query timing)
- Displays all metrics and traces in a centralized monitoring dashboard.

---

## How it works (frontend)
- Administrators open the **Grafana UI** (exposed on port `3001`).
- Pre-configured dashboards display:
  - request latency  
  - error rates  
  - trace timelines  
- The **"Application Traces"** dashboard visualizes request durations and error frequency.

---

## How it works (backend)
- The Node.js app initializes the **OpenTelemetry SDK** (`server/tracing.js`) at startup.
- The SDK automatically instruments:
  - HTTP request handlers  
  - database operations  
- Generated telemetry data is sent to the **OpenTelemetry Collector** container.
- The collector:
  - exports **metrics** to **Prometheus**  
  - exports **traces** to **Tempo**  

---

## Data flow (App to Collector to Storage to Visualization)

1. User makes a request to the Express API.  
2. OpenTelemetry SDK captures the request duration and metadata.  
3. Telemetry data is sent to the `otel-collector` service.  
4. Collector routes:
   - **metrics → Prometheus**  
   - **traces → Tempo**  
5. Grafana queries Prometheus and Tempo to render dashboards, charts, and trace tables.  

---

## API endpoints used or created
- `GET /error-test` — an intentional 500-error endpoint used to test trace capture and alerting workflows.

---

## UI components involved
- Grafana dashboards, including:
  - **Application Traces** dashboard  

---

## Database tables involved
- None.  
- Monitoring data is stored in Docker volumes:
  - `prometheus_data`  
  - `tempo_data`  
  - `grafana_data`  

---

## Edge cases, limitations, or special rules
- Telemetry data is not persistent if Docker volumes are removed (`docker compose down -v`).
- The application must wait for the OpenTelemetry Collector to be ready, but the SDK handles retries gracefully.
