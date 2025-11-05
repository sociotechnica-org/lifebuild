# Workspace Orchestration Runbook

This runbook explains how to operate the workspace orchestration services that manage LiveStore provisioning inside the multi-store server. It focuses on the new observability instrumentation, the manual reconciliation trigger, and escalation expectations.

## Overview

- **Services involved**: `WorkspaceOrchestrator`, `StoreManager`, `EventProcessor`, and `WorkspaceReconciler`.
- **Primary dashboards**: Sentry project specified by `SENTRY_DSN` and the link in `ORCHESTRATION_INCIDENT_DASHBOARD_URL`.
- **Endpoints**:
  - `GET /health` – consolidated status (orchestration, reconciliation, manual trigger state).
  - `GET /stores` – per-store orchestration metadata.
  - `POST /admin/reconcile` – authenticated manual reconciliation trigger.

## Observability & Telemetry

- All orchestration operations emit duration metrics (`durationMs`) in logs and Sentry breadcrumbs under the `workspace_orchestration` category.
- Failures in provisioning or deprovisioning automatically capture Sentry events with tags:
  - `workspace_orchestration.operation`
  - `workspace_orchestration.store_id`
- Logs and breadcrumbs include `incidentDashboardUrl` (if `ORCHESTRATION_INCIDENT_DASHBOARD_URL` is set) for quick access to external dashboards.
- `/health` now exposes:
  ```json
  {
    "reconciliation": { "isRunning": false, ... },
    "manualReconcile": {
      "lastTriggeredAt": "2025-02-10T20:15:00.000Z",
      "minIntervalMs": 60000,
      "inFlight": false,
      "incidentDashboardUrl": "https://observability.example.com/dashboards/workspace-orchestration"
    }
  }
  ```

Use the `manualReconcile` block to verify when a manual trigger last ran and whether another request is currently executing.

## Manual Reconciliation Trigger

- **Endpoint**: `POST /admin/reconcile`
- **Auth**: `Authorization: Bearer <SERVER_BYPASS_TOKEN>` (or `X-Server-Token` header).
- **Rate limiting**: default 60 seconds between successful runs. Configure with `MANUAL_RECONCILE_MIN_INTERVAL_MS`.
- **Responses**:
  - `200 OK`: reconciliation completed. Payload includes `durationMs`, drift counts, and `incidentDashboardUrl`.
  - `409 Conflict`: a reconciliation is already running (automatic or manual).
  - `429 Too Many Requests`: rate limit enforced. Check `Retry-After` header.
  - `401 Unauthorized` / `503 Service Unavailable`: missing or invalid credentials, or reconciler disabled.
- **Example**:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer ${SERVER_BYPASS_TOKEN}" \
    https://server.example.com/admin/reconcile
  ```

### Trigger Procedure

1. Verify `/health` to confirm the reconciler is not already running.
2. Execute the POST request with the bypass token.
3. Monitor logs (`workspace_reconciler.manual_trigger`) and Sentry for success or failure.
4. Confirm `/health` reflects updated timestamps and drift counts.

### Troubleshooting Manual Triggers

- **429 rate limit**: Wait for the interval indicated in `Retry-After`, or adjust `MANUAL_RECONCILE_MIN_INTERVAL_MS` if appropriate.
- **409 running**: Another reconcile (scheduled or manual) is in flight. Retest after current run completes.
- **500 failure**: Review Sentry event tagged `workspace_reconciler.manual_trigger` and follow escalation steps below.

## Interpreting `/health` and `/stores`

- `globalResources`, `liveStoreTotals`, and `processedMessages` highlight queue pressure; investigate if `pendingUserMessages` is high.
- `orchestrator` block lists currently monitored stores, provisioning counts, and timestamps for last changes.
- `reconciliation` includes totals and last duration. Consecutive failures should trigger manual reconciliation and incident review.
- `/stores` adds per-store orchestration metadata; look for stores stuck in `error` or `connecting` status.

## Escalation Path

1. **Primary**: Review logs and Sentry breadcrumbs for the specific operation (`workspace_orchestration.operation` tag).
2. **Dashboard**: Open the link in `incidentDashboardUrl` for infrastructure metrics (Render, Sentry, or custom dashboards).
3. **Manual reconciliation**: Trigger `/admin/reconcile` once conditions allow. Record `durationMs`, `added`, `removed`, and failure counts.
4. **Persistent failure**:
   - Capture Sentry event link.
   - Notify on-call via established incident channel.
   - Reference Plan 028 documentation for architectural context.
5. **Post-incident**: Document timeline and update this runbook if new steps are required.

## Environment Variables

| Variable                               | Purpose                                                     |
| -------------------------------------- | ----------------------------------------------------------- |
| `MANUAL_RECONCILE_MIN_INTERVAL_MS`     | Minimum spacing between manual reconcile requests.          |
| `ORCHESTRATION_INCIDENT_DASHBOARD_URL` | Optional dashboard link automatically added to logs/Sentry. |
| `SERVER_BYPASS_TOKEN`                  | Required for authenticated manual reconcile requests.       |

Ensure secrets are rotated via Render or deployment tooling when credentials change.
