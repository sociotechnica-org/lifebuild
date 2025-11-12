# Alpha Auth & Workspace Rollout

## Mission

Deliver a reliable authentication experience and multi-workspace features for alpha customers while safeguarding data and preparing for scale.

## Target Outcomes

- Sessions stay valid or log out promptly with clear messaging; no silent sync failures.
- Users can recover accounts via email flows.
- Teams can switch and manage workspaces confidently.
- Customer data can be exported and restored during incidents.
- Provisioning new workspaces can be automated once core UX is stable.

## Workstreams

### 1. Session Reliability & Auto-Logout (`025-session-reliability`)

**Status:** ✅ Complete (merged October 2025)  
**Evidence:** `packages/web/src/utils/auth.ts`, `packages/web/src/contexts/AuthContext.tsx`, `packages/web/src/hooks/useSyncPayload.ts`, PRs #269 and #274 logged in plan 025.

- Shipped: proactive refresh buffer, cross-tab locking, shared logout handling, hardened sync payload, and AuthStatusBanner UI with unit coverage.
- Outstanding: Sentry breadcrumbs/metrics around refresh attempts remain open follow-up (see plan 025 “Future Enhancements”).

### 2. Email and Password Reset (`026-email-and-password-reset`)

**Status:** ⏳ Not Started  
No password reset endpoints, email templates, or UI flows exist yet in the repo. Auth worker only exposes login/signup/refresh/logout, and there is no mail provider integration.

### 3. Workspace Management (`027-workspace-management`)

**Status:** 🚧 In Progress  
- Shipped backend: Auth worker CRUD routes (`packages/auth-worker/src/index.ts`), Durable Object helpers + tests, `defaultInstanceId` in auth responses, workspace webhook notifier, and sync worker enforcement (`packages/worker/functions/_worker.ts`).  
- Outstanding frontend: no `WorkspaceContext`, switcher UI, or LiveStore bootstrapping; `EnsureStoreId` still fabricates UUIDs. Need optimistic membership flows, local persistence, and Storybook/reporting coverage.  
- Next: implement container/presenter workspace components, wire Auth/Workspace contexts, add toast messaging, and write RTL + Playwright coverage.

### 4. Backup and Restore (`029-backup-and-restore`)

**Status:** ⏳ Not Started  
Render cron entry (`packages/server/render.yaml`) is still a placeholder, and there is no R2 integration nor snapshot tooling. ADR-003 defines strategy but no code exists.

### 5. Dynamic Store Orchestration (`028-dynamic-store-orchestration`)

**Status:** ✅ Substantially Complete  
- Shipped orchestrator + reconciler services, webhook ingestion, auth-worker notifier, and `/health` / `/stores` reporting (`packages/server/src/index.ts`, `packages/server/src/services/workspace-orchestrator.ts`, `packages/auth-worker/src/workspace-notifier.ts`).  
- Outstanding polish: manual reconcile trigger/CLI, production runbooks, and expanded SLO dashboards still need to be documented (see plan 028 follow-ups).

## Sequencing

1. Complete workstream 1 (session reliability) before starting email or workspace features.
2. Begin workstream 2 (email + password reset) as soon as session reliability code is in review.
3. Start workstream 3 (workspace management) after email flows are stable.
4. Run workstream 4 (backup & restore) in parallel with workstream 2 once session fixes land.
5. Tackle workstream 5 (dynamic orchestration) after workspace management reaches beta.

## Parallelization

- Backup & restore tasks can run alongside email work once session reliability is merged.
- Orchestration work can prepare infrastructure while workspace UI is finishing, but final integration waits for workspace launch.
- Monitoring and SLO instrumentation should be added incrementally within each workstream.

## Definition of Done

- All authentication requests succeed or fail with clear UI and Sentry breadcrumbs.
- Email flows pass staging smoke tests and have rate limiting in place.
- Workspace switching and membership changes sync correctly across tabs and sessions.
- Nightly backups succeed for two consecutive weeks with restore drills documented.
- Automated provisioning showcases a new workspace from signup to first login in staging.

## Operational Checklist

- `pnpm lint-all`, `pnpm test`, and `CI=true pnpm test:e2e` green before every merge.
- Sentry dashboards for auth failures, email throughput, and backup status.
- Feature flags or config toggles documented for rollout/rollback.
