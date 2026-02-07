import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../../../tests/test-utils.js'
import { TaskDetailModal } from './TaskDetailModal'
import type { Task } from '@lifebuild/shared/schema'

// Mock the livestore-compat module
const mockCommit = vi.fn()
vi.mock('../../../livestore-compat.js', () => ({
  useStore: () => ({
    store: {
      commit: mockCommit,
    },
  }),
}))

// Mock the AuthContext
vi.mock('../../../contexts/AuthContext.js', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
  }),
}))

// Mock PostHog
const mockCapture = vi.fn()
vi.mock('../../../lib/analytics.js', () => ({
  usePostHog: () => ({
    capture: mockCapture,
  }),
}))

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  assigneeIds: '[]',
  attributes: null,
  position: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  archivedAt: null,
  ...overrides,
})

describe('TaskDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the delete button when viewing a task', () => {
    const task = createMockTask()
    const onClose = vi.fn()

    render(<TaskDetailModal task={task} allTasks={[task]} onClose={onClose} />)

    expect(screen.getByLabelText('Delete task')).toBeInTheDocument()
  })

  it('does not render the delete button in creation mode', () => {
    const onClose = vi.fn()

    render(
      <TaskDetailModal
        task={null}
        allTasks={[]}
        onClose={onClose}
        projectId='project-1'
        isCreating={true}
      />
    )

    expect(screen.queryByLabelText('Delete task')).not.toBeInTheDocument()
  })

  it('calls taskArchived event when delete button is clicked', () => {
    const task = createMockTask()
    const onClose = vi.fn()

    render(<TaskDetailModal task={task} allTasks={[task]} onClose={onClose} />)

    const deleteButton = screen.getByLabelText('Delete task')
    fireEvent.click(deleteButton)

    expect(mockCommit).toHaveBeenCalledTimes(1)
    expect(mockCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.TaskArchived',
      })
    )
  })

  it('closes the modal after deleting', () => {
    const task = createMockTask()
    const onClose = vi.fn()

    render(<TaskDetailModal task={task} allTasks={[task]} onClose={onClose} />)

    const deleteButton = screen.getByLabelText('Delete task')
    fireEvent.click(deleteButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tracks task_deleted event in PostHog', () => {
    const task = createMockTask()
    const onClose = vi.fn()

    render(<TaskDetailModal task={task} allTasks={[task]} onClose={onClose} />)

    const deleteButton = screen.getByLabelText('Delete task')
    fireEvent.click(deleteButton)

    expect(mockCapture).toHaveBeenCalledWith('task_deleted', { projectId: 'project-1' })
  })
})
