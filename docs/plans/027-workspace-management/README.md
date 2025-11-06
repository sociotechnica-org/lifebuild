# Workspace Creation & Switching

## Goal

Deliver user-managed workspaces (instances) with reliable switching, creation, and authorization. The auth worker must remain the source of truth for workspace ownership, the sync worker must refuse unauthorized connections, and the frontend must select, display, and persist the active workspace without fabricating IDs.

## Current Capabilities

- **Durable Object storage:** `packages/auth-worker/src/durable-objects/UserStore.ts:53` seeds a default instance at signup and stores `User.instances[]`. Admin-only instance management already exists in `handleUpdateUserStoreIds` (`packages/auth-worker/src/durable-objects/UserStore.ts:225`).
- **Auth responses:** Login/signup/refresh return the user record (including instances) via `createAuthSuccessResponse` (`packages/auth-worker/src/handlers/auth.ts:81`), and the frontend caches it inside `AuthContext` (`packages/web/src/contexts/AuthContext.tsx:50`).
- **URL scaffolding:** `packages/web/src/util/navigation.ts` preserves `storeId` in links, and `EnsureStoreId` injects a value when missing (`packages/web/src/components/utils/EnsureStoreId.tsx`).
- **Sync worker JWT validation:** `packages/worker/functions/_worker.ts:44` verifies tokens and applies an expiry grace period, but it does not check workspace ownership or route by workspace.

## Gaps To Close

1. **No user-facing workspace API:** `packages/auth-worker/src/index.ts` only exposes admin routes; end users cannot list or manage their own instances.
2. **Missing workspace context in sessions:** Tokens (`packages/auth-worker/src/utils/jwt.ts:55`) omit workspace data, and the frontend fabricates IDs instead of respecting `user.instances`.
3. **Frontend selection UX:** There is no WorkspaceContext, switcher UI, or guard against stale IDs. `Root.tsx` (`packages/web/src/Root.tsx:52`) generates random UUIDs, and `EnsureStoreId` mirrors that behavior.
4. **Sync worker enforcement:** `validateSyncPayload` trusts `payload.instanceId`, enabling cross-tenant access if someone guesses another UUID. Connections also land on the same Durable Object regardless of workspace.
5. **User experience:** There is no UI for create/rename/default operations, no quota feedback, and no persistence of the active workspace between sessions beyond raw localStorage.

## Plan of Record

### Phase 1 – Auth Worker Contract

**Objective:** Empower authenticated users to manage workspaces through the existing auth worker while enforcing invariants in the Durable Object.

- **Durable Object helpers:** Extend `packages/auth-worker/src/durable-objects/UserStore.ts` with reusable methods to:
  - Fetch users by ID and by email (`user:id:${id}`, `user:${email}`).
  - Append instances (respecting a configurable max, default 10) and populate `name`, `createdAt`, `lastAccessedAt`.
  - Rename instances, ensuring trimmed unique names per user.
  - Toggle defaults so exactly one instance has `isDefault === true`.
  - Update `lastAccessedAt` on switch and persist via both lookup keys.
- **Workspace routes:** Add authenticated endpoints in `packages/auth-worker/src/index.ts`:
  - `GET /workspaces` → list instances.
  - `POST /workspaces` → create new instance (auto default if none).
  - `POST /workspaces/:id/rename` → rename.
  - `POST /workspaces/:id/set-default` → set default and clear others.
  - `DELETE /workspaces/:id` → remove non-default instance (with server-side safety checks).
    Reuse `verifyAdminAccess` patterns for token validation: extract the `Authorization` header, verify via existing JWT utilities, and pass the user ID to the DO helpers. Return JSON with standard CORS headers.
- **Internal verification route:** Add `GET /internal/users/:userId/instances` guarded by `SERVER_BYPASS_TOKEN` so other services can confirm ownership without re-implementing DO queries.
- **Shared types:** Update `packages/shared/src/auth/types.ts` to add `AuthErrorCode.FORBIDDEN` and, if helpful, a lightweight `AuthWorkspaceSelection` type for the default instance ID. Ensure `AuthResponse` continues to return the `instances` array and expose the server-selected default ID.
- **Auth responses:** Modify `createAuthSuccessResponse` (`packages/auth-worker/src/handlers/auth.ts:81`) to include `defaultInstanceId`, derived from the first instance with `isDefault` or the first entry as a fallback.

### Phase 2 – Sync Worker Enforcement

**Objective:** Block unauthorized workspace access and isolate connections per workspace.

- **Access validation:** Enhance `validateSyncPayload` in `packages/worker/functions/_worker.ts` to:
  - Extract the requested workspace (`payload.instanceId`).
  - Call the new auth worker internal endpoint with the bearer bypass token.
  - Reject the request with `AuthErrorCode.FORBIDDEN` if the instance is absent.
  - Cache validation results briefly (per execution context) to limit repeated fetches during rapid reconnects.
- **Durable Object routing:** Pass the validated instance ID to `SyncBackend.makeWorker` so each workspace maps to its own Durable Object (e.g., `env.STORE_INSTANCE_NAMESPACE.idFromName(instanceId)`), preventing state bleed at the infrastructure layer.
- **Configuration:** Document required env vars for deployment (`JWT_SECRET`, `SERVER_BYPASS_TOKEN`, workspace quota) and ensure defaults are sensible in development (e.g., bypass when `REQUIRE_AUTH !== 'true'`).

### Phase 3 – Frontend Workspace State

**Objective:** Centralize workspace selection and wire it into LiveStore without page reloads.

