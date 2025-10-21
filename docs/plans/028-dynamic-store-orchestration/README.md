# Dynamic Store Orchestration

## Overview

**Goal**  
Provision and monitor Workspace stores automatically inside the Node.js multi-store server as soon as users create or delete workspaces. No environment variable edits, deploys, or restarts should be required. Plan 027 (Workspace Creation & Switching) is considered complete and provides the user-facing workspace APIs, default selection, and sync worker enforcement.

**Value**

- Workspace lifecycle flows remain self-serve.
- The server always watches the correct set of stores.
- Operations can observe, reconcile, and recover from drift quickly.

**Status**: Not Started ⭕  
**Priority**: Medium – Required for production scale and operational safety.

---

## Current State

- `packages/server/src/index.ts:24-38` loads store IDs once from `process.env.STORE_IDS` and starts monitoring each store during boot.
- `StoreManager` (`packages/server/src/services/store-manager.ts`) supports `addStore`, `removeStore`, and health tracking, but callers never invoke them after startup.
- `EventProcessor` (`packages/server/src/services/event-processor.ts`) exposes `startMonitoring` and `stopMonitoring`; only the boot loop uses `startMonitoring`.
- Auth Worker now owns workspace CRUD, exposes `/workspaces` and `/internal/users/:userId/instances`, and enforces quotas (Plan 027).
- Sync Worker validates workspace membership per connection and routes traffic per workspace (Plan 027).

**Gap**: There is no automation that connects workspace lifecycle events to the server’s store registry, nor any reconciliation safety net if events are missed.

---

## Objectives

1. **Webhook-driven provisioning** – When the Auth Worker creates or deletes a workspace, the Node server adds or removes monitoring immediately.
2. **State reconciliation** – A background process constantly compares the authoritative workspace list (Auth Worker) with the monitored set and fixes drift.
3. **Operational visibility** – Monitoring endpoints, logging, and Sentry telemetry expose provisioning health, reconcile summaries, and failure alerts.
4. **Safety & idempotency** – All operations must be idempotent, rate-limited, and safe to retry without double-provisioning or double-removal.

---

## Architectural Principles

- **Auth Worker is the source of truth**. Decisions about workspace existence and ownership defer to its Durable Object data and APIs.
- **Server orchestration is modular**. Introduce dedicated orchestration services (`WorkspaceOrchestrator`, `WorkspaceReconciler`) rather than scattering logic across `index.ts`.
- **Event-driven, eventually consistent**. Webhook push minimizes latency; reconciliation guarantees correctness.
- **Deterministic configuration**. Store configuration derives from existing helpers (`packages/server/src/factories/store-factory.ts`) so provisioning never mutates global environment variables.
- **Observability first**. Use the existing Pino logger, Sentry instrumentation, and `/health` endpoint to expose metrics needed for operations and alerting.

---

## Work Breakdown

### Phase 1 – Orchestration Core

**Deliverable**: `WorkspaceOrchestrator` service orchestrating `StoreManager` and `EventProcessor`.

- Create `packages/server/src/services/workspace-orchestrator.ts` exporting an idempotent API:
  - `ensureMonitored(storeId: string)`: checks if monitoring is active, calls `storeManager.addStore`, and `eventProcessor.startMonitoring`.
  - `stopMonitoring(storeId: string)`: stops the event processor and removes the store.
  - `listMonitored(): string[]`: returns current IDs for reconciliation and metrics.
- Refactor `packages/server/src/index.ts` to:
  - Instantiate `WorkspaceOrchestrator`.
  - Replace the boot-time `for` loop with calls to `ensureMonitored` for any `STORE_IDS` defined (supports legacy deployment but no longer required).
  - Expose orchestrator stats via `/health` and `/stores` responses (add `monitoredStoreIds`, `lastProvisionedAt`, etc.).
- Ensure shutdown flow invokes orchestrator to stop all monitoring gracefully.

### Phase 2 – Webhook Ingestion

**Deliverable**: Auth Worker pushes workspace lifecycle events; server validates and applies them.

