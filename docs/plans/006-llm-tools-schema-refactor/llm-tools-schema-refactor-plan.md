# LLM Tools Schema Refactor Plan

## Current State Analysis

### What's Been Completed (PR #78)

The initial LLM tools refactoring is complete with the following changes:

**✅ Modular Structure Created:**

```
src/utils/llm-tools/
├── base.ts          # Core validators, wrappers, schema builders (120 lines)
├── tasks.ts         # Task operations & types (530 lines)
├── projects.ts      # Project operations (61 lines)
├── documents.ts     # Document operations (171 lines)
└── index.ts         # Main exports & executeLLMTool (97 lines)
```

**✅ Duplication Reduction:**

- Validation helpers: `requireId`, `requireEntity`, `validateAssignees`
- Schema builders: `toolDef`, `requiredString`, `optionalString`, `stringArray`
- Error wrappers: `wrapToolFunction`, `wrapStringParamFunction`, `wrapNoParamFunction`
- Consistent error handling across all 16 implemented tools

**✅ Test Organization:**

- Split monolithic test file into 4 category-based files
- Streamlined from 103 to 49 tests (focused on unique logic)
- Unit tests for utilities, integration tests for business logic
- All tests passing (49/49) ✅

**✅ Code Quality:**

- Reduced main file from 983 to ~200-400 lines per category
- TypeScript compilation clean
- Lint/format passing
- No functionality changes - pure refactoring

### Current Implementation Status

**Implemented Tools (16/46 total):**

- ✅ Tasks: 8 tools (create, update, move, archive, get, etc.)
- ✅ Projects: 2 tools (list, get details)
- ✅ Documents: 6 tools (list, read, search, project docs, etc.)

**Missing Tools:** 30 tools still need implementation (see `docs/llm-tools.md`)

## Outstanding Issues

### 1. Schema Duplication Problem

**Issue:** OpenAI function schemas are duplicated between two locations:

- `src/utils/llm-tools/base.ts` - Schema builders (lines 55-79)
- `functions/_worker.ts` - Duplicate schema builders (lines 30-54) + tool definitions (lines 170-295)

**Impact:**

- ~25 lines of duplicate code
- Risk of schemas getting out of sync
- Maintenance overhead

### 2. Missing Tool Schemas

**Issue:** 3 implemented tools lack OpenAI function schemas:

- `get_project_details` (implemented in `projects.ts:31`)
- `get_project_documents` (implemented in `documents.ts:88`)
- `search_project_documents` (implemented in `documents.ts:116`)

**Impact:**

- These tools cannot be called by LLM (missing from OpenAI tools array)
- Incomplete functionality for users

### 3. Type Safety Gap

**Issue:** No TypeScript interfaces for tool schemas

- Runtime validation exists but no compile-time type safety
- IDE support limited for tool parameter construction
- Risk of runtime errors that could be caught at compile time

## Proposed Solutions

### Phase 1: Schema Consolidation (Low Risk)

**Goal:** Eliminate duplication and add missing schemas without changing validation approach

**Changes:**

1. **Create `src/utils/llm-tools/schemas.ts`:**

   - Centralize all OpenAI function schema definitions
   - Export `llmToolSchemas` array for use in `functions/_worker.ts`
   - Add missing schemas for 3 tools

2. **Update `functions/_worker.ts`:**
   - Remove duplicate schema builders (lines 30-54)
   - Import and use `llmToolSchemas` from new file
   - Remove inline tool definitions (lines 170-295)

**Benefits:**

- ✅ Eliminates ~25 lines of duplicate code
- ✅ Adds missing tool functionality
- ✅ Single source of truth for schemas
- ✅ Low risk - no validation logic changes

### Phase 2: TypeScript Interface Addition (Medium Risk)

**Goal:** Add type safety without changing validation approach

**Changes:**

1. **Create `src/utils/llm-tools/types.ts`:**

   - TypeScript interfaces for each tool's parameters
   - TypeScript interfaces for each tool's return types
   - Union types for all tool params/results

2. **Update existing tool implementations:**
   - Use new interfaces instead of current ad-hoc types
   - Maintain existing validation logic

**Benefits:**

- ✅ Compile-time type safety
- ✅ Better IDE support and auto-completion
- ✅ Refactoring safety across codebase
- ✅ Documentation through types

### Phase 3: Zod Migration (High Risk - Future Consideration)

**Goal:** Unified schema definition and validation system

**Changes:**

1. Replace custom validators with Zod schemas
2. Generate both OpenAI schemas and TypeScript types from Zod
3. Single source of truth for validation and type definitions

**Benefits:**

- ✅ Eliminates validation duplication
- ✅ Better error messages
- ✅ Runtime/compile-time consistency
- ✅ Reduced maintenance overhead

**Risks:**

- ⚠️ Large refactor touching all tools
- ⚠️ Bundle size increase
- ⚠️ Team learning curve
- ⚠️ Potential breaking changes

## Recommendation

**Start with Phase 1 (Schema Consolidation):**

- Low risk, high value
- Fixes immediate duplication problem
- Adds missing functionality
- Sets foundation for future improvements

**Consider Phase 2 after Phase 1:**

- Medium risk, medium value
- Provides type safety without validation changes
- Natural progression from Phase 1

**Phase 3 should be separate decision:**

- High risk, high complexity
- Requires broader team discussion
- Should be evaluated after Phase 1 & 2 are complete

## Files That Will Change

### Phase 1 Changes:

- `src/utils/llm-tools/schemas.ts` (new file)
- `functions/_worker.ts` (remove duplication, import schemas)

### Phase 2 Changes:

- `src/utils/llm-tools/types.ts` (new file)
- `src/utils/llm-tools/tasks.ts` (use new interfaces)
- `src/utils/llm-tools/projects.ts` (use new interfaces)
- `src/utils/llm-tools/documents.ts` (use new interfaces)

### Phase 3 Changes:

- All files in `src/utils/llm-tools/` (Zod migration)
- All test files (validation changes)
- `functions/_worker.ts` (schema generation changes)

## Next Steps

1. **Review this plan** - Discuss scope and approach
2. **Get approval for Phase 1** - Low risk, immediate value
3. **Implement Phase 1** - Schema consolidation
4. **Evaluate Phase 2** - After Phase 1 completion
5. **Consider Phase 3** - Future architectural decision

## Success Metrics

- ✅ All tests continue to pass
- ✅ No functionality regression
- ✅ Reduced code duplication
- ✅ Missing tools become available to LLM
- ✅ TypeScript compilation clean
- ✅ Lint/format passing
