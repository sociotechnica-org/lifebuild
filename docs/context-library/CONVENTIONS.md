# LifeBuild Codebase Conventions

This document captures patterns, conventions, and gotchas for working in the LifeBuild codebase. If you're writing code here — human or AI — follow these.

**Last updated:** 2026-02-10
**Maintainer:** Human librarian reviews and approves changes

---

## Code Style

### Naming

- Components: `PascalCase` (e.g., `CategoryCard`, `TableSlot`, `SortableProjectCard`)
- Component files: `PascalCase.tsx` (e.g., `RoomLayout.tsx`, `DraftingRoom.tsx`)
- Hook files: `camelCase.ts` with `use` prefix (e.g., `useChorusNavigation.ts`, `useTableState.ts`)
- Utility files: `kebab-case.ts` (e.g., `livestore-compat.ts`, `navigation.ts`)
- Shared type files: `kebab-case.ts` in `types/` (e.g., `planning.ts`)
- Functions: `camelCase` (e.g., `resolveLifecycleState`, `getCategoryInfo`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `TASK_STATUSES`, `DEFAULT_MODEL`)
- Events: `camelCase` verbs (e.g., `projectCreated`, `chatMessageSent`, `taskStatusUpdated`)
- Room IDs: `kebab-case` for static rooms, `type:id` for dynamic (e.g., `life-map`, `category:health`, `project:abc123`)

### File Organization

```
packages/
├── shared/src/           # Shared across all packages
│   ├── livestore/
│   │   ├── events.ts     # Event definitions (write model)
│   │   └── schema.ts     # Tables + materializers (read model)
│   ├── types/
│   │   └── planning.ts   # Project lifecycle state machine
│   ├── constants.ts      # Task statuses, categories
│   ├── rooms.ts          # Room + agent definitions
│   ├── models.ts         # LLM model definitions
│   └── queries.ts        # Database query definitions
├── web/src/              # React frontend (Cloudflare Pages)
│   ├── components/       # React components by domain
│   │   ├── layout/       # Shell, nav, TableBar, RoomLayout
│   │   ├── life-map/     # CategoryCard, LifeMap
│   │   ├── drafting-room/ # Stage forms, wizard, queue cards
│   │   ├── sorting-room/ # Stream panels, drag-to-table
│   │   ├── room-chat/    # Chat panel, input, message list
│   │   ├── projects/     # ProjectCard, ProjectDetailPage
│   │   └── ui/           # Reusable primitives
│   ├── hooks/            # Custom React hooks
│   ├── constants/        # Routes, config
│   └── utils/            # Pure utility functions
├── server/src/           # Node.js agentic server
│   ├── services/
│   │   ├── agentic-loop/ # LLM provider abstraction
│   │   ├── store-manager.ts
│   │   ├── event-processor.ts
│   │   └── workspace-orchestrator.ts
│   └── utils/            # Logger, telemetry
├── worker/               # Cloudflare Worker (WebSocket sync)
├── auth-worker/          # Cloudflare Worker (authentication)
└── posthog-worker/       # Cloudflare Worker (analytics proxy)
```

### Patterns We Use

- **Event sourcing via LiveStore** — All state changes are events. Events are synced. Tables are materialized views. See `events.ts` for write model, `schema.ts` for read model.
- **Room-scoped agents** — Each screen pairs with an agent via `RoomLayout`. Agent definitions live in `rooms.ts`. Chat toggles via `usePersistentChatToggle` (localStorage).
- **CHORUS_TAG for agent navigation** — Agents emit `<CHORUS_TAG path="type:id">text</CHORUS_TAG>` in chat. `useChorusNavigation` handles clicks via document-level event delegation. Never generate URLs in agent responses.
- **`projectLifecycleState` as single source of truth** — All project lifecycle data is a flat JSON object in one column. No nested `planningData` (legacy format handled by parser). Always use `resolveLifecycleState()` to read.
- **Static room definitions + dynamic project rooms** — Three static rooms (Life Map, Drafting Room, Sorting Room) and 8 category rooms are defined at module level. Project rooms are created dynamically via `createProjectRoomDefinition()`.
- **`preserveStoreIdInUrl()`** — All programmatic navigation wraps URLs in this to maintain LiveStore sync identity across route changes.
- **Storybook stories with real LiveStore events** — Stories use `LiveStoreProvider` with `makeInMemoryAdapter` and `boot` functions that commit real events. No mock data.

### Patterns We Avoid

- **Direct SQL writes** — Never write to SQLite directly; always emit LiveStore events.
- **URL generation in agent prompts** — Agents must use CHORUS_TAG, never markdown links or URLs.
- **Nested lifecycle state** — The old `planningData` nesting is deprecated. Keep `ProjectLifecycleState` flat.
- **Dynamic columns for kanban** — Legacy `columnCreated`/`columnRenamed` events exist but are deprecated. Use `TASK_STATUSES` (`todo`, `doing`, `in_review`, `done`).

---

## Architecture Decisions

