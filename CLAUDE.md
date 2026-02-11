# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Before Committing Code

**ALWAYS run lint-all and tests before committing:**

```bash
pnpm lint-all          # Runs lint, format, AND typecheck in one command
pnpm test              # Runs unit tests
CI=true pnpm test:e2e  # Runs E2E tests (required before committing)
```

`lint-all` replaces:

- `pnpm lint:fix`
- `pnpm format`
- `pnpm typecheck`

## Essential Commands

### Development

```bash
# First time setup
pnpm install
cp packages/web/.env.example packages/web/.env
cp packages/worker/.dev.vars.example packages/worker/.dev.vars
cp packages/auth-worker/.dev.vars.example packages/auth-worker/.dev.vars
cp packages/server/.env.example packages/server/.env
# Edit the respective .env and .dev.vars files with your credentials

# GitHub CLI extensions for project management
gh extension install yahsan2/gh-sub-issue  # Sub-issue management
gh auth refresh -h github.com -s project   # Add project scope to gh auth

# Start development (monorepo - runs both web and worker)
pnpm dev          # Vite + Wrangler

# Alternative ports (for multiple Claude instances)
PORT=3000 VITE_LIVESTORE_SYNC_URL='http://localhost:8787' pnpm dev
```

### Key Commands

```bash
# Quality checks (use before committing!)
pnpm lint-all      # ✅ Use this! Runs lint, format, and typecheck

# Testing
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests (watch mode for development)
CI=true pnpm test:e2e  # E2E tests in CI mode (required before committing)

# Building
pnpm --filter @lifebuild/web build    # Build web package
pnpm build         # Build all packages (if needed)

# Deployment (Separated Architecture)
pnpm --filter @lifebuild/auth-worker run deploy  # Deploy auth worker to Cloudflare
pnpm --filter @lifebuild/worker run deploy       # Deploy sync server to Cloudflare
pnpm --filter @lifebuild/web run deploy          # Deploy web app to Cloudflare Pages
```

## Architecture

LifeBuild is a real-time collaborative web application built as a monorepo with separated deployments:

- **LiveStore**: Event-sourced state management with SQLite materialized views
- **React 19** with TypeScript frontend deployed to **Cloudflare Pages** (`packages/web`)
- **Cloudflare Workers** with Durable Objects for WebSocket-based real-time sync (`packages/worker`)
- **Cloudflare Auth Worker** for user authentication (`packages/auth-worker`)
- **SharedWorker** for multi-tab synchronization
- **OPFS** for client-side persistence

### Key Files (Monorepo)

- `packages/shared/src/events.ts` - Event definitions
- `packages/shared/src/schema.ts` - Database schema & materializers
- `packages/shared/src/queries.ts` - Database queries
- `packages/worker/functions/_worker.ts` - WebSocket sync server
- `packages/web/src/` - React frontend application
- `packages/server/src/index.ts` - Node.js server entry point (agentic loop, event processing)
- `packages/server/src/instrument.ts` - Sentry instrumentation (loaded via dynamic import before app modules)
- `packages/server/src/services/store-manager.ts` - LiveStore instance lifecycle, monitoring, and reconnection
- `packages/server/src/services/event-processor.ts` - Event processing pipeline
- `packages/server/src/services/workspace-orchestrator.ts` - Workspace coordination (receives StoreManager)
- `packages/server/src/services/agentic-loop/` - LLM provider abstraction and agentic processing
- `packages/server/src/utils/logger.ts` - Structured logging with pino
- `packages/server/src/utils/orchestration-telemetry.ts` - Metrics and telemetry helpers

### Server Architecture Details

The server package (`packages/server`) has several key architectural patterns:

