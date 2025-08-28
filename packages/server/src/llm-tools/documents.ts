import type { Store } from '@livestore/livestore'
import { events } from '@work-squared/shared/schema'
import {
  getDocumentList$,
  getDocumentById$,
  searchDocuments$,
  searchDocumentsWithProject$,
  getAllDocuments$,
  getDocumentProjectsByProject$,
  getProjects$,
} from '@work-squared/shared/queries'
import {
  validators,
  wrapStringParamFunction,
  wrapNoParamFunction,
  wrapToolFunction,
} from './base.js'
import type {
  ListDocumentsResult,
  ReadDocumentResult,
  SearchDocumentsResult,
  GetProjectDocumentsResult,
  SearchProjectDocumentsResult,
  CreateDocumentParams,
  CreateDocumentResult,
  UpdateDocumentParams,
  UpdateDocumentResult,
  ArchiveDocumentResult,
  AddDocumentToProjectParams,
  AddDocumentToProjectResult,
  RemoveDocumentFromProjectParams,
  RemoveDocumentFromProjectResult,
} from './types.js'

/**
 * List all available documents (core implementation)
 */
function listDocumentsCore(store: Store): ListDocumentsResult {
  const documents = (store.query(getDocumentList$) || []) as any[]
  return {
    success: true,
    documents: documents.map((d: any) => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
    })),
  }
}

/**
 * Read a specific document by ID (core implementation)
 */
function readDocumentCore(store: Store, documentId: string): ReadDocumentResult {
  const documents = store.query(getDocumentById$(documentId)) as any[]
  const document = validators.requireEntity(documents, 'Document', documentId)

  return {
    success: true,
    document: {
      id: document.id,
      title: document.title,
      content: document.content,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    },
  }
}

/**
 * Search documents by query string (core implementation)
 */
function searchDocumentsCore(store: Store, query: string): SearchDocumentsResult {
  // Validate query
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required')
  }

  const trimmedQuery = query.trim()
  const searchQuery = trimmedQuery.toLowerCase()
  const allDocuments = (store.query(searchDocuments$(trimmedQuery)) || []) as any[]

  // Filter documents that match the search query in title or content
  const results = allDocuments.filter(
    (d: any) =>
      d.title.toLowerCase().includes(searchQuery) || d.content.toLowerCase().includes(searchQuery)
  )

  return {
    success: true,
    results: results.map((d: any) => ({
      id: d.id,
      title: d.title,
      snippet: d.content.substring(0, 200) + (d.content.length > 200 ? '...' : ''),
    })),
  }
}

/**
 * Get all documents for a specific project (core implementation)
 */
function getProjectDocumentsCore(store: Store, projectId: string): GetProjectDocumentsResult {
  // Validate projectId
  if (!projectId || projectId.trim().length === 0) {
    throw new Error('Project ID is required')
  }

  // Get document-project associations and all documents, then filter
  const documentProjects = (store.query(getDocumentProjectsByProject$(projectId)) || []) as any[]
  const allDocuments = (store.query(getAllDocuments$) || []) as any[]
  const documentIds = new Set(documentProjects.map(dp => dp.documentId))
  const documents = allDocuments.filter(doc => documentIds.has(doc.id))

  return {
    success: true,
    documents: documents.map((d: any) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      updatedAt: d.updatedAt,
      createdAt: d.createdAt,
    })),
  }
}

/**
 * Search documents within a specific project (core implementation)
 */
function searchProjectDocumentsCore(
  store: Store,
  query: string,
  projectId?: string
): SearchProjectDocumentsResult {
  // Validate query
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required')
  }

  const trimmedQuery = query.trim()
  const searchQuery = trimmedQuery.toLowerCase()
  let documents = (store.query(searchDocumentsWithProject$(trimmedQuery, projectId)) || []) as any[]

  // If projectId is provided, filter documents by project
  if (projectId) {
    const documentProjects = (store.query(getDocumentProjectsByProject$(projectId)) || []) as any[]
    const documentIds = new Set(documentProjects.map(dp => dp.documentId))
    documents = documents.filter(doc => documentIds.has(doc.id))
  }

  // Filter documents that match the search query in title or content
  const results = documents.filter(
    (d: any) =>
      d.title.toLowerCase().includes(searchQuery) || d.content.toLowerCase().includes(searchQuery)
  )

  return {
    success: true,
    results: results.map((d: any) => ({
      id: d.id,
      title: d.title,
      snippet: d.content.substring(0, 200) + (d.content.length > 200 ? '...' : ''),
      projectId: projectId,
    })),
  }
}

/**
 * Create a new document (core implementation)
 */
function createDocumentCore(store: Store, params: CreateDocumentParams): CreateDocumentResult {
  const { title, content } = params

  // Validate title
  if (!title || title.trim().length === 0) {
    throw new Error('Document title is required')
  }

  // Create the document
  const documentId = crypto.randomUUID()

  store.commit(
    events.documentCreated({
      id: documentId,
      title: title.trim(),
      content: content?.trim() || '',
      createdAt: new Date(),
    })
  )

  return {
    success: true,
    documentId,
    title: title.trim(),
    content: content?.trim() || '',
  }
}

