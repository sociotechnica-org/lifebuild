import { describe, expect, it } from 'vitest'
import { events, tables } from '@work-squared/shared/schema'
import { getBoardTasks$ } from '@work-squared/shared/queries'

describe('Kanban Events and Materialization', () => {
  // PR3: Column events removed - migration to status-based tasks complete
  it('should have v1 task events defined', () => {
    expect(events.taskCreated).toBeDefined()
    expect(events.taskMoved).toBeDefined()
  })

  it('should have v2 task events defined', () => {
    expect(events.taskCreatedV2).toBeDefined()
    expect(events.taskStatusChanged).toBeDefined()
    expect(events.taskReordered).toBeDefined()
    expect(events.taskMovedToProject).toBeDefined()
    expect(events.taskAttributesUpdated).toBeDefined()
  })

  it('should have task table defined', () => {
    // PR3: columns table removed
    expect(tables.tasks).toBeDefined()
  })

  it('should define board query functions', () => {
    // PR3: getBoardColumns$ removed - use status-based queries instead
    expect(getBoardTasks$).toBeDefined()
    expect(typeof getBoardTasks$).toBe('function')

    // Test that calling it returns a query
    const tasksQuery = getBoardTasks$('test-board')
    expect(tasksQuery.label).toBe('getBoardTasks:test-board')
  })
})
