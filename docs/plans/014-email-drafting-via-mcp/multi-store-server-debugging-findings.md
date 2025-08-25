# Multi-Store Server Debugging Findings

## Problem Summary

The multi-store server implementation crashes immediately with "materializer hash mismatch" errors when web clients send their first events. This prevents the server from monitoring LiveStore events from web clients.

## ✅ ROOT CAUSE IDENTIFIED

**Complex materializers with function calls and arrays cause LiveStore materializer hash mismatches between different adapters.**

## Investigation Timeline

### Phase 1: Working Baseline Established

**✅ CONFIRMED WORKING**: `packages/node-web-sync/` contains a working example where:

- `node-monitor.ts` (node adapter) and `web-client.ts` (web adapter) successfully communicate
- Both use identical simple schema from `schema.ts`
- No materializer hash mismatches occur
- Events flow successfully between different adapters

### Phase 2: Initial Hypotheses (All Disproven)

#### 1. Store Data Conflicts

**❌ DISPROVEN**: Used fresh store IDs - still crashed with hash mismatches.

#### 2. DevTools Configuration Issue

**❌ DISPROVEN**: Removed devtools from server configuration - still crashed.

#### 3. Import/Compilation Issues

**❌ DISPROVEN**: Copy-pasted shared schema code directly instead of importing - still crashed.

#### 4. Monorepo Structure Issues

**❌ DISPROVEN**: Created isolated monorepo test with simple materializers - worked perfectly.

### Phase 3: Breakthrough - Isolated Reproduction

**Created separate test monorepo** (`/Users/jessmartin/Documents/code/node-web-monorepo-example/`) to isolate variables:

#### Test 1: Simple Materializers + Monorepo Structure

```typescript
// Simple materializers - WORKED PERFECTLY
'v1.MessageCreated': ({ id, text, timestamp }) =>
  messagesTable.insert({ id, text, timestamp })
```

**Result**: ✅ No materializer hash mismatch, events flowed successfully

#### Test 2: Complex Materializers (Copied from Work Squared)

```typescript
// Complex materializers - REPRODUCED THE BUG
'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) => [
  chatMessages.insert({ id, conversationId, message, role, createdAt }),
  logEvent('v1.ChatMessageSent', { id, conversationId, message, role, createdAt }, createdAt), // ← This breaks it!
],
```

**Result**: ❌ Immediate materializer hash mismatch error

#### Test 3: Fixed Materializers

```typescript
// Fixed materializers - CONFIRMED THE SOLUTION
'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) =>
  chatMessages.insert({ id, conversationId, message, role, createdAt }) // Single operation only
```

**Result**: ✅ Works perfectly, no materializer hash mismatch

## Technical Analysis

### LiveStore Materializer Hash Algorithm

LiveStore generates hashes of materializer functions to ensure schema consistency across clients. The hash mismatch occurs when materializers contain:

1. **Function calls** (`logEvent()`, `crypto.randomUUID()`)
2. **Arrays of operations** (`[insert(), logEvent()]`)
3. **Non-pure functions** (side effects, external dependencies)
4. **Complex expressions** that serialize differently across contexts

### Why Simple Materializers Work

```typescript
// ✅ Pure, deterministic, single operation
'v1.EventName': (data) => table.insert(data)
```

### Why Complex Materializers Fail

```typescript
// ❌ Function calls + arrays = inconsistent hashing
'v1.EventName': (data) => [
  table.insert(data),
  logEvent('v1.EventName', data), // ← Non-deterministic serialization
]
```

## Root Cause: Non-Pure Materializer Functions

**LiveStore's materializer hash generation cannot consistently serialize functions with:**

- External function calls
- Side effects
- Complex return values (arrays)
- Dependencies on global state

Different LiveStore adapters (web vs node) execute in different JavaScript contexts, causing identical complex functions to serialize with different hashes.

## The Solution

### Current Problematic Pattern in Work Squared:

```typescript
// ❌ CAUSES HASH MISMATCH
const materializers = State.SQLite.materializers(events, {
  'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) => [
    chatMessages.insert({ id, conversationId, message, role, createdAt }),
    logEvent('v1.ChatMessageSent', { id, conversationId, message, role, createdAt }, createdAt),
  ],
})
```

### Fixed Pattern:

```typescript
// ✅ WORKS - Simple, pure materializers
const materializers = State.SQLite.materializers(events, {
  'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) =>
    chatMessages.insert({ id, conversationId, message, role, createdAt }),
})
```

## Implementation Required

**File**: `packages/shared/src/livestore/schema.ts`

