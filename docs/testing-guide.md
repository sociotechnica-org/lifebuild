# Testing Guide

Cross-package testing strategy for LifeBuild.

## Quality Gates

Before pushing:

```bash
pnpm lint-all
pnpm test
CI=true pnpm test:e2e
```

## Test Pyramid For This Repo

Use the least expensive test type that gives confidence:

1. Unit tests
2. Integration tests
3. Full-stack integration tests (selectively)
4. E2E tests (critical user flows only)

## When To Use Each Test Type

### Unit

Use for pure logic, reducers/materializers, small hooks, and utilities.

- Fast feedback
- Minimal dependencies
- Prefer for bugfix-first workflows

### Integration

Use for component + store/query behavior or service interactions inside one process.

- Verifies wiring between modules
- Better signal than isolated mocks for LiveStore flows

### Full-stack Integration (Server-centric)

Use when behavior depends on real worker/server process interactions.

- Spawn real processes with deterministic fixtures/stubs
- Validate reconnect and orchestration behavior end-to-end
- Keep scenarios narrow and deterministic

### E2E

Use for user-observable critical journeys only.

- Navigation + key actions + visible outcomes
- Avoid backend implementation coupling
- Keep suite small and stable

## Package-Specific Commands

```bash
# All packages
pnpm test

# Web
pnpm --filter @lifebuild/web run test
pnpm --filter @lifebuild/web run test:e2e

# Server
pnpm --filter @lifebuild/server run test
pnpm --filter @lifebuild/server run test:fullstack

# Worker
pnpm --filter @lifebuild/worker run test
```

## LiveStore Testing Patterns

- Prefer creating state via real events.
- Query the resulting materialized state rather than asserting internals.
- Keep event payloads minimal but realistic.

Example pattern:

```ts
const store = createTestStore()
await store.mutate([{ type: 'project.create', id: '1', name: 'Test', description: 'Test' }])
const projects = await store.query(db => db.table('projects').all())
```

## Full-Stack Process Management Rules

For tests that spawn worker/server:

- Use `spawn`, never `exec`.
- Wait for ports/readiness before test actions.
- Shut down with `SIGTERM`, then `SIGKILL` after timeout.
- Clean up temp directories (for example `.context/fullstack-*`) in `finally`.
- Use global timeout guards to prevent hangs.

## Stub LLM Provider (Deterministic Server Tests)

```bash
LLM_PROVIDER=stub
LLM_STUB_RESPONSES='{"defaultResponse":"stub: {{message}}","responses":[{"match":"ping","response":"pong"}]}'
LLM_STUB_FIXTURE_PATH=./fixtures/stub-responses.json
LLM_STUB_DEFAULT_RESPONSE="default stub response"
```

## Node WebSocket Polyfill Note

Some Node environments do not provide `globalThis.WebSocket`.

```ts
if (typeof globalThis.WebSocket !== 'function') {
  const { WebSocket } = await import('ws')
  ;(globalThis as any).WebSocket = WebSocket
}
```

## Storybook + UI Testing Expectations

- UI components should ship with Storybook coverage.
- Storybook examples should use real LiveStore events to construct state.
- Avoid mock-only presentations that bypass real query/state pathways.

## Logging Expectations In Tests

- Prefer structured logs for cross-process failures.
- Keep log assertions resilient; assert key fields, not full serialized messages.

## References

- `packages/server/README.md`
- `packages/web/README.md`
- `packages/worker/README.md`
- `docs/architecture.md`
