# Multiplayer Release Plan

## Overview

This plan outlines the transition from client-side to server-side architecture, enabling true multi-user collaboration with server-based LLM processing.

**Goal**: Move the agentic loop from the browser to a Node.js backend, allowing multiple users to collaborate with proper server-side coordination.

## Key Decisions

- **Monorepo**: pnpm workspaces (ADR-006)
- **Hosting**: Render.com for Node.js (ADR-002)
- **Architecture**: Keep CF Worker as WebSocket hub, add Node.js for processing

## Implementation Milestones

### Milestone 1: Monorepo Structure

Create the foundation for separating frontend, backend, and shared code.

**Tasks:**
1. Create pnpm workspace structure
2. Move existing frontend code to `packages/web`
3. Move Cloudflare Worker (`functions/_worker.ts`) to `packages/worker`
4. Extract shared types to `packages/shared`
5. Update build scripts for parallel development (Vite + Wrangler)

**Success Criteria:**
- Can run `pnpm dev` to start all services (frontend + CF Worker)
- Shared types work across packages
- WebSocket sync and LLM proxy still work
- No regression in existing functionality

### Milestone 2: Local Node.js Backend

Get a minimal Node.js server running locally that receives events from the Cloudflare Worker.

**Tasks:**
1. Create `packages/server` with TypeScript setup
2. Integrate LiveStore Node.js adapter
3. Connect to CF Worker via WebSocket
4. Use LiveStore DevTools to monitor events

**Success Criteria:**
- Server receives events from browser actions
- LiveStore DevTools show real-time event flow
- Events persist in server-side SQLite

**Verification:**
- Open LiveStore DevTools at `http://localhost:3001/__livestore`
- Create a task in the browser
- See event appear in DevTools within 100ms

### Milestone 3: Server Deployment

Deploy the Node.js backend to Render.com and verify event sync works in production.

**Tasks:**
1. Create `render.yaml` configuration
2. Set up environment variables
3. Deploy and verify WebSocket connection
4. Test multi-client event propagation

**Success Criteria:**
- Server running on Render.com
- Events sync between local and deployed instances
- LiveStore DevTools accessible in production

### Milestone 4: LLM Processing Migration

Move the agentic loop from `ChatInterface.tsx` to the server, and remove the LLM proxy from the CF Worker.

**Tasks:**
1. Extract agentic loop logic to server
2. Implement server-side tool execution
3. Update client to receive LLM events
4. Remove client-side LLM calls
5. Remove `/api/llm/chat` endpoint from CF Worker

**Key Simplifications:**
- No streaming responses (use complete messages)
- Reuse existing tool execution logic
- Minimal changes to UI components

**Success Criteria:**
- Chat messages processed on server
- Tools execute server-side
- Multiple users see LLM responses
- CF Worker only handles WebSocket relay
- No regression in functionality

## Technical Architecture

### Current State
```
Browser → CF Worker (WebSocket + LLM Proxy) → Browser
           ├── WebSocket sync server
           └── /api/llm/chat endpoint
```

### Target State
```
Browser → CF Worker → Node.js Server
           ├── WebSocket relay     ├── Event processing
           └── (no LLM proxy)      └── LLM Processing
                   ↓
Browser ← CF Worker ← Event emission
```

### Package Structure
```
work-squared/
├── packages/
│   ├── web/       # React app (existing code)
│   ├── server/    # Node.js backend (new)
│   ├── shared/    # Types and schemas
│   └── worker/    # CF Worker
└── pnpm-workspace.yaml
```

## Implementation Details

### Server-Side LiveStore Setup

The server will use LiveStore's Node.js adapter with built-in DevTools:

```typescript
import { createStore } from '@livestore/node'
import { schema, events } from '@work-squared/shared'

const store = createStore({
  schema,
  events,
  storage: { type: 'sqlite', path: './data/work-squared.db' },
  devTools: { enabled: true }  // Provides monitoring at /__livestore
})
```

### Event Flow Example

1. User sends chat message
2. Browser emits `chat.message.sent` event
3. CF Worker broadcasts to all clients AND server
4. Server receives event, triggers agentic loop
5. Server calls LLM API (Braintrust)
6. Server executes tools, emits results
7. CF Worker broadcasts results to all clients
8. All users see updated UI

### Simplified Agentic Loop

Focus on moving existing logic with minimal changes:

1. Extract `runAgenticLoop` function from `ChatInterface.tsx`
2. Replace DOM updates with event emissions
3. Keep tool execution logic intact
4. Use existing event types

## What We're NOT Doing

To keep scope manageable with 2 internal users:

- ❌ Custom monitoring dashboards (use LiveStore DevTools)
- ❌ Health check endpoints (DevTools provide this)
- ❌ Streaming responses (complete messages only)
- ❌ Exponential backoff (check LiveStore's built-in reconnection first)
- ❌ Sentry integration (add later if needed)
- ❌ Load testing (premature with 2 users)
- ❌ Phased rollout (just deploy when ready)
- ❌ Horizontal scaling (single instance is fine)

## Development Workflow

### Local Development
```bash
# Start all services (currently Vite + Wrangler)
pnpm dev

# After monorepo migration:
pnpm dev              # All services (web + worker + server)
pnpm dev:web          # Frontend only
pnpm dev:worker       # CF Worker only
pnpm dev:server       # Node.js backend only

# View events in LiveStore DevTools
open http://localhost:3001/__livestore
```

### Testing Approach

Focus on functionality, not scale:

1. **Manual Testing**: Two browsers, verify events sync
2. **Integration Tests**: Existing E2E tests should still pass
3. **Tool Execution**: Verify each tool works server-side

## Deployment

Simple deployment to Render.com:

```yaml
# render.yaml
services:
  - type: web
    name: work-squared-server
    runtime: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm --filter @work-squared/server start
    envVars:
      - key: LIVESTORE_SYNC_URL
        value: wss://work-squared.example.com/sync
      - key: BRAINTRUST_API_KEY
        sync: false
```

## Success Metrics

- ✅ Events flow: Browser → CF → Server → CF → Browser
- ✅ LLM calls happen server-side
- ✅ Multiple users see same results
- ✅ No regression in features
- ✅ LiveStore DevTools show healthy system

## Next Steps After This Release

Once multiplayer is working:

1. Add authentication (ADR-005)
2. Implement background jobs (ADR-001)
3. Add automated backups (ADR-003)
4. Scale to more users

## Priority Order

1. Monorepo setup (enables everything else)
2. Local server with event reception (proves architecture)
3. Deploy to Render (production validation)
4. Migrate LLM processing (core feature complete)

Each milestone builds on the previous one. Complete each fully before moving to the next.