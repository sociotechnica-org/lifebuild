# Plan 017: Server Resource Monitoring Overhaul

## Overview

The current Node.js server (`packages/server`) ships with an in-process `ResourceMonitor` that self-reports CPU, memory, queue depth, and error metrics via log alerts and the `/health` endpoint. Runtime behaviour shows these numbers are inaccurate (especially CPU), several metrics are hard-coded placeholders, and the server is effectively grading its own homework without external validation. This plan documents the existing implementation, pinpoints correctness issues, and recommends a more reliable observability approach using managed telemetry infrastructure.

## Current Implementation Assessment

- `ResourceMonitor` (`packages/server/src/services/resource-monitor.ts`) samples process data on a 10s interval, keeps a sliding window in memory, and emits warnings.
- The monitor is instantiated globally and per store inside `EventProcessor` (`packages/server/src/services/event-processor.ts`). Its computed snapshot is exposed on `/health` via `getGlobalResourceStatus()` (`packages/server/src/index.ts`).
- CPU usage is derived from `process.cpuUsage()` without deltas, so the reported “percent” is just cumulative CPU time in seconds (`resource-monitor.ts:464-469`).
- `getCurrentQueuedMessages()` and `getCurrentActiveConversations()` are placeholders returning zero (`resource-monitor.ts:444-453`), so queue-based alerts can never trigger and the health response misleads operators.
- Message/error rate counters only track what the server manually records; they omit backlog/latency visibility and lack persistence across restarts.
- Alerts are logged at `warn` even when based on fabricated numbers, producing noisy or false-positive telemetry.

## Identified Risks

- **Incorrect CPU telemetry**: Values monotonically increase past configured limits, flagging false “critical” CPU situations and masking real saturation.
- **Missing queue/conversation observability**: Zeroed metrics mask whether the server is overloaded or dropping work.
- **Self-referential monitoring**: Without exporting data externally, outages that take down the Node process also silence monitoring.
- **Health endpoint trust issues**: Downstream systems consuming `/health` see misleading data, undermining automated alerting.

## Recommended Direction

### 1. Retire or neuter `ResourceMonitor`

- Stop surfacing fabricated metrics on `/health`; short-term, strip CPU/queue/conversation numbers or clearly mark them as unavailable.
- Remove auto-generated alerts or downgrade them to `debug` until accurate data exists.
- Replace bespoke sliding-window logic with instrumentation that reflects actual queues (i.e., gather counts from `MessageQueueManager`, per-store processors, and the SQLite backlog directly).

### 2. Adopt standardized telemetry primitives

- Introduce OpenTelemetry Metrics via `@opentelemetry/sdk-node` (the monorepo already references OTEL for the worker) and instrument:
  - Process and event-loop stats via `@opentelemetry/host-metrics`/`prom-client` equivalents.
  - Application metrics (LLM call concurrency, queue depth, processing latency) using gauges/histograms fed by real queue state.
- Expose an OTEL/Prometheus endpoint (`/metrics`) and wire instrumentation to reflect actual system state instead of manual timers.

### 3. External observability platform: Grafana Cloud (Prometheus/Loki)

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

1. **Audit & disable misleading fields**
   - Update `/health` to omit or flag inaccurate numbers until replacements exist.
   - Gate existing warning logs behind a feature flag or remove them.

2. **Instrument real metrics**
   - Capture queue depth directly from `MessageQueueManager` and per-store processors.
   - Measure LLM latency/throughput with histograms timed around actual call completions.
   - Replace `process.cpuUsage()` logic with OTEL host metrics or `process.resourceUsage()` deltas via a shared sampler.

3. **Wire OpenTelemetry**
   - Add OTEL SDK bootstrap (likely `src/telemetry.ts`) and start it from `src/index.ts` before server code runs.
   - Configure OTLP metric exporter conditioned on environment variables; default to stdout/logging when disabled.
   - Provide `pnpm` scripts to run with OTEL locally (`pnpm --filter @work-squared/server dev:otel`).

4. **Deploy Grafana Agent / configure exporters**
   - Supply deployment docs (Docker Compose/systemd) for running Grafana Agent next to the server.
   - Document required secrets and how to rotate them.

5. **Update documentation & runbooks**
   - Rewrite `packages/server/README.md` monitoring section to cover OTEL + Grafana integration and viewing dashboards.
   - Specify remediation steps when thresholds breach (increase worker capacity, throttle LLM, etc.).

## Open Questions & Follow-Up

- Hosting environment details (container orchestrator, bare metal, Cloudflare tunnel) will influence how the Grafana Agent is deployed—clarify before implementation.
- Confirm whether logs should also ship to Grafana (Loki) or stay with existing logging pipeline.
- Decide on retention/alert thresholds for business metrics (e.g., acceptable LLM call error rate) before codifying alerts.

Once these items are addressed, the server will report actionable metrics externally, and `/health` can reflect trustworthy state without the current self-measurement pitfalls.
