# LLM Tools Implementation Status

This document tracks the current implementation status of LLM tools for all events and queries in the Work Squared codebase.

## Overview

Work Squared uses LiveStore's event-sourced architecture where:

- **Events** represent write operations (mutations)
- **Queries** represent read operations
- **LLM Tools** provide AI assistants access to these operations

## Current Implementation Status

### Events (Write Operations)

| Category          | Event Name                  | Tool | Name        |
| ----------------- | --------------------------- | ---- | ----------- |
| **Projects**      | projectCreated              | ❌   | -           |
| **Columns**       | columnCreated               | ❌   | -           |
|                   | columnRenamed               | ❌   | -           |
|                   | columnReordered             | ❌   | -           |
| **Tasks**         | taskCreated                 | ✅   | create_task |
|                   | taskMoved                   | ❌   | -           |
|                   | taskMovedToProject          | ❌   | -           |
|                   | taskUpdated                 | ❌   | -           |
|                   | taskArchived                | ❌   | -           |
|                   | taskUnarchived              | ❌   | -           |
| **Users**         | userCreated                 | ❌   | -           |
| **Chat**          | chatMessageSent             | ❌   | -           |
|                   | llmResponseReceived         | ❌   | -           |
|                   | llmResponseStarted          | ❌   | -           |
| **Conversations** | conversationCreated         | ❌   | -           |
|                   | conversationModelUpdated    | ❌   | -           |
| **Comments**      | commentAdded                | ❌   | -           |
| **Documents**     | documentCreated             | ❌   | -           |
|                   | documentUpdated             | ❌   | -           |
|                   | documentArchived            | ❌   | -           |
|                   | documentAddedToProject      | ❌   | -           |
|                   | documentRemovedFromProject  | ❌   | -           |
| **Workers**       | workerCreated               | ❌   | -           |
|                   | workerUpdated               | ❌   | -           |
|                   | workerAssignedToProject     | ❌   | -           |
|                   | workerUnassignedFromProject | ❌   | -           |

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
| **Tasks**         | getBoardTasks$                 | ❌   | -                        |
|                   | getProjectTasks$               | ❌   | -                        |
|                   | getTaskById$                   | ❌   | -                        |
|                   | getOrphanedTasks$              | ❌   | -                        |
|                   | getOrphanedColumns$            | ❌   | -                        |
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
- **Events with LLM Tools**: 1 (3.8%)
- **Total Queries**: 31 queries
- **Queries with LLM Tools**: 8 (25%)

## Priority Implementation List

### High Priority (Core Operations)

1. **Project Management**

   - `create_project` (projectCreated)
   - `get_project_by_id` (getProjectById$)
   - `get_project_columns` (getBoardColumns$)
   - `get_project_tasks` (getBoardTasks$)

2. **Task Management**

   - `update_task` (taskUpdated)
   - `move_task` (taskMoved)
   - `archive_task` (taskArchived)
   - `get_task_by_id` (getTaskById$)

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

6. **User Management**
   - `create_user` (userCreated)
   - `list_users` (getUsers$)

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
