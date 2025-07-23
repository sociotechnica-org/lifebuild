# Milestone 1: Monorepo Structure - Implementation TODO

**✅ COMPLETED**: This milestone was completed in PR #86 on 2025-07-23

## Overview

This document provides detailed implementation steps for Milestone 1 of the multiplayer release: creating a pnpm workspace monorepo structure.

**Goal**: Reorganize the codebase into packages while maintaining full functionality.

## Pre-Migration Checklist

### 1. Backup Current State

- [x] Commit all current changes
- [x] Create branch: `git checkout -b milestone-1-monorepo`
- [x] Run existing tests to establish baseline: `pnpm test`
- [x] Verify current dev workflow: `pnpm dev` works correctly

### 2. Understand Current Structure

- [x] Document current file locations
- [x] Note all import paths in key files
- [x] List all package.json scripts that will need updating

## Implementation Steps

### Step 1: Create Workspace Structure

#### 1.1 Create Directory Structure

```bash
# Create package directories
mkdir -p packages/web packages/worker packages/shared packages/server

# Create workspace config
touch pnpm-workspace.yaml
```

#### 1.2 Configure pnpm Workspace

- [x] Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

### Step 2: Move Frontend Code (`packages/web`)

#### 2.1 Move Core Files

- [x] Move `src/` → `packages/web/src/`
- [x] Move `public/` → `packages/web/public/`
- [x] Move `index.html` → `packages/web/index.html`
- [x] Copy `.env.example` → `packages/web/.env.example`

#### 2.2 Move Config Files

- [x] Move `vite.config.ts` → `packages/web/vite.config.ts`
- [x] Move `tsconfig.json` → `packages/web/tsconfig.json`
- [x] Move `tailwind.config.js` → `packages/web/tailwind.config.js`
- [x] Move `postcss.config.js` → `packages/web/postcss.config.js`
- [ ] Move `.storybook/` → `packages/web/.storybook/` (Not found - may not be needed)

#### 2.3 Create Web Package.json

- [x] Create `packages/web/package.json`:

```json
{
  "name": "@work-squared/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "storybook": "storybook dev -p 6010",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@work-squared/shared": "workspace:*"
  }
}
```

#### 2.4 Update Import Paths

- [x] Update `packages/web/src/` imports to use `@work-squared/shared`
- [x] Update any absolute paths to be relative within web package
- [x] Fix Storybook config paths in `packages/web/.storybook/` (if applicable)

### Step 3: Move Cloudflare Worker (`packages/worker`)

#### 3.1 Move Worker Files

- [x] Move `functions/` → `packages/worker/functions/`
- [x] Move `wrangler.jsonc` → `packages/worker/wrangler.jsonc`
- [x] Copy `.dev.vars.example` → `packages/worker/.dev.vars.example`

#### 3.2 Create Worker Package.json

- [x] Create `packages/worker/package.json`:

```json
{
  "name": "@work-squared/worker",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev --port 8787",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "@work-squared/shared": "workspace:*"
  }
}
```

#### 3.3 Update Worker Imports

- [x] Update `packages/worker/functions/_worker.ts` imports
- [x] Change `../src/utils/llm-tools/schemas.js` → `@work-squared/shared/llm-tools/schemas`
- [x] Update wrangler.jsonc paths if needed

### Step 4: Create Shared Package (`packages/shared`)

#### 4.1 Extract Shared Types

- [x] Create `packages/shared/src/` directory
- [x] Move `src/livestore/events.ts` → `packages/shared/src/livestore/events.ts`
- [x] Move `src/livestore/schema.ts` → `packages/shared/src/livestore/schema.ts`
- [x] Move `src/utils/llm-tools/` → `packages/shared/src/llm-tools/`
- [x] Move other shared utilities as needed (queries.ts, types.ts)

#### 4.2 Create Shared Package.json

- [x] Create `packages/shared/package.json`:

```json
{
  "name": "@work-squared/shared",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./events": "./src/events.ts",
    "./schema": "./src/schema.ts",
    "./llm-tools": "./src/llm-tools/index.ts"
  }
}
```

#### 4.3 Create Shared Index

- [x] Create `packages/shared/src/index.ts`:

```typescript
// Re-export all shared functionality
export * from './events'
export * from './schema'
export * from './llm-tools'
```

### Step 5: Update Root Configuration

#### 5.1 Update Root Package.json