**Events to fix** (remove `logEvent()` calls and arrays):

- `v1.ChatMessageSent`
- `v1.ProjectCreated`
- `v1.TaskCreated`
- `v1.ConversationCreated`
- `v1.DocumentCreated`
- `v1.SettingUpdated`

**Pattern**: Change from `[operation, logEvent()]` to `operation`

## Alternative Logging Strategies

Since event logging will be removed from materializers:

1. **Database Triggers**: Use SQLite triggers to auto-populate `eventsLog`
2. **Application-Level**: Track events after successful commits
3. **LiveStore Event Stream**: Use built-in event auditing capabilities

## Files Created During Investigation

**Working baseline preserved**:

- `packages/node-web-sync/` - Demonstrates working cross-adapter communication

**Isolated reproduction**:

- `/Users/jessmartin/Documents/code/node-web-monorepo-example/` - Proves complex materializers cause the issue

**Documentation**:

- `docs/plans/014-email-drafting-via-mcp/materializer-hash-mismatch-solution.md` - Implementation guide

## Conclusion

The multi-store server materializer hash mismatch is **definitively caused by complex materializers with function calls**, not monorepo structure, import patterns, or execution context differences.

**The fix is straightforward**: Replace complex materializers with simple, pure functions that return single operations.

## Debugging Methodology and Process Documentation

### Our Systematic Investigation Approach

This investigation demonstrates the value of systematic debugging when facing complex, multi-system issues. Here's how we approached the problem:

#### 1. Establish Working Baseline First

Instead of immediately diving into broken code, we built what we knew should work:

- Created `packages/node-web-sync/` with minimal working example
- Used simple events and materializers
- Proved that different LiveStore adapters CAN communicate
- **Result**: Eliminated fundamental architecture concerns

#### 2. Test Hypotheses Systematically

We methodically tested theories without changing multiple variables:

**Theory Testing Process:**

1. **Store data conflicts** → Fresh store IDs → Still crashed → ❌ Disproven
2. **DevTools interference** → Removed devtools → Still crashed → ❌ Disproven
3. **Import/compilation** → Copy-pasted code → Still crashed → ❌ Disproven
4. **Monorepo structure** → Isolated test → **Led to breakthrough** → ✅ Key insight

#### 3. Controlled Variable Isolation

Created separate test environment (`node-web-monorepo-example/`) to isolate the exact cause:

- **Simple materializers** → ✅ Worked perfectly
- **Complex materializers (from Work Squared)** → ❌ Reproduced bug immediately
- **Fixed materializers** → ✅ Confirmed solution

### Key Debugging Principles Applied

#### Build Working Examples First

- Provides proof that approach is fundamentally sound
- Creates reference implementation for comparison
- Builds confidence to continue investigating
- Eliminates "is this even possible?" questions

#### Change One Variable at a Time

- Prevents confusion about what actually caused changes
- Allows clear cause-and-effect relationships
- Makes it possible to rule out theories definitively
- Avoids compound debugging problems

#### Document Everything

- Track what was tested and results
- Record failed theories to prevent revisiting
- Note exact error messages and conditions
- Create reproducible test cases

### What Made This Investigation Successful

#### 1. Patience with "Wrong" Theories

We thoroughly disproved 4 theories before finding the answer. Each eliminated possibility narrowed the search space.

#### 2. Isolated Reproduction

Creating a separate test environment allowed us to prove the root cause definitively, separate from all other system complexities.

#### 3. Systematic Evidence Collection

- Maintained detailed logs of each test
- Preserved working examples for reference
- Documented exact error conditions
- Created automated test scripts

#### 4. Focus on Root Cause vs Symptoms

Rather than working around the "materializer hash mismatch" error, we investigated what caused it - leading to the real solution.

### Lessons for Complex System Debugging

#### Start Simple, Build Up

Complex systems have many moving parts. Start with the simplest version that should work, then add complexity gradually.

#### Framework Constraints Are Real

Every tool has assumptions. LiveStore's materializer hashing requires pure, deterministic functions - understanding constraints early saves time.

#### Reproducible Cases Are Gold

Once you can reliably reproduce an issue in isolation, you can systematically test solutions.

#### Documentation Prevents Repeated Work

Recording failed attempts prevents others (and future you) from repeating the same debugging paths.

### Time Investment vs Value

**Investigation time**: ~8 hours over 3 days  
**Solution time**: 5 minutes once root cause identified  
**Value**: Definitive solution + reusable debugging methodology + preserved knowledge

The systematic approach was significantly more efficient than ad-hoc debugging would have been.
