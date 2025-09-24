# Plan 018: Server Resource Monitoring Overhaul

## Overview

The Node.js server (`packages/server`) previously shipped with an in-process `ResourceMonitor` that self-reported CPU, memory, queue depth, and error metrics via log alerts and the `/health` endpoint. That monitor has now been removed: the server only surfaces lightweight queue/conversation statistics that it can observe directly, while CPU and memory visibility come from Render’s platform dashboards. This plan captures why the self-monitoring approach was retired and lays out the follow-on observability strategy so we can revisit richer telemetry (likely after the service migrates to Cloudflare Workers).

## Current Implementation Assessment

- The bespoke `ResourceMonitor` module has been removed; `/health` now exposes only derived queue and conversation counts from `EventProcessor` (`packages/server/src/services/event-processor.ts`) and clearly labels CPU/memory data as unavailable.
- CPU and RAM monitoring are delegated to Render’s built-in platform metrics. Any thresholds or alerts should be configured there until we introduce external telemetry.
- We continue to lack durable insight into message latency, per-store backlog depth, or LLM error rates once the Node process restarts—those features require purpose-built instrumentation.
  
These changes eliminate misleading self-reported numbers but leave a visibility gap for anything beyond basic queue length and active conversation counts.

## Identified Risks

- **Platform dependency**: While we depend on Render dashboards, any outage or migration away from Render reintroduces blind spots unless an alternative monitor is ready.
- **Limited backlog/latency visibility**: Without OTEL-style instrumentation we still cannot quantify processing delays or LLM failure rates after restarts.
- **Alerting gaps**: `/health` no longer pushes warnings, so operators must ensure Render or future tooling fires alerts for saturation scenarios.

## Recommended Direction

### 1. Short-term: lean on Render

- Keep `/health` focused on deterministic data (active conversations, queued messages, recent errors) and explicitly note that CPU/memory metrics are supplied by Render.
- Document where to find Render dashboards and how to adjust alert thresholds there.
- Ensure structured logs still capture enough context for incident forensics while we operate without external metrics.

### 2. Prepare for standardized telemetry (deferred)

- Introduce OpenTelemetry Metrics via `@opentelemetry/sdk-node` (the monorepo already references OTEL for the worker) and instrument:
  - Process and event-loop stats via `@opentelemetry/host-metrics`/`prom-client` equivalents.
  - Application metrics (LLM call concurrency, queue depth, processing latency) using gauges/histograms fed by real queue state.
- Expose an OTEL/Prometheus endpoint (`/metrics`) and wire instrumentation to reflect actual system state instead of manual timers.

### 3. External observability platform: Grafana Cloud (Prometheus/Loki) *(future evaluation)*

Grafana Cloud offers a low-friction OTLP/Prometheus-compatible backend with generous free tiers and aligns with existing OpenTelemetry usage.

Preparation steps:
1. **Account & Stack**: Create/select a Grafana Cloud stack; note Prometheus endpoint, instance ID, and access token.
2. **Collector/Agent**: Decide between pushing directly from Node with OTLP HTTP or deploying the lightweight Grafana Agent alongside the server (recommended for buffering and retries).
3. **Configuration**:
   - Add environment variables for OTEL exporter (e.g., `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer <token>`).
   - If using Grafana Agent, ship OTEL metrics locally (`localhost:4318`) and let the agent remote-write to Grafana.
4. **Dashboards & Alerts**: Import Node.js/OTEL starter dashboards and recreate the current `/health` essentials using real metrics (CPU %, memory RSS, queue depth gauges, error-rate SLIs).
5. **Incident Hooks**: Integrate Grafana alerting with Slack/Email; retire any log-based pseudo-alerts from the server.

## Implementation Plan

1. **Stabilize the minimal health payload (in progress)**
   - Keep the new queue/conversation counters and Render note up to date as the server evolves.
   - Ensure non-critical rate limiting is optional so we do not reject messages without visibility.

2. **Instrument real metrics (future)**
   - Capture queue depth directly from `MessageQueueManager` and per-store processors.
   - Measure LLM latency/throughput with histograms timed around actual call completions.
   - Replace `process.cpuUsage()` logic with OTEL host metrics or `process.resourceUsage()` deltas via a shared sampler.

3. **Wire OpenTelemetry (future)**
   - Add OTEL SDK bootstrap (likely `src/telemetry.ts`) and start it from `src/index.ts` before server code runs.
   - Configure OTLP metric exporter conditioned on environment variables; default to stdout/logging when disabled.
   - Provide `pnpm` scripts to run with OTEL locally (`pnpm --filter @work-squared/server dev:otel`).

4. **Deploy Grafana Agent / configure exporters (future)**
   - Supply deployment docs (Docker Compose/systemd) for running Grafana Agent next to the server.
   - Document required secrets and how to rotate them.

5. **Update documentation & runbooks**
   - Rewrite `packages/server/README.md` monitoring section to cover OTEL + Grafana integration and viewing dashboards.
   - Specify remediation steps when thresholds breach (increase worker capacity, throttle LLM, etc.).

## Open Questions & Follow-Up

- Track the future OTEL/Grafana work in a dedicated GitHub issue so it can be prioritized alongside the Cloudflare Worker migration.
- Confirm whether Render’s alerting coverage is sufficient until the Cloudflare migration lands, or if we need interim Slack/email hooks off Render metrics.
- When the deployment moves to Cloudflare Workers, reassess observability tooling (e.g., Workers Metrics, Cloudflare Analytics) and adapt this plan accordingly.

Once those items are clarified, we can schedule the telemetry build-out and reintroduce rich metrics without reverting to inaccurate, in-process monitors.
