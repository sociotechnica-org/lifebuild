# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Before Committing Code

**ALWAYS run this command before committing:**
```bash
pnpm lint-all  # Runs lint, format, AND typecheck in one command
```

This single command replaces:
- `pnpm lint:fix`
- `pnpm format`
- `pnpm typecheck`

## Essential Commands

### Development

```bash
# First time setup
pnpm install
cp .env.example .env && cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Braintrust API credentials

# Start development (2 terminals needed)
export VITE_LIVESTORE_SYNC_URL='http://localhost:8787'
pnpm dev          # Terminal 1: Vite + Wrangler
pnpm llm:service  # Terminal 2: LLM service

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
pnpm build         # Production build

# Deployment
pnpm wrangler:deploy  # Deploy sync server to Cloudflare
```

## Architecture

Work Squared is a real-time collaborative web application built with:

- **LiveStore**: Event-sourced state management with SQLite materialized views
- **React 19** with TypeScript for the frontend
- **Cloudflare Workers** with Durable Objects for WebSocket-based real-time sync
- **Node.js LLM Service**: Separate service for AI chat responses via Braintrust/OpenAI
- **SharedWorker** for multi-tab synchronization
- **OPFS** for client-side persistence

### Key Files

- `src/livestore/events.ts` - Event definitions
- `src/livestore/schema.ts` - Database schema & materializers
- `src/livestore/queries.ts` - Database queries
- `services/llm-service.ts` - LLM service implementation
- `src/cf-worker/index.ts` - WebSocket sync server

## External Documentation

- LiveStore patterns: https://docs.livestore.dev/llms.txt
- LLM architecture: [docs/llm-clean-architecture.md](docs/llm-clean-architecture.md)

## Development Workflow

### Before Starting Work
1. Review requirements thoroughly
2. Create descriptive branch (e.g., `feature/documents-tab`)

### While Developing
1. Follow existing code patterns
2. Write minimal, focused tests
3. Create Storybook stories for UI components

### Before Committing (CRITICAL)
```bash
pnpm lint-all  # ALWAYS run this!
```

### Creating a PR
1. Write clear commit messages
2. Open PR with detailed description
3. Run `gh pr checks --watch` and wait for all checks
4. Fix any issues (including neutral BugBot feedback)

## Important Guidelines

- **Quality before committing**: Always run `pnpm lint-all`
- **Small PRs**: Keep them focused and demoable
- **No time estimates**: Focus on sequencing and dependencies
- **Test-driven bug fixes**: Write failing test first, then fix
- **E2E tests sparingly**: Only for vital user flows
- **PR monitoring**: Use `gh pr checks --watch` and be patient
- **Fix all feedback**: Including neutral BugBot checks

## Testing

### Unit Tests
- Use `src/test-utils.tsx` for component testing
- Test LiveStore events in isolation
- Mock external dependencies

### E2E Tests
- Only for vital user flows
- Run with `CI=true pnpm test:e2e` to verify
- Use `PLAYWRIGHT_PORT=9090` for multiple Claude instances

### LiveStore Testing
```typescript
const store = createTestStore()
await store.mutate([{ type: 'todo.add', id: '1', text: 'Test', completed: false }])
const todos = await store.query(db => db.table('todos').all())
```

## Deployment

1. **Cloudflare Worker**: `pnpm wrangler:deploy`
2. **LLM Service**: Deploy to Node.js runtime with env vars:
   - `BRAINTRUST_API_KEY`
   - `BRAINTRUST_PROJECT_ID`
   - `STORE_ID`
