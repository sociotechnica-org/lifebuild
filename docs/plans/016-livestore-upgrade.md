# Plan 016: LiveStore v0.4.0 Upgrade

## Overview
This plan documents the comprehensive upgrade of Work Squared from LiveStore v0.3.1 to v0.4.0-dev.7. This is a significant upgrade that includes breaking changes, new features, and architectural improvements.

## Background
LiveStore v0.4.0 introduces several important changes:
- Improved developer experience with integrated Vite plugins
- Breaking changes to store shutdown and query builder APIs
- Better TypeScript support with `exactOptionalPropertyTypes`
- Updated dependencies including Effect 3.17.9, React 19.0.0, and Vite 7.1.3

## Upgrade Strategy

### Phase 1: Preparation & Planning
1. Review all breaking changes and their impact
2. Ensure all tests are passing on current version
3. Create a feature branch for the upgrade
4. Back up any critical data

### Phase 2: Dependency Updates
Update the pnpm catalog to use LiveStore v0.4.0-dev.7 packages

### Phase 3: Package-by-Package Migration
Due to the interconnected nature of the packages, we'll perform a coordinated upgrade:

1. **packages/shared** - Update schema and event definitions
2. **packages/web** - Update LiveStore initialization and worker setup
3. **packages/worker** - Update Cloudflare Worker configuration
4. **packages/server** - Update Node adapter usage
5. **packages/auth-worker** - Review for any impacts

### Phase 4: Testing & Validation
1. Run unit tests across all packages
2. Run E2E tests
3. Manual testing of key workflows
4. Verify multiplayer synchronization

## Detailed Changes by Package

### 1. pnpm-workspace.yaml
**Changes Required:**
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
  "@livestore/wa-sqlite": 0.4.0-dev.7  # Now follows LiveStore versioning

  # Ensure compatible versions
  vite: "^7.1.3"  # Required by LiveStore
```

### 2. packages/web

#### A. Create New LiveStore Worker File
**IMPORTANT CORRECTION:** The worker file STILL includes sync configuration, but uses different imports

**Create:** `packages/web/src/livestore.worker.ts`
```typescript
import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'  // Note: /client subpath and makeWsSync instead of makeCfSync
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
    backend: makeWsSync({ url: getSyncUrl() }),  // makeWsSync instead of makeCfSync
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
})
```

#### B. Update vite.config.ts
**IMPORTANT:** The wrangler dev integration should ONLY be added for local development, not production builds.

**Changes:**
1. Add wrangler dev integration for local development ONLY
2. Update worker format configuration
3. Remove wa-sqlite from optimizeDeps exclusions (may no longer be needed)

```typescript
import { spawn } from 'node:child_process'
// ... other imports

const isDevelopment = process.env.NODE_ENV !== 'production'

export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 60_001,
    fs: { strict: false },  // Add this
  },
  worker: { format: 'es' },  // Always use 'es' format
  // Remove optimizeDeps.exclude for wa-sqlite if no longer needed
  plugins: [
    // ... existing plugins
    // Add wrangler dev plugin ONLY for local development
    isDevelopment && {
      name: 'wrangler-dev',
      configureServer: async (server) => {
        const wrangler = spawn('./node_modules/.bin/wrangler', ['dev', '--port', '8787'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          cwd: path.resolve(__dirname, '../worker'), // Run from worker package
        })

        const shutdown = () => {
          if (wrangler.killed === false) {
            wrangler.kill()
          }
          process.exit(0)
        }

        server.httpServer?.on('close', shutdown)
        process.on('SIGTERM', shutdown)
        process.on('SIGINT', shutdown)

        wrangler.on('exit', (code) => console.error(`wrangler dev exited with code ${code}`))
      },
    },
  ].filter(Boolean),
})
```

#### C. Update Root.tsx
**Changes:**
1. Update worker import to use the new livestore.worker.ts file with `?worker` suffix
2. Import worker at the top of the file
3. Pass the imported worker directly (not as a function)

```typescript
// Add at top of file
import LiveStoreWorker from './livestore.worker.ts?worker'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'

// Update adapter configuration
const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,  // Pass directly, not as a function
  sharedWorker: LiveStoreSharedWorker,
})
```

### 3. packages/worker

#### A. Worker File Changes
The `packages/worker/src/livestore.worker.ts` is NO LONGER USED by the web app in v0.4.0. The web app uses its own simplified worker without sync configuration.

#### B. Update functions/_worker.ts
No changes needed for the Cloudflare Worker functions - they should continue to work with the new version for serving the sync endpoint.

### 4. packages/shared

#### A. Update Schema for Breaking Changes
**Review and update:**
1. QueryBuilder.first() usage - check if any code relies on throwing behavior
2. Add behavior parameter where needed:
```typescript
// Old: throws when no match
const user = table.query.first()

// New: returns undefined
const user = table.query.first()

// To preserve old behavior
const user = table.query.first({ behaviour: "error" })
```

#### B. Raw SQL Event (if needed)
If the project uses raw SQL events, explicitly define them:
```typescript
import { Events, Schema } from '@livestore/livestore'

