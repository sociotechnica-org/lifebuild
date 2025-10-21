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

- Decode stored JWTs client-side and refresh when the access token is within 2 minutes of expiry.
- Use a single timeout scheduled from the decoded `exp`, and reschedule on login, `visibilitychange`, or `online` events.
- Remove the insecure development token path; development must authenticate just like production.
- On refresh failure, call the shared `logout()` flow so users are redirected and see why they lost access.
- Harden `useSyncPayload` so it only publishes authenticated payloads and surfaces auth errors through UI copy (banner/toast) before disconnecting.
- Tests: token decode helper, proactive refresh behaviour, multi-tab storage events, and a Playwright happy-path/expiry regression suite.

### 2. Email and Password Reset (`026-email-and-password-reset`)

- Add templated transactional emails for signup confirmation, password reset, and login alerts.
- Implement password reset flow end-to-end (request, token issuance, form, final login).
- Integrate email provider configuration for staging and production and add smoke tests.
- Guard all reset endpoints with rate limiting and audit logging.
- Tests: unit coverage on token issuance/validation, integration walkthrough in Playwright.

### 3. Workspace Management (`027-workspace-management`)

- Ship workspace switcher UI and persistence so users see the same workspace across sessions.
- Provide workspace settings page for membership, roles, and invitations.
- Ensure LiveStore bootstraps the correct workspace data after authentication and on switch.
- Add optimistic updates with rollback for membership mutations.
- Tests: unit coverage on selectors/hooks, E2E coverage for switching and invite acceptance.

### 4. Backup and Restore (`029-backup-and-restore`)

- Implement automated exports to Cloudflare R2 with environment-specific schedules.
- Provide a manual export trigger with status feedback in admin tools.
- Create restore documentation and scripts validated in staging.
- Sentry/metrics around backup runs and failures.

### 5. Dynamic Store Orchestration (`028-dynamic-store-orchestration`)

- Introduce provisioning worker that creates LiveStore instances on demand.
- Manage lifecycle events (create, suspend, delete) with durable state tracking.
- Hook into workspace creation flow once management UI is stable.
- Add synthetic monitoring to verify new stores are reachable within SLA.

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
