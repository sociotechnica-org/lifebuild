import { describe, expect, it } from 'vitest'
import { events, tables } from '@lifebuild/shared/schema'
import { getBoards$ } from '@lifebuild/shared/queries'

describe('Board Events and Materialization', () => {
  it('should have project creation event function', () => {
    expect(events.projectCreated).toBeDefined()
    expect(typeof events.projectCreated).toBe('function')
  })

  it('should define projects table', () => {
    expect(tables.projects).toBeDefined()
  })

  it('should define getBoards query', () => {
    expect(getBoards$).toBeDefined()
    expect(getBoards$.label).toBe('getBoards')
  })
})
