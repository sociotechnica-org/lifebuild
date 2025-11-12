# Distributed Security Policy

## Status

Proposed

## Last Updated

2025-11-12

## Context

Work Squared relies on several distributed components to enforce workspace-level access controls:

- Auth Worker (Cloudflare Worker + Durable Object) is the source of truth for users, workspaces, and roles.
- Sync Worker (LiveStore WebSocket worker) currently validates workspace ownership by calling Auth Worker for every connection.
- Node “multi-store” server depends on `SERVER_BYPASS_TOKEN` and Auth Worker webhooks to monitor workspace stores.

This topology creates a tight coupling between runtime code paths and the Auth Worker Durable Object. When usage spikes (e.g., reconnect storms), the DO’s duration quota is consumed quickly, threatening availability. We need a security policy that keeps enforcement decentralized (so servers can operate independently) while still honoring a single source of truth and enabling rapid revocation.

## Decision

Adopt a “distributed claims + version map” policy:

1. **Authoritative issuance (Auth Worker)**
   - Auth Worker mints JWTs containing workspace membership claims (`workspaces[]`, roles, default workspace) and a per-user `workspaceClaimsVersion`.
   - On any membership change it increments the version and writes it to a globally readable store (Cloudflare KV). Durable Object storage remains the canonical record, but KV serves low-latency reads.

2. **Local enforcement (Sync Worker, Node server)**
   - Sync Worker validates JWT signature, ensures the requested workspace exists in the token, and compares `workspaceClaimsVersion` against the KV value cached in memory. No runtime fetches to the Auth Worker are required.
   - Node server relies on `SERVER_BYPASS_TOKEN` for privileged operations but does not perform per-request lookups; it trusts JWT claims when interacting with LiveStore or performing internal orchestrations.

3. **Rapid revocation**
   - Short-lived JWTs (≈15 minutes) with proactive client refresh keep tokens fresh.
   - Membership changes trigger version increments, so revoked users are blocked as soon as the sync worker observes the higher required version—even if their JWT hasn’t expired yet.

4. **Observability & governance**
   - All components emit Sentry breadcrumbs/logs for claim issuance, version bumps, and rejected connections.
   - Secrets (`SERVER_BYPASS_TOKEN`, webhook secrets) remain per-environment and are rotated via deployment tooling.

## Consequences

**Positives**
- Per-connection workspace validation no longer hits the Auth Worker Durable Object, eliminating the largest source of DO duration usage.
- Revocation is deterministic: bump version → write KV → clients with stale tokens are rejected immediately.
- Each component can continue operating even if another is degraded, as long as JWT signing keys remain trusted.
- Operational load drops because there is no need to reconcile caches or restart services after membership changes.

**Negatives / Trade-offs**
- Requires additional infrastructure (Cloudflare KV) and careful consistency handling between DO storage and KV.
- Bugs in version increment logic could allow stale tokens to persist until JWT expiry.
- Clients must implement refresh-on-rejection flows to recover gracefully when versions mismatch.

**Follow-up Actions**
- Implement the JWT claim + version map plan (Plan 031).
- Update deployment runbooks to include KV namespace provisioning and secret rotation procedures.
- Instrument dashboards to track JWT claim sizes, version skew, and rejection rates.
