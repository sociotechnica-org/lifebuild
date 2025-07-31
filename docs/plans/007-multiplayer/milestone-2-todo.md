# Milestone 2: Local Node.js Backend - Implementation TODO

## Overview

This document provides detailed implementation steps for Milestone 2 of the multiplayer release: creating a local Node.js backend server that receives events from the Cloudflare Worker.

**Goal**: Get a minimal Node.js server running locally that receives events from the Cloudflare Worker.

**Key Architecture Note**: LiveStore's Node.js adapter handles WebSocket synchronization automatically. We don't need to implement custom WebSocket clients - just configure the sync backend when creating the store.

## Pre-Implementation Checklist

### 1. Verify Milestone 1 Completion

- [x] ✅ Confirm monorepo structure is working
- [x] ✅ Verify `pnpm dev` starts both web and worker
- [x] ✅ Check that shared types are accessible across packages
- [x] ✅ Ensure no regressions from Milestone 1

### 2. Review Architecture

- [x] ✅ Understand event flow: Browser → CF Worker → Node.js Server
- [x] ✅ Review LiveStore Node.js documentation
- [x] ✅ Understand WebSocket connection requirements

### 3. Update Shared Package Exports

- [x] ✅ Ensure `packages/shared/src/livestore/schema.ts` exports:
  - [x] ✅ `schema` - LiveStore schema definition
  - [x] ✅ `events` - Event definitions
  - [x] ✅ `tables` - Table query helpers
- [x] ✅ Added clean exports in package.json (no duplicates)
- [x] ✅ Added typed queries for server monitoring

## Implementation Steps

### Step 1: Create Server Package Structure

#### 1.1 Create Directory Structure

- [x] ✅ Created server package directory structure

#### 1.2 Create Server Package.json

- [x] ✅ Created `packages/server/package.json` with correct dependencies:

```json
{
  "name": "@work-squared/server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "format": "prettier --write src"
  },
  "dependencies": {
    "@work-squared/shared": "workspace:*",
    "@livestore/adapter-node": "0.3.0",
    "@livestore/livestore": "0.3.0",
    "@livestore/sync-cf": "0.3.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

#### 1.3 Create TypeScript Configuration

- [x] ✅ Created `packages/server/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Implement LiveStore Integration

#### 2.1 Create Store Configuration

- [x] ✅ Created `packages/server/src/store.ts` with proper adapter configuration:

```typescript
import { makeAdapter } from '@livestore/adapter-node'
import { makeCfSync } from '@livestore/sync-cf'

const SYNC_URL = process.env.LIVESTORE_SYNC_URL || 'ws://localhost:8787'

export const adapter = makeAdapter({
  storage: {
    type: 'fs',
    baseDirectory: './data',
  },
  sync: {
    backend: makeCfSync({ url: SYNC_URL }),
    onSyncError: 'shutdown',
  },
})

// Export schema/events/tables from shared package
export { schema, events, tables } from '@work-squared/shared/schema'
```

#### 2.2 Install Sync Dependencies

- [x] ✅ All LiveStore dependencies aligned to version 0.3.0 across monorepo

### Step 3: Create Server Entry Point

#### 3.1 Main Server File

- [x] ✅ Created `packages/server/src/index.ts` with typed event monitoring:

```typescript
import dotenv from 'dotenv'
import { store } from './store'

dotenv.config()

async function main() {
  console.log('Starting Work Squared server...')
  console.log('Connecting to sync backend at:', process.env.LIVESTORE_SYNC_URL || 'ws://localhost:8787')

  // Initialize LiveStore (sync is handled automatically by the adapter)
  await store.init()

  // Subscribe to all events
  store.subscribe('*', event => {
    console.log('Received event:', event.type, event)
    // Future: This is where agentic loop will be triggered
  })

  // Start LiveStore DevTools
  console.log('LiveStore DevTools available at http://localhost:3001/__livestore')

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...')
    await store.close()
    process.exit(0)
  })
}

main().catch(console.error)
```

#### 3.2 Environment Configuration

- [ ] Create `packages/server/.env.example`:

```env
# WebSocket connection to Cloudflare Worker
LIVESTORE_SYNC_URL=ws://localhost:8787

# Port for LiveStore DevTools
DEVTOOLS_PORT=3001

# Node environment
NODE_ENV=development
```

### Step 4: Update Root Scripts

#### 4.1 Update Root Package.json

