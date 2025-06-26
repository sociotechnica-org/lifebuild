# Law Firm Demo Cleanup Todo

This document outlines the cleanup tasks needed to revert law firm-specific changes and restore the original Work Squared functionality.

## High Priority Cleanup

### 1. Revert Chat-First Interface

**Goal**: Restore original Projects List page layout with persistent chat sidebar

- [ ] Remove nested `/admin` route structure
- [ ] Restore original layout where main page shows:
  - Projects and Tasks tabs
  - Persistent chat sidebar on the right
- [ ] Remove `ChatOnlyLayout` component if no longer needed
- [ ] Ensure session routing still works but with original UI structure

### 2. Revert Document Seeding

**Goal**: Remove law firm-specific document seeding

- [ ] Remove `docs/seed-content/` directory with law firm documents
- [ ] Remove `seedSessionDocuments` function calls from session creation
- [ ] Clean up any law firm-specific document seeding logic
- [ ] Remove any hardcoded law firm document references

## Medium Priority Cleanup

### 3. Clean Up Code References

**Goal**: Remove law firm-specific code and comments (if any exist)

- [ ] Search codebase for "Danvers", "law firm", "legal" references
- [ ] Remove or genericize law firm-specific comments
- [ ] Clean up any hardcoded law firm terminology

**Note**: Since Virtual Danvers work was never committed, most law firm-specific code should not exist in the codebase.

### 4. Documentation Cleanup

**Goal**: Update documentation to reflect current state

- [ ] Update README if it references law firm demo
- [ ] Clean up any inline code comments about law firm features
- [ ] Ensure documentation reflects the current generic state

## Low Priority Cleanup

### 5. Optional Code Consolidation

**Goal**: Clean up unused code paths (only if time permits)

- [ ] Remove unused components created for law firm demo
- [ ] Consolidate routing if chat-first interface removal leaves unused routes
- [ ] Clean up any unused imports or dependencies

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

## Success Criteria

- [ ] Application returns to original Projects List layout
- [ ] Any remaining law firm-specific content or terminology is removed
- [ ] All useful infrastructure improvements are preserved
- [ ] Application works as expected without document seeding