- **StoreManager**: Manages LiveStore instance lifecycle — initialization, adding, removing, reconnecting, and monitoring status (sync state, network status). Uses Fiber-based effects (`networkStatusFiber`, `syncStateFiber`) via `Effect.runFork` for monitoring, and `Fiber.interrupt` for cleanup during shutdown/reconnection.
- **Health Check Mechanism**: A periodic `healthCheckInterval` in StoreManager checks all managed stores, syncs internal `storeInfo.status` with observed `networkStatus`, and triggers reconnects for extended disconnects or stuck sync states.
- **Debug Endpoints**: Endpoints like `/debug/network-health` and `/debug/subscription-health` are token-gated via `isDashboardAuthorized` checking a `SERVER_BYPASS_TOKEN`.
- **Dependency Flow**: `EventProcessor` and `WorkspaceOrchestrator` receive the `StoreManager` instance during construction.
- **Sentry Integration**: `instrument.ts` is dynamically imported before all other app modules so that `dotenv.config()` runs first and Sentry's `pinoIntegration` can instrument the logger.

### Server Coding Patterns

- **Idempotent monitoring**: `ensureMonitored` must handle idempotency — never re-add stores that are already managed.
- **Offline duration**: Use `networkStatus.disconnectedSince` (not `storeInfo.lastDisconnectedAt`) for `offlineDurationMs`. The former is tied directly to the network status event.
- **Stale data on reconnection**: When a store reconnects and a new LiveStore instance is created, reset internal monitoring state (`syncStatus`, `networkStatus`) to allow fresh monitoring.
- **Fiber cleanup**: Always use `Fiber.interrupt` to stop monitoring fibers before creating new ones during reconnection or shutdown.
- **API serialization**: Convert `Date` objects to ISO strings (`toISOString()`) consistently in API responses. Handle internal-to-API type conversions explicitly (e.g., `NetworkStatusInfo` to API `NetworkStatus`).
- **Graceful shutdown**: `StoreManager.shutdown()` must clear all timeouts (health check intervals) and shut down all managed stores. Use `SIGTERM` first, then `SIGKILL` after a timeout for child processes.

### Effect-TS Patterns

The codebase uses Effect-TS extensively for async operations, side effects, and control flow:

- **Control flow**: `Effect.gen`, `Effect.withSpan`, `Effect.runFork`
- **Dependency injection**: `Layer` for composable service dependencies
- **Streaming**: `Stream` for reactive data flows
- **Concurrency**: `Deferred` for signaling, `SubscriptionRef` for observable state
- **Resource management**: `Scope` for lifecycle management of DB connections and workers
- **Error handling**: Map errors to `UnknownError` or specific LiveStore errors (`MaterializeError`, `BackendIdMismatchError`). Use `Effect.tapCauseLogPretty` for logging
- **`shouldNeverHappen`**: Used for unrecoverable internal states. Throws `Error` in dev, logs defect in production. These defects are NOT caught by React error boundaries unless explicitly propagated

### LiveStore Repair Flow

The app includes a repair mechanism for when local LiveStore data becomes inconsistent:

- **Root cause**: Boot head mismatch — the sync backend's "head" (latest committed event) diverges from the local event log, typically when a materializer crashes mid-sync
- **`resetPersistence: true`**: The adapter option that clears LiveStore's local OPFS data to resolve corruption
- **`LiveStoreBootBoundary`**: A dedicated React Error Boundary that catches LiveStore boot errors and renders a repair UI
- **One-time repair flag**: Uses `localStorage` to persist a repair flag across page reloads, ensuring repair runs once then clears
- **Cross-tab coordination**: Uses `BroadcastChannel` to coordinate repair requests across multiple tabs
- **`syncStatus` API**: `useLiveStoreConnection` hook exposes sync status for health monitoring and repair suggestions
- **User confirmation**: Repair requires explicit user confirmation — never auto-execute destructive operations

### Worker Architecture

- **SharedWorker + Web Worker**: The web adapter uses a web worker for LiveStore operations and a SharedWorker for multi-tab coordination
- **OPFS persistence**: Client-side data persists via Origin Private File System
- **Fallback design**: Adapters fall back gracefully when SharedWorker is unavailable (e.g., single-tab mode)
- **WebLock**: Used for cross-tab synchronization to prevent race conditions

### Common Gotchas

**Worker error handling:**

- Errors in web workers do NOT propagate to the main thread automatically. React error boundaries and main-thread Sentry won't catch worker errors without explicit bridging.
- Sentry must be initialized inside workers, or errors must be forwarded to the main thread.
- Effect-TS `shouldNeverHappen` defects do NOT reach React error boundaries unless explicitly forwarded.

