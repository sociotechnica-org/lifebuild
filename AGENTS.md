# AGENTS.md

Repository-wide agent instructions for LifeBuild.

Use this file for high-signal, cross-cutting rules. Use scoped AGENTS files in subdirectories for domain-specific guidance.

## Critical Before Push

Run these before pushing code:

```bash
pnpm lint-all
pnpm test
CI=true pnpm test:e2e
```

Notes:

- Pre-push hook runs `pnpm format:check`.
- If formatting fails, run `pnpm lint-all`.

## Daily Commands

```bash
# Dev
pnpm dev
PORT=3000 VITE_LIVESTORE_SYNC_URL='http://localhost:8787' pnpm dev

# Quality / tests
pnpm lint-all
pnpm test
pnpm test:e2e
CI=true pnpm test:e2e

# Build
pnpm --filter @lifebuild/web build
```

## Architecture Snapshot

- LiveStore event-sourced state with SQLite materialized views.
- Web app: React 19 + TypeScript (`packages/web`), deployed to Cloudflare Pages.
- Sync backend: Cloudflare Worker + Durable Objects (`packages/worker`).
- Auth backend: Cloudflare Worker (`packages/auth-worker`).
- Agentic backend: Node.js server (`packages/server`).
- Client persistence and multi-tab: OPFS + SharedWorker.

## Key Paths

- Events: `packages/shared/src/events.ts`
- Schema/materializers: `packages/shared/src/schema.ts`
- Queries: `packages/shared/src/queries.ts`
- Sync worker entry: `packages/worker/functions/_worker.ts`
- Server entry: `packages/server/src/index.ts`
- Server instrumentation: `packages/server/src/instrument.ts`

## Critical Gotchas

- Worker errors do not automatically propagate to main thread; bridge explicitly.
- React Error Boundaries do not catch all worker/defect paths by default.
- LiveStore adapter instances must be memoized (`useMemo`) to avoid reconnect loops.
- Use `networkStatus.disconnectedSince` for offline-duration calculations.
- Serialize `Date` values to ISO strings in API responses.

## Context Library Workflow

When touching product concepts (rooms, agents, capabilities, systems, primitives):

- Search cards in `docs/context-library/` first.
- For complex work, run Conan: `.claude/agents/conan.md`.
- Apply the 5-signal uncertainty protocol: `.claude/agents/sam.md`.
- After structural library changes, run Conan Downstream Sync (Job 9).

Quick lookup:

- Find cards: `docs/context-library/**/[Type] - [Name].md`
- Search topic: `rg <term> docs/context-library`
- Check gaps: `docs/context-library/learnings/`

## Workflow Rules

- Use feature branches; do not commit directly to `main`.
- All MAKE/PATCH station items require a PR.
- Include `Closes #<issue>` when applicable.
- Add a `## Changelog` section for user-facing changes.
- Move issue status to `In Progress` when starting and `In Review` when PR is open.
- Keep PRs small and focused.
- No time estimates.
- Bug fixes: write a failing test first.
- Ask before running `gh pr merge`.
- Create Storybook stories for UI components (details in `packages/web/AGENTS.md`).

## Scoped AGENTS Files

Use these for deeper guidance:

- `packages/server/AGENTS.md` for server/store-manager/effect patterns.
- `packages/web/AGENTS.md` for React, LiveStore UI, Storybook patterns.
- `packages/worker/AGENTS.md` for worker runtime/sync constraints.
- `deploy/AGENTS.md` for deployment/runbook operations.

## Documentation Index

- Architecture: `docs/architecture.md`
- Deployment: `docs/deployment.md`
- Testing strategy: `docs/testing-guide.md`
- ADRs: `docs/adrs/`
- Context library: `docs/context-library/README.md`
- Runbooks: `docs/runbooks/`
- Agent system: `.claude/agents/README.md`
- Project board protocol: `.claude/skills/george/board-fields.md`
- LiveStore patterns: `https://docs.livestore.dev/llms.txt`

## Services (Local Dev)

| Service     | Command           | Port  |
| ----------- | ----------------- | ----- |
| Web (Vite)  | `pnpm dev:web`    | 60001 |
| Sync Worker | `pnpm dev:worker` | 8787  |
| Auth Worker | `pnpm dev:auth`   | 8788  |
| Server      | `pnpm dev:server` | 3003  |
| Storybook   | `pnpm storybook`  | 6010  |

Environment setup and package-specific bootstrapping live in package READMEs.
