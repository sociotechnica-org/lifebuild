import { describe, it, expect, beforeEach } from 'vitest'
import {
  createTask,
  updateTask,
  moveTask,
  moveTaskToProject,
  archiveTask,
  unarchiveTask,
  getTaskById,
  getProjectTasks,
  getOrphanedTasks,
} from '../../../src/utils/llm-tools/tasks.js'
import { createTestStore } from '../../test-utils.js'

describe('LLM Tools - Tasks', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore()
  })

  // Mock data
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

    it('should return error when title is undefined', () => {
      const result = createTask(store, { title: undefined as any })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task title is required')
    })

    it('should return error when no projects exist', () => {
      store.query = () => []

      const result = createTask(store, { title: 'Test Task' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('No projects available. Please create a project first.')
    })

    it('should return error when project not found', () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        return []
      }

      const result = createTask(store, {
        title: 'Test Task',
        boardId: 'nonexistent-project',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Project with ID nonexistent-project not found')
    })

    it('should return error when no columns exist', () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardColumns:')) return []
        return []
      }

      const result = createTask(store, { title: 'Test Task' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Board "Test Project" has no columns. Please add columns first.')
    })

    it('should return error when column not found', () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
        return []
      }

      const result = createTask(store, {
        title: 'Test Task',
        columnId: 'nonexistent-column',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Column with ID nonexistent-column not found')
    })

    it('should validate assignee when provided', () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
        if (query.label?.startsWith('getBoardTasks:')) return []
        if (query.label === 'getUsers') return []
        return []
      }

      const result = createTask(store, {
        title: 'Test Task',
        assigneeId: 'invalid-user',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid assignee IDs: invalid-user')
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

    it('should return error when taskId is empty', () => {
      const result = updateTask(store, {
        taskId: '',
        title: 'Updated Task',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task ID is required')
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

    it('should return error when taskId is empty', () => {
      const result = moveTask(store, {
        taskId: '',
        toColumnId: 'test-column',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task ID is required')
    })

    it('should return error when toColumnId is empty', () => {
      const result = moveTask(store, {
        taskId: 'test-task',
        toColumnId: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Column ID is required')
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

    it('should return error when column not found', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label?.startsWith('getBoardColumns:')) return []
        return []
      }

      const result = moveTask(store, {
        taskId: 'test-task',
        toColumnId: 'nonexistent-column',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Column with ID nonexistent-column not found')
    })
  })

  describe('moveTaskToProject', () => {
    it('should move task to project successfully', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardColumns:')) return [mockColumn]
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }
      store.commit = () => {}

      const result = moveTaskToProject(store, {
        taskId: 'test-task',
        toProjectId: 'test-project',
        toColumnId: 'test-column',
      })

      expect(result.success).toBe(true)
      expect(result.task?.projectId).toBe('test-project')
      expect(result.task?.columnId).toBe('test-column')
    })

    it('should return error when task not found', () => {
      store.query = () => []

      const result = moveTaskToProject(store, {
        taskId: 'nonexistent-task',
        toProjectId: 'test-project',
        toColumnId: 'test-column',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task with ID nonexistent-task not found')
    })

    it('should return error when project not found', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label === 'getBoards' || query.label === 'getProjects') return []
        return []
      }

      const result = moveTaskToProject(store, {
        taskId: 'test-task',
        toProjectId: 'nonexistent-project',
        toColumnId: 'test-column',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Project with ID nonexistent-project not found')
    })

    it('should handle orphaning task when no project specified', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        return []
      }
      store.commit = () => {}

      const result = moveTaskToProject(store, {
        taskId: 'test-task',
        toColumnId: 'test-column',
      })

      expect(result.success).toBe(true)
      expect(result.task?.projectId).toBeUndefined()
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

    it('should return error when taskId is empty', () => {
      const result = archiveTask(store, '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task ID is required')
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

    it('should return error when task not found', () => {
      store.query = () => []

      const result = unarchiveTask(store, 'nonexistent-task')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task with ID nonexistent-task not found')
    })

    it('should return error when taskId is empty', () => {
      const result = unarchiveTask(store, '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task ID is required')
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

    it('should return error when taskId is empty', () => {
      const result = getTaskById(store, '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task ID is required')
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

    it('should return error when projectId is empty', () => {
      const result = getProjectTasks(store, '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Project ID is required')
    })

    it('should return empty array when project has no tasks', () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }

      const result = getProjectTasks(store, 'test-project')
      expect(result.success).toBe(true)
      expect(result.tasks).toEqual([])
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
})