| Convention | Rationale |
| --- | --- |
| LiveStore event sourcing | Enables real-time sync across clients via WebSocket + Durable Objects. Events are the canonical data model; tables are derived views. |
| Room = Screen + Agent | Every navigable screen has a paired AI agent. The `RoomLayout` wrapper provides this coupling. Keeps agent context scoped to what the Director sees. |
| Flat lifecycle state JSON | Single `projectLifecycleState` column avoids dual-source bugs between separate `attributes` and `status` fields. All planning data lives together. |
| CHORUS_TAG over URLs | Agents don't know URLs. CHORUS_TAG decouples navigation from routing implementation. `useChorusNavigation` resolves paths at click time. |
| SharedWorker + OPFS | Client-side persistence via Origin Private File System. SharedWorker coordinates across tabs. Fallback to single-tab mode when SharedWorker unavailable. |
| Three-stream model | Gold/Silver/Bronze streams limit active work. Only one Gold, one Silver, multiple Bronze. Enforces focus. |
| `pnpm` monorepo with workspace protocol | `@lifebuild/shared` is `workspace:*`. LiveStore packages use `catalog:` from pnpm catalog. All packages are `"type": "module"` (ESM). |

---

## Gotchas & Landmines

### LiveStore Boot Head Mismatch

**The trap:** The sync backend's "head" (latest committed event) diverges from the local event log, typically when a materializer crashes mid-sync. The app gets stuck on boot.
**The fix:** `LiveStoreBootBoundary` catches boot errors and renders a repair UI. Repair clears OPFS data via `resetPersistence: true`. Uses localStorage flag + BroadcastChannel for cross-tab coordination. Never auto-execute — requires user confirmation.

### Worker Error Isolation

**The trap:** Errors in web workers do NOT propagate to the main thread. React error boundaries and Sentry won't catch them. Effect-TS `shouldNeverHappen` defects also don't reach React.
**The fix:** Sentry must be initialized inside workers, or errors must be explicitly forwarded to the main thread.

### Adapter Instance Memoization

**The trap:** `makeWebAdapter` recreating on every render causes full LiveStore reconnections, which looks like data loss / flickering.
**The fix:** Always memoize adapter instances with `useMemo`. Same applies to context values and expensive computations in the LiveStore hot path.

### JSON null vs undefined

**The trap:** `ProjectLifecycleState` fields can be `undefined` (missing) or `null` (from JSON round-trip). `JSON.parse(JSON.stringify({ x: undefined }))` drops the key. `JSON.parse(JSON.stringify({ x: null }))` keeps `null`.
**The fix:** Always check for both: `if (value === null || value === undefined)`. The `optionalNullable()` schema helper handles this at the validation layer.

### Legacy Event Compatibility

**The trap:** Old events (`v1.ColumnCreated`, `v1.ColumnRenamed`, etc.) still flow through the system. Their materializers are no-ops but the events can't be removed without breaking existing event logs.
**The fix:** Keep legacy materializers as no-ops. Use `TASK_STATUSES` for new code. Never emit legacy column events.

### CHORUS_TAG Path vs Text

**The trap:** If an LLM generates `<CHORUS_TAG>display text</CHORUS_TAG>` instead of `<CHORUS_TAG path="type:id">display text</CHORUS_TAG>`, the path attribute contains the display text (arrows, spaces, etc.).
**The fix:** `useChorusNavigation` validates paths and warns on text-like content. Agent prompts must include explicit format instructions with examples.

### Fiber Cleanup on Reconnection

**The trap:** StoreManager monitoring fibers (networkStatus, syncState) leak if not interrupted before creating new ones during reconnect.
**The fix:** Always use `Fiber.interrupt` on old fibers before `Effect.runFork` for new ones. Reset internal monitoring state (`syncStatus`, `networkStatus`) on reconnect.

### iOS Safari Viewport

**The trap:** `100vh` doesn't account for Safari's dynamic toolbar. Content overflows or is hidden behind it.
**The fix:** Use `h-dvh` (dynamic viewport height) instead of `h-screen`. The app shell in `NewUiShell.tsx` uses this.

---

## Testing Conventions

### What to Test

- **Unit tests** for business logic: lifecycle state parsing, event processing, utility functions
- **Storybook stories** for every UI component (real LiveStore events, not mocks)
- **E2E tests** sparingly, only for vital user flows
- **Node.js integration tests** for server-side reconnect paths and event processing
- **Test-driven bug fixes** — write a failing test first, then fix

### How to Test

```bash
pnpm test                      # Unit tests (all packages)
pnpm test:e2e                  # E2E in watch mode (development)
CI=true pnpm test:e2e          # E2E in CI mode (before committing)
pnpm --filter @lifebuild/server run test:fullstack  # Full-stack integration
pnpm storybook                 # Visual component dev (port 6010)
```

### Test File Naming

- `*.test.ts` / `*.test.tsx` for unit tests (vitest)
- `*.spec.ts` for E2E tests (Playwright)
- `*.stories.tsx` for Storybook stories
- `packages/web/src/test-utils.tsx` for shared test helpers

### Full-Stack Test Patterns

