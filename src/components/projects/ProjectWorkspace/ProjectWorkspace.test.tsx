import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ProjectWorkspace } from './ProjectWorkspace.js'
import { createMockProject, createMockColumn, createMockTask } from '../../../test-utils.js'

// Hoisted mocks
const { mockUseQuery, mockStore, mockUseParams } = vi.hoisted(() => {
  const mockUseQuery = vi.fn()
  const mockStore = { commit: vi.fn() }
  const mockUseParams = vi.fn(() => ({
    projectId: 'test-project' as string,
  }))
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
  KeyboardSensor: vi.fn(),
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
    description: 'Test project description',
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
      } else if (callCount === 4) {
        return [] // Fourth call is for documents (empty for now)
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
    expect(documentsTab).toBeEnabled() // Documents tab is now enabled

    // Tasks tab should be active by default
    expect(tasksTab).toHaveClass('border-blue-500', 'text-blue-600')
  })

  it('should render kanban board in tasks tab', () => {
    render(<ProjectWorkspace />)

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should show empty documents list with create button when documents tab is active', () => {
    render(<ProjectWorkspace />)

    // Click on documents tab to switch to it
    const documentsTab = screen.getByRole('button', { name: 'Documents' })
    expect(documentsTab).toBeEnabled()
    expect(documentsTab).not.toHaveAttribute('title') // No tooltip since it's enabled

    // Switch to documents tab to see the content
    act(() => {
      documentsTab.click()
    })

    // Should show empty state with create button
    expect(screen.getByText('No documents yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first document to get started')).toBeInTheDocument()
    expect(screen.getAllByText('Create Document')).toHaveLength(2) // Header button + empty state button
  })

  it('should handle missing projectId', () => {
    mockUseParams.mockReturnValue({ projectId: undefined as any })

    render(<ProjectWorkspace />)
    expect(screen.getByText('Project not found')).toBeInTheDocument()
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