**React performance with LiveStore:**

- Use `useMemo` for stable references to adapter configs, context values, and expensive computations.
- Adapter instances (e.g., `makeWebAdapter`) must be memoized — recreating them causes full LiveStore reconnections.
- Use `useRef` for mutable state that persists across renders without triggering re-renders (e.g., timestamps, counters).

## Documentation

- **Context Library**: [docs/context-library/README.md](docs/context-library/README.md) — Product knowledge, strategic rationale, type taxonomy. Read `reference.md` for templates and conformance rules. Open folder in Obsidian for best browsing experience.
- LiveStore patterns: https://docs.livestore.dev/llms.txt
- LifeBuild Architecture: [docs/architecture.md](docs/architecture.md)

## Context Library Retrieval

When implementing features that touch product concepts (rooms, agents, capabilities, systems, primitives, etc.), consult the Context Library for architectural alignment.

### Quick lookup
- Find a card: `Glob` for `docs/context-library/**/[Type] - [Name].md`
- Search by topic: `Grep` across `docs/context-library/`
- Check known gaps: `Grep` across `docs/context-library/learnings/`

### Full constellation (for complex tasks)
Use the **Conan subagent** (`.claude/agents/conan.md`) to assemble a context briefing before implementation. Conan reads the retrieval profiles and assembles the right cards based on what you're building.

### During implementation
Follow the **5-signal uncertainty protocol** when making decisions: if 2+ signals (reversibility, coverage, precedent, blast radius, domain specificity) say "search," check the library before proceeding. See `.claude/agents/bob.md` for the full protocol.

### Key references
- `.claude/skills/context-constellation/retrieval-profiles.md` — What cards to pull for each type
- `.claude/skills/context-constellation/traversal.md` — How to navigate the knowledge graph
- `docs/context-library/skills/constellation/protocol.md` — CONTEXT_BRIEFING.md format

## Development Workflow

### Before Starting Work

1. Review requirements thoroughly
2. Ask clarifying questions
3. **Set issue status to "In Progress"**: Update the GitHub issue status on the project board
4. Create descriptive branch with your username prefix (e.g., `jessmartin/add-feature-name`)

### While Developing

1. Follow existing code patterns
2. Write minimal, focused tests
3. Create Storybook stories for UI components

### Before Committing (CRITICAL)

```bash
pnpm lint-all  # ALWAYS run this!
pnpm test      # Run tests
CI=true pnpm test:e2e  # Run E2E tests
```

### Creating a PR

1. Write clear commit messages
2. Push your branch to GitHub
3. Create PR: `gh pr create --title "Title" --body "Description"` (or use GitHub web UI)
4. **Add a Changelog section** (optional but recommended for user-facing changes):
   - Add a `## Changelog` section with bullet points describing changes
   - PRs without a Changelog section won't trigger version bumps or changelog updates
5. **Link issues**: If the PR fixes a GitHub issue, include `Closes #XXX` in the PR description to auto-close the issue on merge
6. **Set issue status to "In Review"**: Update the GitHub issue status on the project board
7. Check for feedback: `gh pr view <number> --comments` to see reviews and comments
8. Fix any issues (including neutral BugBot feedback)

#### Changelog Entry Example

```markdown
## Changelog

- Add dark mode support for all pages
- Fix task due date not saving correctly
```

## GitHub CLI (`gh`) Commands

Use the `gh` command to interact with GitHub pull requests, issues, and checks. This is the preferred method for GitHub operations in Claude Code.

### Pull Request Commands

```bash
# View PR details
gh pr view <number>              # View PR summary
gh pr view <number> --comments   # View PR with comments and reviews
gh pr view <number> --web        # Open PR in browser

# Check PR status
gh pr status                     # View all your PRs and review requests

# List PRs
gh pr list                       # List all open PRs
gh pr list --author @me          # List your PRs
gh pr list --state merged        # List merged PRs

# Create PR
gh pr create --title "Title" --body "Description"
gh pr create --web   # Open browser to create PR with full editor
```

### Issue Commands

