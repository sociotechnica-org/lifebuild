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
    it('should return documents with proper formatting', () => {
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
  })

  describe('readDocument', () => {
    it('should return full document data when found', () => {
      store.query = () => [mockDocument]

      const result = readDocument(store, 'doc-1')

      expect(result.success).toBe(true)
      expect(result.document).toEqual(mockDocument)
    })
  })

  describe('searchDocuments', () => {
    it('should search documents and format results with snippets', () => {
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

    it('should filter documents by title and content matching', () => {
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

    it('should filter documents by project and return full document data', () => {
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

    it('should search documents within a specific project and include projectId', () => {
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
      expect(result.results?.[0]?.projectId).toBeUndefined()
      expect(result.results?.[1]?.projectId).toBeUndefined()
    })
  })
})
