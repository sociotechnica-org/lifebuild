# Multi-Store Server Debugging Findings

## Problem Summary

The multi-store server implementation crashes immediately with "materializer hash mismatch" errors when web clients send their first events. This prevents the server from monitoring LiveStore events from web clients.

## Working Baseline

**✅ CONFIRMED WORKING**: `packages/node-web-sync/` contains a working example where:
- `node-monitor.ts` (node adapter) and `web-client.ts` (web adapter) successfully communicate
- Both use identical simple schema from `schema.ts`
- No materializer hash mismatches occur
- Events flow successfully between different adapters

## Failed Approaches & Findings

### 1. Initial Hypothesis: Store Data Conflicts
**❌ DISPROVEN**: Used fresh store IDs - still crashed with hash mismatches.

### 2. DevTools Configuration Issue  
**❌ DISPROVEN**: Removed devtools from server configuration - still crashed.

### 3. Import/Compilation Issues
**❌ DISPROVEN**: Copy-pasted shared schema code directly instead of importing - still crashed.

### 4. Complex Materializer Theory
**⚠️ PARTIALLY VALIDATED**: 

**Working materializer pattern** (from `node-web-sync/schema.ts`):
```typescript
'v1.MessageCreated': ({ id, text, timestamp }) => {
  return messagesTable.insert({ id, text, timestamp })
}
```

**Failing materializer pattern** (from `shared/schema.ts`):
```typescript
'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) => [
  chatMessages.insert({ id, conversationId, message, role, createdAt }),
  logEvent('v1.ChatMessageSent', { id, conversationId, message, role, createdAt }, createdAt), // ← Function call
],
```

**Test Result**: Created simple materializer version without function calls - still crashed with hash mismatch.

### 5. Schema Compilation Context
**🎯 LIKELY ROOT CAUSE**: 

Even when using identical schema definitions and simple materializers, the `packages/server` context crashes while `packages/node-web-sync` works.

**Evidence**:
- Same schema file works in `node-web-sync` directory
- Same schema file fails when run from `packages/server` directory  
- Even copy-pasted identical code fails in server context
- Different error ("unable to open database file") occurred when running from server context

## Technical Analysis

### LiveStore Materializer Hash Algorithm
LiveStore generates hashes of materializer functions to ensure schema consistency across clients. The hash mismatch suggests:

1. **Function serialization differences** between contexts
2. **Module resolution differences** affecting how functions are compiled
3. **Build/runtime environment differences** between directories

### Environment Differences
- `packages/node-web-sync/`: Standalone scripts, simple tsconfig
- `packages/server/`: Monorepo package context, different build tooling
- Different Node.js module resolution paths
- Different working directories affecting file system operations

## Root Cause Theory

**The multi-store server fails because LiveStore's materializer hash generation is sensitive to the execution context, even when using identical schema code.**

The `packages/server` monorepo environment compiles/executes materializer functions differently than standalone scripts, causing different hash signatures despite identical source code.

## Potential Solutions (Untested)

### 1. Move Server to Standalone Context
- Extract server from monorepo package structure
- Run as standalone script like working `node-web-sync` example
- Use direct file imports instead of package imports

### 2. Simplify Shared Schema  
- Remove all function calls from materializers (like `logEvent()`)
- Use only single-operation materializers
- Avoid arrays of operations in materializers

### 3. Schema Compilation Investigation
- Debug LiveStore's materializer hash generation
- Compare function serialization between contexts
- Investigate tsconfig/build differences

### 4. Alternative Architecture
- Use separate sync mechanism instead of shared LiveStore
- Implement event forwarding at transport level
- Use different stores for server vs web clients

## Files Modified During Investigation

**Test files created** (need cleanup):
- `packages/node-web-sync/simple-web-test.ts`
- `packages/node-web-sync/copy-paste-test.ts` 
- `packages/node-web-sync/simple-materializer-test.ts`
- `packages/server/src/test-simple-schema.ts`
- `packages/server/src/test-simple-server.ts`

**Working files** (keep):
- `packages/node-web-sync/node-monitor.ts`
- `packages/node-web-sync/web-client.ts`  
- `packages/node-web-sync/schema.ts`

## Recommendation

**Investigate LiveStore's materializer hash generation mechanism** to understand why identical schemas produce different hashes in different execution contexts. This appears to be a fundamental incompatibility between the monorepo package environment and LiveStore's consistency checks.

Consider **extracting the multi-store server from the monorepo structure** as a temporary workaround while investigating the root cause.