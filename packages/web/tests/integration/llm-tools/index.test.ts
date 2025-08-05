import { describe, it, expect, beforeEach, vi } from 'vitest'
import { executeLLMTool } from '@work-squared/shared/llm-tools'
import { createTestStore } from '../../test-utils.js'

describe('LLM Tools - executeLLMTool', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore()
    // Suppress console output for cleaner test runs
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // Mock data
  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    description: 'A test project',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    deletedAt: null,
  }

  const mockDocument = {
    id: 'doc-1',
    title: 'Test Document',
    content: 'Document content',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }

  const mockTask = {
    id: 'test-task',
    projectId: 'test-project',
    columnId: 'test-column',
    title: 'Test Task',
    description: 'A test task',
    assigneeIds: ['test-user'],
    position: 0,
    createdAt: new Date('2023-01-01'),
    archivedAt: null,
  }

  const mockColumn = {
    id: 'test-column',
    name: 'To Do',
    projectId: 'test-project',
    position: 0,
  }

  const mockUser = {
    id: 'test-user',
    name: 'Test User',
  }

  describe('Project Tools', () => {
    it('should execute list_projects tool successfully', async () => {
      store.query = () => [mockProject]

      const result = await executeLLMTool(store, {
        name: 'list_projects',
        parameters: {},
      })

      expect(result.success).toBe(true)
      expect(result.projects).toHaveLength(1)
      expect(result.projects[0].name).toBe('Test Project')
    })

    it('should execute get_project_details tool successfully', async () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getProjectDetails:')) return [mockProject]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return []
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }

      const result = await executeLLMTool(store, {
        name: 'get_project_details',
        parameters: { projectId: 'test-project' },
      })

      expect(result.success).toBe(true)
      expect(result.project.id).toBe('test-project')
      expect(result.project.name).toBe('Test Project')
    })
  })

  describe('Document Tools', () => {
    it('should execute list_documents tool successfully', async () => {
      store.query = () => [mockDocument]

      const result = await executeLLMTool(store, {
        name: 'list_documents',
        parameters: {},
      })

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0].title).toBe('Test Document')
    })

    it('should execute read_document tool successfully', async () => {
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
      expect(result.results[0].title).toBe('Test Document')
    })

    it('should execute get_project_documents tool successfully', async () => {
      const mockDocumentProjects = [{ documentId: 'doc-1' }]
      const mockAllDocuments = [mockDocument]

      store.query = (query: any) => {
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return mockDocumentProjects
        if (query.label === 'getAllDocuments') return mockAllDocuments
        return []
      }

      const result = await executeLLMTool(store, {
        name: 'get_project_documents',
        parameters: { projectId: 'test-project' },
      })

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0].title).toBe('Test Document')
    })

    it('should execute search_project_documents tool successfully', async () => {
      const mockResults = [
        {
          id: 'doc-1',
          title: 'Test Document',
          content: 'This is a test document',
        },
      ]

      const mockDocumentProjects = [{ documentId: 'doc-1' }]

      store.query = (query: any) => {
        if (query.label?.startsWith('searchDocumentsWithProject:')) return mockResults
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return mockDocumentProjects
        return []
      }

      const result = await executeLLMTool(store, {
        name: 'search_project_documents',
        parameters: { query: 'test', projectId: 'test-project' },
      })

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].title).toBe('Test Document')
    })
  })

  describe('Task Tools', () => {
    it('should execute create_task tool successfully', async () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }
      store.commit = () => {}

      const result = await executeLLMTool(store, {
        name: 'create_task',
        parameters: { title: 'New Task', description: 'Task description' },
      })

      expect(result.success).toBe(true)
      expect(result.taskTitle).toBe('New Task')
    })

    it('should execute update_task tool successfully', async () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label === 'getUsers') return [mockUser]
        return []
      }
      store.commit = () => {}

      const result = await executeLLMTool(store, {
        name: 'update_task',
        parameters: {
          taskId: 'test-task',
          title: 'Updated Task',
        },
      })

      expect(result.success).toBe(true)
      expect(result.task?.title).toBe('Updated Task')
    })

    it('should execute move_task tool successfully', async () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }
      store.commit = () => {}

      const result = await executeLLMTool(store, {
        name: 'move_task',
        parameters: {
          taskId: 'test-task',
          toColumnId: 'test-column',
        },
      })

      expect(result.success).toBe(true)
      expect(result.task?.columnId).toBe('test-column')
    })

    it('should execute move_task_to_project tool successfully', async () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }
      store.commit = () => {}

      const result = await executeLLMTool(store, {
        name: 'move_task_to_project',
        parameters: {
          taskId: 'test-task',
          toProjectId: 'test-project',
          toColumnId: 'test-column',
        },
      })

      expect(result.success).toBe(true)
      expect(result.task?.projectId).toBe('test-project')
    })

    it('should execute archive_task tool successfully', async () => {
      store.query = () => [mockTask]
      store.commit = () => {}

      const result = await executeLLMTool(store, {
        name: 'archive_task',
        parameters: { taskId: 'test-task' },
      })

      expect(result.success).toBe(true)
    })

    it('should execute unarchive_task tool successfully', async () => {
      const archivedTask = { ...mockTask, archivedAt: new Date() }
      store.query = () => [archivedTask]
      store.commit = () => {}

      const result = await executeLLMTool(store, {
        name: 'unarchive_task',
        parameters: { taskId: 'test-task' },
      })

      expect(result.success).toBe(true)
    })

    it('should execute get_task_by_id tool successfully', async () => {
      store.query = () => [mockTask]

      const result = await executeLLMTool(store, {
        name: 'get_task_by_id',
        parameters: { taskId: 'test-task' },
      })

      expect(result.success).toBe(true)
      expect(result.task?.id).toBe('test-task')
    })

    it('should execute get_project_tasks tool successfully', async () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardTasks:')) return [mockTask]
        return []
      }

      const result = await executeLLMTool(store, {
        name: 'get_project_tasks',
        parameters: { projectId: 'test-project' },
      })

      expect(result.success).toBe(true)
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].id).toBe('test-task')
    })

    it('should execute get_orphaned_tasks tool successfully', async () => {
      const orphanedTask = { ...mockTask, projectId: null }
      store.query = () => [orphanedTask]

      const result = await executeLLMTool(store, {
        name: 'get_orphaned_tasks',
        parameters: {},
      })

      expect(result.success).toBe(true)
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].projectId).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should throw error for unknown tool', async () => {
      await expect(
        executeLLMTool(store, {
          name: 'unknown_tool',
          parameters: {},
        })
      ).rejects.toThrow('Unknown tool: unknown_tool')
    })

    it('should handle tool execution errors gracefully', async () => {
      store.query = () => {
        throw new Error('Database connection failed')
      }

      const result = await executeLLMTool(store, {
        name: 'list_projects',
        parameters: {},
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle validation errors gracefully', async () => {
      const result = await executeLLMTool(store, {
        name: 'read_document',
        parameters: { documentId: '' },
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Document with ID  not found')
    })
  })
})
