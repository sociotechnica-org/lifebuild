# AGENTS.md (packages/web)

Scope: `packages/web/**`

Primary reference: `packages/web/README.md`

## Commands

```bash
pnpm --filter @lifebuild/web run dev
pnpm --filter @lifebuild/web run test
pnpm --filter @lifebuild/web run test:e2e
pnpm --filter @lifebuild/web run build
```

## UI / LiveStore Rules

- Add Storybook stories for UI components.
- Storybook state must be created via real LiveStore events (no mock-only presenter data).
- Memoize LiveStore adapter/config references (`useMemo`) to avoid reconnect churn.
- Use `useRef` for mutable values that should not trigger re-renders.
- Keep SharedWorker fallback behavior intact for single-tab/unavailable-worker scenarios.

## Repair / Error Handling

- LiveStore repair actions are destructive; require explicit user confirmation.
- Do not auto-run `resetPersistence` on behalf of users.
- Worker-side errors must be explicitly surfaced to main-thread telemetry/UI when needed.

## Testing Guidance

- Prefer unit/integration tests for component and hook logic.
- Use E2E for critical user journeys only.
- Run CI mode for verification: `CI=true pnpm --filter @lifebuild/web run test:e2e`.

## Related Docs

- `docs/testing-guide.md`
- `docs/context-library/README.md`
- `.claude/skills/context-briefing/retrieval-profiles.md`