- [x] Update root `package.json` scripts:

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter @work-squared/web --filter @work-squared/worker dev",
    "dev:web": "pnpm --filter @work-squared/web dev",
    "dev:worker": "pnpm --filter @work-squared/worker dev",
    "build": "pnpm -r build",
    "test": "pnpm --filter @work-squared/web test",
    "lint": "pnpm -r lint",
    "format": "pnpm -r format",
    "typecheck": "pnpm -r typecheck"
  }
}
```

#### 5.2 Move Dependencies

- [x] Move web-specific deps from root to `packages/web/package.json`
- [x] Move worker-specific deps from root to `packages/worker/package.json`
- [x] Keep only shared dev tools (prettier, eslint) in root

#### 5.3 Update Config Files

- [x] Update root `.gitignore` to handle package-specific ignores
- [x] Update GitHub Actions workflow paths if needed
- [x] Update any VS Code settings for new structure

### Step 6: Create Server Package Stub

#### 6.1 Basic Server Structure

- [ ] Create `packages/server/package.json`: (Stub not created yet - for future milestone)

```json
{
  "name": "@work-squared/server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "echo 'Server not implemented yet'",
    "build": "echo 'Server not implemented yet'"
  },
  "dependencies": {
    "@work-squared/shared": "workspace:*"
  }
}
```

## Verification Steps

### Test 1: Install Dependencies

```bash
# Clean install
rm -rf node_modules packages/*/node_modules
pnpm install
```

- [x] All packages install successfully
- [x] No dependency resolution errors
- [x] Workspace links created correctly

### Test 2: Development Servers

```bash
# Test individual services
pnpm dev:web    # Should start Vite on port 60001
pnpm dev:worker # Should start Wrangler on port 8787

# Test parallel development
pnpm dev        # Should start both services
```

- [x] Web server starts without errors
- [x] Worker server starts without errors
- [x] Both services can run in parallel
- [x] Hot reload works for both services

### Test 3: Build Process

```bash
pnpm build
```

- [x] Web package builds successfully
- [x] Worker package builds successfully
- [x] No TypeScript errors
- [x] Build outputs in correct locations

### Test 4: Functionality Tests

- [x] Open http://localhost:60001 in browser
- [x] Create a task - verify it works
- [x] Open chat interface - verify it works
- [x] Drag and drop tasks - verify it works
- [x] WebSocket connection established (check browser network tab)
- [x] LLM chat responses work

### Test 5: Shared Package Import

- [x] Verify web package can import from `@work-squared/shared`
- [x] Verify worker package can import from `@work-squared/shared`
- [x] No circular dependency warnings
- [x] TypeScript recognizes shared types

## Rollback Plan

If migration fails at any step:

1. **Return to previous state**:

   ```bash
   git checkout main
   git branch -D milestone-1-monorepo
   ```

2. **Clean up**:
   ```bash
   rm -rf packages/
   rm pnpm-workspace.yaml
   pnpm install
   ```

## Common Issues & Solutions

### Import Path Issues

- **Problem**: Module not found errors
- **Solution**: Check import paths use `@work-squared/shared` syntax
- **Debug**: Use `pnpm list` to verify workspace linking

### Vite Config Issues

- **Problem**: Assets not loading
- **Solution**: Update `packages/web/vite.config.ts` paths
- **Check**: Public directory, index.html location

### Wrangler Config Issues

- **Problem**: Worker not finding functions
- **Solution**: Update `packages/worker/wrangler.jsonc` paths
- **Check**: Functions directory path is correct

### TypeScript Issues

- **Problem**: Type errors after migration
- **Solution**: Update tsconfig.json paths and references
- **Check**: Shared types are exported correctly

## Success Criteria Met

- [x] ✅ Can run `pnpm dev` to start all services (frontend + CF Worker)
- [x] ✅ Shared types work across packages
- [x] ✅ WebSocket sync and LLM proxy still work
- [x] ✅ No regression in existing functionality
- [x] ✅ All existing tests pass
- [x] ✅ Build process works for all packages
- [x] ✅ Ready to proceed to Milestone 2

## Next Steps

Once all items are completed and verified:

1. Commit changes: `git add . && git commit -m "Milestone 1: Monorepo structure complete"`
2. Create PR for review
3. Merge to main after approval
4. Begin Milestone 2: Local Node.js Backend
