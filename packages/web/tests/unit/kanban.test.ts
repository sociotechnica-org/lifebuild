import { describe, expect, it } from 'vitest'
import { events, tables } from '@work-squared/shared/schema'
import { getBoardColumns$, getBoardTasks$ } from '@work-squared/shared/queries'

describe('Kanban Events and Materialization', () => {
  it('should have column and task events defined', () => {
    expect(events.columnCreated).toBeDefined()
    expect(events.columnRenamed).toBeDefined()
    expect(events.columnReordered).toBeDefined()
    expect(events.taskCreated).toBeDefined()
  })

  it('should have column and task tables defined', () => {
    expect(tables.columns).toBeDefined()
    expect(tables.tasks).toBeDefined()
  })

  it('should define board query functions', () => {
    expect(getBoardColumns$).toBeDefined()
    expect(getBoardTasks$).toBeDefined()
    expect(typeof getBoardColumns$).toBe('function')
    expect(typeof getBoardTasks$).toBe('function')

    // Test that calling them returns queries
    const columnsQuery = getBoardColumns$('test-board')
    const tasksQuery = getBoardTasks$('test-board')
    expect(columnsQuery.label).toBe('getBoardColumns:test-board')
    expect(tasksQuery.label).toBe('getBoardTasks:test-board')
  })
})
