# LLM Tools Implementation Status

This document tracks the current implementation status of LLM tools for all events and queries in the Work Squared codebase.

## Overview

Work Squared uses LiveStore's event-sourced architecture where:

- **Events** represent write operations (mutations)
- **Queries** represent read operations
- **LLM Tools** provide AI assistants access to these operations

## Architecture

The LLM tools system has been fully refactored with a modular architecture:

```
src/utils/llm-tools/
├── base.ts          # Core validators, wrappers, schema builders
├── tasks.ts         # Task operations & validation logic
├── projects.ts      # Project operations
├── documents.ts     # Document operations
├── schemas.ts       # Centralized OpenAI function schemas
├── types.ts         # TypeScript interfaces for all tools
└── index.ts         # Main exports & executeLLMTool
```

**Key Features:**

- ✅ Full TypeScript type safety across all tools
- ✅ Centralized OpenAI schemas in `schemas.ts`
- ✅ Consistent error handling and validation patterns
- ✅ Comprehensive test coverage (298 tests)
- ✅ Optimized validation approach leveraging OpenAI + TypeScript + business logic

## Current Implementation Status

### Events (Write Operations)

| Category          | Event Name                  | Tool | Name                 |
| ----------------- | --------------------------- | ---- | -------------------- |
| **Projects**      | projectCreated              | ❌   | -                    |
| **Columns**       | columnCreated               | ❌   | -                    |
|                   | columnRenamed               | ❌   | -                    |
|                   | columnReordered             | ❌   | -                    |
| **Tasks**         | taskCreated                 | ✅   | create_task          |
|                   | taskMoved                   | ✅   | move_task            |
|                   | taskMovedToProject          | ✅   | move_task_to_project |
|                   | taskUpdated                 | ✅   | update_task          |
|                   | taskArchived                | ✅   | archive_task         |
|                   | taskUnarchived              | ✅   | unarchive_task       |
| **Users**         | userCreated                 | ❌   | -                    |
| **Chat**          | chatMessageSent             | ❌   | -                    |
|                   | llmResponseReceived         | ❌   | -                    |
|                   | llmResponseStarted          | ❌   | -                    |
| **Conversations** | conversationCreated         | ❌   | -                    |
|                   | conversationModelUpdated    | ❌   | -                    |
| **Comments**      | commentAdded                | ❌   | -                    |
| **Documents**     | documentCreated             | ❌   | -                    |
|                   | documentUpdated             | ❌   | -                    |
|                   | documentArchived            | ❌   | -                    |
|                   | documentAddedToProject      | ❌   | -                    |
|                   | documentRemovedFromProject  | ❌   | -                    |
| **Workers**       | workerCreated               | ❌   | -                    |
|                   | workerUpdated               | ❌   | -                    |
|                   | workerAssignedToProject     | ❌   | -                    |
|                   | workerUnassignedFromProject | ❌   | -                    |

### Queries (Read Operations)

| Category          | Query Name                     | Tool | Name                     |
| ----------------- | ------------------------------ | ---- | ------------------------ |
| **App State**     | app$                           | ❌   | -                        |
| **Projects**      | getProjects$                   | ✅   | list_projects            |
|                   | getProjectById$                | ❌   | -                        |
|                   | getProjectDetails$             | ✅   | get_project_details      |
| **Columns**       | getBoardColumns$               | ❌   | -                        |
|                   | getBoardColumnsOptional$       | ❌   | -                        |
|                   | getProjectColumns$             | ❌   | -                        |
|                   | getOrphanedColumns$            | ❌   | -                        |
| **Tasks**         | getBoardTasks$                 | ✅   | get_project_tasks        |
|                   | getProjectTasks$               | ✅   | get_project_tasks        |
|                   | getTaskById$                   | ✅   | get_task_by_id           |
|                   | getOrphanedTasks$              | ✅   | get_orphaned_tasks       |
| **Users**         | getUsers$                      | ❌   | -                        |
| **Conversations** | getConversations$              | ❌   | -                        |
|                   | getConversation$               | ❌   | -                        |
|                   | getConversationMessages$       | ❌   | -                        |
| **Comments**      | getTaskComments$               | ❌   | -                        |
| **Documents**     | getAllDocuments$               | ❌   | -                        |
|                   | getDocumentList$               | ✅   | list_documents           |
|                   | getDocumentById$               | ✅   | read_document            |
|                   | getDocumentsForProject$        | ❌   | -                        |
|                   | getDocumentsByIds$             | ❌   | -                        |
|                   | searchDocuments$               | ✅   | search_documents         |
|                   | searchDocumentsWithProject$    | ✅   | search_project_documents |
|                   | getDocumentProjectsByProject$  | ✅   | get_project_documents    |
|                   | getDocumentProjectsByDocument$ | ❌   | -                        |
|                   | getAllDocumentProjects$        | ❌   | -                        |
| **Workers**       | getWorkers$                    | ❌   | -                        |
|                   | getWorkerProjects$             | ❌   | -                        |
|                   | getProjectWorkers$             | ❌   | -                        |
|                   | getAllWorkerProjects$          | ❌   | -                        |

## Implementation Summary

- **Total Events**: 26 events
- **Events with LLM Tools**: 5 (19.2%)
- **Total Queries**: 31 queries
- **Queries with LLM Tools**: 9 (29.0%)

## Priority Implementation List

### High Priority (Core Operations)

1. **Project Management**

   - `create_project` (projectCreated)
   - `get_project_by_id` (getProjectById$)
   - `get_project_columns` (getBoardColumns$)
   - `get_project_tasks` (getBoardTasks$)

2. **Task Management**

   - ✅ `update_task` (taskUpdated)
   - ✅ `move_task` (taskMoved)
   - ✅ `move_task_to_project` (taskMovedToProject)
   - ✅ `archive_task` (taskArchived)
   - ✅ `unarchive_task` (taskUnarchived)
   - ✅ `get_task_by_id` (getTaskById$)
   - ✅ `get_project_tasks` (getBoardTasks$)
   - ✅ `get_orphaned_tasks` (getOrphanedTasks$)

3. **Document Management**
   - `create_document` (documentCreated)
   - `update_document` (documentUpdated)
   - `add_document_to_project` (documentAddedToProject)

### Medium Priority (Extended Features)

4. **Column Management**

   - `create_column` (columnCreated)
   - `rename_column` (columnRenamed)
   - `reorder_column` (columnReordered)

5. **Worker Management**

   - `create_worker` (workerCreated)
   - `assign_worker_to_project` (workerAssignedToProject)
   - `list_workers` (getWorkers$)

### Low Priority (Advanced Features)

7. **Comments & Conversations**

   - `add_comment` (commentAdded)
   - `get_task_comments` (getTaskComments$)
   - `create_conversation` (conversationCreated)

8. **Specialized Queries**
   - `get_orphaned_tasks` (getOrphanedTasks$)
   - `get_orphaned_columns` (getOrphanedColumns$)

## Implementation Notes

- LLM tool definitions are maintained in `functions/_worker.ts`
- Tool implementations are in `src/utils/llm-tools.ts`
- All tools should follow the existing pattern with proper error handling
- Tools should validate inputs and provide meaningful error messages
- Consider batching related operations for better UX

## Related Files

- `src/livestore/events.ts` - Event definitions
- `src/livestore/queries.ts` - Query definitions
- `src/utils/llm-tools.ts` - LLM tool implementations
- `functions/_worker.ts` - Tool schemas and definitions
