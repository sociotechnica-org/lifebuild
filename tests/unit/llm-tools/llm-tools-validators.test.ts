import { describe, it, expect } from 'vitest'
import { validators } from '../../../src/utils/llm-tools/base.js'

describe('LLM Tool Validators', () => {
  describe('requireId', () => {
    it('should return trimmed ID when valid', () => {
      expect(validators.requireId('  test-id  ', 'Test ID')).toBe('test-id')
      expect(validators.requireId('test-id', 'Test ID')).toBe('test-id')
    })

    it('should throw error when ID is empty', () => {
      expect(() => validators.requireId('', 'Test ID')).toThrow('Test ID is required')
    })

    it('should throw error when ID is undefined', () => {
      expect(() => validators.requireId(undefined, 'Test ID')).toThrow('Test ID is required')
    })

    it('should throw error when ID is only whitespace', () => {
      expect(() => validators.requireId('   ', 'Test ID')).toThrow('Test ID is required')
    })

    it('should preserve original field name in error message', () => {
      expect(() => validators.requireId('', 'Task ID')).toThrow('Task ID is required')
      expect(() => validators.requireId('', 'Project ID')).toThrow('Project ID is required')
    })
  })

  describe('requireEntity', () => {
    it('should return entity when found', () => {
      const entities = [{ id: 'test-1', name: 'Test' }]
      const result = validators.requireEntity(entities, 'Test Entity', 'test-1')
      expect(result).toEqual({ id: 'test-1', name: 'Test' })
    })

    it('should return first entity when multiple found', () => {
      const entities = [
        { id: 'test-1', name: 'First' },
        { id: 'test-2', name: 'Second' },
      ]
      const result = validators.requireEntity(entities, 'Test Entity', 'test-1')
      expect(result).toEqual({ id: 'test-1', name: 'First' })
    })

    it('should throw error with custom message when not found', () => {
      expect(() => validators.requireEntity([], 'Task', 'task-1')).toThrow(
        'Task with ID task-1 not found'
      )
    })

    it('should preserve entity name and ID in error message', () => {
      expect(() => validators.requireEntity([], 'Document', 'doc-123')).toThrow(
        'Document with ID doc-123 not found'
      )
    })
  })

  describe('validateAssignees', () => {
    const mockUsers = [
      { id: 'user-1', name: 'User 1' },
      { id: 'user-2', name: 'User 2' },
      { id: 'user-3', name: 'User 3' },
    ]

    it('should pass when all assignees exist', () => {
      expect(() => validators.validateAssignees(['user-1', 'user-2'], mockUsers)).not.toThrow()
    })

    it('should pass when assignee array is empty', () => {
      expect(() => validators.validateAssignees([], mockUsers)).not.toThrow()
    })

    it('should pass when single assignee exists', () => {
      expect(() => validators.validateAssignees(['user-1'], mockUsers)).not.toThrow()
    })

    it('should throw error for single invalid assignee', () => {
      expect(() => validators.validateAssignees(['invalid-user'], mockUsers)).toThrow(
        'Invalid assignee IDs: invalid-user'
      )
    })

    it('should throw error listing multiple invalid IDs', () => {
      expect(() =>
        validators.validateAssignees(['invalid-1', 'user-2', 'invalid-2'], mockUsers)
      ).toThrow('Invalid assignee IDs: invalid-1, invalid-2')
    })

    it('should handle empty user list', () => {
      expect(() => validators.validateAssignees(['user-1'], [])).toThrow(
        'Invalid assignee IDs: user-1'
      )
    })
  })

  describe('validateOptionalAssignees', () => {
    const mockUsers = [
      { id: 'user-1', name: 'User 1' },
      { id: 'user-2', name: 'User 2' },
    ]

    it('should pass when assigneeIds is undefined', () => {
      expect(() => validators.validateOptionalAssignees(undefined, mockUsers)).not.toThrow()
    })

    it('should pass when assigneeIds is empty array', () => {
      expect(() => validators.validateOptionalAssignees([], mockUsers)).not.toThrow()
    })

    it('should validate assignees when provided', () => {
      expect(() => validators.validateOptionalAssignees(['user-1'], mockUsers)).not.toThrow()
    })

    it('should throw error for invalid assignees when provided', () => {
      expect(() => validators.validateOptionalAssignees(['invalid-user'], mockUsers)).toThrow(
        'Invalid assignee IDs: invalid-user'
      )
    })
  })
})
