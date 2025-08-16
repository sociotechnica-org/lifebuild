import { describe, expect, it, beforeEach } from 'vitest'
import { calculateTaskReorder, calculateDropTarget } from './taskReordering'
import type { Task } from '@work-squared/shared/schema'

describe('Task Reordering', () => {
  let mockTasks: Task[]

  beforeEach(() => {
    // Create mock tasks with positions
    mockTasks = [
      {
        id: 'task-1',
        projectId: 'proj-1',
        columnId: 'col-1',
        title: 'Task 1',
        description: '',
        assigneeIds: [],
        position: 1000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        archivedAt: null,
      },
      {
        id: 'task-2',
        projectId: 'proj-1',
        columnId: 'col-1',
        title: 'Task 2',
        description: '',
        assigneeIds: [],
        position: 2000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        archivedAt: null,
      },
      {
        id: 'task-3',
        projectId: 'proj-1',
        columnId: 'col-1',
        title: 'Task 3',
        description: '',
        assigneeIds: [],
        position: 3000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        archivedAt: null,
      },
      {
        id: 'task-4',
        projectId: 'proj-1',
        columnId: 'col-2',
        title: 'Task 4',
        description: '',
        assigneeIds: [],
        position: 1000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        archivedAt: null,
      },
    ]
  })

  describe('calculateTaskReorder', () => {
    it('should move task to empty column', () => {
      const draggedTask = mockTasks[0]!
      const results = calculateTaskReorder(draggedTask, 'col-3', 0, [])

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        taskId: 'task-1',
        toColumnId: 'col-3',
        position: 1000,
      })
    })

    it('should move task to beginning of column', () => {
      const draggedTask = mockTasks[2]! // task-3
      const tasksInColumn = [mockTasks[0]!, mockTasks[1]!] // task-1, task-2

      const results = calculateTaskReorder(draggedTask, 'col-1', 0, tasksInColumn)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        taskId: 'task-3',
        toColumnId: 'col-1',
        position: 500, // Half of first task's position
      })
    })

    it('should move task to end of column', () => {
      const draggedTask = mockTasks[0]! // task-1
      const tasksInColumn = [mockTasks[1]!, mockTasks[2]!] // task-2, task-3

      const results = calculateTaskReorder(draggedTask, 'col-1', 2, tasksInColumn)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        taskId: 'task-1',
        toColumnId: 'col-1',
        position: 4000, // Last task position + 1000
      })
    })

    it('should move task between two tasks', () => {
      const draggedTask = mockTasks[3]! // task-4 from col-2
      const tasksInColumn = [mockTasks[0]!, mockTasks[2]!] // task-1 (1000), task-3 (3000)

      const results = calculateTaskReorder(draggedTask, 'col-1', 1, tasksInColumn)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        taskId: 'task-4',
        toColumnId: 'col-1',
        position: 2000, // Average of 1000 and 3000
      })
    })

    it('should handle moving within same column upward', () => {
      const draggedTask = mockTasks[2]! // task-3
      const tasksInColumn = [mockTasks[0]!, mockTasks[1]!, mockTasks[2]!] // All col-1 tasks

      const results = calculateTaskReorder(draggedTask, 'col-1', 1, tasksInColumn)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        taskId: 'task-3',
        toColumnId: 'col-1',
        position: 1500, // Between task-1 (1000) and task-2 (2000)
      })
    })

    it('should handle moving within same column downward', () => {
      const draggedTask = mockTasks[0]! // task-1
      const tasksInColumn = [mockTasks[0]!, mockTasks[1]!, mockTasks[2]!] // All col-1 tasks

      const results = calculateTaskReorder(draggedTask, 'col-1', 2, tasksInColumn)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        taskId: 'task-1',
        toColumnId: 'col-1',
        // When moving to index 2, it goes after the last task (task-3 at 3000)
        position: 4000, // After task-3 (3000) + 1000
      })
    })

    it('should normalize positions when gaps are too small', () => {
      // Create tasks with very small position gaps
      const tasksWithSmallGaps: Task[] = [
        { ...mockTasks[0]!, position: 1.0 },
        { ...mockTasks[1]!, position: 1.0005 },
        { ...mockTasks[2]!, position: 1.001 },
      ]

      const draggedTask = mockTasks[3]! // task-4
      const results = calculateTaskReorder(draggedTask, 'col-1', 1, tasksWithSmallGaps)

      // Should normalize all positions
      expect(results.length).toBeGreaterThan(1)

      // Check that positions are properly spaced
      const sortedResults = results.sort((a, b) => a.position - b.position)
      expect(sortedResults[0]?.position).toBe(1000)
      expect(sortedResults[1]?.position).toBe(2000)
      expect(sortedResults[2]?.position).toBe(3000)
      expect(sortedResults[3]?.position).toBe(4000)
    })

    it('should handle dropping task back to original position', () => {
      const draggedTask = mockTasks[1]! // task-2
      const tasksInColumn = [mockTasks[0]!, mockTasks[1]!, mockTasks[2]!]

      // Dropping back at index 1 (its original position)
      const results = calculateTaskReorder(draggedTask, 'col-1', 1, tasksInColumn)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        taskId: 'task-2',
        toColumnId: 'col-1',
        // When dropping at original position, it stays at the same value
        // The algorithm filters out the dragged task, so index 1 means between task-1 and task-3
        position: 2000, // Average of task-1 (1000) and task-3 (3000)
      })
    })
  })

  describe('calculateDropTarget', () => {
    let tasksByColumn: Record<string, Task[]>

    beforeEach(() => {
      const task1 = mockTasks[0]
      const task2 = mockTasks[1]
      const task3 = mockTasks[2]
      const task4 = mockTasks[3]

      tasksByColumn = {
        'col-1': task1 && task2 && task3 ? [task1, task2, task3] : [],
        'col-2': task4 ? [task4] : [],
        'col-3': [],
      }
    })

    it('should handle empty column drop', () => {
      const task = mockTasks[0]
      if (!task) throw new Error('Task not found')
      const result = calculateDropTarget('empty-column-col-3', task, tasksByColumn)

      expect(result).toEqual({
        columnId: 'col-3',
        index: 0,
      })
    })

    it('should handle add card button drop', () => {
      const task = mockTasks[3]
      if (!task) throw new Error('Task not found')
      const result = calculateDropTarget('add-card-col-1', task, tasksByColumn)

      expect(result).toEqual({
        columnId: 'col-1',
        index: 3, // After all existing tasks
      })
    })

    it('should handle dropping on task in different column', () => {
      const task = mockTasks[3]
      if (!task) throw new Error('Task not found')
      const result = calculateDropTarget('task-2', task, tasksByColumn)

      expect(result).toEqual({
        columnId: 'col-1',
        index: 1, // At task-2's position
      })
    })

    it('should handle dropping on task in same column (moving up)', () => {
      const task = mockTasks[2]
      if (!task) throw new Error('Task not found')
      const result = calculateDropTarget('task-1', task, tasksByColumn)

      expect(result).toEqual({
        columnId: 'col-1',
        index: 0, // At task-1's position
      })
    })

    it('should handle dropping on task in same column (moving down)', () => {
      const task = mockTasks[0]
      if (!task) throw new Error('Task not found')
      const result = calculateDropTarget('task-3', task, tasksByColumn)

      expect(result).toEqual({
        columnId: 'col-1',
        index: 2, // After task-3 since we're moving down
      })
    })

    it('should return null for invalid drop target', () => {
      const task = mockTasks[0]
      if (!task) throw new Error('Task not found')
      const result = calculateDropTarget('invalid-id', task, tasksByColumn)

      expect(result).toBeNull()
    })
  })
})