```bash
# List issues
gh issue list                    # List all open issues
gh issue list --limit 10         # List first 10 issues
gh issue list --assignee @me     # List issues assigned to you

# View issue details
gh issue view <number>           # View issue summary
gh issue view <number> --web     # Open issue in browser

# Create issue
gh issue create --title "Title" --body "Description"
gh issue create --assignee @me   # Create and self-assign
```

### Project Board Commands (Issue Status)

```bash
# List projects to find project number
gh project list

# View project items and their status
gh project item-list <project-number> --owner @me

# Update issue status on project board (requires item ID and field/option IDs)
# First, get the project field IDs:
gh project field-list <project-number> --owner @me

# Then update the status (use the Status field ID and appropriate option ID)
gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> --field-id <STATUS_FIELD_ID> --single-select-option-id <OPTION_ID>
```

**Common Status Workflow:**

- When picking up an issue: Set status to "In Progress"
- When creating a PR: Set status to "In Review"
- Issues auto-close on merge when PR description includes `Closes #XXX`

### Project Management

- **Parent Issues**: Only use the "Parent issue" feature for issues with type "Project". Never set a parent issue on regular issues. Only ONE level of sub-issues - sub-issues should not have their own sub-issues.
- **Sub-issues**: Use the REST API to link issues as sub-issues to Project-type issues. For smaller sub-tasks within an issue, use markdown checklists instead of creating separate issues.
- **Adding to Projects**: Use `gh project item-add <project-number> --owner sociotechnica-org --url <issue-url>`

### Common Workflows

```bash
# View PR with all comments and reviews
gh pr view 272 --comments

# Check status of all your PRs
gh pr status
```

### Notes

- PR numbers are shown in `gh pr status` or on GitHub
- Use `--web` flag to open items in browser for complex interactions

## Project Management

We use GitHub Issues and Projects for all project management across the SocioTechnica organization.

### Repository Organization

- **`lifebuild`**: Issues related to the LifeBuild app (features, bugs, technical work)
- **`company`**: Issues related to company-level activities (social media, marketing, partnerships, operations)

### Key Concepts

