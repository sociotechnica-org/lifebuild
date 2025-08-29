import { describe, expect, it } from 'vitest'
import { DEFAULT_MODEL } from '@work-squared/shared'
import { generateRandomWorkerName } from '../../src/util/workerNames.js'
import { workerCreated, workerUpdated } from '@work-squared/shared/events'

describe('Worker Name Generation', () => {
  it('should generate different names on subsequent calls', () => {
    const name1 = generateRandomWorkerName()
    const name2 = generateRandomWorkerName()

    expect(name1).toMatch(/^[A-Za-z]+ [A-Za-z]+$/)
    expect(name2).toMatch(/^[A-Za-z]+ [A-Za-z]+$/)
    expect(name1).not.toBe(name2) // Very unlikely to be the same
  })
})

describe('Worker Events', () => {
  describe('workerCreated', () => {
    it('should create a valid worker event', () => {
      const event = workerCreated({
        id: 'test-id',
        name: 'Test Worker',
        roleDescription: 'Test Role',
        systemPrompt: 'Test system prompt',
        avatar: '🤖',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date('2023-01-01'),
      })

      expect(event.name).toBe('v1.WorkerCreated')
      expect(event.args).toEqual({
        id: 'test-id',
        name: 'Test Worker',
        roleDescription: 'Test Role',
        systemPrompt: 'Test system prompt',
        avatar: '🤖',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date('2023-01-01'),
      })
    })

    it('should handle optional fields', () => {
      const event = workerCreated({
        id: 'test-id',
        name: 'Test Worker',
        systemPrompt: 'Test system prompt',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date('2023-01-01'),
      })

      expect(event.name).toBe('v1.WorkerCreated')
      expect(event.args).toEqual({
        id: 'test-id',
        name: 'Test Worker',
        systemPrompt: 'Test system prompt',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date('2023-01-01'),
      })
    })
  })

  describe('workerUpdated', () => {
    it('should create a valid worker update event', () => {
      const event = workerUpdated({
        id: 'test-id',
        updates: {
          name: 'Updated Worker',
          roleDescription: 'Updated Role',
          systemPrompt: 'Updated system prompt',
        },
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.WorkerUpdated')
      expect(event.args).toEqual({
        id: 'test-id',
        updates: {
          name: 'Updated Worker',
          roleDescription: 'Updated Role',
          systemPrompt: 'Updated system prompt',
        },
        updatedAt: new Date('2023-01-02'),
      })
    })

    it('should handle partial updates', () => {
      const event = workerUpdated({
        id: 'test-id',
        updates: {
          name: 'Only Name Updated',
        },
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.WorkerUpdated')
      expect(event.args).toEqual({
        id: 'test-id',
        updates: {
          name: 'Only Name Updated',
        },
        updatedAt: new Date('2023-01-02'),
      })
    })

    it('should handle empty updates', () => {
      const event = workerUpdated({
        id: 'test-id',
        updates: {},
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.WorkerUpdated')
      expect(event.args).toEqual({
        id: 'test-id',
        updates: {},
        updatedAt: new Date('2023-01-02'),
      })
    })
  })
})
