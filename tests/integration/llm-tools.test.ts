import { describe, it, expect, beforeEach } from 'vitest'
import { executeLLMTool } from '../../src/utils/llm-tools/index.js'
import { listProjects } from '../../src/utils/llm-tools/projects.js'
import { listDocuments, readDocument, searchDocuments } from '../../src/utils/llm-tools/documents.js'
import {
  createTask,
  updateTask,
  moveTask,
  archiveTask,
  unarchiveTask,
  getTaskById,
  getProjectTasks,
  getOrphanedTasks,
} from '../../src/utils/llm-tools/tasks.js'
import { createTestStore } from '../test-utils.js'

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

  describe('Task Tools', () => {
    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      description: 'A test project',
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

    describe('createTask', () => {
      it('should create task successfully', () => {
        // Mock store responses
        store.query = (query: any) => {
          if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
          if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
          if (query.label?.startsWith('getBoardTasks:')) return []
          return []
        }
        store.commit = () => {}

        const result = createTask(store, {
          title: 'New Task',
          description: 'Task description',
        })

        expect(result.success).toBe(true)
        expect(result.taskTitle).toBe('New Task')
        expect(result.projectName).toBe('Test Project')
        expect(result.columnName).toBe('To Do')
      })

      it('should return error when title is empty', () => {
        const result = createTask(store, { title: '' })
        expect(result.success).toBe(false)
        expect(result.error).toBe('Task title is required')
      })

      it('should return error when no projects exist', () => {
        store.query = () => []

        const result = createTask(store, { title: 'Test Task' })
        expect(result.success).toBe(false)
        expect(result.error).toBe('No projects available. Please create a project first.')
      })
    })

    describe('updateTask', () => {
      it('should update task successfully', () => {
        store.query = (query: any) => {
          if (query.label?.startsWith('getTaskById:')) return [mockTask]
          if (query.label === 'getUsers') return [mockUser]
          return []
        }
        store.commit = () => {}

        const result = updateTask(store, {
          taskId: 'test-task',
          title: 'Updated Task',
          assigneeIds: ['test-user'],
        })

        expect(result.success).toBe(true)
        expect(result.task?.title).toBe('Updated Task')
      })

      it('should return error when task not found', () => {
        store.query = () => []

        const result = updateTask(store, {
          taskId: 'nonexistent-task',
          title: 'Updated Task',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Task with ID nonexistent-task not found')
      })

      it('should return error for invalid assignees', () => {
        store.query = (query: any) => {
          if (query.label?.startsWith('getTaskById:')) return [mockTask]
          if (query.label === 'getUsers') return [mockUser]
          return []
        }

        const result = updateTask(store, {
          taskId: 'test-task',
          assigneeIds: ['invalid-user'],
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid assignee IDs: invalid-user')
      })
    })

    describe('moveTask', () => {
      it('should move task successfully', () => {
        store.query = (query: any) => {
          if (query.label?.startsWith('getTaskById:')) return [mockTask]
          if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
          if (query.label?.startsWith('getBoardTasks:')) return []
          return []
        }
        store.commit = () => {}

        const result = moveTask(store, {
          taskId: 'test-task',
          toColumnId: 'test-column',
        })

        expect(result.success).toBe(true)
        expect(result.task?.columnId).toBe('test-column')
      })

      it('should return error when task not found', () => {
        store.query = () => []

        const result = moveTask(store, {
          taskId: 'nonexistent-task',
          toColumnId: 'test-column',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Task with ID nonexistent-task not found')
      })

      it('should return error for orphaned task', () => {
        const orphanedTask = { ...mockTask, projectId: null }
        store.query = (query: any) => {
          if (query.label?.startsWith('getTaskById:')) return [orphanedTask]
          return []
        }

        const result = moveTask(store, {
          taskId: 'test-task',
          toColumnId: 'test-column',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Cannot move orphaned task')
      })
    })

    describe('archiveTask', () => {
      it('should archive task successfully', () => {
        store.query = () => [mockTask]
        store.commit = () => {}

        const result = archiveTask(store, 'test-task')
        expect(result.success).toBe(true)
      })

      it('should return error when task not found', () => {
        store.query = () => []

        const result = archiveTask(store, 'nonexistent-task')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Task with ID nonexistent-task not found')
      })

      it('should return error when task already archived', () => {
        const archivedTask = { ...mockTask, archivedAt: new Date() }
        store.query = () => [archivedTask]

        const result = archiveTask(store, 'test-task')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Task is already archived')
      })
    })

    describe('unarchiveTask', () => {
      const archivedTask = { ...mockTask, archivedAt: new Date() }

      it('should unarchive task successfully', () => {
        store.query = () => [archivedTask]
        store.commit = () => {}

        const result = unarchiveTask(store, 'test-task')
        expect(result.success).toBe(true)
      })

      it('should return error when task is not archived', () => {
        store.query = () => [mockTask]

        const result = unarchiveTask(store, 'test-task')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Task is not archived')
      })
    })

    describe('getTaskById', () => {
      it('should return task when found', () => {
        store.query = () => [mockTask]

        const result = getTaskById(store, 'test-task')
        expect(result.success).toBe(true)
        expect(result.task?.id).toBe('test-task')
        expect(result.task?.title).toBe('Test Task')
      })

      it('should return error when task not found', () => {
        store.query = () => []

        const result = getTaskById(store, 'nonexistent-task')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Task with ID nonexistent-task not found')
      })
    })

    describe('getProjectTasks', () => {
      it('should return tasks for project', () => {
        store.query = (query: any) => {
          if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
          if (query.label?.startsWith('getBoardTasks:')) return [mockTask]
          return []
        }

        const result = getProjectTasks(store, 'test-project')
        expect(result.success).toBe(true)
        expect(result.tasks).toHaveLength(1)
        expect(result.tasks?.[0].id).toBe('test-task')
      })

      it('should return error when project not found', () => {
        store.query = () => []

        const result = getProjectTasks(store, 'nonexistent-project')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Project with ID nonexistent-project not found')
      })
    })

    describe('getOrphanedTasks', () => {
      it('should return orphaned tasks', () => {
        const orphanedTask = { ...mockTask, projectId: null }
        store.query = () => [orphanedTask]

        const result = getOrphanedTasks(store)
        expect(result.success).toBe(true)
        expect(result.tasks).toHaveLength(1)
        expect(result.tasks?.[0].projectId).toBeNull()
      })

      it('should return empty array when no orphaned tasks', () => {
        store.query = () => []

        const result = getOrphanedTasks(store)
        expect(result.success).toBe(true)
        expect(result.tasks).toEqual([])
      })
    })

    describe('executeLLMTool - task tools', () => {
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

      it('should execute get_task_by_id tool successfully', async () => {
        store.query = () => [mockTask]

        const result = await executeLLMTool(store, {
          name: 'get_task_by_id',
          parameters: { taskId: 'test-task' },
        })

        expect(result.success).toBe(true)
        expect(result.task?.id).toBe('test-task')
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
    })
  })
})
