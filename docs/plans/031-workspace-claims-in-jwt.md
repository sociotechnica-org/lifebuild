# Workspace Claims in JWT

## Overview

**Goal**  
Eliminate per-connection calls from the sync worker to the Auth Worker Durable Object by embedding authoritative workspace claims directly inside the JWT that clients present to LiveStore. Connections should validate ownership locally, and tokens need to be refreshable whenever membership changes.

**Status**: Proposed 🔄  
**Priority**: High – required to keep Durable Object usage within free tier and reduce auth-worker latency/variance.

---

## Current Pain

- Sync worker validates every WebSocket connection by calling `GET /internal/users/:userId/instances` inside the Auth Worker Durable Object.
- Even with the short-term cache bump (15 min positive TTL, 60 s negative re-check), peak usage still scales with reconnect storms and multi-tab usage.
- Durable Object “duration” usage spikes trigger daily quota alerts and risk worker throttling. Render server incidents arise when the Auth Worker becomes overloaded.
- Membership updates (role changes, invitations) already flow through the Auth Worker; we can issue new tokens at that moment instead of forcing the sync worker to discover changes.

---

## Desired Outcomes

1. **Zero per-connection Durable Object lookups.** Sync worker validates JWT signature and scoped workspace claims locally.
2. **Revocation latency ≤ 1 minute.** Removing a user from a workspace should invalidate their cached token within ~60 seconds via refresh or forced logout.
3. **Minimal token size increase.** JWT payload includes only the necessary workspace identifiers and metadata.
4. **Backward-compatible rollout.** Clients using existing tokens should keep working until new auth endpoints roll out.

---

## High-Level Design

### Claims Format

Embed a `workspaces` claim in the JWT payload:

```json
{
  "userId": "usr_123",
  "email": "demo@example.com",
  "defaultInstanceId": "ws_default",
  "workspaces": [
    { "id": "ws_default", "role": "owner", "rev": 5, "exp": 1731465600 },
    { "id": "ws_shared", "role": "member", "rev": 2, "exp": 1731465600 }
  ],
  "workspaceClaimsIssuedAt": 1731462000,
  "iat": 1731462000,
  "exp": 1731548400
}
```

- `rev` (optional) increments whenever membership changes so the sync worker can detect stale claims even before token expiry.
- `exp` per workspace (optional) can enforce shorter lifetimes than the JWT itself if needed.

### Token Issuance

- Auth Worker issues JWTs during login and on `refreshUser()` calls (`packages/web/src/contexts/AuthContext.tsx`).
- Membership mutations (invite, accept, revoke, remove, role change) trigger `workspaceClaimsRev` increments and optionally force token refresh for affected users via:
  - Web push (Service Worker message or SSE),
  - LiveStore event targeted at the user,
  - Or simply by expiring the current token (set short `exp`).

### Sync Worker Validation

- `validateSyncPayload` checks `payload.instanceId`.
- Instead of calling Auth Worker, it verifies:
  - JWT signature & grace period (unchanged).
  - Payload contains `workspaces` array and a matching entry for `payload.instanceId`.
  - `rev` is ≥ server-known minimum (optional; see “Revocation” below).
- Workspace mismatch errors return `FORBIDDEN`.

### Revocation & Rotation

Two complementary strategies:

1. **Short JWT lifetimes (e.g., 15 minutes) + silent refresh.**
   - Client refreshes token via Auth Worker before expiry.
   - Workspace removal takes effect at next refresh (≤15 min).
2. **Versioned revocation map.**
   - Auth Worker maintains `workspaceClaimsVersion[userId]`.
   - Sync worker stores `latestVersion` in memory (populated via occasional background fetches or signed metadata in the token).
   - Upon mismatch, sync worker rejects token and client must refresh.

We can start with option 1 (simpler) and add versioning later if needed.

---

## Implementation Plan

Because we have no active production sessions, we can ship this as a single PR with a hard cut-over. The PR will:

1. **Extend shared auth schema and types**
   - Update `packages/shared/src/auth/types.ts` with the new JWT payload shape: `workspaces` array and `workspaceClaimsVersion`.
   - Add helpers for serializing/deserializing claims and validating payload size.

