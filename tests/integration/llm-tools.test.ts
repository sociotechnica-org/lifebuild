import { describe, it, expect, beforeEach } from 'vitest'
import { executeLLMTool, listProjects } from '../../src/utils/llm-tools.js'
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
})