- **Project**: A timebound, goal-oriented unit of work. Projects start and complete (unlike Areas, which are ongoing). A Project is represented as a GitHub Issue with type "Project".
- **Sub-issues**: Issues that belong to a Project are linked as sub-issues to the parent Project issue. **Only one level of sub-issues** - sub-issues should NOT have their own sub-issues.
- **Checklists for sub-tasks**: Use GitHub markdown checklists (`- [ ]`) within an issue for smaller sub-tasks. Don't create separate issues for every small item.
- **GitHub Project Board**: [SocioTechnica Project Board](https://github.com/orgs/sociotechnica-org/projects/2/) - central view of all work in progress.

### Project Issue Structure

Project issues use the "Project" issue type and follow this template:

```markdown
## Goal

[One sentence describing the outcome]

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

### Creating a New Project

When creating a new Project issue, you MUST complete ALL of these steps:

1. **Create the issue** with "Project: " prefix in the title
2. **Set the issue type to "Project"** using GraphQL mutation
3. **Add to the LifeBuild Planning project board**

```bash
# Step 1: Create the issue
gh issue create -R sociotechnica-org/<repo> \
  --title "Project: Name" \
  --body "## Goal
[One sentence describing the outcome]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2"

# Step 2: Set issue type to Project (get the issue number from step 1)
ISSUE_ID=$(gh api repos/sociotechnica-org/<repo>/issues/<number> --jq '.node_id')
PROJECT_TYPE_ID="IT_kwDOBzJqv84B0qO5"
gh api graphql -f query="
  mutation {
    updateIssueIssueType(input: {issueId: \"$ISSUE_ID\", issueTypeId: \"$PROJECT_TYPE_ID\"}) {
      issue { number title }
    }
  }
"

# Step 3: Add to LifeBuild Planning project board
gh project item-add 2 --owner sociotechnica-org --url <issue-url>
```

### Listing Projects

```bash
# List all Project issues
gh issue list --search "type:Project" -R sociotechnica-org/lifebuild
```

#### Sub-issues with gh-sub-issue extension

Install the community extension for easier sub-issue management:

```bash
# Install the extension (one-time)
gh extension install yahsan2/gh-sub-issue

# List sub-issues of a project
gh sub-issue list 410

# Add an existing issue as a sub-issue
gh sub-issue add 410 415  # Add issue 415 as sub-issue of 410

# Create a new sub-issue directly
gh sub-issue create --parent 410 --title "New task for this project"

# Remove a sub-issue from a project (keeps the issue, just unlinks it)
gh sub-issue remove 410 415

# When not in the repo directory, use -R flag
gh sub-issue list 410 -R sociotechnica-org/lifebuild
```

#### Sub-issues with REST API (no extension needed)

```bash
# Add a sub-issue to a project (using REST API)
# Use -F (not -f) to pass integer values
CHILD_ID=$(gh api repos/sociotechnica-org/lifebuild/issues/123 --jq '.id')
gh api repos/sociotechnica-org/lifebuild/issues/100/sub_issues \
  -X POST -F sub_issue_id="$CHILD_ID"

# List sub-issues of a project
gh api repos/sociotechnica-org/lifebuild/issues/100/sub_issues

# View project in GitHub Project board
# Filter: parent-issue:"sociotechnica-org/lifebuild#100"
```

### GitHub Project Views

Views must be created via the GitHub UI (no API available). Recommended views:

- **All Projects**: Filter `type:Project` - shows all active projects
- **[Project Name]**: Filter `parent-issue:"sociotechnica-org/lifebuild#N"` - shows work for a specific project

To create a view:

1. Go to https://github.com/orgs/sociotechnica-org/projects/2/
2. Click **+ New view** → Table or Board
3. Add filter using the syntax above

### Project Statuses

Projects use the same status workflow as other issues:

- **Backlog**: Not yet started
- **In Progress**: Actively being worked on
- **Done**: Completed

## Important Guidelines

- **Quality before committing**: Always run `pnpm lint-all` and `pnpm test`
- **Small PRs**: Keep them focused and demoable
- **No time estimates**: Focus on sequencing and dependencies
- **Test-driven bug fixes**: Write failing test first, then fix
- **E2E tests sparingly**: Only for vital user flows
- **Fix all feedback**: Including neutral BugBot checks
- **Never merge without asking**: Always ask the user before running `gh pr merge`

## Testing

### Unit Tests

- Use `packages/web/src/test-utils.tsx` for component testing
- Test LiveStore events in isolation
- Mock external dependencies

### E2E Tests

- Only for vital user flows
- Run with `CI=true pnpm test:e2e` to verify

### Testing Strategy

- **Node.js integration tests** for server-side logic (reconnect paths, event processing) — fewer moving parts, faster execution
- **Playwright E2E tests** for user-facing behavior (connection indicators, UI flows) — keep high-level and implementation-agnostic
- **E2E tests should not depend on backend implementation details** — focus on observable behavior

### LiveStore Testing

```typescript
const store = createTestStore()
await store.mutate([{ type: 'project.create', id: '1', name: 'Test', description: 'Test' }])
const projects = await store.query(db => db.table('projects').all())
```

### Full-Stack Integration Testing

Full-stack tests spawn real worker and server processes and connect a LiveStore client. Key patterns:

```bash
# Run full-stack integration test
pnpm --filter @lifebuild/server run test:fullstack
```

**StubLLMProvider for deterministic LLM responses:**

Set `LLM_PROVIDER=stub` and configure responses via environment variables:

```bash
LLM_PROVIDER=stub
LLM_STUB_RESPONSES='{"defaultResponse":"stub: {{message}}","responses":[{"match":"ping","response":"pong"}]}'
# Or use a fixture file:
LLM_STUB_FIXTURE_PATH=./fixtures/stub-responses.json
# Or set a simple default:
LLM_STUB_DEFAULT_RESPONSE="default stub response"
```

Response rules support `matchType`: `"exact"` (default), `"includes"`, or `"regex"`.

**Process management in tests:**

- Use `spawn` for child processes (worker, server) — never `exec`
- Always terminate with `SIGTERM` first, then `SIGKILL` after timeout
- Use `waitForPort()` to confirm process readiness before proceeding
- Clean up temporary directories (`.context/fullstack-*`) in `finally` blocks
- Set a total timeout guard to prevent tests from hanging indefinitely

**WebSocket polyfill for Node.js:**

Node.js may not provide `globalThis.WebSocket`. Polyfill with `ws` in tests and server code:

```typescript
if (typeof globalThis.WebSocket !== 'function') {
  const { WebSocket } = await import('ws')
  ;(globalThis as any).WebSocket = WebSocket
}
```

### Logging

The server uses `pino` for structured logging. Key utilities in `packages/server/src/utils/logger.ts`:

- `createContextLogger({ storeId, operation, ... })` — child logger with structured context
- `createCorrelatedLogger({ correlationId, messageId, ... })` — includes correlation ID from async local storage
- `logMessageEvent(level, event, message)` — structured message lifecycle logging
- Log level controlled by `LOG_LEVEL` env var (defaults: `debug` in dev, `warn` in test, `info` in prod)

## Component Architecture Patterns

### Storybook Stories

**ALWAYS create Storybook stories for UI components.** Stories should use LiveStore directly with real events to create state.

**IMPORTANT**: Use **real LiveStore events** to create state, not mock data. This ensures stories accurately reflect how components work in production.

#### Story Structure with LiveStore

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { MyComponent } from './MyComponent.js'
import { schema, events } from '@lifebuild/shared/schema'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'

const adapter = makeInMemoryAdapter()

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Brief description of what this component does',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

// Boot function creates state via events
const defaultSetup = (store: Store) => {
  store.commit(
    events.projectCreated({
      id: '1',
      name: 'Test Project',
      description: 'A test project',
      createdAt: new Date(),
      actorId: '1',
    })
  )
}

export const Default: Story = {
  args: {
    projectId: '1',
  },
  decorators: [
    Story => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={defaultSetup}
      >
        <Story />
      </LiveStoreProvider>
    ),
  ],
}
```

#### Key Principles

1. **No Mock Data**: Always use real LiveStore events via `store.commit(events.eventName({...}))`
2. **LiveStore in Stories**: Wrap stories in `LiveStoreProvider` so components can use `useQuery` hooks directly
3. **Boot Functions**: Each story has its own `boot` function that creates the necessary state
4. **Real Component Testing**: Test the actual component with real data fetching, not a separate presenter

#### Story Categories

- `Components/` - Reusable UI components
- `Pages/` - Full page components
- `Modals/` - Modal dialogs
- `Kanban/` - Kanban-specific components

#### Required Stories

- **Default**: Standard usage with minimal data
- **Edge Cases**: Long text, empty states, error states
- **Interactive**: Form validation, loading states
- **Variants**: Different data states and scenarios

#### Common Patterns

```typescript
// Multiple items
const multipleItemsSetup = (store: Store) => {
  for (let i = 0; i < 5; i++) {
    store.commit(events.itemCreated({ id: `${i}`, name: `Item ${i}`, actorId: '1' }))
  }
}

// Related data (e.g., project with workers)
const withRelatedDataSetup = (store: Store) => {
  store.commit(events.projectCreated({ id: '1', name: 'Project', actorId: '1' }))
  store.commit(events.workerCreated({ id: '1', name: 'Worker', actorId: '1' }))
  store.commit(events.workerAssignedToProject({ workerId: '1', projectId: '1', actorId: '1' }))
}

// Empty state
const emptySetup = (store: Store) => {
  // Create minimal context (e.g., a project) but no items
  store.commit(events.projectCreated({ id: '1', name: 'Empty Project', actorId: '1' }))
}
```

#### Story Descriptions

- Include `parameters.docs.description.story` for complex examples
- Explain interaction patterns ("Try submitting with invalid data")
- Document different states and behaviors

## Deployment

Deployments happen automatically via GitHub Actions when PRs are merged to the main branch.

### Manual Deployment (if needed)

Use these commands only when you need to deploy manually outside the normal CI/CD pipeline:

```bash
pnpm --filter @lifebuild/auth-worker run deploy  # Deploy auth worker to Cloudflare
pnpm --filter @lifebuild/worker run deploy       # Deploy sync server to Cloudflare
pnpm --filter @lifebuild/web run deploy          # Deploy web app to Cloudflare Pages
```