/**
 * Update an existing document (core implementation)
 */
function updateDocumentCore(store: Store, params: UpdateDocumentParams): UpdateDocumentResult {
  const { documentId, title, content } = params

  // Verify document exists
  const documents = store.query(getDocumentById$(documentId))
  validators.requireEntity(documents, 'Document', documentId)

  // At least one field must be provided for update
  if (title === undefined && content === undefined) {
    throw new Error('At least one field (title or content) must be provided for update')
  }

  // Prepare updates object
  const updates: any = {}
  if (title !== undefined) {
    if (title.trim().length === 0) {
      throw new Error('Document title cannot be empty')
    }
    updates.title = title.trim()
  }
  if (content !== undefined) {
    updates.content = content.trim()
  }

  // Create update event
  store.commit(
    events.documentUpdated({
      id: documentId,
      updates,
      updatedAt: new Date(),
    })
  )

  return {
    success: true,
    document: {
      id: documentId,
      title: updates.title,
      content: updates.content,
    },
  }
}

/**
 * Archive a document (core implementation)
 */
function archiveDocumentCore(store: Store, documentId: string): ArchiveDocumentResult {
  // Verify document exists
  const documents = store.query(getDocumentById$(documentId))
  const document = validators.requireEntity(documents, 'Document', documentId)

  if (document.archivedAt) {
    throw new Error('Document is already archived')
  }

  // Create archive event with consistent timestamp
  const archivedAt = new Date()
  store.commit(
    events.documentArchived({
      id: documentId,
      archivedAt,
    })
  )

  return {
    success: true,
    document: {
      id: documentId,
      archivedAt,
    },
  }
}

/**
 * Add a document to a project (core implementation)
 */
function addDocumentToProjectCore(
  store: Store,
  params: AddDocumentToProjectParams
): AddDocumentToProjectResult {
  const { documentId, projectId } = params

  // Verify document exists
  const documents = store.query(getDocumentById$(documentId))
  validators.requireEntity(documents, 'Document', documentId)

  // Verify project exists
  const projects = store.query(getProjects$) || []
  if (!Array.isArray(projects)) {
    throw new Error('Failed to retrieve projects list')
  }
  const project = projects.find((p: any) => p?.id === projectId)
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  // Check if document is already associated with this project
  const existingAssociations = store.query(getDocumentProjectsByProject$(projectId)) || []
  const alreadyAssociated =
    Array.isArray(existingAssociations) &&
    existingAssociations.some((dp: any) => dp?.documentId === documentId)
  if (alreadyAssociated) {
    throw new Error(`Document is already associated with project ${projectId}`)
  }

  // Create association event
  store.commit(
    events.documentAddedToProject({
      documentId,
      projectId,
    })
  )

  return {
    success: true,
    association: {
      documentId,
      projectId,
    },
  }
}

/**
 * Remove a document from a project (core implementation)
 */
function removeDocumentFromProjectCore(
  store: Store,
  params: RemoveDocumentFromProjectParams
): RemoveDocumentFromProjectResult {
  const { documentId, projectId } = params

  // Verify document exists
  const documents = store.query(getDocumentById$(documentId))
  validators.requireEntity(documents, 'Document', documentId)

  // Verify project exists
  const projects = store.query(getProjects$) || []
  if (!Array.isArray(projects)) {
    throw new Error('Failed to retrieve projects list')
  }
  const project = projects.find((p: any) => p?.id === projectId)
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  // Check if document is associated with this project
  const existingAssociations = store.query(getDocumentProjectsByProject$(projectId)) || []
  const isAssociated =
    Array.isArray(existingAssociations) &&
    existingAssociations.some((dp: any) => dp?.documentId === documentId)
  if (!isAssociated) {
    throw new Error(`Document is not associated with project ${projectId}`)
  }

  // Create removal event
  store.commit(
    events.documentRemovedFromProject({
      documentId,
      projectId,
    })
  )

  return {
    success: true,
    association: {
      documentId,
      projectId,
    },
  }
}

// Export wrapped versions for external use
export const listDocuments = wrapNoParamFunction(listDocumentsCore)
export const readDocument = wrapStringParamFunction(readDocumentCore)
export const searchDocuments = wrapStringParamFunction(searchDocumentsCore)
export const getProjectDocuments = wrapStringParamFunction(getProjectDocumentsCore)
export const createDocument = wrapToolFunction(createDocumentCore)
export const updateDocument = wrapToolFunction(updateDocumentCore)
export const archiveDocument = wrapStringParamFunction(archiveDocumentCore)
export const addDocumentToProject = wrapToolFunction(addDocumentToProjectCore)
export const removeDocumentFromProject = wrapToolFunction(removeDocumentFromProjectCore)

// This function takes two parameters, so we need a custom wrapper
export function searchProjectDocuments(
  store: Store,
  query: string,
  projectId?: string
): SearchProjectDocumentsResult {
  try {
    return searchProjectDocumentsCore(store, query, projectId)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
