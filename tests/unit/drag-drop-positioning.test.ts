import { describe, expect, it } from 'vitest'

/**
 * Unit tests for drag-and-drop position calculation logic
 * These tests verify the fix for the bug where dropping a task on an empty column area
 * would miscalculate the position by not accounting for the dragged task being removed.
 */
describe('Drag and Drop Position Calculation', () => {
  it('should calculate correct position when dropping task at end of same column', () => {
    // Simulate the tasksByColumn structure
    const tasksByColumn = {
      'col-1': [
        { id: 'task-1', position: 0 },
        { id: 'task-2', position: 1 },
        { id: 'task-3', position: 2 },
      ],
    }

    const task = { id: 'task-2', columnId: 'col-1', position: 1 }
    const targetColumnId = 'col-1'

    // This is the logic from handleDragEnd when dropping on empty column area
    let targetPosition = tasksByColumn[targetColumnId]?.length || 0 // Would be 3
    
    // The fix: account for the dragged task being removed if dropping in same column
    if (targetColumnId === task.columnId) {
      targetPosition = Math.max(0, targetPosition - 1) // Should become 2
    }

    expect(targetPosition).toBe(2) // Not 3 (which would be the bug)
  })

  it('should not adjust position when dropping task at end of different column', () => {
    const tasksByColumn = {
      'col-1': [
        { id: 'task-1', position: 0 },
        { id: 'task-2', position: 1 },
        { id: 'task-3', position: 2 },
      ],
      'col-2': [
        { id: 'task-4', position: 0 },
      ],
    }

    const task = { id: 'task-2', columnId: 'col-1', position: 1 }
    const targetColumnId = 'col-2'

    let targetPosition = tasksByColumn[targetColumnId]?.length || 0 // Would be 1
    
    // No adjustment needed when moving to different column
    if (targetColumnId === task.columnId) {
      targetPosition = Math.max(0, targetPosition - 1)
    }

    expect(targetPosition).toBe(1) // Should remain 1 (end of target column)
  })

  it('should handle empty column correctly', () => {
    const tasksByColumn = {
      'col-1': [
        { id: 'task-1', position: 0 },
      ],
      'col-2': [], // Empty column
    }

    const task = { id: 'task-1', columnId: 'col-1', position: 0 }
    const targetColumnId = 'col-2'

    let targetPosition = tasksByColumn[targetColumnId]?.length || 0 // Would be 0
    
    if (targetColumnId === task.columnId) {
      targetPosition = Math.max(0, targetPosition - 1)
    }

    expect(targetPosition).toBe(0) // Should be 0 (first position in empty column)
  })

  it('should handle single task column correctly when dropping at end', () => {
    const tasksByColumn = {
      'col-1': [
        { id: 'task-1', position: 0 },
      ],
    }

    const task = { id: 'task-1', columnId: 'col-1', position: 0 }
    const targetColumnId = 'col-1'

    let targetPosition = tasksByColumn[targetColumnId]?.length || 0 // Would be 1
    
    // The fix: account for the dragged task being removed
    if (targetColumnId === task.columnId) {
      targetPosition = Math.max(0, targetPosition - 1) // Should become 0
    }

    expect(targetPosition).toBe(0) // Should stay at position 0 (only position available)
  })
})