import { queryDb } from '@livestore/livestore'

import { tables } from './schema'

export const app$ = queryDb(tables.uiState.get(), { label: 'app' })

export const getBoards$ = queryDb(
  _get => {
    return tables.boards.select().where({
      deletedAt: undefined,
    })
  },
  { label: 'getBoards' }
)

// New terminology alias
export const getProjects$ = getBoards$

export const getBoardColumns$ = (boardId: string) =>
  queryDb(
    tables.columns
      .select()
      .where({ projectId: boardId })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getBoardColumns:${boardId}`,
    }
  )

// New project terminology alias
export const getProjectColumns$ = getBoardColumns$

export const getBoardColumnsOptional$ = (boardId: string | null) =>
  queryDb(
    tables.columns
      .select()
      .where(boardId !== null ? { projectId: boardId } : { projectId: '__impossible__' }) // Impossible condition returns no results when boardId is null
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getBoardColumnsOptional:${boardId || 'null'}`,
    }
  )

export const getBoardTasks$ = (boardId: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ projectId: boardId, archivedAt: null })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getBoardTasks:${boardId}`,
    }
  )

// New project terminology alias
export const getProjectTasks$ = getBoardTasks$

export const getTaskById$ = (taskId: string) =>
  queryDb(tables.tasks.select().where({ id: taskId }), {
    label: `getTaskById:${taskId}`,
  })

export const getBoardById$ = (boardId: string) =>
  queryDb(tables.boards.select().where({ id: boardId }), {
    label: `getBoardById:${boardId}`,
  })

// New project terminology alias
export const getProjectById$ = getBoardById$

export const getConversations$ = queryDb(
  tables.conversations.select().orderBy([{ col: 'createdAt', direction: 'desc' }]),
  { label: 'getConversations' }
)

export const getConversation$ = (conversationId: string) =>
  queryDb(tables.conversations.select().where({ id: conversationId }), {
    label: `getConversation:${conversationId}`,
  })

export const getConversationMessages$ = (conversationId: string) =>
  queryDb(
    tables.chatMessages
      .select()
      .where({ conversationId })
      .orderBy([{ col: 'createdAt', direction: 'asc' }]),
    {
      label: `getConversationMessages:${conversationId}`,
    }
  )

export const getUsers$ = queryDb(
  tables.users.select().orderBy([{ col: 'name', direction: 'asc' }]),
  { label: 'getUsers' }
)

export const getTaskComments$ = (taskId: string) =>
  queryDb(
    tables.comments
      .select()
      .where({ taskId })
      .orderBy([{ col: 'createdAt', direction: 'desc' }]),
    {
      label: `getTaskComments:${taskId}`,
    }
  )

export const getAllDocuments$ = queryDb(
  tables.documents
    .select()
    .where({ archivedAt: null })
    .orderBy([{ col: 'updatedAt', direction: 'desc' }]),
  { label: 'getAllDocuments' }
)

// Helper query to get document-project associations for a project
export const getDocumentProjectsByProject$ = (projectId: string) =>
  queryDb(tables.documentProjects.select().where({ projectId }), {
    label: `getDocumentProjectsByProject:${projectId}`,
  })

// Get documents for a specific project (client-side filtering for now)
// TODO: Implement proper join query when LiveStore supports complex joins
export const getDocumentsForProject$ = (projectId: string) =>
  queryDb(
    tables.documents
      .select()
      .where({ archivedAt: null })
      .orderBy([{ col: 'updatedAt', direction: 'desc' }]),
    {
      label: `getDocumentsForProject:${projectId}`,
    }
  )

export const getDocumentById$ = (documentId: string) =>
  queryDb(tables.documents.select().where({ id: documentId }), {
    label: `getDocumentById:${documentId}`,
  })

export const getOrphanedTasks$ = queryDb(
  tables.tasks
    .select()
    .where({ projectId: null, archivedAt: null })
    .orderBy([{ col: 'position', direction: 'asc' }]),
  {
    label: 'getOrphanedTasks',
  }
)

export const getOrphanedColumns$ = queryDb(
  tables.columns
    .select()
    .where({ projectId: null }) // Use null for orphaned columns
    .orderBy([{ col: 'position', direction: 'asc' }]),
  {
    label: 'getOrphanedColumns',
  }
)

export const getDocumentList$ = queryDb(
  tables.documents
    .select()
    .where({ archivedAt: null })
    .orderBy([{ col: 'updatedAt', direction: 'desc' }]),
  { label: 'getDocumentList' }
)

export const searchDocuments$ = (query: string) =>
  queryDb(tables.documents.select().where({ archivedAt: null }), {
    label: `searchDocuments:${query}`,
  })

export const getWorkers$ = queryDb(
  tables.workers
    .select()
    .where({ isActive: true })
    .orderBy([{ col: 'createdAt', direction: 'desc' }]),
  { label: 'getWorkers' }
)

export const getWorkerById$ = (workerId: string) =>
  queryDb(tables.workers.select().where({ id: workerId }), {
    label: `getWorkerById:${workerId}`,
  })

export const getWorkerProjects$ = (workerId: string) =>
  queryDb(tables.workerProjects.select().where({ workerId }), {
    label: `getWorkerProjects:${workerId}`,
  })

export const getProjectWorkers$ = (projectId: string) =>
  queryDb(tables.workerProjects.select().where({ projectId }), {
    label: `getProjectWorkers:${projectId}`,
  })

export const getAllWorkerProjects$ = queryDb(tables.workerProjects.select(), {
  label: 'getAllWorkerProjects',
})

// Get all document-project associations
export const getAllDocumentProjects$ = queryDb(tables.documentProjects.select(), {
  label: 'getAllDocumentProjects',
})

// Helper query to get project associations for a specific document
export const getDocumentProjectsByDocument$ = (documentId: string) =>
  queryDb(tables.documentProjects.select().where({ documentId }), {
    label: `getDocumentProjectsByDocument:${documentId}`,
  })

// Enhanced search query that will support FTS in Phase 2.4
// For now, returns all documents and filtering is done client-side
export const searchDocumentsWithProject$ = (query: string, projectId?: string) => {
  const baseQuery = tables.documents.select().where({ archivedAt: null })

  // For now, return all documents and let the calling code filter by project
  // TODO: Implement proper join query when LiveStore supports complex joins
  return queryDb(baseQuery, {
    label: `searchDocumentsWithProject:${query}:${projectId || 'all'}`,
  })
}

// Query to get all events for the history panel
export const getAllEvents$ = queryDb(
  tables.eventsLog
    .select()
    .orderBy([{ col: 'createdAt', direction: 'desc' }])
    .limit(100),
  { label: 'getAllEvents' }
)

// Query to get project details with document and task counts (for LLM tools)
export const getProjectDetails$ = (projectId: string) =>
  queryDb(tables.boards.select().where({ id: projectId }), {
    label: `getProjectDetails:${projectId}`,
  })

// Query to get documents by IDs (for efficient bulk lookups)
// TODO: Implement proper IN operator when LiveStore supports it
export const getDocumentsByIds$ = (documentIds: string[]) =>
  queryDb(tables.documents.select().where({ archivedAt: null }), {
    label: `getDocumentsByIds:${documentIds.length}`,
  })

// Settings queries
export const getAllSettings$ = queryDb(
  tables.settings.select().orderBy([{ col: 'key', direction: 'asc' }]),
  { label: 'getAllSettings' }
)

export const getSettingByKey$ = (key: string) =>
  queryDb(tables.settings.select().where({ key }), {
    label: `getSettingByKey:${key}`,
  })

// Contact queries
export const getContacts$ = queryDb(
  tables.contacts
    .select()
    .where({ deletedAt: null })
    .orderBy([{ col: 'name', direction: 'asc' }]),
  { label: 'getContacts' }
)

export const getContactById$ = (contactId: string) =>
  queryDb(tables.contacts.select().where({ id: contactId, deletedAt: null }), {
    label: `getContactById:${contactId}`,
  })

export const getContactByEmail$ = (email: string) =>
  queryDb(tables.contacts.select().where({ email, deletedAt: null }), {
    label: `getContactByEmail:${email}`,
  })

// Project-Contact association queries
export const getProjectContactAssociations$ = (projectId: string) =>
  queryDb(tables.projectContacts.select().where({ projectId }), {
    label: `getProjectContactAssociations:${projectId}`,
  })

export const getContactProjectAssociations$ = (contactId: string) =>
  queryDb(tables.projectContacts.select().where({ contactId }), {
    label: `getContactProjectAssociations:${contactId}`,
  })

// Alias queries for web component compatibility
export const getProjectContacts$ = getProjectContactAssociations$
export const getContactProjects$ = getContactProjectAssociations$

// Recurring tasks queries
export const getRecurringTasks$ = queryDb(
  tables.recurringTasks.select().orderBy([{ col: 'createdAt', direction: 'desc' }]),
  { label: 'getRecurringTasks' }
)

export const getRecurringTaskById$ = (id: string) =>
  queryDb(tables.recurringTasks.select().where({ id }), {
    label: `getRecurringTaskById:${id}`,
  })

// Task execution queries
export const getTaskExecutions$ = (recurringTaskId: string) =>
  queryDb(
    tables.taskExecutions
      .select()
      .where({ recurringTaskId })
      .orderBy([{ col: 'startedAt', direction: 'desc' }]),
    {
      label: `getTaskExecutions:${recurringTaskId}`,
    }
  )

export const getLatestExecution$ = (recurringTaskId: string) =>
  queryDb(
    tables.taskExecutions
      .select()
      .where({ recurringTaskId })
      .orderBy([{ col: 'startedAt', direction: 'desc' }])
      .limit(1),
    {
      label: `getLatestExecution:${recurringTaskId}`,
    }
  )

// ============================================================================
// STATUS-BASED TASK QUERIES
// ============================================================================

/**
 * Get tasks by status for a project
 */
export const getTasksByStatus$ = (projectId: string, status: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ projectId, status, archivedAt: null })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getTasksByStatus:${projectId}:${status}`,
    }
  )

/**
 * Get all tasks grouped by status for a project
 * Returns tasks organized by status
 */
export const getProjectTasksByStatus$ = (projectId: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ projectId, archivedAt: null })
      .orderBy([
        { col: 'status', direction: 'asc' },
        { col: 'position', direction: 'asc' },
      ]),
    {
      label: `getProjectTasksByStatus:${projectId}`,
    }
  )

/**
 * Get task count summary by status for a project
 * Note: Returns all tasks, filtering done client-side
 */
export const getProjectStatusSummary$ = (projectId: string) =>
  queryDb(tables.tasks.select().where({ projectId, archivedAt: null }), {
    label: `getProjectStatusSummary:${projectId}`,
  })

/**
 * Get orphaned tasks by status (no project)
 */
export const getOrphanedTasksByStatus$ = (status: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ projectId: null, status, archivedAt: null })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getOrphanedTasksByStatus:${status}`,
    }
  )
