import { describe, it, expect, beforeEach } from 'vitest'
import {
  listDocuments,
  readDocument,
  searchDocuments,
  getProjectDocuments,
  searchProjectDocuments,
} from '../../../src/utils/llm-tools/documents.js'
import { createTestStore } from '../../test-utils.js'

describe('LLM Tools - Documents', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore()
  })

  // Mock data
  const mockDocument = {
    id: 'doc-1',
    title: 'Test Document',
    content: 'This is the document content',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
  }

  const mockDocuments = [
    mockDocument,
    {
      id: 'doc-2',
      title: 'Second Document',
      content: 'This is another document',
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-04'),
    },
  ]

  describe('listDocuments', () => {
    it('should return success with empty documents list when no documents exist', () => {
      store.query = () => []

      const result = listDocuments(store)

      expect(result).toEqual({
        success: true,
        documents: [],
      })
    })

    it('should return documents when they exist', () => {
      store.query = () => mockDocuments

      const result = listDocuments(store)

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(2)
      expect(result.documents?.[0]).toEqual({
        id: 'doc-1',
        title: 'Test Document',
        updatedAt: new Date('2023-01-02'),
      })
      expect(result.documents?.[1]).toEqual({
        id: 'doc-2',
        title: 'Second Document',
        updatedAt: new Date('2023-01-04'),
      })
    })

    it('should handle query errors gracefully', () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = listDocuments(store)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
      expect(result.documents).toBeUndefined()
    })
  })

  describe('readDocument', () => {
    it('should return document when it exists', () => {
      store.query = () => [mockDocument]

      const result = readDocument(store, 'doc-1')

      expect(result.success).toBe(true)
      expect(result.document).toEqual(mockDocument)
    })

    it('should return error when document does not exist', () => {
      store.query = () => []

      const result = readDocument(store, 'nonexistent-doc')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document with ID nonexistent-doc not found')
      expect(result.document).toBeUndefined()
    })

    it('should return error when documentId is empty', () => {
      const result = readDocument(store, '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document ID is required')
    })

    it('should return error when documentId is undefined', () => {
      const result = readDocument(store, undefined as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document ID is required')
    })

    it('should return error when documentId is only whitespace', () => {
      const result = readDocument(store, '   ')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document ID is required')
    })

    it('should handle query errors gracefully', () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = readDocument(store, 'doc-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should trim documentId input', () => {
      store.query = () => [mockDocument]

      const result = readDocument(store, '  doc-1  ')

      expect(result.success).toBe(true)
      expect(result.document?.id).toBe('doc-1')
    })
  })

  describe('searchDocuments', () => {
    it('should return matching documents', () => {
      const mockResults = [
        {
          id: 'doc-1',
          title: 'Document about AI',
          content:
            'This document discusses artificial intelligence and its applications in business.',
        },
        {
          id: 'doc-2',
          title: 'AI Implementation Guide',
          content: 'A comprehensive guide to implementing AI solutions in your organization.',
        },
      ]

      store.query = () => mockResults

      const result = searchDocuments(store, 'AI')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results?.[0]).toEqual({
        id: 'doc-1',
        title: 'Document about AI',
        snippet:
          'This document discusses artificial intelligence and its applications in business.',
      })
      expect(result.results?.[1]).toEqual({
        id: 'doc-2',
        title: 'AI Implementation Guide',
        snippet: 'A comprehensive guide to implementing AI solutions in your organization.',
      })
    })

    it('should truncate long content snippets', () => {
      const longContent = 'A'.repeat(250)
      const mockResults = [
        {
          id: 'doc-1',
          title: 'Long Document',
          content: longContent,
        },
      ]

      store.query = () => mockResults

      const result = searchDocuments(store, 'Long')

      expect(result.success).toBe(true)
      expect(result.results?.[0].snippet).toBe('A'.repeat(200) + '...')
    })

    it('should return empty results when no matches found', () => {
      store.query = () => []

      const result = searchDocuments(store, 'nonexistent query')

      expect(result.success).toBe(true)
      expect(result.results).toEqual([])
    })

    it('should return error when query is empty', () => {
      const result = searchDocuments(store, '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Search query is required')
    })

    it('should return error when query is undefined', () => {
      const result = searchDocuments(store, undefined as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Search query is required')
    })

    it('should return error when query is only whitespace', () => {
      const result = searchDocuments(store, '   ')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Search query is required')
    })

    it('should handle query errors gracefully', () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = searchDocuments(store, 'test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should filter documents by title match', () => {
      const mockResults = [
        {
          id: 'doc-1',
          title: 'AI Research Paper',
          content: 'This is about machine learning.',
        },
        {
          id: 'doc-2',
          title: 'Business Strategy',
          content: 'This document covers AI implementation.',
        },
      ]

      store.query = () => mockResults

      const result = searchDocuments(store, 'AI')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      // Both should match - one by title, one by content
    })

    it('should handle short content without truncation', () => {
      const shortContent = 'Short content'
      const mockResults = [
        {
          id: 'doc-1',
          title: 'Short Document',
          content: shortContent,
        },
      ]

      store.query = () => mockResults

      const result = searchDocuments(store, 'Short')

      expect(result.success).toBe(true)
      expect(result.results?.[0].snippet).toBe(shortContent)
    })
  })

  describe('getProjectDocuments', () => {
    const mockDocumentProjects = [{ documentId: 'doc-1' }, { documentId: 'doc-2' }]

    const mockAllDocuments = [
      {
        id: 'doc-1',
        title: 'Project Document 1',
        content: 'Content 1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      },
      {
        id: 'doc-2',
        title: 'Project Document 2',
        content: 'Content 2',
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-04'),
      },
      {
        id: 'doc-3',
        title: 'Other Document',
        content: 'Content 3',
        createdAt: new Date('2023-01-05'),
        updatedAt: new Date('2023-01-06'),
      },
    ]

    it('should return documents for a specific project', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return mockDocumentProjects
        if (query.label === 'getAllDocuments') return mockAllDocuments
        return []
      }

      const result = getProjectDocuments(store, 'test-project')

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(2)
      expect(result.documents?.[0]).toEqual({
        id: 'doc-1',
        title: 'Project Document 1',
        content: 'Content 1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      })
      expect(result.documents?.[1]).toEqual({
        id: 'doc-2',
        title: 'Project Document 2',
        content: 'Content 2',
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-04'),
      })
    })

    it('should return empty array when project has no documents', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return []
        if (query.label === 'getAllDocuments') return mockAllDocuments
        return []
      }

      const result = getProjectDocuments(store, 'test-project')

      expect(result.success).toBe(true)
      expect(result.documents).toEqual([])
    })

    it('should return error when projectId is empty', () => {
      const result = getProjectDocuments(store, '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Project ID is required')
    })

    it('should return error when projectId is undefined', () => {
      const result = getProjectDocuments(store, undefined as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Project ID is required')
    })

    it('should handle query errors gracefully', () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = getProjectDocuments(store, 'test-project')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('searchProjectDocuments', () => {
    const mockSearchResults = [
      {
        id: 'doc-1',
        title: 'Project AI Document',
        content: 'This document discusses AI in the project context.',
      },
      {
        id: 'doc-2',
        title: 'Implementation Guide',
        content: 'A guide for implementing AI solutions.',
      },
    ]

    const mockDocumentProjects = [{ documentId: 'doc-1' }, { documentId: 'doc-2' }]

    it('should search documents within a specific project', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('searchDocumentsWithProject:')) return mockSearchResults
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return mockDocumentProjects
        return []
      }

      const result = searchProjectDocuments(store, 'AI', 'test-project')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results?.[0]).toEqual({
        id: 'doc-1',
        title: 'Project AI Document',
        snippet: 'This document discusses AI in the project context.',
        projectId: 'test-project',
      })
      expect(result.results?.[1]).toEqual({
        id: 'doc-2',
        title: 'Implementation Guide',
        snippet: 'A guide for implementing AI solutions.',
        projectId: 'test-project',
      })
    })

    it('should search all documents when no project specified', () => {
      store.query = () => mockSearchResults

      const result = searchProjectDocuments(store, 'AI')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results?.[0].projectId).toBeUndefined()
      expect(result.results?.[1].projectId).toBeUndefined()
    })

    it('should return empty results when no matches found', () => {
      store.query = () => []

      const result = searchProjectDocuments(store, 'nonexistent', 'test-project')

      expect(result.success).toBe(true)
      expect(result.results).toEqual([])
    })

    it('should return error when query is empty', () => {
      const result = searchProjectDocuments(store, '', 'test-project')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Search query is required')
    })

    it('should return error when query is undefined', () => {
      const result = searchProjectDocuments(store, undefined as any, 'test-project')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Search query is required')
    })

    it('should handle query errors gracefully', () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = searchProjectDocuments(store, 'test', 'test-project')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should filter documents by title and content', () => {
      const mockResults = [
        {
          id: 'doc-1',
          title: 'AI Research Paper',
          content: 'This is about machine learning.',
        },
        {
          id: 'doc-2',
          title: 'Business Strategy',
          content: 'This document covers AI implementation.',
        },
        {
          id: 'doc-3',
          title: 'Unrelated Document',
          content: 'This is about marketing.',
        },
      ]

      store.query = () => mockResults

      const result = searchProjectDocuments(store, 'AI')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      // Only the first two should match
    })

    it('should truncate long content snippets', () => {
      const longContent = 'B'.repeat(250)
      const mockResults = [
        {
          id: 'doc-1',
          title: 'Long Document',
          content: longContent,
        },
      ]

      store.query = () => mockResults

      const result = searchProjectDocuments(store, 'Long')

      expect(result.success).toBe(true)
      expect(result.results?.[0].snippet).toBe('B'.repeat(200) + '...')
    })
  })
})
