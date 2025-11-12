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

## Work Breakdown

### Phase 1 – Schema & Token Updates

1. Update `packages/shared/src/auth/types.ts` with the new JWT payload interface (workspace list, versions).
2. Extend Auth Worker token issuance (`packages/auth-worker/src/handlers/auth.ts`) to hydrate the claim by querying the `UserStore` in-memory data.
3. Adjust frontend AuthContext to expect/work with the new claim (update TypeScript types, handle fallback for old tokens).
4. Add migration script to invalidate existing tokens (e.g., bump JWT signing key or enforce re-login).

**Validation:** Unit tests covering token issuance for owners, admins, invited-but-not-accepted states.

### Phase 2 – Sync Worker Validation Path

1. Modify `verifyWorkspaceOwnership` in `packages/worker/functions/_worker.ts` to:
   - Inspect JWT `workspaces` claim.
   - Ensure the target `instanceId` is present and the role is not revoked.
   - Only fall back to Auth Worker call if the claim is missing (graceful deployment).
2. Remove fetch path once >95 % of tokens include claims.
3. Add logging & Sentry breadcrumbs when tokens lack claims to track rollout progress.

**Validation:** Integration test (or unit test with mocked JWT) to assert unauthorized access is blocked without hitting the Auth Worker.

### Phase 3 – Revocation Strategy

1. Decide refresh cadence (e.g., JWT exp 15 min, refresh token 7 days).
2. For immediate revocations:
   - Auth Worker increments `workspaceClaimsVersion`.
   - Sync worker rejects tokens with stale version (needs minimal storage, maybe durable KV keyed by user).
   - Alternatively, the frontend receives a LiveStore event telling it to refresh auth.
3. Update AuthContext to refresh token when server responds with `FORBIDDEN` due to stale claims.

**Validation:** End-to-end test removing a member and ensuring they lose access within the SLA.

### Phase 4 – Cleanup & Observability

1. Remove legacy `/internal/users/:userId/instances` dependency from sync worker after rollout.
2. Document new claim format in `docs/architecture.md`, `packages/worker/README.md`, and `packages/auth-worker/README.md`.
3. Add dashboards/metrics (Sentry tags, Cloudflare logs) for:
   - Tokens missing claims,
   - Rejected due to stale version,
   - Average token refresh latency.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Token size grows beyond header limits for users with many workspaces | Failed logins or sync connects | Store only workspace IDs + role (short strings). Consider compressing or encrypting claim if >50 workspaces. |
| Revocations delayed due to longer JWT expiry | Unauthorized access persists | Use shorter JWT exp with silent refresh and/or versioned revocation map. |
| Clock skew affects per-claim expirations | Legit users get kicked | Use server-generated timestamps only; rely on `iat` rather than client clocks. |
| Mixed-token rollout causes failures | Clients without claims blocked | Keep fallback path (Auth Worker fetch) until adoption completes; log to monitor. |

---

## Deliverables

- Updated shared auth schema and token issuance pipeline.
- Sync worker validation logic relying on JWT claims.
- Revocation strategy implementation with documented SLAs.
- Observability dashboards & alerts for claim-related failures.
- Migration/runbook outlining rollout, toggles, and rollback steps.

---

## Open Questions

1. Should we include additional metadata (workspace name, permissions) in the JWT claim or fetch separately?
2. Do we need per-workspace scopes/permissions beyond role? (e.g., read-only vs. write).
3. What’s the acceptable maximum JWT size for existing clients (browser headers, WebSockets)?
4. How do we handle invite acceptance? Does the user need to re-login immediately or can we issue a provisional token with pending invitations?

Answers to these will refine the scope before implementation.

