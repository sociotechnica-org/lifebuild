import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { KanbanBoard } from '../../src/components/KanbanBoard.js'
import {
  createMockProject,
  createMockColumn,
  createMockTask,
  createMockTasks,
} from '../../src/test-utils.js'

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
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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
  const mockBoard = createMockProject({ name: 'Test Board' })

  const mockColumns = [createMockColumn({ id: 'col-1', name: 'Todo' })]

  const mockTasks = [createMockTask({ id: 'task-1', columnId: 'col-1', title: 'Test Task' })]

  beforeEach(() => {
    // Reset to default boardId
    mockUseParams.mockReturnValue({ boardId: 'test-board' })

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getBoardById')) {
        return [mockBoard]
      }
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
    expect(screen.getByText('Project not found')).toBeInTheDocument()
  })

  it('should render with multiple tasks and maintain proper structure', () => {
    // Set up test scenario: column with 3 tasks to test rendering behavior
    const testTasks = createMockTasks(3, { columnId: 'col-1' })

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getBoardById')) {
        return [mockBoard]
      }
      if (query.label?.includes('getBoardColumns')) {
        return mockColumns
      }
      if (query.label?.includes('getBoardTasks')) {
        return testTasks
      }
      return []
    })

    render(<KanbanBoard />)

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })
})
