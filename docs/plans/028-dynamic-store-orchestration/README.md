# Dynamic Store Orchestration

## Overview

**Goal**  
Provision and monitor Workspace stores automatically inside the Node.js multi-store server as soon as users create or delete workspaces. No environment variable edits, deploys, or restarts should be required. Plan 027 (Workspace Creation & Switching) supplies the backend workspace CRUD + sync enforcement; frontend UX is still in flight.

**Value**

- Workspace lifecycle flows remain self-serve.
- The server always watches the correct set of stores.
- Operations can observe, reconcile, and recover from drift quickly.

**Status**: 🚧 In Progress — backend orchestration + webhooks landed; manual controls & runbooks pending.  
**Priority**: Medium – Required for production scale and operational safety.

---

## Current State

- `WorkspaceOrchestrator` dynamically provisions/tears down stores at runtime (`packages/server/src/services/workspace-orchestrator.ts`) and exposes summaries via `/health` + `/stores`.
- Auth worker emits workspace lifecycle webhooks with retries (`packages/auth-worker/src/workspace-notifier.ts`), and the server ingests them via `/webhooks/workspaces` (`packages/server/src/api/workspace-webhooks.ts`).
- `WorkspaceReconciler` runs on startup and at configurable intervals, comparing auth worker state to monitored stores (`packages/server/src/services/workspace-reconciler.ts`); status surfaces in `/health`.
- Tests cover orchestrator, reconciler, and webhook paths; logs use `operationLogger` namespaces.

**Remaining Gaps**
- Manual reconciliation trigger/CLI for ops incidents.
- Runbooks + SLO dashboards for provisioning failures and backlog monitoring.
- Optional synthetic monitoring and load/chaos exercises still TBD.

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

**Status:** ✅ Complete — `WorkspaceOrchestrator` landed with summary reporting and tests.  
**Deliverable**: `WorkspaceOrchestrator` service orchestrating `StoreManager` and `EventProcessor`.

- ✅ Created `packages/server/src/services/workspace-orchestrator.ts` with idempotent `ensureMonitored`, `stopMonitoring`, and `listMonitored`.
- ✅ `packages/server/src/index.ts` instantiates the orchestrator, calls `ensureMonitored` for legacy `STORE_IDS`, and exposes summary data via `/health` + `/stores`.
- ✅ Shutdown path delegates to `WorkspaceOrchestrator.shutdown()` to stop monitoring and flush dependencies.

### Phase 2 – Webhook Ingestion

**Status:** ✅ Complete — notifier + handler merged with unit tests.  
**Deliverable**: Auth Worker pushes workspace lifecycle events; server validates and applies them.

- ✅ Auth worker workspace handlers invoke `notifyWorkspaceEvent` with retries; configuration optional in development.
- ✅ Server exposes `/webhooks/workspaces`, validates secrets/payloads, and delegates to `WorkspaceOrchestrator`.
- ✅ Responses distinguish `monitoring_started`, `already_monitored`, `monitoring_stopped`, `already_stopped`; Vitest suite covers happy/error paths.

### Phase 3 – Reconciliation & Drift Repair

**Status:** ✅ Complete — reconciler running with status reporting.  
**Deliverable**: Periodic reconciliation job that guarantees eventual correctness.

- ✅ Added `WorkspaceReconciler` with configurable interval, lifecycle, diff logic, and metrics (`packages/server/src/services/workspace-reconciler.ts`).
- ✅ Server starts/stops reconciler alongside orchestrator and surfaces status via `/health` + `/stores`.
- ✅ Tests cover add/remove/partial failure scenarios.

### Phase 4 – Observability & Operations

**Status:** 🚧 In Progress — endpoints expose stats, but Sentry + manual controls outstanding.  
**Deliverable**: Metrics, logging, and manual controls.

- 🚧 Need additional instrumentation: add duration metrics and Sentry breadcrumbs/tags in `StoreManager` + `EventProcessor`.
- ✅ `/stores` and `/health` now include orchestrator timestamps, counts, and reconciliation status (`packages/server/src/index.ts`).
- ⏳ Manual reconciliation trigger/CLI not yet implemented.
- ⏳ Runbooks + dashboard updates still required.

### Phase 5 – Validation & Rollout

**Status:** 🚧 In Progress — backend unit tests merged; integration load tests + docs pending.  
**Deliverable**: Automated coverage and deployment readiness.

- ✅ **Unit Tests**: orchestrator, webhook handler, reconciler, and notifier suites in `packages/server/tests` and `packages/auth-worker/src/test`.
- 🚧 **Integration Tests**: need end-to-end workspace creation/deletion exercises across auth worker ↔ server.
- ⏳ **Load / Resilience Tests**: chaos/burst scenarios not yet scripted.
- ⏳ **Docs & Ops**: architecture/runbook updates and deployment checklist still to be expanded.

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