- Use `LLM_PROVIDER=stub` with `LLM_STUB_RESPONSES` for deterministic LLM behavior
- `spawn` for child processes, never `exec`. `SIGTERM` first, then `SIGKILL` after timeout.
- `waitForPort()` before connecting. Clean up temp dirs in `finally`.
- Polyfill `globalThis.WebSocket` with `ws` for Node.js environments.

---

## Git Conventions

### Branch Naming

```
username/short-description
```

Examples: `jessmartin/add-feature-name`, `danversfleury/context-library-port`

### Commit Messages

```
type(scope): short description

Longer explanation if needed.

Closes #issue-number (if applicable)
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
Scopes: `web`, `server`, `shared`, `worker`, `auth`

### PR Process

1. Run `pnpm lint-all` and `pnpm test` and `CI=true pnpm test:e2e`
2. Push branch, create PR via `gh pr create`
3. Include `## Changelog` section for user-facing changes (triggers version bump)
4. Include `Closes #XXX` to auto-close linked issues
5. Address all feedback including neutral BugBot checks
6. Never merge without asking — human approves merges

---

## Environment & Setup

### Prerequisites

- Node.js (current LTS)
- pnpm (workspace-enabled)
- Wrangler CLI (for Cloudflare Workers dev)

### Local Development

```bash
pnpm install
cp packages/web/.env.example packages/web/.env
cp packages/worker/.dev.vars.example packages/worker/.dev.vars
cp packages/auth-worker/.dev.vars.example packages/auth-worker/.dev.vars
cp packages/server/.env.example packages/server/.env
# Edit .env and .dev.vars files with credentials

pnpm dev          # Starts web + worker + server + auth-worker + storybook
```

### Pre-Commit Checklist

```bash
pnpm lint-all          # lint:fix + format + typecheck (ALL THREE)
pnpm test              # Unit tests
CI=true pnpm test:e2e  # E2E tests
```

`pnpm lint-all` is non-negotiable. It replaces running `lint:fix`, `format`, and `typecheck` separately.

---

## Dependencies

### Key Libraries

| Library | Purpose | Package |
| --- | --- | --- |
| LiveStore | Event-sourced state management + real-time sync | `@livestore/*` (catalog) |
| React 19 | UI framework | web |
| Effect-TS | Async operations, DI, streaming, error handling | server |
| Cloudflare Workers + Durable Objects | WebSocket sync backend | worker |
| dnd-kit | Drag-and-drop (Sorting Room table interaction) | web |
| Phosphor Icons | Icon library | web |
| Pino | Structured logging | server |
| Sentry | Error tracking | web + server |
| Vitest | Unit testing | all |
| Playwright | E2E testing | web |
| Storybook | Component development | web |
| Tailwind CSS | Styling | web |

### LLM Models

Defined in `packages/shared/src/models.ts`. Default: Claude Sonnet 4.5. All agent prompts use `DEFAULT_MODEL`.

| Model | ID | Provider |
| --- | --- | --- |
| Claude 4.5 Sonnet | `claude-sonnet-4-5-20250929` | Anthropic |
| Claude 4.5 Haiku | `claude-haiku-4-5-20251001` | Anthropic |
| GPT-5 | `gpt-5-2025-08-07` | OpenAI |
| O3 | `o3-2025-04-16` | OpenAI |

---

## Deployment

### Environments

- `development` — local (`pnpm dev`)
- `production` — Cloudflare (auto-deploy on merge to `main` via GitHub Actions)

### Deploy Targets

| Package | Platform | Command (manual) |
| --- | --- | --- |
| `@lifebuild/web` | Cloudflare Pages | `pnpm --filter @lifebuild/web run deploy` |
| `@lifebuild/worker` | Cloudflare Workers (Durable Objects) | `pnpm --filter @lifebuild/worker run deploy` |
| `@lifebuild/auth-worker` | Cloudflare Workers | `pnpm --filter @lifebuild/auth-worker run deploy` |

Normal workflow: merge to `main` and GitHub Actions handles deployment.

---

## Legacy Scaffolding

These tables and events exist in the schema but are inherited from the prior WorkSquared product. They are not actively used in LifeBuild's current experience:

- `documents` / `documentProjects` — Document management
- `contacts` / `projectContacts` — Contact management
- `recurringTasks` — Recurring task scheduling
- `workers` / `workerProjects` / `workerCategories` — Worker agent assignment (Roster Room not yet implemented)
- `columns` / `columnCreated` / `columnRenamed` / `columnDeleted` — Dynamic kanban columns (replaced by fixed `TASK_STATUSES`)

Do not build new features on top of legacy tables. They may be removed in a future cleanup.

---

## When Conventions Conflict

If you encounter a situation where:

- Existing code doesn't follow these conventions
- Two conventions seem to conflict
- A convention doesn't make sense for your case

**Don't guess.** Flag it for human review. We'd rather discuss and update conventions than accumulate inconsistency.

---

## Updating This Document

This is a living document. When you discover:

- A pattern that should be standardized — propose addition
- A gotcha that bit you — add it so others don't repeat
- A convention that's outdated — flag for review

Submit updates via PR. Human librarian approves convention changes.
