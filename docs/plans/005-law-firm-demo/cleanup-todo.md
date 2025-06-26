# Law Firm Demo Cleanup Todo

This document outlines the cleanup tasks needed to revert law firm-specific changes and restore the original Work Squared functionality.

## High Priority Cleanup

### 1. Revert Chat-First Interface ✅ COMPLETED

**Goal**: Restore original Projects List page layout with persistent chat sidebar

- [x] Remove nested `/admin` route structure
- [x] Restore original layout where main page shows:
  - Projects and Tasks tabs
  - Persistent chat sidebar on the right
- [x] Remove `ChatOnlyLayout` component if no longer needed
- [x] Ensure session routing still works but with original UI structure
- [x] Fix navigation links to use new routes (removed /admin paths)
- [x] Update E2E tests for new routing structure
- [x] Fix Projects tab highlighting on root route

### 2. Revert Document Seeding ✅ COMPLETED

**Goal**: Remove law firm-specific document seeding

- [x] Remove `src/util/seeds/` directory with law firm documents (5 files deleted)
- [x] Remove `seedSessionDocuments` function calls from session creation
- [x] Clean up any law firm-specific document seeding logic from ProjectWorkspace
- [x] Remove any hardcoded law firm document references
- [x] Delete `tests/integration/document-seeding.test.ts`

## Medium Priority Cleanup

### 3. Clean Up Code References ✅ COMPLETED

**Goal**: Remove law firm-specific code and comments (if any exist)

- [x] Search codebase for "Danvers", "law firm", "legal" references
- [x] Remove or genericize law firm-specific comments
- [x] Clean up any hardcoded law firm terminology

**Note**: Since Virtual Danvers work was never committed, most law firm-specific code did not exist in the codebase. Document seeding removal covered all law firm references.

### 4. Documentation Cleanup ✅ COMPLETED

**Goal**: Update documentation to reflect current state

- [x] Update README if it references law firm demo (no references found)
- [x] Clean up any inline code comments about law firm features (removed with seeding code)
- [x] Ensure documentation reflects the current generic state
- [x] Updated all stream todo docs with final completion status
- [x] Updated main law firm demo plan document

## Low Priority Cleanup

### 5. Optional Code Consolidation ✅ COMPLETED

**Goal**: Clean up unused code paths (only if time permits)

- [x] Remove unused components created for law firm demo (`ChatOnlyLayout` deleted)
- [x] Consolidate routing if chat-first interface removal leaves unused routes (reverted to original structure)
- [x] Clean up any unused imports or dependencies (removed with deleted files)
- [x] Updated E2E tests to match new routing
- [x] Fixed navigation links throughout codebase

## Preserve These Features

### ✅ Keep These (They're Useful)

- Document tools (`list_documents`, `read_document`, `search_documents`)
- Session management and URL-based sessions
- localStorage persistence and storeId handling
- Mobile chat optimizations
- Production deployment improvements
- API key persistence fixes

### ⚠️ Evaluate These

- Admin/inspector routes (might be useful for debugging)
- Session sharing functionality (copy URL, new session buttons)

## Notes

- Focus on removing law firm-specific content while preserving generally useful infrastructure
- The document tools should remain as they could be valuable for future advisor features
- Session management improvements should be preserved
- This cleanup prepares the codebase for potential future "advisors" feature development

## Success Criteria ✅ ALL COMPLETED

- [x] Application returns to original Projects List layout
- [x] Any remaining law firm-specific content or terminology is removed
- [x] All useful infrastructure improvements are preserved
- [x] Application works as expected without document seeding
- [x] All tests pass (unit tests, E2E tests, linting, typecheck)
- [x] PR created and merged successfully
- [x] All CI checks pass
- [x] Cursor BugBot feedback addressed

## Cleanup Summary

**Completed Work:**
- Reverted chat-first interface back to original Projects List layout
- Removed all `/admin` routes and restored original routing structure
- Deleted `ChatOnlyLayout` component
- Fixed navigation links and active state detection
- Removed all law firm document seeding (5 seed files deleted)
- Updated E2E tests for new routing
- Fixed Projects tab highlighting on root route
- All quality checks passed (lint-all, tests, E2E)
- PR merged successfully with all CI checks passing

**Branch:** `cleanup/revert-law-firm-demo`
**PR:** Successfully merged after addressing BugBot feedback
**Status:** ✅ Cleanup complete - codebase restored to original state with useful infrastructure preserved
