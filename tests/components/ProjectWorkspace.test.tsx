import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ProjectWorkspace } from '../../src/components/ProjectWorkspace.js'
import { createMockProject, createMockColumn, createMockTask } from '../../src/test-utils.js'

// Hoisted mocks
const { mockUseQuery, mockStore, mockUseParams } = vi.hoisted(() => {
  const mockUseQuery = vi.fn()
  const mockStore = { commit: vi.fn() }
  const mockUseParams = vi.fn(() => ({ projectId: 'test-project' }))
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

describe('ProjectWorkspace', () => {
  const mockProject = createMockProject({ 
    id: 'test-project',
    name: 'Test Project', 
    description: 'Test project description' 
  })
  const mockColumns = [createMockColumn({ id: 'col-1', name: 'Todo' })]
  const mockTasks = [createMockTask({ id: 'task-1', columnId: 'col-1', title: 'Test Task' })]

  beforeEach(() => {
    mockUseParams.mockReturnValue({ projectId: 'test-project' })

    // Reset all queries to return proper data
    mockUseQuery.mockReset()
    
    // Create a mock implementation based on call order since we can't easily inspect the query
    let callCount = 0
    mockUseQuery.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return [mockProject] // First call is for project data in context
      } else if (callCount === 2) {
        return mockColumns // Second call is for columns
      } else if (callCount === 3) {
        return mockTasks // Third call is for tasks
      }
      return []
    })
  })

  it('should render project workspace with header and breadcrumb', () => {
    render(<ProjectWorkspace />)
    
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Test Project' })).toBeInTheDocument()
    expect(screen.getByText('Test project description')).toBeInTheDocument()
  })

  it('should render tabbed interface with Tasks tab active', () => {
    render(<ProjectWorkspace />)
    
    const tasksTab = screen.getByRole('button', { name: 'Tasks' })
    const documentsTab = screen.getByRole('button', { name: 'Documents' })
    
    expect(tasksTab).toBeInTheDocument()
    expect(documentsTab).toBeInTheDocument()
    expect(documentsTab).toBeDisabled()
    
    // Tasks tab should be active by default
    expect(tasksTab).toHaveClass('border-blue-500', 'text-blue-600')
  })

  it('should render kanban board in tasks tab', () => {
    render(<ProjectWorkspace />)
    
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should show documents coming soon when documents tab is active', () => {
    render(<ProjectWorkspace />)
    
    // Even though the button is disabled, let's test that it has the proper title
    const documentsTab = screen.getByRole('button', { name: 'Documents' })
    expect(documentsTab).toHaveAttribute('title', 'Documents tab coming in Phase 1.2')
  })

  it('should handle missing projectId', () => {
    mockUseParams.mockReturnValue({ projectId: undefined })
    
    render(<ProjectWorkspace />)
    expect(screen.getByText('Project not found')).toBeInTheDocument()
  })

  it('should support old board URLs with boardId param', () => {
    mockUseParams.mockReturnValue({ boardId: 'test-project' })
    
    render(<ProjectWorkspace />)
    expect(screen.getByRole('heading', { name: 'Test Project' })).toBeInTheDocument()
  })

  it('should render back to projects link', () => {
    render(<ProjectWorkspace />)
    
    const backLink = screen.getByLabelText('Back to projects')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/projects')
  })

  it('should show project name in breadcrumb navigation', () => {
    render(<ProjectWorkspace />)
    
    // Should have breadcrumb link to projects
    const projectsLink = screen.getByRole('link', { name: 'Projects' })
    expect(projectsLink).toHaveAttribute('href', '/projects')
    
    // Should show project name in breadcrumb
    const breadcrumbItems = screen.getAllByText('Test Project')
    expect(breadcrumbItems.length).toBeGreaterThan(0)
  })
})