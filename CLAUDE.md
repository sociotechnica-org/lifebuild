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
pnpm --filter @work-squared/web build    # Build web package
pnpm build         # Build all packages (if needed)

# Deployment (Separated Architecture)
pnpm --filter @work-squared/auth-worker run deploy  # Deploy auth worker to Cloudflare
pnpm --filter @work-squared/worker run deploy       # Deploy sync server to Cloudflare
pnpm --filter @work-squared/web run deploy          # Deploy web app to Cloudflare Pages
```

## Architecture

Work Squared is a real-time collaborative web application built as a monorepo with separated deployments:

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

## Documentation

- LiveStore patterns: https://docs.livestore.dev/llms.txt
- Work Squared Architecture: [docs/architecture.md](docs/architecture.md)

## Development Workflow

### Before Starting Work

1. Review requirements thoroughly
2. Ask clarifying questions
3. Create descriptive branch with your username prefix (e.g., `jessmartin/add-feature-name`)

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
4. Monitor checks: `gh pr checks --watch` and wait for all checks (up to 10 minutes)
5. Check for feedback: `gh pr view <number> --comments` to see reviews and comments
6. Fix any issues (including neutral BugBot feedback)

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
gh pr checks <number>            # View check status for a specific PR
gh pr checks --watch             # Monitor checks in real-time (wait up to 10 minutes)

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

### Common Workflows

```bash
# After creating a PR, monitor checks
gh pr checks --watch

# View PR with all comments and reviews
gh pr view 272 --comments

# Check status of all your PRs
gh pr status

# View specific check details
gh pr checks 272
```

### Notes

- PR numbers are shown in `gh pr status` or on GitHub
- Use `--web` flag to open items in browser for complex interactions
- `gh pr checks --watch` is essential for monitoring CI/CD pipelines

## Important Guidelines

- **Quality before committing**: Always run `pnpm lint-all` and `pnpm test`
- **Small PRs**: Keep them focused and demoable
- **No time estimates**: Focus on sequencing and dependencies
- **Test-driven bug fixes**: Write failing test first, then fix
- **E2E tests sparingly**: Only for vital user flows
- **PR monitoring**: Use `gh pr checks --watch` and wait up to 10 minutes
- **Fix all feedback**: Including neutral BugBot checks

## Testing

### Unit Tests

- Use `packages/web/src/test-utils.tsx` for component testing
- Test LiveStore events in isolation
- Mock external dependencies

### E2E Tests

- Only for vital user flows
- Run with `CI=true pnpm test:e2e` to verify

### LiveStore Testing

```typescript
const store = createTestStore()
await store.mutate([{ type: 'project.create', id: '1', name: 'Test', description: 'Test' }])
const projects = await store.query(db => db.table('projects').all())
```

## Component Architecture Patterns

### Container/Presenter Pattern

**ALWAYS follow the Container/Presenter pattern for components that need data:**

- **Container Components**: Handle data fetching, state management, and LiveStore integration
- **Presenter Components**: Pure components that receive data via props and handle presentation

**Example:**

```typescript
// ChatInterface.tsx (Container)
export const ChatInterface: React.FC = () => {
  const chatData = useChatData()
  return <ChatPresenter {...chatData} />
}

// ChatPresenter.tsx (Presenter)
export interface ChatPresenterProps {
  conversations: Conversation[]
  messages: ChatMessage[]
  onSendMessage: (e: React.FormEvent) => void
  // ... all needed data and callbacks
}

export const ChatPresenter: React.FC<ChatPresenterProps> = ({
  conversations,
  messages,
  onSendMessage,
}) => {
  // Pure presentation logic only
  return <div>...</div>
}
```

**Benefits:**

- Presenter components can be easily tested in Storybook without LiveStore context
- Clear separation of data and presentation concerns
- Reusable presenter components with different data sources

### Storybook Stories

Create Storybook stories for **Presenter components only** following these patterns.

**IMPORTANT**: Use **real LiveStore events** to create state, not mock data. This ensures stories accurately reflect how components work in production.

#### Story Structure with LiveStore

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ComponentPresenter } from './ComponentPresenter.js'
import { getDataQuery$ } from '@work-squared/shared/queries'
import { schema, events } from '@work-squared/shared/schema'
import { LiveStoreProvider, useQuery } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'

type ComponentProps = React.ComponentProps<typeof ComponentPresenter>

// Define props that the helper provides via LiveStore
type ProvidedProps = 'data' | 'relatedData'

// Stories provide remaining props
type HelperProps = Omit<ComponentProps, ProvidedProps> & {
  dataId?: string  // Pass IDs, not data
}

const adapter = makeInMemoryAdapter()

// Helper fetches data from LiveStore
const ComponentHelper = (props: HelperProps) => {
  const data = props.dataId ? useQuery(getDataQuery$(props.dataId)) : []
  return <ComponentPresenter {...props} data={data} />
}

const meta: Meta<typeof ComponentHelper> = {
  title: 'Category/ComponentName',
  component: ComponentHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Brief description',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentHelper>

export default meta
type Story = StoryObj<typeof meta>

// Boot function creates state via events
const defaultSetup = (store: Store) => {
  store.commit(
    events.dataCreated({
      id: '1',
      name: 'Test Data',
      createdAt: new Date(),
      actorId: '1',
    })
  )
}

export const Default: Story = {
  args: {
    dataId: '1',
    onAction: () => {},
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
2. **Helper Components**: Create helpers that use `useQuery` to fetch data from LiveStore
3. **Type Safety**: Use `Omit` to define which props the helper provides vs stories provide
4. **Boot Functions**: Each story has its own `boot` function that creates the necessary state
5. **Decorators**: Wrap each story in `LiveStoreProvider` with its boot function

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
pnpm --filter @work-squared/auth-worker run deploy  # Deploy auth worker to Cloudflare
pnpm --filter @work-squared/worker run deploy       # Deploy sync server to Cloudflare
pnpm --filter @work-squared/web run deploy          # Deploy web app to Cloudflare Pages
```
