# Workspace Creation & Switching

**Status:** 🚧 In Progress  
- ✅ Auth worker workspace CRUD + Durable Object helpers are merged and unit-tested (`packages/auth-worker/src/index.ts`, `.../durable-objects/UserStore.ts`, `UserStore.test.ts`).  
- ✅ Sync worker enforces workspace ownership and per-instance routing with caching (`packages/worker/functions/_worker.ts`).  
- ⏳ Frontend workspace selection, switcher UX, and optimistic LiveStore integration are still missing.  
- ⏳ Operational polish (dashboards, rollout docs, Playwright coverage) outstanding.

---

## Current State Snapshot

- **Backend ownership:** Auth responses now include `defaultInstanceId`, and `/workspaces` routes let authenticated users create, rename, delete, and set defaults.
- **Sync enforcement:** WebSocket payloads must supply a workspace owned by the user; mismatches throw `AuthErrorCode.FORBIDDEN`.
- **Client gap:** `EnsureStoreId` and LiveStore bootstrapping still fabricate UUIDs, so the UI never surfaces real workspace IDs.
- **Observability:** Orchestrator/reconciler metrics live in plan 028; no dashboards or alerts specifically cover workspace UX yet.

---

## What’s Shipped

### Auth Worker
- Workspace CRUD endpoints available to end users with CORS + rate limiting.
- Durable Object helpers enforce quotas, uniqueness, and default selection; `touch` updates `lastAccessedAt`.
- Internal endpoints supply instance ownership checks for other services.

### Sync Worker
- `validateSyncPayload` verifies JWTs, confirms workspace ownership via auth worker, and enforces storeId ↔ instanceId parity.
- Development bypass remains opt-in and still requires explicit workspace IDs.
- Errors propagate with consistent `AuthErrorCode` values so UI layers can surface auth problems.

### Tests & Tooling
- `UserStore.test.ts` covers CRUD invariants and quotas.
- `workspace-notifier.test.ts` validates webhook retries; server webhook/orchestrator/reconciler suites exercised in plan 028 coverage.

---

## Outstanding Scope

1. **Workspace context & persistence**
   - Build `WorkspaceContext` to derive the active workspace from `AuthContext`, prefer server default, and persist to storage.
   - Remove UUID fabrication in `EnsureStoreId` and ensure LiveStore boot uses real instance IDs.

2. **Switcher + management UX**
   - Presenter/container pair for switching workspaces, creating, renaming, deleting, and setting defaults.
   - Toast/loading states, quota error copy, and optimistic updates wired through contexts.

3. **Membership flows**
   - Roles/invitations UI, optimistic membership mutations, and guardrails around default workspace removal.

4. **Testing & rollout**
   - RTL tests for contexts + switcher, Playwright flow that exercises create/switch lifecycle, and Storybook coverage.
   - Operational checklist + dashboards for denied workspace access and webhook failures.

---

## Phase Tracker

### Phase 1 – Auth Worker Contract  
**Status:** ✅ Complete  
Deliverables (done):
- Reusable DO helpers for list/create/rename/set-default/delete/touch.
- `/workspaces` REST endpoints plus internal ownership/listing APIs.
- Shared types updated with `AuthWorkspaceSelection` + `AuthErrorCode.FORBIDDEN`.
- `defaultInstanceId` returned in every auth success response.

### Phase 2 – Sync Worker Enforcement  
**Status:** ✅ Complete  
Deliverables (done):
- Workspace ownership validation against auth worker with 60 s cache.
- Rejection of mismatched storeId vs instanceId attempts.
- Grace-period logging + consistent auth error propagation.

### Phase 3 – Frontend Workspace Alignment  
**Status:** ⏳ Not Started  
Needs:
- `WorkspaceContext` with persistence + validation.
- Router/URL integration that respects server-selected IDs.
- LiveStore adapter updates to swap stores on switch and handle pending mutations.

### Phase 4 – Workspace Management UX  
**Status:** ⏳ Not Started  
Needs:
- Switcher UI, create/rename/delete flows, copywriting, and accessibility audit.
- Presenter stories bootstrapped with LiveStore events.
- Snackbar + dialog patterns for quota/errors.

### Phase 5 – Testing & Rollout  
**Status:** 🚧 Partially Complete  
- ✅ Backend suites (DO, notifier, webhook, orchestrator/reconciler).  
- ⏳ Frontend unit tests, Storybook stories, and E2E coverage.  
- ⏳ Operational checklist (env flags, deployment order, monitoring, incident drills).

---

## Immediate Next Steps

1. Implement `WorkspaceContext` with default selection + local persistence, then delete `EnsureStoreId` UUID fallback.  
2. Build workspace switcher + management presenters/containers, including optimistic updates and Snackbar feedback.  
3. Add RTL + Playwright coverage plus rollout checklist before enabling the UI for alpha users.
