# Session Reliability & Auto-Logout

## Mission

Keep sessions trustworthy by refreshing JWTs before they expire, removing insecure fallbacks, and making auth failures obvious so users never work in a “logged-in but rejected” state.

## Current Pain

- `getCurrentAccessToken` never inspects JWT expiry, so tabs reuse expired tokens until the worker rejects them.
- `AuthContext` only refreshes after sync errors, leading to dropped events and confusing reconnection loops.
- `useSyncPayload` falls back to the legacy dev token, masking real auth failures in production builds.
- Tabs refresh independently, causing refresh-token races and duplicate network calls.
- No user-facing signal when auth fails; the app keeps rendering while events are discarded.

## North Star

1. Decode stored access tokens, refresh two minutes before expiry, and log out immediately when refresh fails.
2. Treat dev and prod the same—no insecure tokens, no silent fallbacks.
3. Coordinate refresh across tabs so only one network call is made.
4. Surface auth failures in UI so users know why they were disconnected.

## Approach

### 1. Token Introspection & Refresh Buffer

- Add a safe, dependency-free JWT decode helper.
- Store a 120-second buffer constant and reuse it across the app.
- Update `getCurrentAccessToken` to trigger `refreshAccessToken` when the buffer window is reached.
- Expose expiry helpers (`getAccessTokenExpiry`, `isAccessTokenExpiringSoon`) for tests and scheduling.

### 2. Auth Context Orchestration

- Keep tokens in state and schedule a single `setTimeout` per login based on `exp - buffer`.
- Reset timers on login, logout, manual refresh, `visibilitychange`, and `online` events.
- On refresh failure, clear local state and trigger the shared logout flow.
- Base `isAuthenticated` off in-memory tokens to avoid lagging behind storage.

### 3. Cross-Tab Coordination

- Use a lightweight `localStorage` lock (`work-squared-refresh-lock`) with expiry so only one tab refreshes at a time.
- If a tab can’t acquire the lock, wait briefly and reuse the updated token from storage.

### 4. Sync Payload Hardening & UX Hook

- Remove the insecure dev token fallback entirely.
- Require a real token every time `useSyncPayload` runs; otherwise attach `authError` metadata so UI layers can show a banner/toast and force reconnect after logout.

### 5. Observability & Tests

- Unit tests for token decode, buffer logic, and refresh flow.
- Hook-level tests to verify sync payload behaviour in auth/no-auth paths.
- Extend Playwright coverage to (a) keep a session alive across expiry and (b) verify logout on refresh failure.
- Add Sentry breadcrumbs around refresh attempts in follow-up work.

## Execution Steps

1. Ship the JWT helper + buffer constant and update `getCurrentAccessToken`.
2. Refactor `AuthContext` with timed refresh, event listeners, and stricter logout handling.
3. Implement refresh locking and storage cleanup for multi-tab support.
4. Rewrite `useSyncPayload` to reject insecure tokens and return actionable errors.
5. Add unit tests and update existing integration specs to cover the new flow.
6. Wire a global auth failure banner (separate UI story) and expand Playwright coverage.

## Definition of Done

- Access tokens refresh at least two minutes before expiry without user interaction.
- All tabs stay in sync without double-refreshing or falling back to insecure tokens.
- Users are redirected or notified as soon as refresh fails; no silent limbo states.
- `pnpm lint-all`, `pnpm test`, and targeted Playwright specs pass locally.
- Sentry shows breadcrumbs for refresh attempts/failures (tracked as follow-up if not in first pass).
