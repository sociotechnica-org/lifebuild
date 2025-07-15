import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  listDocuments,
  readDocument,
  searchDocuments,
  getProjectDocuments,
  searchProjectDocuments,
  createDocument,
  updateDocument,
  archiveDocument,
  addDocumentToProject,
  removeDocumentFromProject,
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

  // Test data for new document tools
  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    description: 'A test project',
  }

  const mockDocumentProjects = [{ documentId: 'doc-1', projectId: 'project-1' }]

  describe('createDocument', () => {
    it('should create document successfully', () => {
      store.commit = vi.fn()

      const result = createDocument(store, {
        title: 'New Document',
        content: 'New content',
      })

      expect(result.success).toBe(true)
      expect(result.title).toBe('New Document')
      expect(result.content).toBe('New content')
      expect(result.documentId).toBeDefined()
      expect(store.commit).toHaveBeenCalled()
    })

    it('should create document with minimal parameters', () => {
      store.commit = vi.fn()

      const result = createDocument(store, {
        title: 'Minimal Document',
      })

      expect(result.success).toBe(true)
      expect(result.title).toBe('Minimal Document')
      expect(result.content).toBe('')
      expect(store.commit).toHaveBeenCalled()
    })

    it('should validate title requirement', () => {
      const result = createDocument(store, {
        title: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document title is required')
    })

    it('should trim whitespace from title and content', () => {
      store.commit = vi.fn()

      const result = createDocument(store, {
        title: '  Whitespace Document  ',
        content: '  Content with spaces  ',
      })

      expect(result.success).toBe(true)
      expect(result.title).toBe('Whitespace Document')
      expect(result.content).toBe('Content with spaces')
    })
  })

  describe('updateDocument', () => {
    it('should update document successfully', () => {
      store.query = () => [mockDocument]
      store.commit = vi.fn()

      const result = updateDocument(store, {
        documentId: 'doc-1',
        title: 'Updated Title',
        content: 'Updated content',
      })

      expect(result.success).toBe(true)
      expect(result.document?.title).toBe('Updated Title')
      expect(result.document?.content).toBe('Updated content')
      expect(store.commit).toHaveBeenCalled()
    })

    it('should update only title', () => {
      store.query = () => [mockDocument]
      store.commit = vi.fn()

      const result = updateDocument(store, {
        documentId: 'doc-1',
        title: 'New Title Only',
      })

      expect(result.success).toBe(true)
      expect(result.document?.title).toBe('New Title Only')
      expect(result.document?.content).toBeUndefined()
    })

    it('should update only content', () => {
      store.query = () => [mockDocument]
      store.commit = vi.fn()

      const result = updateDocument(store, {
        documentId: 'doc-1',
        content: 'New content only',
      })

      expect(result.success).toBe(true)
      expect(result.document?.title).toBeUndefined()
      expect(result.document?.content).toBe('New content only')
    })

    it('should validate document exists', () => {
      store.query = () => []

      const result = updateDocument(store, {
        documentId: 'nonexistent',
        title: 'New Title',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document with ID nonexistent not found')
    })

    it('should require at least one field for update', () => {
      store.query = () => [mockDocument]

      const result = updateDocument(store, {
        documentId: 'doc-1',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('At least one field (title or content) must be provided for update')
    })

    it('should validate empty title', () => {
      store.query = () => [mockDocument]

      const result = updateDocument(store, {
        documentId: 'doc-1',
        title: '   ',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document title cannot be empty')
    })
  })

  describe('archiveDocument', () => {
    it('should archive document successfully', () => {
      store.query = () => [mockDocument]
      store.commit = vi.fn()

      const result = archiveDocument(store, 'doc-1')

      expect(result.success).toBe(true)
      expect(result.document?.id).toBe('doc-1')
      expect(result.document?.archivedAt).toBeInstanceOf(Date)
      expect(store.commit).toHaveBeenCalled()
    })

    it('should validate document exists', () => {
      store.query = () => []

      const result = archiveDocument(store, 'nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document with ID nonexistent not found')
    })

    it('should prevent archiving already archived document', () => {
      const archivedDocument = { ...mockDocument, archivedAt: new Date() }
      store.query = () => [archivedDocument]

      const result = archiveDocument(store, 'doc-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document is already archived')
    })
  })

  describe('addDocumentToProject', () => {
    it('should add document to project successfully', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return [mockDocument]
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return []
        return []
      }
      store.commit = vi.fn()

      const result = addDocumentToProject(store, {
        documentId: 'doc-1',
        projectId: 'project-1',
      })

      expect(result.success).toBe(true)
      expect(result.association?.documentId).toBe('doc-1')
      expect(result.association?.projectId).toBe('project-1')
      expect(store.commit).toHaveBeenCalled()
    })

    it('should validate document exists', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return []
        return []
      }

      const result = addDocumentToProject(store, {
        documentId: 'nonexistent',
        projectId: 'project-1',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document with ID nonexistent not found')
    })

    it('should validate project exists', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return [mockDocument]
        if (query.label === 'getBoards' || query.label === 'getProjects') return []
        return []
      }

      const result = addDocumentToProject(store, {
        documentId: 'doc-1',
        projectId: 'nonexistent',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Project with ID nonexistent not found')
    })

    it('should prevent duplicate associations', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return [mockDocument]
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return mockDocumentProjects
        return []
      }

      const result = addDocumentToProject(store, {
        documentId: 'doc-1',
        projectId: 'project-1',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document is already associated with project project-1')
    })
  })

  describe('removeDocumentFromProject', () => {
    it('should remove document from project successfully', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return [mockDocument]
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return mockDocumentProjects
        return []
      }
      store.commit = vi.fn()

      const result = removeDocumentFromProject(store, {
        documentId: 'doc-1',
        projectId: 'project-1',
      })

      expect(result.success).toBe(true)
      expect(result.association?.documentId).toBe('doc-1')
      expect(result.association?.projectId).toBe('project-1')
      expect(store.commit).toHaveBeenCalled()
    })

    it('should validate document exists', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return []
        return []
      }

      const result = removeDocumentFromProject(store, {
        documentId: 'nonexistent',
        projectId: 'project-1',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document with ID nonexistent not found')
    })

    it('should validate project exists', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return [mockDocument]
        if (query.label === 'getBoards' || query.label === 'getProjects') return []
        return []
      }

      const result = removeDocumentFromProject(store, {
        documentId: 'doc-1',
        projectId: 'nonexistent',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Project with ID nonexistent not found')
    })

    it('should validate association exists', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentById:')) return [mockDocument]
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return []
        return []
      }

      const result = removeDocumentFromProject(store, {
        documentId: 'doc-1',
        projectId: 'project-1',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document is not associated with project project-1')
    })
  })
})
