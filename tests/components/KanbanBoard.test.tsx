import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KanbanBoard } from '../../src/components/KanbanBoard.js'

// Hoisted mocks
const { mockUseQuery, mockStore, mockUseParams } = vi.hoisted(() => {
  const mockUseQuery = vi.fn()
  const mockStore = { commit: vi.fn() }
  const mockUseParams = vi.fn(() => ({ boardId: 'test-board' }))
  return { mockUseQuery, mockStore, mockUseParams }
})

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: mockUseParams,
}))

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useQuery: mockUseQuery,
  useStore: () => ({ store: mockStore }),
}))

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='dnd-context'>{children}</div>
  ),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='drag-overlay'>{children}</div>
  ),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  })),
}))

describe('KanbanBoard', () => {
  const mockColumns = [
    {
      id: 'col-1',
      boardId: 'test-board',
      name: 'Todo',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockTasks = [
    {
      id: 'task-1',
      boardId: 'test-board',
      columnId: 'col-1',
      title: 'Test Task',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getBoardColumns')) {
        return mockColumns
      }
      if (query.label?.includes('getBoardTasks')) {
        return mockTasks
      }
      return []
    })
  })

  it('should render DndContext wrapper', () => {
    render(<KanbanBoard />)
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
  })

  it('should render DragOverlay', () => {
    render(<KanbanBoard />)
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
  })

  it('should render columns and tasks', () => {
    render(<KanbanBoard />)
    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should handle missing boardId', () => {
    mockUseParams.mockReturnValue({ boardId: undefined as any })

    render(<KanbanBoard />)
    expect(screen.getByText('Board not found')).toBeInTheDocument()
  })
})
