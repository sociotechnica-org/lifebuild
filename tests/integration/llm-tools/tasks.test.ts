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
    it('should create task with proper project and column selection', () => {
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

    it('should handle no projects available', () => {
      store.query = () => []

      const result = createTask(store, { title: 'Test Task' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('No projects available. Please create a project first.')
    })

    it('should handle no columns available', () => {
      store.query = (query: any) => {
        if (query.label === 'getBoards' || query.label === 'getProjects') return [mockProject]
        if (query.label?.startsWith('getBoardColumns:')) return []
        return []
      }

      const result = createTask(store, { title: 'Test Task' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Board "Test Project" has no columns. Please add columns first.')
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
    it('should update task with assignee validation', () => {
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

    it('should validate assignees', () => {
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
    it('should move task to different column', () => {
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

    it('should reject moving orphaned task', () => {
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

  describe('moveTaskToProject', () => {
    it('should move task to different project', () => {
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

    it('should handle orphaning task with orphaned column', () => {
      const orphanedColumn = { id: 'orphaned-column', name: 'Orphaned', projectId: null }

      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label === 'getOrphanedColumns') return [orphanedColumn]
        return []
      }
      store.commit = () => {}

      const result = moveTaskToProject(store, {
        taskId: 'test-task',
        toColumnId: 'orphaned-column',
      })

      expect(result.success).toBe(true)
      expect(result.task?.projectId).toBeUndefined()
      expect(result.task?.columnId).toBe('orphaned-column')
    })

    it('should reject orphaning task with project-owned column', () => {
      const projectColumn = { id: 'project-column', name: 'Project Col', projectId: 'some-project' }

      store.query = (query: any) => {
        if (query.label?.startsWith('getTaskById:')) return [mockTask]
        if (query.label === 'getOrphanedColumns') return [projectColumn]
        return []
      }

      const result = moveTaskToProject(store, {
        taskId: 'test-task',
        toColumnId: 'project-column',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Column project-column belongs to project some-project, cannot use for orphaned task'
      )
    })
  })

  describe('archiveTask', () => {
    it('should archive task successfully', () => {
      store.query = () => [mockTask]
      store.commit = () => {}

      const result = archiveTask(store, 'test-task')
      expect(result.success).toBe(true)
    })

    it('should prevent archiving already archived task', () => {
      const archivedTask = { ...mockTask, archivedAt: new Date() }
      store.query = () => [archivedTask]

      const result = archiveTask(store, 'test-task')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task is already archived')
    })
  })

  describe('unarchiveTask', () => {
    it('should unarchive task successfully', () => {
      const archivedTask = { ...mockTask, archivedAt: new Date() }
      store.query = () => [archivedTask]
      store.commit = () => {}

      const result = unarchiveTask(store, 'test-task')
      expect(result.success).toBe(true)
    })

    it('should prevent unarchiving non-archived task', () => {
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
  })
})
