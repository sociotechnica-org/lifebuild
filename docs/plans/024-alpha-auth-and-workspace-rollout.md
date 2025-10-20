# Alpha Auth & Workspace Readiness Plan

## Goals

- Ensure expired authentication flows log users out cleanly before the sync server rejects their events.
- Provision dedicated Work Squared stores per user, with UI affordances to create, switch, and set defaults.
- Dynamically onboard new stores into the Node.js monitoring server without manual environment tweaks.
- Ship an export/import strategy so alpha users can back up and restore their data.
- Add transactional email support for "forgot password" and onboarding notifications.

## Current State Overview

### Authentication lifecycle

- The web app keeps tokens in `localStorage` and exposes refresh/login/logout helpers via `AuthContext`, but it never inspects JWT expiry prior to reuse. `getCurrentAccessToken` simply returns the cached token with a TODO about expiry, so stale access tokens remain "valid" on the client even after the worker has rejected them.【F:packages/web/src/contexts/AuthContext.tsx†L142-L207】【F:packages/web/src/utils/auth.ts†L204-L212】
- When `useSyncPayload` cannot obtain a fresh token it silently falls back to the insecure development token, so a user can appear logged in while the sync worker discards their events for being unauthorized.【F:packages/web/src/hooks/useSyncPayload.ts†L12-L63】
- The auth worker rotates refresh tokens and reports `TOKEN_EXPIRED`, but the frontend only reacts after sync failures, creating confusing limbo states.【F:packages/auth-worker/src/handlers/auth.ts†L190-L233】

### Workspace provisioning & switching

- Durable Object persistence already records a default `instances` array for each user and exposes admin-only mutation endpoints, but there is no user-facing API or UI for creating/switching instances. The default "Personal Workspace" is generated during signup and then never surfaced in the React app.【F:packages/auth-worker/src/durable-objects/UserStore.ts†L53-L215】
- Auth tokens currently do not encode an active instance, so the frontend cannot detect which store to join or maintain per-device defaults.【F:packages/auth-worker/src/utils/jwt.ts†L32-L81】

### Server store monitoring

- The Node.js agent server reads a static `STORE_IDS` list once at boot. Any new store requires an environment change and restart before it will be monitored.【F:packages/server/src/config/stores.ts†L11-L117】【F:packages/server/src/index.ts†L18-L61】

### Backup & restore readiness

- ADR-003 proposes Cloudflare R2 snapshots every six hours, but there is no production implementation or UI entry point to trigger exports/restores yet.【F:docs/adrs/003-backup-storage-strategy.md†L1-L142】

### Email capabilities

- Account creation currently triggers only an optional Discord webhook; there is no SMTP/API integration for password resets or signup confirmations.【F:packages/auth-worker/src/handlers/auth.ts†L120-L180】

## Proposed Plan

### Phase 1 – Session reliability & auto-logout

1. Decode stored access tokens client-side to observe `exp`, proactively refreshing a few minutes before expiry, and fall back to logging out when refresh fails.
2. Extend `AuthContext` to broadcast a forced logout event (clearing React state and storage) whenever refresh fails or `TOKEN_EXPIRED` arrives, and ensure UI redirects to login.
3. Remove the `DEV_AUTH.INSECURE_TOKEN` fallback in production builds; gate it behind `import.meta.env.DEV` so expired tokens cannot masquerade as valid sessions.
4. Instrument sync retry outcomes so we can alert when refresh loops exceed thresholds.

### Phase 2 – Workspace creation & switching

1. Add authenticated endpoints on the auth worker that let end users create, rename, switch, and set default instances (wrapping `handleUpdateUserStoreIds` internally instead of exposing admin routes).
2. Embed the active `instanceId` (and perhaps `isDefault`) inside the access token payload or return it alongside tokens so the frontend knows which store to open by default.
3. Build a workspace switcher UI in the React shell that lists `user.instances`, allows marking a default, and triggers a LiveStore reconnect when the selection changes.
4. Persist the last-selected instance per device (e.g., `localStorage`) while honoring server-side defaults for new sessions.

### Phase 3 – Dynamic store orchestration

1. Publish store lifecycle events (create/remove) from the auth worker to a lightweight queue or webhook that the Node.js server can consume.
2. Teach `StoreManager` to reconcile against this event stream or poll an auth-worker endpoint, adding and removing stores at runtime instead of relying on `STORE_IDS`.
3. Guard against runaway store creation by enforcing per-user quotas in the Durable Object and logging suspicious spikes.

### Phase 4 – Backup, export & restore

1. Implement the Cloudflare R2 backup service described in ADR-003, wiring it into a scheduled worker/cron and exposing status metrics.
2. Provide a "Download Workspace" action in the UI that triggers an on-demand export (compressed SQLite snapshot plus metadata) and emails the user a secure link.
3. Create an authenticated import endpoint that validates uploaded snapshots, pauses event ingestion, restores the databases, and resumes sync with clear progress feedback.
4. Document disaster-recovery runbooks and add automated restore smoke tests to staging.

### Phase 5 – Email flows

1. Integrate with a transactional provider (e.g., Resend, Postmark) via the auth worker for outbound email.
2. Add a password-reset flow: generate time-limited signed tokens, store them in Durable Object state, and build UI to request/reset passwords via email.
3. Send signup confirmations and workspace provisioning receipts, reusing the email service with templated content.
4. Capture delivery metrics and bounce handling to maintain sender reputation.

## Risks & Open Questions

- **Token payload changes:** Embedding instance metadata increases JWT size; confirm Cloudflare Workers request limits and update signature validation everywhere.
- **Store sprawl:** Dynamic provisioning needs lifecycle policies (archival, deletion) to keep storage costs predictable.
- **Backup consistency:** Ensure exports quiesce writes or leverage SQLite backup APIs to avoid corrupt snapshots while sync traffic continues.
- **Email compliance:** Selecting a provider requires verifying domain ownership and handling unsubscribe preferences even for operational emails.

## Success Metrics

- 0 unresolved `TOKEN_EXPIRED` errors in Sentry over a rolling 7-day period during alpha.
- Workspace switcher adoption: ≥80% of multi-instance users successfully create a secondary workspace without support intervention.
- Mean time to onboard a new store into monitoring drops from “manual ENV change” to <1 minute automated propagation.
- Backup jobs succeed ≥99% of the time, and restore drills complete in <15 minutes.
- Password reset emails deliver in <2 minutes, with <1% bounce rate.
