import { describe, expect, it } from 'vitest'
import { events, tables } from '../../src/livestore/schema.js'
import { getWorkers$ } from '../../src/livestore/queries.js'
import { generateRandomWorkerName, systemPromptTemplates } from '../../src/util/workerNames.js'

describe('Worker Events and Materialization', () => {
  it('should have worker creation event function', () => {
    expect(events.workerCreated).toBeDefined()
    expect(typeof events.workerCreated).toBe('function')
  })

  it('should define workers table', () => {
    expect(tables.workers).toBeDefined()
  })

  it('should define getWorkers query', () => {
    expect(getWorkers$).toBeDefined()
    expect(getWorkers$.label).toBe('getWorkers')
  })

  it('should create worker event with correct structure', () => {
    const workerId = 'test-worker-id'
    const workerData = {
      id: workerId,
      name: 'Test Worker',
      roleDescription: 'Test Role',
      systemPrompt: 'Test system prompt',
      avatar: '🤖',
      createdAt: new Date(),
    }

    const event = events.workerCreated(workerData)
    expect(event.name).toBe('v1.WorkerCreated')
    expect(event.args).toEqual(workerData)
  })
})

describe('Worker Name Generation', () => {
  it('should generate random worker names', () => {
    const name1 = generateRandomWorkerName()
    const name2 = generateRandomWorkerName()

    expect(name1).toMatch(/^[A-Za-z]+ [A-Za-z]+$/)
    expect(name2).toMatch(/^[A-Za-z]+ [A-Za-z]+$/)
    expect(name1).not.toBe(name2) // Very unlikely to be the same
  })

  it('should have system prompt templates', () => {
    expect(systemPromptTemplates).toBeDefined()
    expect(Array.isArray(systemPromptTemplates)).toBe(true)
    expect(systemPromptTemplates.length).toBeGreaterThan(0)

    systemPromptTemplates.forEach(template => {
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('prompt')
      expect(typeof template.name).toBe('string')
      expect(typeof template.prompt).toBe('string')
    })
  })
})