- **Auth Worker**
  - Extend the Plan 027 workspace creation/deletion handlers to call `notifyServerOfWorkspaceEvent(eventType, instanceId, userId, env)`.
  - Implement the notifier with retries (e.g., exponential backoff capped at 3 attempts) and log failures without blocking the user flow.
  - Configure `SERVER_WEBHOOK_URL` and `WEBHOOK_SECRET` in `wrangler.toml`, leaving them optional in development.
- **Server**
  - Introduce an HTTP handler module (e.g., `packages/server/src/api/workspace-webhooks.ts`) that:
    - Verifies `X-Webhook-Secret`.
    - Validates payload shape (`event`, `instanceId`, `userId`, `timestamp`).
    - Delegates to `WorkspaceOrchestrator.ensureMonitored` or `stopMonitoring`.
    - Returns idempotent responses (`already_monitored`, `monitoring_started`, `monitoring_stopped`).
  - Wire the handler into the HTTP server. Either:
    - Add a lightweight router atop the existing `http` server, or
    - Introduce Express/Koa (with careful dependency management). Document the choice.
  - Emit Pino logs and Sentry breadcrumbs for every event, noting duration and outcome.

### Phase 3 – Reconciliation & Drift Repair

**Deliverable**: Periodic reconciliation job that guarantees eventual correctness.

- Add `WorkspaceReconciler` (`packages/server/src/services/workspace-reconciler.ts`) with:
  - Configurable interval (default 5 minutes, env override).
  - `start()`/`stop()` lifecycle methods.
  - `reconcile()` that fetches the authoritative instance list using the Plan 027 internal endpoint (`GET /internal/users/:userId/instances` or a new bulk listing if required), using `SERVER_BYPASS_TOKEN`.
  - Diff logic:
    - For each missing monitored store, call `stopMonitoring` (optionally with a grace period).
    - For each unmonitored store in the authoritative list, call `ensureMonitored`.
  - Metrics capture: counts of added/removed stores, reconcile duration, last success timestamp.
- Invoke `workspaceReconciler.start()` during server startup after Sentry initialization and stop it during shutdown.
- Update `/health` to include reconciliation details (last run, success status, mismatched counts).

### Phase 4 – Observability & Operations

**Deliverable**: Metrics, logging, and manual controls.

- Enhance `StoreManager.addStore` and `EventProcessor.startMonitoring` to measure elapsed time, log success/failure, and add Sentry breadcrumbs (category: `workspace_orchestration`).
- Track provisioning failures and reconciliation errors with Sentry tags (`storeId`, `operation`, `phase`).
- Extend `/stores` JSON output to include provisioning timestamps, reconcile status, and error counters.
- Document a manual reconciliation trigger (CLI script or authenticated HTTP endpoint) to assist operations during incidents.

### Phase 5 – Validation & Rollout

**Deliverable**: Automated coverage and deployment readiness.

- **Unit Tests**
  - Orchestrator happy path & idempotency.
  - Webhook handler secret validation and duplicate protection.
  - Reconciler diff logic (add missing, remove orphaned, error handling).
- **Integration Tests**
  - End-to-end: create workspace → webhook fired → server monitors new store.
  - Simulate webhook failure, ensure reconciler eventually adds the store.
  - Workspace deletion flow stops monitoring within reconciliation window.
- **Load / Resilience Tests**
  - Burst of workspace creations (e.g., 10 in parallel) to confirm queueing/backpressure.
  - Reconcile against 100+ workspaces to validate performance.
- **Docs & Ops**
  - Update architecture and runbooks (docs/architecture.md, ops guides) with webhook URLs, secrets, reconcile intervals, and manual commands.
  - Final deployment checklist (see below).

---

## Environment & Configuration

