import { describe, it, expect, vi } from 'vitest'

// Mock the logger to avoid console output during tests
vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

// Create a mock store factory
function createMockStore(
  overrides: {
    projects?: any[]
    tasks?: any[]
    projectLifecycleState?: any
  } = {}
) {
  const { projects = [], tasks = [], projectLifecycleState = null } = overrides

  const projectsWithLifecycle = projects.map(p => ({
    ...p,
    projectLifecycleState: p.projectLifecycleState ?? projectLifecycleState,
  }))

  return {
    query: vi.fn((queryObj: any) => {
      // Handle getBoardTasks$ query (used for task validation)
      if (queryObj?.label?.startsWith('getBoardTasks:')) {
        return tasks
      }
      // Handle getProjectDetails$ query
      if (queryObj?.label?.startsWith('getProjectDetails:')) {
        return projectsWithLifecycle
      }
      return []
    }),
    commit: vi.fn(),
  }
}

describe('updateProjectLifecycle validation', () => {
  // We'll test the validation logic by importing and calling the function directly
  // Since the function is not exported directly, we test through the exported wrapper

  describe('Stage 3+ validation (objectives and stream required)', () => {
    it('should reject advancing to stage 3 without objectives', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
              stream: 'gold', // Has stream but no objectives
            },
          },
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('objectives')
    })

    it('should reject advancing to stage 3 without stream/tier', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
              objectives: 'Test objectives', // Has objectives but no stream
            },
          },
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('project type')
    })

    it('should reject advancing to stage 3 with empty objectives string', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
              objectives: '   ', // Empty/whitespace only
              stream: 'gold',
            },
          },
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('objectives')
    })

    it('should allow advancing to stage 3 with objectives and stream', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
              objectives: 'Test objectives',
              stream: 'gold',
            },
          },
        ],
        tasks: [], // No tasks yet (not required for stage 3)
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
        },
        'actor-1'
      )

      expect(result.success).toBe(true)
      expect(mockStore.commit).toHaveBeenCalled()
    })

    it('should allow providing objectives and stream in the same call as stage advance', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
              // No objectives or stream yet
            },
          },
        ],
        tasks: [],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
          objectives: 'New objectives',
          stream: 'silver',
        },
        'actor-1'
      )

      expect(result.success).toBe(true)
      expect(mockStore.commit).toHaveBeenCalled()
    })

    it('should allow advancing to stage 3 using projectType instead of stream', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
            },
          },
        ],
        tasks: [],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
          objectives: 'Ship it',
          projectType: 'initiative',
        },
        'actor-1'
      )

      expect(result.success).toBe(true)
      expect(mockStore.commit).toHaveBeenCalled()
    })

    it('should reject conflicting stream and projectType values', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
            },
          },
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
          objectives: 'Ship it',
          stream: 'gold',
          projectType: 'optimization',
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Conflicting stream and projectType')
    })

    it('should reject invalid projectType values', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
            },
          },
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 3,
          objectives: 'Ship it',
          projectType: 'not-a-valid-type',
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid projectType')
    })
  })

  describe('Stage 4 / backlog validation (tasks required)', () => {
    it('should reject advancing to stage 4 without tasks', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 3,
              objectives: 'Test objectives',
              stream: 'gold',
            },
          },
        ],
        tasks: [], // No tasks
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 4,
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('task')
    })

    it('should reject moving to backlog without tasks', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 3,
              objectives: 'Test objectives',
              stream: 'gold',
            },
          },
        ],
        tasks: [], // No tasks
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          status: 'backlog',
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('task')
    })

    it('should not count archived tasks when validating', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 3,
              objectives: 'Test objectives',
              stream: 'gold',
            },
          },
        ],
        tasks: [
          { id: 'task-1', archivedAt: new Date() }, // Archived task shouldn't count
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 4,
        },
        'actor-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('task')
    })

    it('should allow advancing to stage 4 with at least one non-archived task', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 3,
              objectives: 'Test objectives',
              stream: 'gold',
            },
          },
        ],
        tasks: [
          { id: 'task-1', archivedAt: null }, // Non-archived task
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 4,
        },
        'actor-1'
      )

      expect(result.success).toBe(true)
      expect(mockStore.commit).toHaveBeenCalled()
    })

    it('should allow moving to backlog with tasks', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 3,
              objectives: 'Test objectives',
              stream: 'gold',
            },
          },
        ],
        tasks: [{ id: 'task-1', archivedAt: null }],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          status: 'backlog',
        },
        'actor-1'
      )

      expect(result.success).toBe(true)
      expect(mockStore.commit).toHaveBeenCalled()
    })
  })

  describe('Earlier stage updates (no validation required)', () => {
    it('should allow updating stage 1 project without restrictions', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 1,
            },
          },
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          stage: 2,
        },
        'actor-1'
      )

      expect(result.success).toBe(true)
      expect(mockStore.commit).toHaveBeenCalled()
    })

    it('should allow updating lifecycle fields at stage 2 without advancing', async () => {
      const { updateProjectLifecycle } = await import('./projects.js')

      const mockStore = createMockStore({
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            projectLifecycleState: {
              status: 'planning',
              stage: 2,
            },
          },
        ],
      })

      const result = updateProjectLifecycle(
        mockStore as any,
        {
          projectId: 'project-1',
          objectives: 'Setting objectives',
          stream: 'bronze',
        },
        'actor-1'
      )

      expect(result.success).toBe(true)
      expect(mockStore.commit).toHaveBeenCalled()
    })
  })
})
