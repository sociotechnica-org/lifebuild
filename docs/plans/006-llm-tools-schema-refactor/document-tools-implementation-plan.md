# Document Tools Implementation Plan

## Project Overview

Add complete LLM tool support for all Document events and improve related query tools. This will bring document management functionality to AI assistants working with Work Squared.

## Current Status

**Existing Document Tools (6/11 total):**
- ✅ `list_documents` (getDocumentList$) 
- ✅ `read_document` (getDocumentById$)
- ✅ `search_documents` (searchDocuments$)
- ✅ `get_project_documents` (getDocumentProjectsByProject$)
- ✅ `search_project_documents` (searchDocumentsWithProject$)

**Missing Document Tools (5 events):**
- ❌ `create_document` (documentCreated)
- ❌ `update_document` (documentUpdated) 
- ❌ `archive_document` (documentArchived)
- ❌ `add_document_to_project` (documentAddedToProject)
- ❌ `remove_document_from_project` (documentRemovedFromProject)

## Implementation Plan

### Phase 1: Core Document Operations

#### 1. `create_document` (documentCreated)
**Purpose:** Create a new document with title and content
**Parameters:**
- `title: string` (required)
- `content?: string` (optional, default empty)
**Returns:** Document ID, title, creation timestamp

#### 2. `update_document` (documentUpdated)  
**Purpose:** Update document title and/or content
**Parameters:**
- `documentId: string` (required)
- `title?: string` (optional)
- `content?: string` (optional)
**Returns:** Updated document details

#### 3. `archive_document` (documentArchived)
**Purpose:** Archive a document (soft delete)
**Parameters:**
- `documentId: string` (required)
**Returns:** Success confirmation with archive timestamp

### Phase 2: Project Association Operations

#### 4. `add_document_to_project` (documentAddedToProject)
**Purpose:** Associate an existing document with a project
**Parameters:**
- `documentId: string` (required)
- `projectId: string` (required)  
**Returns:** Success confirmation with relationship details

#### 5. `remove_document_from_project` (documentRemovedFromProject)
**Purpose:** Remove document association from a project (keep document)
**Parameters:**
- `documentId: string` (required)
- `projectId: string` (required)
**Returns:** Success confirmation

## Technical Implementation

### File Changes Required

**1. `src/utils/llm-tools/documents.ts`**
- Add 5 new core functions with proper validation
- Follow existing patterns with `wrapToolFunction`
- Use existing validators from `base.ts`

**2. `src/utils/llm-tools/schemas.ts`**
- Add 5 new OpenAI function schemas
- Follow existing naming convention
- Include proper parameter descriptions

**3. `src/utils/llm-tools/types.ts`**
- Add parameter interfaces for all 5 tools
- Add result interfaces with proper error handling
- Update union types

**4. `src/utils/llm-tools/index.ts`**
- Export new tools in `executeLLMTool` function
- Add to tool mapping

**5. `functions/_worker.ts`**
- Already uses centralized schemas, no changes needed

### Validation Requirements

**Business Logic Validation:**
- Document existence validation for update/archive operations
- Project existence validation for project association
- Prevent duplicate project associations
- Title validation (non-empty for creation)

**Error Handling:**
- Use existing wrapper pattern for consistent error responses
- Provide clear error messages for common failures
- Handle edge cases (missing entities, duplicate associations)

### Testing Strategy

**Unit Tests:**
- Test document CRUD operations
- Test project association/disassociation  
- Test validation logic and error cases
- Test edge cases and boundary conditions

**Integration Tests:**
- Test end-to-end document workflows
- Test interaction with existing document queries
- Verify proper event generation and store updates

## Success Criteria

✅ **Functionality:**
- All 5 document tools working correctly
- Proper validation and error handling
- Integration with existing document queries

✅ **Code Quality:**
- Follow established patterns from existing tools
- Comprehensive test coverage (maintain 100% pass rate)
- Clean, maintainable code with proper TypeScript types

✅ **Documentation:**
- Updated tool status in documentation
- Clear parameter and return value descriptions
- Integration examples

## Implementation Sequence

1. **Setup** - Create feature branch ✅
2. **Core CRUD** - Implement create, update, archive tools  
3. **Project Association** - Implement add/remove project tools
4. **Schemas & Types** - Add all OpenAI schemas and TypeScript interfaces
5. **Testing** - Write comprehensive test coverage
6. **Integration** - Update exports and documentation
7. **Quality Check** - Run all tests, lint, typecheck
8. **Documentation** - Update status tracking documents

## Timeline Estimate

**Implementation:** 2-3 hours
- Core functions: ~1 hour
- Schemas & types: ~30 minutes  
- Testing: ~1 hour
- Documentation: ~30 minutes

This follows the proven patterns established in the previous LLM tools refactoring project and should integrate seamlessly with the existing codebase.