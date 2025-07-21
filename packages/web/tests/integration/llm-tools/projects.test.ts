import { describe, it, expect, beforeEach } from 'vitest'
import { listProjects, getProjectDetails } from '@work-squared/shared/llm-tools'
import { createTestStore } from '../../test-utils.js'

describe('LLM Tools - Projects', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore()
  })

  // Mock data
  const mockProject = {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test project',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    deletedAt: null,
  }

  const mockProjects = [
    mockProject,
    {
      id: 'test-project-2',
      name: 'Second Project',
      description: null,
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-04'),
      deletedAt: null,
    },
  ]

  describe('listProjects', () => {
    it('should return projects with proper formatting', () => {
      store.query = () => mockProjects

      const result = listProjects(store)

      expect(result.success).toBe(true)
      expect(result.projects).toHaveLength(2)
      expect(result.projects?.[0]).toEqual({
        id: 'test-project-1',
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date('2023-01-01'),
      })
      expect(result.projects?.[1]).toEqual({
        id: 'test-project-2',
        name: 'Second Project',
        description: null,
        createdAt: new Date('2023-01-03'),
      })
    })

    it('should filter out null/undefined projects', () => {
      store.query = () => [null, undefined, mockProject]

      const result = listProjects(store)

      expect(result.success).toBe(true)
      expect(result.projects).toHaveLength(1)
      // The function should filter out null/undefined gracefully
    })
  })

  describe('getProjectDetails', () => {
    const mockDocumentProjects = [{ documentId: 'doc-1' }, { documentId: 'doc-2' }]

    const mockTasks = [
      { id: 'task-1', title: 'Task 1' },
      { id: 'task-2', title: 'Task 2' },
      { id: 'task-3', title: 'Task 3' },
    ]

    it('should return project details with document and task counts', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getProjectDetails:')) return [mockProject]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return mockDocumentProjects
        if (query.label?.startsWith('getBoardTasks:')) return mockTasks
        return []
      }

      const result = getProjectDetails(store, 'test-project-1')

      expect(result.success).toBe(true)
      expect(result.project).toEqual({
        id: 'test-project-1',
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        documentCount: 2,
        taskCount: 3,
      })
    })

    it('should handle project with zero documents and tasks', () => {
      store.query = (query: any) => {
        if (query.label?.startsWith('getProjectDetails:')) return [mockProject]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return []
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }

      const result = getProjectDetails(store, 'test-project-1')

      expect(result.success).toBe(true)
      expect(result.project?.documentCount).toBe(0)
      expect(result.project?.taskCount).toBe(0)
    })

    it('should handle projects with null description', () => {
      const projectWithNullDescription = {
        ...mockProject,
        description: null,
      }

      store.query = (query: any) => {
        if (query.label?.startsWith('getProjectDetails:')) return [projectWithNullDescription]
        if (query.label?.startsWith('getDocumentProjectsByProject:')) return []
        if (query.label?.startsWith('getBoardTasks:')) return []
        return []
      }

      const result = getProjectDetails(store, 'test-project-1')

      expect(result.success).toBe(true)
      expect(result.project?.description).toBeNull()
    })
  })
})