2. **Auth Worker updates**
   - `packages/auth-worker/src/durable-objects/UserStore.ts`: maintain a per-user `workspaceClaimsVersion` counter (increment on any membership mutation) and persist it alongside user data.
   - Provision a dedicated Cloudflare KV namespace (e.g., `WORKSPACE_CLAIMS_VERSION`) and push the latest version there after each mutation for low-latency reads (key: `workspace-claims-version:${userId}`). Update `wrangler.toml` and `.dev.vars`/deployment docs to bind this namespace to both the Auth Worker and Sync Worker.
   - `packages/auth-worker/src/handlers/auth.ts`: when issuing JWTs (login/refresh), embed `workspaces` (id + role + optional `rev`) and `workspaceClaimsVersion`. Remove the old endpoints used by the sync worker (`/internal/users/:userId/instances`).
   - Provide an authenticated endpoint (used by the frontend) to force-refresh tokens after receiving a `FORBIDDEN` error.

3. **Frontend updates**
   - `packages/web/src/contexts/AuthContext.tsx` and related utils: expect the new JWT structure, surface `workspaces` + `workspaceClaimsVersion`, and trigger a refresh cycle every 10–12 minutes (before expiry). On `FORBIDDEN` responses from the sync worker, log out and re-initiate login.

4. **Sync worker updates**
   - Replace `verifyWorkspaceOwnership` in `packages/worker/functions/_worker.ts` with JWT-claim validation that never calls the Auth Worker.
   - Bind the same `WORKSPACE_CLAIMS_VERSION` KV namespace in `wrangler.toml` and add a lightweight cache of values fetched from KV so tokens with stale versions are rejected immediately.
   - Remove all code paths that fetched `/internal/users/:userId/instances` and delete related config/env docs.

5. **Observability**
   - Emit Sentry breadcrumbs/tags when tokens are rejected due to missing claims, stale versions, or oversize payloads.
   - Log claim payload sizes to watch for users approaching header limits.

6. **Docs and runbooks**
   - Update `docs/architecture.md`, package READMEs, and ops runbooks to describe the new flow.

7. **Infrastructure & deployment**
   - Provision the Cloudflare KV namespace in each environment (`wrangler kv:namespace create WORKSPACE_CLAIMS_VERSION --preview`) and wire bindings into both the Auth Worker and Sync Worker `wrangler.toml` files.
   - Store namespace IDs/preview IDs in Conductor/infra configs so deployments remain reproducible.
   - Document the provisioning commands in `docs/deployment.md` and ensure `pnpm install` steps don’t try to create namespaces automatically.

**Testing / Validation**

- Unit tests for new shared types, version bump logic, and sync worker validators.
- Integration tests that:
  - Issue a token, connect to LiveStore, and confirm no network call happens during validation.
  - Remove a user and ensure the next connection is rejected until the token is refreshed.
- Manual test: simulate 100 concurrent reconnects to confirm the Auth Worker sees zero validation requests.

## Risks & Mitigations

| Risk                                                                 | Impact                                          | Mitigation                                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Token size grows beyond header limits for users with many workspaces | Failed logins or sync connects                  | Store only workspace IDs + role (short strings). Log claim sizes; consider chunking or secondary fetch if someone exceeds ~4 KB. |
| Version map out-of-sync (KV write fails)                             | Revocations delayed                             | Retry KV writes with backoff, emit Sentry errors, and fall back to forcing JWT expiration if KV is unavailable.                  |
| Token issued without incremented version                             | Revoked users keep access                       | Centralize membership mutations through helpers that always bump version + write KV; add test coverage + Sentry assertions.      |
| KV read failures in sync worker                                      | Users blocked or allowed when they shouldn’t be | Cache last known version and treat KV failure as “stale” (force refresh) while logging and alerting.                             |
| Client refresh loop bugs                                             | Users stuck refreshing                          | Provide explicit error codes so AuthContext can differentiate “stale version” from other failures and show actionable UI.        |

## Deliverables

- Single PR implementing the schema, Auth Worker, frontend, and sync worker changes.
- Updated docs and observability dashboards.
- Migration/runbook describing the hard cut-over (invalidate existing tokens, redeploy worker + auth + web).

## Decisions / Clarifications

1. **Workspace name in JWT?** No; omit to keep tokens small. Clients still fetch names via existing APIs.
2. **Additional scopes/permissions?** Not needed yet—`owner/admin/member` is sufficient.
3. **JWT size limits?** Target <4 KB payloads (browser header limit ≈8 KB). Log claim sizes to monitor growth.
4. **Invite support?** Not yet planned—users will log out/in after role changes until an invite flow exists.
