import React from 'react'
import { render, screen, fireEvent } from "../../../../tests/test-utils.js"
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TaskCard } from './TaskCard.js'
import { createMockTask } from '../../../../tests/test-utils.js'

// Hoisted mocks
const { mockUseDraggable, mockUseDroppable, mockUseQuery } = vi.hoisted(() => {
  const mockUseDraggable = vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }))
  const mockUseDroppable = vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }))
  const mockUseQuery = vi.fn()
  return { mockUseDraggable, mockUseDroppable, mockUseQuery }
})

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDraggable: mockUseDraggable,
  useDroppable: mockUseDroppable,
}))

// Mock LiveStore React hooks
vi.mock('@livestore/react', () => ({
  useQuery: mockUseQuery,
}))

describe('TaskCard', () => {
  const mockTask = createMockTask()
  const mockUsers = [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date(),
      syncedAt: null,
    },
    {
      id: 'user-2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date(),
      syncedAt: null,
    },
    {
      id: 'user-3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date(),
      syncedAt: null,
    },
  ]

  beforeEach(() => {
    // Reset mocks before each test
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    })
    mockUseDroppable.mockReturnValue({
      setNodeRef: vi.fn(),
      isOver: false,
    })
    mockUseQuery.mockReturnValue(mockUsers)
  })

  it('should render task title', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    render(<TaskCard task={mockTask} />)
    const card = screen.getByText('Test Task').closest('div')?.parentElement
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm')
  })

  it('should render with drag overlay styling', () => {
    render(<TaskCard task={mockTask} isDragOverlay />)
    const card = screen.getByText('Test Task').closest('div')?.parentElement
    expect(card).toHaveClass('shadow-lg', 'rotate-2')
  })

  it('should render with dragging state styling', () => {
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: true,
    })

    render(<TaskCard task={mockTask} />)
    const card = screen.getByText('Test Task').closest('div')?.parentElement
    expect(card).toHaveClass('opacity-50')
  })

  it('should call onClick when clicked and not dragging', () => {
    const mockOnClick = vi.fn()
    render(<TaskCard task={mockTask} onClick={mockOnClick} />)

    const card = screen.getByText('Test Task').closest('div')?.parentElement!
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledWith('test-task')
  })

  it('should not call onClick when dragging', () => {
    const mockOnClick = vi.fn()
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: true,
    })

    render(<TaskCard task={mockTask} onClick={mockOnClick} />)

    const card = screen.getByText('Test Task').closest('div')?.parentElement!
    fireEvent.click(card)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('should not call onClick when no handler provided', () => {
    render(<TaskCard task={mockTask} />)

    const card = screen.getByText('Test Task').closest('div')?.parentElement!

    // Should not throw error when clicked without onClick handler
    expect(() => fireEvent.click(card)).not.toThrow()
  })

  it('should stop propagation when clicked', () => {
    const mockOnClick = vi.fn()
    const mockParentClick = vi.fn()

    render(
      <div onClick={mockParentClick}>
        <TaskCard task={mockTask} onClick={mockOnClick} />
      </div>
    )

    const card = screen.getByText('Test Task').closest('div')?.parentElement!
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledWith('test-task')
    expect(mockParentClick).not.toHaveBeenCalled()
  })

  it('should display assignee avatars when task has assignees', () => {
    const taskWithAssignees = {
      ...mockTask,
      assigneeIds: '["user-1", "user-2"]',
    }

    render(<TaskCard task={taskWithAssignees} />)

    // Should show avatars for Alice and Bob
    expect(screen.getByTitle('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByTitle('Bob Smith')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument() // Alice first initial
    expect(screen.getByText('B')).toBeInTheDocument() // Bob first initial
  })

  it('should not display assignee section when task has no assignees', () => {
    const taskWithoutAssignees = {
      ...mockTask,
      assigneeIds: '[]',
    }

    render(<TaskCard task={taskWithoutAssignees} />)

    // Should not show any avatars
    expect(screen.queryByTitle('Alice Johnson')).not.toBeInTheDocument()
    expect(screen.queryByText('A')).not.toBeInTheDocument()
  })

  it('should handle malformed assigneeIds gracefully', () => {
    const taskWithBadAssignees = {
      ...mockTask,
      assigneeIds: 'invalid-json',
    }

    // Should not throw error
    expect(() => render(<TaskCard task={taskWithBadAssignees} />)).not.toThrow()
  })

  it('should show +N indicator when more than 3 assignees', () => {
    const taskWithManyAssignees = {
      ...mockTask,
      assigneeIds: '["user-1", "user-2", "user-3", "user-4", "user-5"]',
    }

    // Add more mock users
    mockUseQuery.mockReturnValue([
      ...mockUsers,
      {
        id: 'user-4',
        name: 'David Wilson',
        email: 'david@example.com',
        avatarUrl: null,
        isAdmin: false,
        createdAt: new Date(),
        syncedAt: null,
      },
      {
        id: 'user-5',
        name: 'Eva Brown',
        email: 'eva@example.com',
        avatarUrl: null,
        isAdmin: false,
        createdAt: new Date(),
        syncedAt: null,
      },
    ])

    render(<TaskCard task={taskWithManyAssignees} />)

    // Should show first 3 avatars plus +2 indicator
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('should handle edge cases in name formatting for initials', () => {
    const taskWithEdgeCaseNames = {
      ...mockTask,
      assigneeIds: '["user-edge-1", "user-edge-2", "user-edge-3"]',
    }

    // Mock users with edge case names
    mockUseQuery.mockReturnValue([
      {
        id: 'user-edge-1',
        name: 'John  Smith',
        email: 'john@example.com',
        avatarUrl: null,
        isAdmin: false,
        createdAt: new Date(),
        syncedAt: null,
      }, // Extra spaces
      {
        id: 'user-edge-2',
        name: ' Jane Doe ',
        email: 'jane@example.com',
        avatarUrl: null,
        isAdmin: false,
        createdAt: new Date(),
        syncedAt: null,
      }, // Leading/trailing spaces
      {
        id: 'user-edge-3',
        name: 'Bob',
        email: 'bob@example.com',
        avatarUrl: null,
        isAdmin: false,
        createdAt: new Date(),
        syncedAt: null,
      },
    ])

    render(<TaskCard task={taskWithEdgeCaseNames} />)

    // Should show properly formatted initials (first letter only)
    expect(screen.getByText('J')).toBeInTheDocument() // John (first initial)
    expect(screen.getByText('B')).toBeInTheDocument() // Bob
  })
})
