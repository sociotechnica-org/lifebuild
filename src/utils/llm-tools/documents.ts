import type { Store } from '@livestore/livestore'
import {
  getDocumentList$,
  getDocumentById$,
  searchDocuments$,
  searchDocumentsWithProject$,
  getAllDocuments$,
  getDocumentProjectsByProject$,
} from '../../livestore/queries.js'

/**
 * List all available documents
 */
export function listDocuments(store: Store): {
  success: boolean
  documents?: any[]
  error?: string
} {
  try {
    const documents = store.query(getDocumentList$) as any[]
    return {
      success: true,
      documents: documents.map((d: any) => ({
        id: d.id,
        title: d.title,
        updatedAt: d.updatedAt,
      })),
    }
  } catch (error) {
    console.error('Error listing documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Read a specific document by ID
 */
export function readDocument(
  store: Store,
  documentId: string
): { success: boolean; document?: any; error?: string } {
  try {
    if (!documentId?.trim()) {
      return { success: false, error: 'Document ID is required' }
    }

    const documents = store.query(getDocumentById$(documentId)) as any[]
    if (documents.length === 0) {
      return { success: false, error: `Document with ID ${documentId} not found` }
    }

    const document = documents[0]
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
  } catch (error) {
    console.error('Error reading document:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Search documents by query string
 */
export function searchDocuments(
  store: Store,
  query: string
): { success: boolean; results?: any[]; error?: string } {
  try {
    if (!query?.trim()) {
      return { success: false, error: 'Search query is required' }
    }

    const searchQuery = query.trim().toLowerCase()
    const allDocuments = store.query(searchDocuments$(query.trim())) as any[]

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
  } catch (error) {
    console.error('Error searching documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get all documents for a specific project
 */
export function getProjectDocuments(
  store: Store,
  projectId: string
): { success: boolean; documents?: any[]; error?: string } {
  try {
    if (!projectId?.trim()) {
      return { success: false, error: 'Project ID is required' }
    }

    // Get document-project associations and all documents, then filter
    const documentProjects = store.query(getDocumentProjectsByProject$(projectId.trim())) as any[]
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
  } catch (error) {
    console.error('Error getting project documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project documents',
    }
  }
}

/**
 * Search documents within a specific project
 */
export function searchProjectDocuments(
  store: Store,
  query: string,
  projectId?: string
): { success: boolean; results?: any[]; error?: string } {
  try {
    if (!query?.trim()) {
      return { success: false, error: 'Search query is required' }
    }

    const searchQuery = query.trim().toLowerCase()
    let documents = store.query(searchDocumentsWithProject$(query.trim(), projectId)) as any[]

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
  } catch (error) {
    console.error('Error searching project documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search project documents',
    }
  }
}
