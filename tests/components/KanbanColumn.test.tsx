import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KanbanColumn } from '../../src/components/KanbanColumn.js'

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
}))

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDroppable: mockUseDroppable,
  useDraggable: mockUseDraggable,
}))

describe('KanbanColumn', () => {
  const mockColumn = {
    id: 'test-column',
    boardId: 'test-board',
    name: 'Test Column',
    position: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }

  const mockTasks = [
    {
      id: 'task-1',
      boardId: 'test-board',
      columnId: 'test-column',
      title: 'Task 1',
      position: 0,
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'task-2',
      boardId: 'test-board',
      columnId: 'test-column',
      title: 'Task 2',
      position: 1,
      createdAt: new Date('2023-01-02'),
    },
  ]

  it('should render column name', () => {
    render(<KanbanColumn column={mockColumn} tasks={[]} />)
    expect(screen.getByText('Test Column')).toBeInTheDocument()
  })

  it('should render task count', () => {
    render(<KanbanColumn column={mockColumn} tasks={mockTasks} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should render tasks', () => {
    render(<KanbanColumn column={mockColumn} tasks={mockTasks} />)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should show Add Card button when no tasks', () => {
    render(<KanbanColumn column={mockColumn} tasks={[]} />)
    expect(screen.getByText('➕ Add Card')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should show Add Card button when there are tasks', () => {
    render(<KanbanColumn column={mockColumn} tasks={mockTasks} />)
    expect(screen.getByText('➕ Add Card')).toBeInTheDocument()
  })

  it('should show AddTaskForm when Add Card button is clicked', () => {
    render(<KanbanColumn column={mockColumn} tasks={[]} />)

    fireEvent.click(screen.getByText('➕ Add Card'))

    expect(screen.getByPlaceholderText('Task name')).toBeInTheDocument()
    expect(screen.queryByText('➕ Add Card')).not.toBeInTheDocument()
  })

  it('should assign position 0 to first task in empty column', () => {
    mockCommit.mockClear()

    render(<KanbanColumn column={mockColumn} tasks={[]} />)

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

  it('should show hover styling when dragging over', () => {
    mockUseDroppable.mockReturnValue({
      setNodeRef: vi.fn(),
      isOver: true,
    })

    render(<KanbanColumn column={mockColumn} tasks={[]} />)
    const column = screen.getByText('Test Column').closest('.flex-shrink-0')
    expect(column).toHaveClass('bg-blue-50', 'border-2', 'border-blue-300')
  })
})
