import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecurringTaskCard } from './RecurringTaskCard'
import type { RecurringTask } from '@work-squared/shared/schema'

// Mock formatInterval and formatRelativeTime
vi.mock('@work-squared/shared', () => ({
  formatInterval: vi.fn((hours: number) => `${hours} hours`),
  formatRelativeTime: vi.fn((timestamp: number) => 'in 2 hours'),
}))

// Mock useQuery hook
vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(() => []),
}))

const mockTask: RecurringTask = {
  id: 'task-1',
  name: 'Test Task',
  description: 'A test recurring task',
  prompt: 'Do something important',
  intervalHours: 24,
  enabled: true,
  projectId: null,
  lastExecutedAt: null,
  nextExecutionAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockDisabledTask: RecurringTask = {
  ...mockTask,
  id: 'task-2',
  name: 'Disabled Task',
  enabled: false,
  nextExecutionAt: null,
}

describe('RecurringTaskCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnToggleEnabled = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render enabled task correctly', () => {
    render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('A test recurring task')).toBeInTheDocument()
    expect(screen.getByText('Every 24 hours')).toBeInTheDocument()
    expect(screen.getByText('Next: in 2 hours')).toBeInTheDocument()
  })

  it('should render disabled task with reduced opacity', () => {
    const { container } = render(
      <RecurringTaskCard
        task={mockDisabledTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    const card = container.querySelector('.opacity-60')
    expect(card).toBeInTheDocument()
    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
  })

  it('should show action buttons on hover', async () => {
    const { container } = render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    const card = container.firstChild as HTMLElement

    // Initially actions should be hidden
    expect(container.querySelector('.opacity-0')).toBeInTheDocument()

    // Hover should show buttons
    fireEvent.mouseEnter(card)
    await waitFor(() => {
      expect(container.querySelector('.opacity-100')).toBeInTheDocument()
    })
  })

  it('should call onEdit when edit button is clicked', async () => {
    render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.mouseEnter(card)

    await waitFor(() => {
      const editButton = screen.getByTitle('Edit task')
      expect(editButton).toBeInTheDocument()
      fireEvent.click(editButton)
    })

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask)
  })

  it('should call onToggleEnabled when toggle button is clicked', async () => {
    render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.mouseEnter(card)

    await waitFor(() => {
      const toggleButton = screen.getByTitle('Disable task')
      expect(toggleButton).toBeInTheDocument()
      fireEvent.click(toggleButton)
    })

    expect(mockOnToggleEnabled).toHaveBeenCalledWith('task-1', false)
  })

  it('should show confirmation dialog when delete button is clicked', async () => {
    // Mock window.confirm
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.mouseEnter(card)

    await waitFor(() => {
      const deleteButton = screen.getByTitle('Delete task')
      expect(deleteButton).toBeInTheDocument()
      fireEvent.click(deleteButton)
    })

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Test Task"? This action cannot be undone.'
    )
    expect(mockOnDelete).toHaveBeenCalledWith('task-1')

    mockConfirm.mockRestore()
  })

  it('should not delete when confirmation is cancelled', async () => {
    // Mock window.confirm to return false
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.mouseEnter(card)

    await waitFor(() => {
      const deleteButton = screen.getByTitle('Delete task')
      fireEvent.click(deleteButton)
    })

    expect(mockOnDelete).not.toHaveBeenCalled()
    mockConfirm.mockRestore()
  })

  it('should show loading state for toggle action', async () => {
    mockOnToggleEnabled.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    const { container } = render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    const card = container.firstChild as HTMLElement
    fireEvent.mouseEnter(card)

    await waitFor(() => {
      const toggleButton = screen.getByTitle('Disable task')
      fireEvent.click(toggleButton)
    })

    // Should show loading state
    await waitFor(() => {
      expect(container.querySelector('.opacity-50')).toBeInTheDocument()
      expect(container.querySelector('.pointer-events-none')).toBeInTheDocument()
    })
  })

  it('should not show next execution for disabled tasks', () => {
    render(
      <RecurringTaskCard
        task={mockDisabledTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
  })

  it('should show last executed time when available', () => {
    const taskWithLastExecution = {
      ...mockTask,
      lastExecutedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    }

    render(
      <RecurringTaskCard
        task={taskWithLastExecution}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    )

    expect(screen.getByText('Last: in 2 hours')).toBeInTheDocument()
  })
})
