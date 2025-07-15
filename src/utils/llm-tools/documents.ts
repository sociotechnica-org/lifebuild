import type { Store } from '@livestore/livestore'
import {
  getDocumentList$,
  getDocumentById$,
  searchDocuments$,
  searchDocumentsWithProject$,
  getAllDocuments$,
  getDocumentProjectsByProject$,
} from '../../livestore/queries.js'
import { validators, wrapStringParamFunction, wrapNoParamFunction } from './base.js'
import type {
  ListDocumentsResult,
  ReadDocumentResult,
  SearchDocumentsResult,
  GetProjectDocumentsResult,
  SearchProjectDocumentsResult,
} from './types.js'

/**
 * List all available documents (core implementation)
 */
function listDocumentsCore(store: Store): ListDocumentsResult {
  const documents = store.query(getDocumentList$) as any[]
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
  const allDocuments = store.query(searchDocuments$(trimmedQuery)) as any[]

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
  const documentProjects = store.query(getDocumentProjectsByProject$(projectId)) as any[]
  const allDocuments = store.query(getAllDocuments$) as any[]
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
  let documents = store.query(searchDocumentsWithProject$(trimmedQuery, projectId)) as any[]

  // If projectId is provided, filter documents by project
  if (projectId) {
    const documentProjects = store.query(getDocumentProjectsByProject$(projectId)) as any[]
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

// Export wrapped versions for external use
export const listDocuments = wrapNoParamFunction(listDocumentsCore)
export const readDocument = wrapStringParamFunction(readDocumentCore)
export const searchDocuments = wrapStringParamFunction(searchDocumentsCore)
export const getProjectDocuments = wrapStringParamFunction(getProjectDocumentsCore)

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
