# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Install dependencies
pnpm

# Run development server (starts both Vite and Wrangler concurrently)
export VITE_LIVESTORE_SYNC_URL='http://localhost:8787'
pnpm dev

# Run Storybook (port 6010 - avoids conflicts with other instances)
pnpm storybook
```

### Testing

```bash
# Run unit tests (Vitest)
pnpm test

# Run unit tests in watch mode
pnpm test -- --watch

# Run E2E tests (Playwright) - REMOVED
# pnpm test:e2e (removed due to LiveStore compatibility issues)

# Run Storybook tests
pnpm test:storybook
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

### Directory Structure

- `/src/livestore/` - Data model (schema, events, queries)
- `/src/cf-worker/` - Cloudflare Worker for sync server
- `/src/components/` - React components
- `/src/livestore.worker.ts` - SharedWorker for LiveStore operations

## LiveStore Documentation

For LiveStore-specific syntax and patterns, refer to: https://docs.livestore.dev/llms.txt

## Important Guidelines

- When creating work plans or implementation tasks, NEVER include time estimates - focus on sequencing and dependencies only
- Prefer vertical slices (full features) over horizontal layers when possible
- Each PR should be small, focused, and demoable
- Always run tests before creating a PR

## Testing Best Practices

### Unit Tests (Vitest)

- Test LiveStore events and materializers in isolation
- Use the test utilities from `src/test-utils.tsx` for components
- Mock external dependencies

### Component Tests (React Testing Library)

- Test user interactions, not implementation details
- Use `data-testid` attributes for reliable element selection
- Always wrap components with LiveStore provider using test utilities

### E2E Tests (Playwright) - REMOVED

- E2E testing removed due to LiveStore dependency compatibility issues
- Consider adding back when LiveStore provides better E2E testing support
- For now, rely on Storybook and component tests for UI validation

### Storybook

- Create stories for all UI components
- Use Storybook for visual testing and documentation
- Test different component states and edge cases
- Stories should be self-contained with mock data

### LiveStore Testing Patterns

```typescript
// Use test store with memory adapter
const store = createTestStore();

// Add test data
await store.mutate([
  { type: "todo.add", id: "1", text: "Test", completed: false },
]);

// Test queries
const todos = await store.query((db) => db.table("todos").all());
```