const rawSqlEvent = Events.clientOnly({
  name: 'livestore.RawSql',
  schema: Schema.Struct({
    sql: Schema.String,
    bindValues: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Any })),
    writeTables: Schema.optional(Schema.ReadonlySet(Schema.String)),
  }),
})
```

### 5. packages/server

#### A. Update Sync Imports
**Breaking change:** Update sync imports in `packages/server/src/factories/store-factory.ts`

```typescript
// Old (line 3)
import { makeCfSync } from '@livestore/sync-cf'

// New - needs investigation for server-side usage
// Option 1: Use client version (if compatible)
import { makeWsSync } from '@livestore/sync-cf/client'

// Option 2: May need server-specific import
import { makeSync } from '@livestore/sync-cf/cf-worker'

// Update usage (line 130)
backend: makeWsSync({ url: config.syncUrl })  // or appropriate server function
```

#### B. Update Store Shutdown Calls
**Breaking change:** Update any `store.shutdown()` calls

```typescript
// Old
await store.shutdown()

// New (using Promise API)
await store.shutdownPromise()
```

#### C. Review QueryBuilder Usage
Check all `.first()` calls and update as needed for new behavior.

### 6. packages/auth-worker
Review for any LiveStore usage and apply similar updates as needed.

## Migration Steps

### Step 1: Update Dependencies
```bash
# Update pnpm-workspace.yaml with new versions
# Then run:
pnpm install
```

### Step 2: Create Worker File
```bash
# Create new worker file in web package
touch packages/web/src/livestore.worker.ts
# Add the worker code as specified above
```

### Step 3: Update Configuration Files
1. Update vite.config.ts with wrangler integration
2. Update Root.tsx to use new worker import

### Step 4: Fix Breaking Changes
1. Search for all `store.shutdown()` calls and update to `store.shutdownPromise()`
2. Search for all `.first()` calls on query builders and review behavior
3. Check for any raw SQL event usage

### Step 5: Test Each Package
```bash
# Run tests for each package
pnpm --filter @work-squared/shared test
pnpm --filter @work-squared/web test
pnpm --filter @work-squared/server test
pnpm --filter @work-squared/auth-worker test

# Run E2E tests
CI=true pnpm test:e2e
```

### Step 6: Test Development Environment
```bash
# Start the development environment
pnpm dev

