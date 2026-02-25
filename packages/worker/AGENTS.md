# AGENTS.md (packages/worker)

Scope: `packages/worker/**`

Primary reference: `packages/worker/README.md`

## Commands

```bash
pnpm --filter @lifebuild/worker run dev
pnpm --filter @lifebuild/worker run test
pnpm --filter @lifebuild/worker run deploy
```

## Runtime Constraints

- Root route `404` on port `8787` is expected; worker serves upgrade/API routes.
- Preserve Durable Object + WebSocket sync behavior when changing request routing.
- Preserve fallback behavior when SharedWorker/multi-tab paths are unavailable.
- Keep cross-tab coordination guarantees (including WebLock-related behavior in integrations).

## Error Handling Rules

- Worker errors do not automatically reach main-thread handlers.
- Initialize telemetry/error capture in worker context or forward errors explicitly.
- Do not assume React Error Boundaries will catch worker defects.

## Related Docs

- `docs/architecture.md`
- `docs/testing-guide.md`
- `packages/worker/README.md`