| Variable                          | Location                           | Purpose                                                  |
| --------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| `SERVER_WEBHOOK_URL`              | Auth Worker `wrangler.toml`        | Target for workspace lifecycle webhooks.                 |
| `WEBHOOK_SECRET`                  | Auth Worker secret + Server `.env` | Shared secret for webhook authentication.                |
| `SERVER_BYPASS_TOKEN`             | Auth Worker + Server               | Authenticates internal reconciliation requests.          |
| `WORKSPACE_RECONCILE_INTERVAL_MS` | Server `.env` (optional)           | Overrides default 5 minute reconciliation cadence.       |
| `STORE_IDS`                       | Server `.env` (optional)           | Legacy bootstrap list; kept for backwards compatibility. |

Ensure production secrets are injected via deployment tooling (Wrangler secrets, Render env vars, etc.).

---

## Deliverables

- `WorkspaceOrchestrator` and `WorkspaceReconciler` services with accompanying tests.
- Webhook endpoint in the server and notifier in the Auth Worker.
- Updated `/health` and `/stores` endpoints exposing orchestration metadata.
- Documentation updates and operational runbooks.

---

## Success Metrics

- 100 % of workspaces created via Auth Worker are monitored within 1 minute (webhook path).
- 100 % reconciliation success within 10 minutes for missed webhooks.
- 0 orphaned monitored stores (stores without matching workspace records).
- Provisioning and reconciliation failure rates <1 % outside of deliberate chaos tests.
- Mean provisioning latency <15 seconds; 95th percentile <30 seconds.

---

## Risks & Mitigations

| Risk                                   | Mitigation                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook delivery failures              | Retry with backoff; reconciliation repairs drift; monitor Sentry alerts.                                                                                      |
| Secret leakage                         | Use dedicated secrets per environment, rotate regularly, verify via HMAC headers.                                                                             |
| Excessive provisioning load            | Make orchestrator idempotent, add rate limiting/backoff, monitor queue depths.                                                                                |
| Authoritative list endpoint throttling | Cache reconciliation responses per run and batch requests; add exponential backoff when Auth Worker is unavailable.                                           |
| Partial deployment sequencing          | Enforce deployment order: Auth Worker (webhooks enabled) → Server (orchestrator) → optional config toggles. Use feature flags if staggered rollout is needed. |

---

## Dependencies

- Plan 027 (Workspace Creation & Switching) must be deployed and stable.
- No external services required beyond existing infrastructure (Auth Worker, Node server, Sentry).

---

## Deployment Checklist

**Pre-Deployment**

- Configure `SERVER_WEBHOOK_URL` and `WEBHOOK_SECRET` in Auth Worker (per environment).
- Configure `WEBHOOK_SECRET`, `SERVER_BYPASS_TOKEN`, and optional reconcile interval in server `.env`.
- Verify Auth Worker internal endpoints are reachable from the server environment.
- Run `pnpm lint-all`, `pnpm test`, and `CI=true pnpm test:e2e`.

**Deploy**

- Deploy Auth Worker (webhook notifier).
- Deploy server with orchestrator and webhook listener.
- Confirm `/health` reports reconciliation enabled and no drift.
- Trigger a test workspace creation and observe automatic provisioning.

**Post-Deployment**

- Monitor Sentry for `workspace_orchestration` warnings/errors.
- Review `/stores` and `/health` dashboards for active store counts.
- Validate reconciliation logs for successes/failures.
- Document any tuning of reconcile interval or backoff in ops notes.

---

## Rollback Strategy

1. Disable webhook notifications by unsetting `SERVER_WEBHOOK_URL` in Auth Worker (or set to empty string).
2. Temporarily disable reconciliation via environment flag (stop the interval) if it misbehaves.
3. Revert server to static `STORE_IDS` configuration if necessary.
4. Investigate logs/Sentry for root cause, patch issues, redeploy, and re-enable automation gradually.

---

## Open Questions

- Do we need dedicated persistent storage for webhook audit trails, or are logs + Sentry breadcrumbs sufficient?
- Should reconciliation delete stores immediately or mark them for removal after a grace period (e.g., 24 hours) to protect against accidental deletions?
- Are there regulatory or compliance requirements for telemetry around workspace provisioning that require additional logging formats?

Capture answers before implementation starts; update this document if scope changes.
