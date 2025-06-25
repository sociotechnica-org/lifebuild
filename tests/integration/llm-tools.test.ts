import { describe, it, expect, beforeEach } from 'vitest'
import {
  executeLLMTool,
  listProjects,
  listDocuments,
  readDocument,
  searchDocuments,
} from '../../src/utils/llm-tools.js'
import { createTestStore } from '../../src/test-utils.js'

describe('LLM Tools Integration', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore()
  })

  describe('listProjects', () => {
    it('should return success with empty projects list when no projects exist', () => {
      const result = listProjects(store)

      expect(result).toEqual({
        success: true,
        projects: [],
      })
    })

    it('should return projects when they exist', async () => {
      // Add a test project to the store
      const projectId = 'test-project-1'
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        deletedAt: null,
      }

      // Mock the store query to return our test project
      store.query = () => [mockProject]

      const result = listProjects(store)

      expect(result.success).toBe(true)
      expect(result.projects).toHaveLength(1)
      expect(result.projects?.[0]).toEqual({
        id: projectId,
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date('2023-01-01'),
      })
    })

    it('should handle query errors gracefully', () => {
      // Mock store.query to throw an error
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = listProjects(store)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
      expect(result.projects).toBeUndefined()
    })
  })

  describe('executeLLMTool', () => {
    it('should execute list_projects tool successfully', async () => {
      // Mock the store query to return test projects
      store.query = () => [
        {
          id: 'project-1',
          name: 'Project 1',
          description: 'First project',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'project-2',
          name: 'Project 2',
          description: null,
          createdAt: new Date('2023-01-02'),
        },
      ]

      const result = await executeLLMTool(store, {
        name: 'list_projects',
        parameters: {},
      })

      expect(result.success).toBe(true)
      expect(result.projects).toHaveLength(2)
      expect(result.projects[0].name).toBe('Project 1')
      expect(result.projects[1].name).toBe('Project 2')
    })

    it('should throw error for unknown tool', async () => {
      await expect(
        executeLLMTool(store, {
          name: 'unknown_tool',
          parameters: {},
        })
      ).rejects.toThrow('Unknown tool: unknown_tool')
    })
  })

  describe('listDocuments', () => {
    it('should return success with empty documents list when no documents exist', () => {
      const result = listDocuments(store)

      expect(result).toEqual({
        success: true,
        documents: [],
      })
    })

    it('should return documents when they exist', () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Test Document 1',
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: 'doc-2',
          title: 'Test Document 2',
          updatedAt: new Date('2023-01-02'),
        },
      ]

      store.query = () => mockDocuments

      const result = listDocuments(store)

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(2)
      expect(result.documents?.[0]).toEqual({
        id: 'doc-1',
        title: 'Test Document 1',
        updatedAt: new Date('2023-01-01'),
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
      const mockDocument = {
        id: 'doc-1',
        title: 'Test Document',
        content: 'This is the document content',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      }

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

    it('should handle query errors gracefully', () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = readDocument(store, 'doc-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
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

    it('should handle query errors gracefully', () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = searchDocuments(store, 'test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('executeLLMTool - document tools', () => {
    it('should execute list_documents tool successfully', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Document 1',
          updatedAt: new Date('2023-01-01'),
        },
      ]

      store.query = () => mockDocuments

      const result = await executeLLMTool(store, {
        name: 'list_documents',
        parameters: {},
      })

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(1)
    })

    it('should execute read_document tool successfully', async () => {
      const mockDocument = {
        id: 'doc-1',
        title: 'Test Document',
        content: 'Document content',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      }

      store.query = () => [mockDocument]

      const result = await executeLLMTool(store, {
        name: 'read_document',
        parameters: { documentId: 'doc-1' },
      })

      expect(result.success).toBe(true)
      expect(result.document).toEqual(mockDocument)
    })

    it('should execute search_documents tool successfully', async () => {
      const mockResults = [
        {
          id: 'doc-1',
          title: 'Test Document',
          content: 'This is a test document',
        },
      ]

      store.query = () => mockResults

      const result = await executeLLMTool(store, {
        name: 'search_documents',
        parameters: { query: 'test' },
      })

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results?.[0].title).toBe('Test Document')
    })
  })
})