- **WorkspaceContext:** Create `packages/web/src/contexts/WorkspaceContext.tsx` that provides:
  - `workspaces: AuthInstance[]`
  - `currentWorkspaceId: string | null`
  - Actions: `switchWorkspace`, `createWorkspace`, `renameWorkspace`, `setDefaultWorkspace`, `deleteWorkspace`, `refreshWorkspaces`
    Initialize from `AuthContext.user.instances`, prefer the server-provided `defaultInstanceId`, fall back to the first instance, and persist the selection to localStorage (`work-squared-current-workspace`). Guard against stale IDs by verifying membership before accepting stored values.
- **Auth integration:** When auth responses update (login, refresh), patch `AuthContext` so WorkspaceContext re-renders with the latest `instances`. On logout, clear stored workspace state.
- **LiveStore provider:** Replace the UUID memoization in `packages/web/src/Root.tsx:52` with a wrapper that reads `currentWorkspaceId`. Key the `LiveStoreProvider` by that ID so switching remounts LiveStore bindings without forcing a full reload.
- **URL handling:** Retire the current `EnsureStoreId` logic. Instead, synchronize query parameters inside WorkspaceContext: when switching workspaces, update `?storeId=` to match the new ID; when a URL is opened with a `storeId`, validate ownership before accepting it.
- **Sync payload:** Update `packages/web/src/hooks/useSyncPayload.ts` to observe `currentWorkspaceId`, request fresh tokens as needed, and surface errors back to WorkspaceContext so the UI can reset gracefully.

### Phase 4 – Workspace UX

**Objective:** Ship intuitive UI for managing workspaces.

- **Switcher component:** Build `packages/web/src/components/workspace/WorkspaceSwitcher.tsx` that lists available workspaces, highlights the active one, displays default badges, and supports keyboard interaction. Integrate into the header via `packages/web/src/components/layout/Navigation.tsx`.
- **Management flows:** Provide create, rename, delete, and set-default affordances (modal or inline). Hook them into WorkspaceContext actions so state updates propagate throughout the app, including `AuthContext` and LiveStore (for `lastAccessedAt` updates).
- **Feedback:** Use the existing `SnackbarProvider` to communicate success and error states. Add loading indicators while workspace mutations are in flight and ensure quotas/validation errors are human-readable.
- **Storybook & accessibility:** Add presenter stories that bootstrap LiveStore with real events, and confirm the dropdown meets focus and aria guidelines.

### Phase 5 – Testing & Rollout

**Objective:** Validate the full stack and document operational steps.

- **Unit & integration tests:** Cover Durable Object helpers, auth worker routes, and sync worker validation. Reuse `packages/auth-worker/scripts/integration-test.ts` patterns to verify instance quotas and default toggling.
- **Frontend tests:** Write React Testing Library tests for WorkspaceContext (initial state, switching, stale ID handling) and the switcher component. Ensure navigation utilities keep the correct query parameter.
- **E2E coverage:** Add an end-to-end test that creates an additional workspace, switches between them, refreshes the page, and verifies data isolation (projects/tasks/events appear only in the active workspace).
- **Operational checklist:** Document required environment variables, deployment order (auth worker → sync worker → web), and monitoring (e.g., log counts of `AuthErrorCode.FORBIDDEN`).
- **Quality gates:** Run `pnpm lint-all`, `pnpm test`, and `CI=true pnpm test:e2e` prior to release.

## Deliverables

- Workspace CRUD routes and helpers in the auth worker with enforced invariants.
- Sync worker validation and per-instance routing preventing cross-tenant access.
- WorkspaceContext, updated LiveStore integration, and UI components that allow end users to manage workspaces.
- Automated test coverage (unit, integration, E2E) plus documentation for operations and monitoring.

## Membership Roles & Invitations

- **Roles:** Workspaces now support `owner`, `admin`, and `member` roles. Owners retain full control (including membership management), admins can manage settings without editing membership, and members participate without management privileges. At least one owner must always remain.
- **Invitations:** Owners can invite collaborators by email from the Settings page. Invites carry the workspace name, expire after 7 days, and are rate limited (10 sends/hour per actor). Pending invites appear to owners and invitees; owners can revoke them before acceptance.
- **Acceptance:** Authenticated users can accept invitations directly in-app. Acceptance provisions membership, updates the auth context, and unlocks LiveStore access for the workspace.
- **Audit & notifications:** All membership mutations append to the workspace audit log and flow through the webhook notifier for external monitoring.
- **UI placement:** Membership management (member list, role selector, pending invites, and invitations for the current user) lives under Settings ➝ Workspace Members.

## Dependencies & Coordination

- Ensure plan 026 (email and password reset) is complete to support account recovery.
- Coordinate with plan 028 (dynamic store orchestration) once workspace creation is user-driven.
- Align deployment sequencing so backend enforcement lands before the new UI ships.

## Risks & Mitigations

- **Unauthorized access:** Mitigate with sync worker verification, per-instance routing, and monitoring of auth worker logs for denied requests.
- **State drift between contexts:** Always update both `AuthContext` and WorkspaceContext, and invalidate cached selections when tokens refresh or instances mutate.
- **Quota abuse:** Enforce limits server-side and surface clear UI feedback; consider adding telemetry for workspace creation rates.
- **Legacy dev mode:** When `REQUIRE_AUTH` is false, continue supporting the insecure token path but hide workspace management UI behind authentication to avoid inconsistent states.

## Success Metrics

- ≥90% of authenticated sessions land in the expected default workspace (tracked via client telemetry or logs).
- 0 successful cross-user workspace connections after enforcement goes live.
- Workspace create/rename/delete APIs maintain <1% error rate outside quota violations.
- Workspace switching completes and reconnects LiveStore in <500 ms median round trip.