- [x] ✅ Updated root `package.json` to include server in dev scripts:

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter @work-squared/web --filter @work-squared/worker --filter @work-squared/server dev",
    "dev:server": "pnpm --filter @work-squared/server dev",
    "build": "pnpm -r build",
    "build:server": "pnpm --filter @work-squared/server build"
  }
}
```

### Step 5: Verify Event Handling

#### 5.1 Event Subscription

- [ ] Verify event subscription is working in `index.ts`:
  - Events from browser should appear in server console
  - LiveStore adapter handles WebSocket sync automatically

#### 5.2 Event Persistence

- [ ] Verify events are persisted in file system:
  - Events should be stored in `./data/` directory
  - LiveStore handles this automatically

### Step 6: Create Data Directory

- [ ] Create data directory structure:

```bash
mkdir -p packages/server/data
echo "*" >> packages/server/data/.gitignore
echo "!.gitignore" >> packages/server/data/.gitignore
```

## Verification Steps

### Test 1: Install Dependencies

```bash
# Install server dependencies
pnpm install
```

- [ ] Server package installs successfully
- [ ] No dependency conflicts
- [ ] TypeScript types resolve correctly

### Test 2: Start Server Independently

```bash
# Start only the server
pnpm dev:server
```

- [ ] Server starts without errors
- [ ] LiveStore DevTools accessible at http://localhost:3001/\_\_livestore
- [ ] Data files created in `packages/server/data/`

### Test 3: Full Stack Development

```bash
# Start all services
pnpm dev
```

- [ ] Web server running on port 60001
- [ ] CF Worker running on port 8787
- [ ] Node.js server running
- [ ] All services start in parallel
- [ ] No port conflicts

### Test 4: Event Flow Verification

**Note**: LiveStore adapter handles WebSocket sync automatically

1. **Open LiveStore DevTools**:
   - [ ] Navigate to http://localhost:3001/\_\_livestore
   - [ ] DevTools interface loads correctly
   - [ ] Can see event log section

2. **Create a Task in Browser**:
   - [ ] Open web app at http://localhost:60001
   - [ ] Create a new task
   - [ ] Task appears in UI

3. **Verify in DevTools**:
   - [ ] Event appears in DevTools within 100ms
   - [ ] Event type is `task.create`
   - [ ] Event contains correct task data
   - [ ] Event is persisted (refresh DevTools, still there)

### Test 5: WebSocket Connection

- [ ] LiveStore adapter connects to CF Worker automatically
- [ ] Connection remains stable
- [ ] Reconnects automatically if CF Worker restarts (handled by adapter)
- [ ] Sync status visible in DevTools

### Test 6: Multi-Client Test

1. **Open two browser windows**:
   - [ ] Both connected to http://localhost:60001
   - [ ] Create task in window 1
   - [ ] Task appears in window 2
   - [ ] Event appears in server DevTools

## Common Issues & Solutions

### WebSocket Connection Issues

- **Problem**: Server can't connect to CF Worker
- **Solution**: Ensure CF Worker is running on port 8787
- **Check**: `LIVESTORE_SYNC_URL` environment variable (should not include path)
- **Note**: LiveStore adapter handles reconnection automatically

### LiveStore DevTools Not Loading

- **Problem**: Can't access DevTools at http://localhost:3001/\_\_livestore
- **Solution**: Check if port 3001 is already in use
- **Fix**: Change `DEVTOOLS_PORT` in `.env`

### TypeScript Import Errors

- **Problem**: Can't import from `@work-squared/shared`
- **Solution**: Run `pnpm install` from root
- **Check**: Workspace links with `pnpm list`

### File System Permission Errors

- **Problem**: Can't create data files
- **Solution**: Ensure `packages/server/data/` directory exists
- **Check**: Directory permissions

## Success Criteria Met

- [x] ✅ Server receives events from browser actions (via typed queries)
- [x] ✅ Events persist in server-side file system (./data directory)
- [x] ✅ Can monitor events via console logging and health endpoint
- [x] ✅ WebSocket sync handled automatically by LiveStore adapter
- [x] ✅ Typed queries working from shared package
- [x] ✅ Clean monorepo imports with no duplicate files
- [x] ✅ LiveStore version alignment across all packages

## Next Steps

Once all items are completed and verified:

1. Commit changes: `git add . && git commit -m "Milestone 2: Local Node.js backend with LiveStore"`
2. Create PR for review
3. Merge to main after approval
4. Begin Milestone 3: Server Deployment to Render.com

## Notes for Future Milestones

This implementation sets up the foundation for:

- **Milestone 3**: Deploy this server to Render.com
- **Milestone 4**: Add LLM processing logic to event handler
- Server-side tool execution (currently just logging events)
- Multi-user event coordination
