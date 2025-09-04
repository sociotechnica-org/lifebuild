import { describe, it, expect } from 'vitest'
import {
  interpolateRecurringTaskPrompt,
  validatePromptTemplate,
  getAvailableVariables,
} from '../../src/utils/prompt-interpolation.js'
import type { RecurringTask } from '../../src/livestore/schema.js'

describe('prompt-interpolation', () => {
  const mockTask: RecurringTask = {
    id: 'task-123',
    name: 'Weekly Report',
    description: 'Generate weekly status reports',
    prompt: 'Create a summary of completed tasks',
    intervalHours: 168,
    enabled: true,
    projectId: 'proj-456',
    lastExecutedAt: new Date('2024-01-01T10:00:00Z'),
    nextExecutionAt: new Date('2024-01-08T10:00:00Z'),
    createdAt: new Date('2023-12-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  }

  const mockTaskWithNulls: RecurringTask = {
    id: 'task-456',
    name: 'Simple Task',
    description: null,
    prompt: 'Do something',
    intervalHours: 24,
    enabled: false,
    projectId: null,
    lastExecutedAt: null,
    nextExecutionAt: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  }

  describe('interpolateRecurringTaskPrompt', () => {
    it('should return empty string for empty template', () => {
      expect(interpolateRecurringTaskPrompt('', mockTask)).toBe('')
      expect(interpolateRecurringTaskPrompt('   ', mockTask)).toBe('')
    })

    it('should replace single variable', () => {
      const template = 'Task name: {{name}}'
      const result = interpolateRecurringTaskPrompt(template, mockTask)
      expect(result).toBe('Task name: Weekly Report')
    })

    it('should replace multiple variables', () => {
      const template = 'Task "{{name}}" ({{id}}) runs every {{intervalHours}} hours'
      const result = interpolateRecurringTaskPrompt(template, mockTask)
      expect(result).toBe('Task "Weekly Report" (task-123) runs every 168 hours')
    })

    it('should handle null values gracefully', () => {
      const template = 'Description: {{description}}, Project: {{projectId}}'
      const result = interpolateRecurringTaskPrompt(template, mockTaskWithNulls)
      expect(result).toBe('Description: [description not set], Project: [projectId not set]')
    })

    it('should format dates properly', () => {
      const template = 'Created: {{createdAt}}'
      const result = interpolateRecurringTaskPrompt(template, mockTask)
      expect(result).toBe('Created: 2023-12-01T10:00:00.000Z')
    })

    it('should format boolean values', () => {
      const template = 'Enabled: {{enabled}}'
      const result = interpolateRecurringTaskPrompt(template, mockTask)
      expect(result).toBe('Enabled: true')

      const result2 = interpolateRecurringTaskPrompt(template, mockTaskWithNulls)
      expect(result2).toBe('Enabled: false')
    })

    it('should handle complex template with multiple occurrences', () => {
      const template = `Task: {{name}}
Description: {{description}}
Prompt: {{prompt}}
Task {{name}} runs every {{intervalHours}} hours`

      const result = interpolateRecurringTaskPrompt(template, mockTask)
      expect(result).toBe(`Task: Weekly Report
Description: Generate weekly status reports
Prompt: Create a summary of completed tasks
Task Weekly Report runs every 168 hours`)
    })
  })

  describe('validatePromptTemplate', () => {
    it('should validate empty template as valid', () => {
      const result = validatePromptTemplate('')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.variables).toEqual([])
    })

    it('should validate template with valid variables', () => {
      const template = 'Task {{name}} has description {{description}}'
      const result = validatePromptTemplate(template)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.variables).toEqual(['name', 'description'])
    })

    it('should detect invalid variables', () => {
      const template = 'Invalid {{invalidVar}} and {{anotherInvalid}}'
      const result = validatePromptTemplate(template)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toContain('Invalid variable: {{invalidVar}}')
      expect(result.errors[1]).toContain('Invalid variable: {{anotherInvalid}}')
    })

    it('should detect empty variable names', () => {
      const template = 'Empty variable: {{}}'
      const result = validatePromptTemplate(template)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Empty variable name: {{}} is not allowed')
    })

    it('should detect malformed brackets', () => {
      const template = 'Unclosed {{name and missing }'
      const result = validatePromptTemplate(template)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Malformed template: mismatched brackets detected')
    })

    it('should handle mixed valid and invalid variables', () => {
      const template = 'Valid {{name}} and invalid {{badVar}}'
      const result = validatePromptTemplate(template)
      expect(result.isValid).toBe(false)
      expect(result.variables).toContain('name')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Invalid variable: {{badVar}}')
    })

    it('should deduplicate variables', () => {
      const template = 'Task {{name}} called {{name}} again'
      const result = validatePromptTemplate(template)
      expect(result.isValid).toBe(true)
      expect(result.variables).toEqual(['name'])
    })

    it('should handle variables with spaces around names', () => {
      const template = 'Valid {{ name }} variable'
      const result = validatePromptTemplate(template)
      expect(result.isValid).toBe(true)
      expect(result.variables).toEqual(['name'])
    })
  })

  describe('getAvailableVariables', () => {
    it('should return all available variables', () => {
      const variables = getAvailableVariables()
      expect(variables).toContain('id')
      expect(variables).toContain('name')
      expect(variables).toContain('description')
      expect(variables).toContain('prompt')
      expect(variables).toContain('intervalHours')
      expect(variables).toContain('enabled')
      expect(variables).toContain('projectId')
      expect(variables).toContain('lastExecutedAt')
      expect(variables).toContain('nextExecutionAt')
      expect(variables).toContain('createdAt')
      expect(variables).toContain('updatedAt')
    })
  })
})
