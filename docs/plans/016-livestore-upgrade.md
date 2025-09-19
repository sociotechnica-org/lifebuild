# Plan 016: LiveStore v0.4.0 Upgrade

## Overview
Upgrade Work Squared from LiveStore v0.3.1 to v0.4.0-dev.7.

## Key Breaking Changes

### 1. Import Path Restructuring
The `@livestore/sync-cf` package no longer has a default export. Must use subpath imports:
```typescript
// OLD
import { makeCfSync } from '@livestore/sync-cf'

// NEW
import { makeWsSync } from '@livestore/sync-cf/client'  // For web workers
```

### 2. Store Shutdown API
```typescript
// OLD
await store.shutdown()

// NEW
await store.shutdownPromise()
```

### 3. Worker Import Syntax
Must use `?worker` and `?sharedworker` suffixes:
```typescript
import LiveStoreWorker from './livestore.worker.ts?worker'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
```

## Required Changes by Package

### 1. pnpm-workspace.yaml
Update all LiveStore packages to `0.4.0-dev.7`:
```yaml
catalog:
  "@livestore/adapter-node": 0.4.0-dev.7
  "@livestore/adapter-web": 0.4.0-dev.7
  "@livestore/devtools-vite": 0.4.0-dev.7
  "@livestore/livestore": 0.4.0-dev.7
  "@livestore/peer-deps": 0.4.0-dev.7
  "@livestore/react": 0.4.0-dev.7
  "@livestore/sync-cf": 0.4.0-dev.7
  "@livestore/utils": 0.4.0-dev.7
  "@livestore/wa-sqlite": 0.4.0-dev.7
  vite: "^7.1.3"
```

### 2. packages/web

#### Create `packages/web/src/livestore.worker.ts`:
```typescript
import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'
import { schema } from '@work-squared/shared/schema'

const getSyncUrl = () => {
  if (self.location && self.location.hostname === 'localhost') {
    return 'ws://localhost:8787'
  }
  return `wss://${self.location.host}`
}

makeWorker({
  schema,
  sync: {
    backend: makeWsSync({ url: getSyncUrl() }),
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
})
```

#### Update `Root.tsx`:
```typescript
// Add imports
import LiveStoreWorker from './livestore.worker.ts?worker'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'

// Update adapter
const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,  // Pass directly, not as function
  sharedWorker: LiveStoreSharedWorker,
})
```

#### Update `vite.config.ts`:
- Set `worker: { format: 'es' }`
- Keep `wa-sqlite` in `optimizeDeps.exclude`
- Optionally add wrangler dev plugin for local development

### 3. packages/server

#### Update `src/factories/store-factory.ts`:
```typescript
// Line 3: Update import
import { makeWsSync } from '@livestore/sync-cf/client'

// Line 130: Update usage
backend: makeWsSync({ url: config.syncUrl })
```

#### Update `src/services/store-manager.ts`:
Lines 97 & 172: Change `await storeInfo.store.shutdown()` to `await storeInfo.store.shutdownPromise()`

### 4. packages/worker
No changes needed. The Cloudflare Worker continues to serve the sync endpoint.

### 5. packages/shared
No changes needed. No QueryBuilder.first() usage or raw SQL events in codebase.

## Migration Steps

1. **Update Dependencies**
   ```bash
   # Update pnpm-workspace.yaml
   pnpm install
   ```

2. **Create Worker File**
   ```bash
   touch packages/web/src/livestore.worker.ts
   # Add code from above
   ```

3. **Update Code Files**
   - Update imports in Root.tsx
   - Update imports in store-factory.ts
   - Update shutdown calls in store-manager.ts

4. **Run Tests**
   ```bash
   pnpm test
   CI=true pnpm test:e2e
   ```

5. **Test Locally**
   ```bash
   pnpm dev
   # Test: projects, tasks, real-time sync, chat, documents
   ```

6. **Run Quality Checks**
   ```bash
   pnpm lint-all
   pnpm typecheck
   ```

## What We're NOT Changing
- ✅ No QueryBuilder.first() usage found
- ✅ No raw SQL events used
- ✅ No Effect API usage (only React useEffect)
- ✅ Deployment workflow remains the same
- ✅ wrangler.jsonc unchanged

## Potential Issues

**TypeScript Errors**: New version enables `exactOptionalPropertyTypes`
- Fix any optional property type errors that arise

**Worker Bundling**: Ensure `?worker` suffix is used
- Check worker imports have correct suffix

**Sync Issues**: Verify WebSocket connections
- Check wrangler is running on port 8787

## Rollback Plan
```bash
git reset --hard HEAD~1
# Restore pnpm-workspace.yaml to v0.3.1 versions
pnpm install
```

## Timeline
- Dependency updates: 15 minutes
- Code changes: 30 minutes
- Testing: 1 hour
- **Total: ~2 hours**

## References
- [cf-chat example](https://github.com/livestorejs/livestore/tree/dev/examples/cf-chat)
- [LiveStore docs](https://dev.docs.livestore.dev/llms-full.txt)