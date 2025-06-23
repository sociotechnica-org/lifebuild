import { describe, expect, it } from 'vitest'
import { events, tables } from '../../src/livestore/schema.js'
import { getBoards$ } from '../../src/livestore/queries.js'

describe('Board Events and Materialization', () => {
  it('should have project creation event function', () => {
    expect(events.projectCreated).toBeDefined()
    expect(typeof events.projectCreated).toBe('function')
  })

  it('should define boards table', () => {
    expect(tables.boards).toBeDefined()
  })

  it('should define getBoards query', () => {
    expect(getBoards$).toBeDefined()
    expect(getBoards$.label).toBe('getBoards')
  })
})
