import { queryDb } from '@livestore/livestore'

import { tables } from './schema.js'

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

// Temporary implementation - returns all documents for now to test functionality
// TODO: Implement proper join query in future story
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
