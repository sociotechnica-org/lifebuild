# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Install dependencies
pnpm

# Set up environment variables (first time only)
cp .env.example .env
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Braintrust API credentials

# Run development server (starts both Vite and Wrangler concurrently)
export VITE_LIVESTORE_SYNC_URL='http://localhost:8787'
pnpm dev

# Run LLM service (separate terminal)
pnpm llm:service

# Run development server on custom port
PORT=3000 VITE_LIVESTORE_SYNC_URL='http://localhost:8787' pnpm dev

# Run Storybook (port 6010 - avoids conflicts with other instances)
pnpm storybook
```

### Testing

```bash
# Run unit tests (Vitest)
pnpm test

# Run unit tests in watch mode
pnpm test -- --watch

# Run E2E tests (Playwright)
pnpm test:e2e

# Run E2E tests with UI mode
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug

# Run E2E tests on specific port (for multiple Claude instances)
PLAYWRIGHT_PORT=9090 pnpm test:e2e

# Run Storybook tests
pnpm test:storybook
```

### Linting and Formatting

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting with Prettier
pnpm format:check

# Type check with TypeScript
pnpm typecheck
```

### Build

```bash
# Production build
pnpm build

# Build with bundle analysis
pnpm build:analyze

# Build Storybook static site
pnpm build-storybook
```

### Cloudflare Workers

```bash
# Deploy to Cloudflare Workers
pnpm wrangler:deploy

# Run Wrangler dev server only
pnpm dev:wrangler
```

## Architecture

Work Squared is a real-time collaborative web application built with:

- **LiveStore**: Event-sourced state management with SQLite materialized views
- **React 19** with TypeScript for the frontend
- **Cloudflare Workers** with Durable Objects for WebSocket-based real-time sync
- **Node.js LLM Service**: Separate service for AI chat responses via Braintrust/OpenAI
- **SharedWorker** for multi-tab synchronization
- **OPFS** for client-side persistence

### Key Concepts

1. **Event Sourcing**: All state changes are events that get materialized into SQLite tables

   - Events are defined in `src/livestore/events.ts`
   - Schema and materializers in `src/livestore/schema.ts`
   - Queries in `src/livestore/queries.ts`

2. **Real-time Sync**: WebSocket server runs on Cloudflare Workers

   - Server implementation in `src/cf-worker/index.ts`
   - Client sync setup in `src/Root.tsx`

3. **State Management**: LiveStore provides reactive queries and event dispatch

   - Tables: `todos`, `chatMessages`, `uiState`
   - Events get synced across all connected clients
   - Local-first with automatic conflict resolution

4. **LLM Integration**: Separate Node.js service handles AI chat responses
   - Service listens for `ChatMessageSent` events with `role: 'user'`
   - Calls Braintrust API (GPT-4o) for AI responses
   - Emits `LLMResponseReceived` events back to LiveStore
   - Service implementation in `services/llm-service.ts`

### Directory Structure

- `/src/livestore/` - Data model (schema, events, queries)
- `/functions/` - Cloudflare Worker for sync server
- `/services/` - Node.js LLM service
- `/src/components/` - React components
- `/src/livestore.worker.ts` - SharedWorker for LiveStore operations

## LiveStore Documentation

For LiveStore-specific syntax and patterns, refer to: https://docs.livestore.dev/llms.txt

## LLM Integration

For detailed LLM integration architecture and implementation details, see: [docs/llm-clean-architecture.md](docs/llm-clean-architecture.md)

## Deployment

The application consists of two main services that need to be deployed:

### 1. Cloudflare Worker (Sync Server)

```bash
# Deploy the sync server
pnpm wrangler:deploy
```

### 2. LLM Service (Node.js)

The LLM service (`services/llm-service.ts`) needs to be deployed to a Node.js runtime. Options include:

- **Docker container** (recommended for production)
- **VPS/Server** with Node.js runtime
- **Serverless platform** (Vercel, Railway, etc.)

**Environment Variables Required:**

```bash
BRAINTRUST_API_KEY=your-api-key
BRAINTRUST_PROJECT_ID=your-project-id
STORE_ID=production-store-id
```

**Docker Example:**

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
CMD ["pnpm", "llm:service"]
```

## Important Guidelines

- When creating work plans or implementation tasks, NEVER include time estimates - focus on sequencing and dependencies only
- Prefer vertical slices (full features) over horizontal layers when possible
- Each PR should be small, focused, and demoable
- Always run tests before creating a PR

### PR Monitoring

Whenever you push up a commit to a PR or open a new PR, watch the PR until all the checks are finished using `gh pr checks --watch`. The watch interface will update automatically every 10 seconds. No need to refresh or exit or whatever. This might take up to 10 minutes; just wait!

- Cursor's BugBot check is a neutral check, but may report a bug that you need to fix. Even though it's neutral, please fix the bug and push up a new commit.

### PR Completion

When a PR is completed (merged), if the PR was related to a specific GitHub issue:

- Update the GitHub issue description with implementation details or resolution notes
- Close the issue if the PR fully addresses it, or leave it open if more work is needed

## Testing Best Practices

### Unit Tests (Vitest)

- Test LiveStore events and materializers in isolation
- Use the test utilities from `src/test-utils.tsx` for components
- Mock external dependencies

### Component Tests (React Testing Library)

- Test user interactions, not implementation details
- Use `data-testid` attributes for reliable element selection
- Always wrap components with LiveStore provider using test utilities

### E2E Tests (Playwright)

- Playwright tests with playwright-mcp integration for Claude Code compatibility
- Tests run against the full multi-service architecture (Vite + Wrangler)
- Dynamic port allocation prevents conflicts between multiple Claude instances
- Basic smoke tests validate core functionality and LiveStore integration
- **New features should include Playwright tests** to ensure end-to-end functionality
- **Claude can verify tests work** by running `CI=true pnpm test:e2e` (uses build mode, outputs results without starting dev server)

#### Configuration

```bash
# Default port (5173) - configured in playwright.config.ts
pnpm test:e2e

# Custom port for multiple Claude instances
PLAYWRIGHT_PORT=9090 pnpm test:e2e
```

#### Test Structure

- `/e2e/` - E2E test files and utilities
- `e2e/test-utils.ts` - Helper functions for LiveStore and app interactions
- `e2e/smoke.spec.ts` - Basic smoke tests for core functionality

#### GitHub Actions CI

Playwright tests run automatically on:

- Push to `main` branch
- Pull requests to `main` branch

The workflow includes:

- Automated browser installation
- Full multi-service test execution
- Test report artifacts (retained for 30 days)
- Proper caching for faster CI runs

### Storybook

- Create stories for all UI components
- Use Storybook for visual testing and documentation
- Test different component states and edge cases
- Stories should be self-contained with mock data

### LiveStore Testing Patterns

```typescript
// Use test store with memory adapter
const store = createTestStore()

// Add test data
await store.mutate([{ type: 'todo.add', id: '1', text: 'Test', completed: false }])

// Test queries
const todos = await store.query(db => db.table('todos').all())
```
