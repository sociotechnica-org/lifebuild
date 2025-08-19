import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KanbanColumn } from './KanbanColumn.js'
import { createMockColumn, createMockTasks } from '../../../../../tests/test-utils.js'

// Hoisted mocks
const { mockCommit, mockUseDroppable, mockUseDraggable } = vi.hoisted(() => {
  const mockCommit = vi.fn()
  const mockUseDroppable = vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }))
  const mockUseDraggable = vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }))
  return { mockCommit, mockUseDroppable, mockUseDraggable }
})

// Mock the useStore hook
vi.mock('@livestore/react', () => ({
  useStore: () => ({
    store: {
      commit: mockCommit,
    },
  }),
  useQuery: () => [], // Mock empty users array
}))

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDroppable: mockUseDroppable,
  useDraggable: mockUseDraggable,
}))

describe('KanbanColumn', () => {
  const mockColumn = createMockColumn()
  const mockTasks = createMockTasks(2, {
    columnId: 'test-column',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  })

  // Helper to render with default props
  const renderColumn = (props: Partial<React.ComponentProps<typeof KanbanColumn>> = {}) => {
    return render(
      <KanbanColumn
        column={mockColumn}
        tasks={[]}
        insertionPreview={null}
        draggedTaskHeight={0}
        draggedTaskId={null}
        showAddCardPreview={false}
        {...props}
      />
    )
  }

  it('should render column name', () => {
    renderColumn()
    expect(screen.getByText('Test Column')).toBeInTheDocument()
  })

  it('should render task count', () => {
    renderColumn({ tasks: mockTasks })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should render tasks', () => {
    renderColumn({ tasks: mockTasks })
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should show Add Card button when no tasks', () => {
    renderColumn()
    expect(screen.getByText('➕ Add Card')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should show Add Card button when there are tasks', () => {
    renderColumn({ tasks: mockTasks })
    expect(screen.getByText('➕ Add Card')).toBeInTheDocument()
  })

  it('should show AddTaskForm when Add Card button is clicked', () => {
    renderColumn()

    fireEvent.click(screen.getByText('➕ Add Card'))

    expect(screen.getByPlaceholderText('Task name')).toBeInTheDocument()
    expect(screen.queryByText('➕ Add Card')).not.toBeInTheDocument()
  })

  it('should assign position 0 to first task in empty column', () => {
    mockCommit.mockClear()

    renderColumn()

    fireEvent.click(screen.getByText('➕ Add Card'))
    const input = screen.getByPlaceholderText('Task name')
    fireEvent.change(input, { target: { value: 'First task' } })
    fireEvent.click(screen.getByText('Add Card'))

    // Check if the task creation was called with position 0
    expect(mockCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        args: expect.objectContaining({
          position: 0,
          title: 'First task',
        }),
      })
    )
  })

  it('should show insertion placeholder when dragging over Add Card button', () => {
    mockUseDroppable.mockReturnValue({
      setNodeRef: vi.fn(),
      isOver: true,
    })

    // Render with showAddCardPreview to show insertion placeholder
    render(
      <KanbanColumn
        column={mockColumn}
        tasks={[]} // Empty column
        insertionPreview={null}
        draggedTaskHeight={76}
        draggedTaskId={null}
        showAddCardPreview={true} // Show the preview above Add Card
      />
    )

    // Should show the insertion placeholder (Drop here text)
    expect(screen.getByText('Drop here')).toBeInTheDocument()

    // The Add Card button should maintain normal styling
    const addCardButton = screen.getByText('➕ Add Card')
    expect(addCardButton).toHaveClass('border-gray-300')
  })

  it('should show insertion placeholder between cards at correct position', () => {
    // Render with multiple tasks and insertionPreview at position 1 (between first and second task)
    render(
      <KanbanColumn
        column={mockColumn}
        tasks={mockTasks}
        insertionPreview={1} // Insert at index 1 (between Task 1 and Task 2)
        draggedTaskHeight={76}
        draggedTaskId={null}
        showAddCardPreview={false}
      />
    )

    // Should show the insertion placeholder (Drop here text)
    expect(screen.getByText('Drop here')).toBeInTheDocument()

    // Should show both tasks
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })
})
