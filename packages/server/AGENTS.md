# AGENTS.md (packages/server)

Scope: `packages/server/**`

Primary reference: `packages/server/README.md`

## Commands

```bash
pnpm --filter @lifebuild/server run dev
pnpm --filter @lifebuild/server run test
pnpm --filter @lifebuild/server run test:fullstack
```

## Implementation Invariants

- `StoreManager.ensureMonitored` must be idempotent.
- Use `networkStatus.disconnectedSince` for offline-duration logic.
- On reconnection/new LiveStore instance, reset monitoring state before resubscribing.
- Interrupt monitoring fibers before replacing stores or shutting down.
- Convert `Date` values to ISO strings in API responses.
- `StoreManager.shutdown()` must clear intervals/timeouts and terminate child processes via `SIGTERM`, then `SIGKILL` on timeout.
- Keep `EventProcessor` and `WorkspaceOrchestrator` wired through `StoreManager`.
- Preserve instrumentation order: `instrument.ts` must run before app module imports.

## Effect-TS Patterns

Prefer existing patterns used in this package:

- `Effect.gen`, `Effect.withSpan`, `Effect.runFork`
- `Layer` for dependency composition
- `Stream` for reactive flows
- `Scope`, `Deferred`, `SubscriptionRef` for lifecycle/state coordination
- `Effect.tapCauseLogPretty` for defect visibility

## Testing Notes

- Use `spawn`, not `exec`, for process-based integration tests.
- Confirm readiness with port checks before test actions.
- Always clean up child processes and temp directories in `finally`.
- For deterministic LLM tests, use stub provider env vars (`LLM_PROVIDER=stub`, `LLM_STUB_*`).
- Polyfill `globalThis.WebSocket` with `ws` when needed in Node.

## Related Docs

- `docs/testing-guide.md`
- `docs/architecture.md`
- `docs/runbooks/workspace-orchestration.md`