# Test key functionalities:
# 1. Create and update projects
# 2. Create and move tasks
# 3. Real-time synchronization between tabs
# 4. Chat functionality
# 5. Document creation and editing
```

### Step 7: Run Quality Checks
```bash
# Run comprehensive checks
pnpm lint-all
pnpm typecheck
```

## Potential Issues & Solutions

### Issue 1: TypeScript Errors with exactOptionalPropertyTypes
**Solution:** The new version enables `exactOptionalPropertyTypes`. Review and fix any TypeScript errors that arise from stricter optional property checking.

### Issue 2: Worker Bundling Issues
**Solution:** Ensure the worker format is set to 'es' in vite.config.ts and that the worker file imports are using the `?worker` suffix.

### Issue 3: Synchronization Issues
**Solution:** Verify that the wrangler dev integration is working correctly and that WebSocket connections are established properly.

### Issue 4: Query Errors
**Solution:** Review all `.first()` query calls. If errors are expected when no rows match, explicitly use `{ behaviour: "error" }`.

## Rollback Plan
If issues are encountered:
1. Git reset to the previous commit
2. Restore pnpm-workspace.yaml to v0.3.1 versions
3. Run `pnpm install` to restore previous dependencies
4. Verify functionality

## Success Criteria
- [ ] All packages build successfully
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Manual testing confirms core functionality works
- [ ] Real-time synchronization works between tabs
- [ ] No TypeScript errors
- [ ] Development environment starts without errors

## Additional Findings from cf-chat Example

After reviewing the LiveStore 0.4.0 cf-chat example, here are additional patterns and changes:

### Important Patterns from cf-chat:
1. **Worker Import Syntax**: Uses `?worker` suffix for worker imports
   ```typescript
   import LiveStoreWorker from './livestore.worker.ts?worker'
   import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
   ```

2. **Sync Import Changes**: Critical breaking change in imports:
   ```typescript
   // OLD (v0.3.1)
   import { makeCfSync } from '@livestore/sync-cf'

   // NEW (v0.4.0) - must use /client subpath
   import { makeWsSync } from '@livestore/sync-cf/client'
   ```

3. **Worker Still Has Sync**: The worker STILL includes sync configuration (initial analysis was incorrect)

4. **Vite Config Differences**:
   - Still excludes wa-sqlite from optimizeDeps
   - Uses livestoreDevtoolsPlugin with schema path
   - No wrangler spawn in their vite config (they use concurrent scripts instead)

5. **Package Versions**: They use exact versions (0.4.0-dev.7) not catalog references

## Specific Code Changes Found

After analyzing both our codebase and the cf-chat example, here are the specific changes needed:

### 1. Store Shutdown Calls (packages/server)
**Files to update:**
- `packages/server/src/services/store-manager.ts` (lines 97, 172)
  - Change `await storeInfo.store.shutdown()` to `await storeInfo.store.shutdownPromise()`

### 2. QueryBuilder.first() Usage
**Good news:** No usage of LiveStore's QueryBuilder.first() found in the codebase. All `.first()` calls are DOM-related (Playwright tests) or array operations, not LiveStore queries.

### 3. Raw SQL Events
**Good news:** No usage of raw SQL events found in the codebase.

### 4. Effect API Usage
**Good news:** The codebase doesn't directly use Effect API. All "Effect" references are React useEffect hooks, not the Effect library.

### 5. Worker Configuration - CRITICAL CHANGES
**Current setup:**
- `packages/web/src/Root.tsx` imports worker from `packages/worker/src/livestore.worker.ts`
- `packages/worker/src/livestore.worker.ts` uses `makeCfSync` from `@livestore/sync-cf`

**Breaking changes in v0.4.0:**
1. **Import path change**: `@livestore/sync-cf` no longer has a default export
   - Must import from `@livestore/sync-cf/client` for web workers
2. **Function name change**: `makeCfSync` → `makeWsSync`
3. **Worker location**: Move to `packages/web/src/livestore.worker.ts`

**Changes needed:**
- Create NEW `packages/web/src/livestore.worker.ts` with updated imports:
  ```typescript
  import { makeWorker } from '@livestore/adapter-web/worker'
  import { makeWsSync } from '@livestore/sync-cf/client'  // NEW import
  import { schema } from '@work-squared/shared/schema'

  makeWorker({
    schema,
    sync: {
      backend: makeWsSync({ url: getSyncUrl() }),  // makeWsSync not makeCfSync
      initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
    },
  })
  ```
- Update import in Root.tsx to use `?worker` suffix:
  ```typescript
  import LiveStoreWorker from './livestore.worker.ts?worker'
  ```

### 6. Store Query Patterns
The codebase uses:
- `store.query(db => ...)` pattern in packages/server
- Query functions from `@work-squared/shared/queries` that return observables
- No direct table.query.first() usage

## References
- [LiveStore v0.4.0 Migration Guide](https://dev.docs.livestore.dev/llms-full.txt)
- [LiveStore Breaking Changes Documentation](https://docs.livestore.dev/changelog)
- [Work Squared Architecture Documentation](docs/architecture.md)

## Timeline
Estimated time: 2-4 hours
- Dependency updates: 15 minutes
- Code changes: 1-2 hours (mainly worker relocation and vite config)
- Testing: 1-1.5 hours
- Debugging/fixes: 30 minutes (buffer)

## Deployment Considerations

### Production Deployment via GitHub Actions
The project uses GitHub Actions for deployment (`/.github/workflows/deploy.yml`), which:
1. Builds the web package with production settings
2. Deploys auth-worker to Cloudflare
3. Deploys main worker (with bundled web assets) to Cloudflare

**Important Notes:**
- The wrangler dev integration in vite.config.ts must ONLY run in development
- Production builds happen via `wrangler.jsonc` build command:
  ```json
  "build": {
    "command": "VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev pnpm --filter @work-squared/web build"
  }
  ```
- The worker package serves both WebSocket sync AND static assets in production
- No changes needed to deployment workflow or wrangler.jsonc

### Local Development vs Production
- **Local Dev**: Vite spawns wrangler dev on port 8787 for WebSocket sync
- **Production**: Cloudflare Worker serves both sync and static assets from single deployment

## Critical Insights from cf-chat Review

Based on the cf-chat example analysis, here are critical differences not in the changelog:

1. **Sync Import Breaking Change**: `@livestore/sync-cf` no longer has a default export
   - Must use `@livestore/sync-cf/client` subpath
   - Function renamed: `makeCfSync` → `makeWsSync`
2. **Import Syntax Change**: Must use `?worker` and `?sharedworker` suffixes for Vite imports
3. **Adapter Configuration**: Worker is passed directly, not as a function
4. **wa-sqlite Optimization**: Still needs to be excluded from optimizeDeps in Vite
5. **Development Strategy**: cf-chat uses concurrent scripts instead of Vite plugin for wrangler

## Notes
- **CORRECTED**: Worker still includes sync configuration, but uses `makeWsSync` from `@livestore/sync-cf/client`
- Major breaking change: `@livestore/sync-cf` package restructured with subpath exports
- Only 2 shutdown calls need updating in server package
- No QueryBuilder.first() or raw SQL usage to worry about
- Deployment workflow remains unchanged - production builds work as before
- The wrangler dev integration is development-only and won't affect production
- The upgrade from wa-sqlite independent versioning to LiveStore-aligned versioning should be transparent
- React 19 compatibility is maintained in the new version
- Effect 3.17.9 includes performance improvements that may benefit the application
- The new Vite 7.1.3 requirement may introduce additional build improvements