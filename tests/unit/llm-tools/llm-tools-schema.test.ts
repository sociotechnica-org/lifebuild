import { describe, it, expect } from 'vitest'
import {
  toolDef,
  requiredString,
  optionalString,
  optionalNumber,
  stringArray,
} from '../../../src/utils/llm-tools/base.js'

describe('Tool Schema Builders', () => {
  describe('toolDef', () => {
    it('should create valid OpenAI function schema', () => {
      const result = toolDef('test_tool', 'A test tool', {
        type: 'object',
        properties: {
          param1: requiredString('First parameter'),
        },
        required: ['param1'],
      })

      expect(result).toEqual({
        type: 'function',
        function: {
          name: 'test_tool',
          description: 'A test tool',
          parameters: {
            type: 'object',
            properties: {
              param1: requiredString('First parameter'),
            },
            required: ['param1'],
          },
        },
      })
    })

    it('should preserve all parameters', () => {
      const complexParams = {
        type: 'object',
        properties: {
          taskId: requiredString('Task ID'),
          title: optionalString('Task title'),
          position: optionalNumber('Task position'),
          assigneeIds: stringArray('Assignee IDs'),
        },
        required: ['taskId'],
      }

      const result = toolDef('update_task', 'Update a task', complexParams)

      expect(result.function.parameters).toEqual(complexParams)
    })

    it('should handle empty parameters', () => {
      const result = toolDef('list_projects', 'List all projects', {
        type: 'object',
        properties: {},
        required: [],
      })

      expect(result.function.parameters).toEqual({
        type: 'object',
        properties: {},
        required: [],
      })
    })
  })

  describe('parameter helpers', () => {
    describe('requiredString', () => {
      it('should create required string parameter', () => {
        const result = requiredString('The task ID to update')

        expect(result).toEqual({
          type: 'string',
          description: 'The task ID to update',
        })
      })

      it('should preserve description exactly', () => {
        const descriptions = [
          'Simple description',
          'Description with (parentheses)',
          'Description with "quotes"',
          'Multi-word description with special chars !@#$%',
        ]

        descriptions.forEach(desc => {
          const result = requiredString(desc)
          expect(result.description).toBe(desc)
        })
      })
    })

    describe('optionalString', () => {
      it('should create optional string parameter', () => {
        const result = optionalString('Optional task description')

        expect(result).toEqual({
          type: 'string',
          description: 'Optional task description',
        })
      })
    })

    describe('optionalNumber', () => {
      it('should create optional number parameter', () => {
        const result = optionalNumber('Position in the column')

        expect(result).toEqual({
          type: 'number',
          description: 'Position in the column',
        })
      })
    })

    describe('stringArray', () => {
      it('should create string array parameter', () => {
        const result = stringArray('List of user IDs to assign')

        expect(result).toEqual({
          type: 'array',
          items: { type: 'string' },
          description: 'List of user IDs to assign',
        })
      })
    })
  })

  describe('complete tool definitions', () => {
    it('should create update_task tool definition', () => {
      const updateTaskTool = toolDef('update_task', 'Update an existing task', {
        type: 'object',
        properties: {
          taskId: requiredString('The ID of the task to update'),
          title: optionalString('New title for the task'),
          description: optionalString('New description for the task'),
          assigneeIds: stringArray('Array of user IDs to assign to the task'),
        },
        required: ['taskId'],
      })

      expect(updateTaskTool.type).toBe('function')
      expect(updateTaskTool.function.name).toBe('update_task')
      expect(updateTaskTool.function.description).toBe('Update an existing task')
      expect(updateTaskTool.function.parameters.required).toEqual(['taskId'])
      expect(updateTaskTool.function.parameters.properties.taskId.type).toBe('string')
      expect(updateTaskTool.function.parameters.properties.assigneeIds.type).toBe('array')
    })

    it('should create move_task tool definition', () => {
      const moveTaskTool = toolDef('move_task', 'Move a task to a different column', {
        type: 'object',
        properties: {
          taskId: requiredString('The ID of the task to move'),
          toColumnId: requiredString('The ID of the column to move to'),
          position: optionalNumber('Position in the new column'),
        },
        required: ['taskId', 'toColumnId'],
      })

      expect(moveTaskTool.function.name).toBe('move_task')
      expect(moveTaskTool.function.parameters.required).toEqual(['taskId', 'toColumnId'])
      expect(moveTaskTool.function.parameters.properties.position.type).toBe('number')
    })

    it('should create archive_task tool definition', () => {
      const archiveTaskTool = toolDef('archive_task', 'Archive a task', {
        type: 'object',
        properties: {
          taskId: requiredString('The ID of the task to archive'),
        },
        required: ['taskId'],
      })

      expect(archiveTaskTool.function.name).toBe('archive_task')
      expect(archiveTaskTool.function.parameters.required).toEqual(['taskId'])
    })
  })
})
