import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecurringTaskCard } from './RecurringTaskCard'
import type { RecurringTask } from '@lifebuild/shared/schema'

// Mock formatInterval and formatRelativeTime
vi.mock('@lifebuild/shared', () => ({
  formatInterval: vi.fn((hours: number) => `${hours} hours`),
  formatRelativeTime: vi.fn((_timestamp: number) => 'in 2 hours'),
}))

// Mock useQuery hook
vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(() => []),
}))

// Mock ExecutionHistory component
vi.mock('./ExecutionHistory', () => ({
  ExecutionHistory: vi.fn(() => null),
}))

// Mock AssigneeAvatars component
vi.mock('../ui/AssigneeSelector/AssigneeSelector.js', () => ({
  AssigneeAvatars: ({ assigneeIds }: { assigneeIds: string[] }) => (
    <div data-testid='assignee-avatars'>
      {assigneeIds.map(id => (
        <span key={id} data-testid={`avatar-${id}`}>
          {id}
        </span>
      ))}
    </div>
  ),
}))

const mockTask: RecurringTask = {
  id: 'task-1',
  name: 'Test Task',
  description: 'A test recurring task',
  prompt: 'Do something important',
  intervalHours: 24,
  assigneeIds: '["user1", "user2"]',
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
  assigneeIds: '[]',
  enabled: false,
  nextExecutionAt: null,
}

describe('RecurringTaskCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnToggleEnabled = vi.fn()
  const mockOnTrigger = vi.fn()

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
        onTrigger={mockOnTrigger}
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
        onTrigger={mockOnTrigger}
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
        onTrigger={mockOnTrigger}
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
        onTrigger={mockOnTrigger}
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
        onTrigger={mockOnTrigger}
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
        onTrigger={mockOnTrigger}
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
        onTrigger={mockOnTrigger}
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
    let resolveToggle: () => void
    const togglePromise = new Promise<void>(resolve => {
      resolveToggle = resolve
    })
    mockOnToggleEnabled.mockImplementation(() => togglePromise)

    const { container } = render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
        onTrigger={mockOnTrigger}
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

    // Complete the toggle operation to prevent state update after test teardown
    resolveToggle!()
    await togglePromise
  })

  it('should not show next execution for disabled tasks', () => {
    render(
      <RecurringTaskCard
        task={mockDisabledTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
        onTrigger={mockOnTrigger}
      />
    )

    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
  })

  it('should call onTrigger when run button is clicked', async () => {
    render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
        onTrigger={mockOnTrigger}
      />
    )

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.mouseEnter(card)

    await waitFor(() => {
      const runButton = screen.getByTitle('Run now')
      expect(runButton).toBeInTheDocument()
      fireEvent.click(runButton)
    })

    expect(mockOnTrigger).toHaveBeenCalledWith('task-1')
  })

  it('should disable run button for disabled tasks', () => {
    render(
      <RecurringTaskCard
        task={mockDisabledTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
        onTrigger={mockOnTrigger}
      />
    )

    const card = screen.getByText('Disabled Task').closest('div')!
    fireEvent.mouseEnter(card)

    const runButton = screen.getByTitle('Enable task to run')
    expect(runButton).toBeDisabled()
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
        onTrigger={mockOnTrigger}
      />
    )

    expect(screen.getByText('Last: in 2 hours')).toBeInTheDocument()
  })

  it('should display assignee avatars when assignees exist', () => {
    render(
      <RecurringTaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
        onTrigger={mockOnTrigger}
      />
    )

    expect(screen.getByText('Assigned to:')).toBeInTheDocument()
    expect(screen.getByTestId('assignee-avatars')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-user1')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-user2')).toBeInTheDocument()
  })

  it('should not display assignees section when no assignees exist', () => {
    render(
      <RecurringTaskCard
        task={mockDisabledTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
        onTrigger={mockOnTrigger}
      />
    )

    expect(screen.queryByText('Assigned to:')).not.toBeInTheDocument()
    expect(screen.queryByTestId('assignee-avatars')).not.toBeInTheDocument()
  })

  it('should handle malformed assigneeIds gracefully', () => {
    const taskWithBadAssigneeIds = {
      ...mockTask,
      assigneeIds: 'invalid json',
    }

    render(
      <RecurringTaskCard
        task={taskWithBadAssigneeIds}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
        onTrigger={mockOnTrigger}
      />
    )

    // Should not crash and not show assignees section
    expect(screen.queryByText('Assigned to:')).not.toBeInTheDocument()
  })
})
