# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Before Committing Code

**ALWAYS run lint-all and tests before committing:**

```bash
pnpm lint-all          # Runs lint, format, AND typecheck in one command
pnpm test              # Runs unit tests
CI=true pnpm test:e2e  # Runs E2E tests
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
cp packages/web/.env.example packages/web/.env && cp .dev.vars.example .dev.vars
# Edit packages/web/.env and .dev.vars with your Braintrust API credentials

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
pnpm test:e2e      # E2E tests
CI=true pnpm test:e2e  # Verify E2E tests work (for Claude)

# Building
pnpm --filter @work-squared/web build    # Build web package
pnpm build         # Build all packages (if needed)

# Deployment
pnpm --filter @work-squared/auth-worker run deploy  # Deploy auth worker to Cloudflare
pnpm --filter @work-squared/worker run deploy  # Deploy sync server to Cloudflare
```

## Architecture

Work Squared is a real-time collaborative web application built as a monorepo with:

- **LiveStore**: Event-sourced state management with SQLite materialized views
- **React 19** with TypeScript for the frontend (`packages/web`)
- **Cloudflare Workers** with Durable Objects for WebSocket-based real-time sync (`packages/worker`)
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
3. Create descriptive branch (e.g., `feature/documents-tab`)

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
2. Open PR with detailed description
3. Run `gh pr checks --watch` and wait for all checks (up to 10 minutes)
4. Fix any issues (including neutral BugBot feedback)

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

### Storybook Stories

Create Storybook stories for all UI components following these patterns:

#### Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './ComponentName.js'

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName', // Use logical grouping
  component: ComponentName,
  parameters: {
    layout: 'centered', // or 'fullscreen' for pages
    docs: {
      description: {
        component: 'Brief description of the component',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for interactive props
  },
}

export default meta
type Story = StoryObj<typeof meta>
```

#### Story Categories

- `Components/` - Reusable UI components
- `Pages/` - Full page components
- `Modals/` - Modal dialogs
- `Kanban/` - Kanban-specific components

#### Required Stories

- **Default**: Standard usage
- **Edge Cases**: Long text, empty states, error states
- **Interactive**: Form validation, loading states
- **Variants**: Different modes (dev/prod, authenticated/not)

#### Mocking Dependencies

For components with external dependencies:

```typescript
// Mock contexts and providers
const MockAuthProvider = ({ children, mockProps }) => {
  const mockContext = { ...defaultValues, ...mockProps }
  return <div data-mock-auth={JSON.stringify(mockContext)}>{children}</div>
}

// Mock routing
<MemoryRouter initialEntries={['/path']}>
  <Component />
</MemoryRouter>

// Mock environment variables
React.useEffect(() => {
  (import.meta as any).env = { ...import.meta.env, VITE_VAR: 'value' }
}, [])
```

#### Story Descriptions

- Include `parameters.docs.description.story` for complex examples
- Explain interaction patterns ("Try submitting with invalid data")
- Document different states and behaviors

## Deployment

Deployments happen automatically when you push to the main branch.

1. Deploy worker + assets to Cloudflare `pnpm --filter @work-squared/worker deploy`
