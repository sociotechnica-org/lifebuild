import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TaskModal } from '../../src/components/TaskModal.js'
import { createMockTask, createMockColumn } from '../../src/test-utils.js'

// Hoisted mocks
const { mockUseQuery } = vi.hoisted(() => {
  const mockUseQuery = vi.fn()
  return { mockUseQuery }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useQuery: mockUseQuery,
}))

describe('TaskModal', () => {
  const mockOnClose = vi.fn()

  const mockTask = createMockTask({
    description: 'This is a test task description',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
  })

  const mockColumns = [createMockColumn({ name: 'Todo' })]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation
    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) {
        return [mockTask]
      }
      if (query.label?.includes('getBoardColumns')) {
        return mockColumns
      }
      return []
    })
  })

  it('should not render when taskId is null', () => {
    render(<TaskModal taskId={null} onClose={mockOnClose} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should not render when task is not found', () => {
    // Mock no task found
    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) {
        return []
      }
      return mockColumns
    })

    render(<TaskModal taskId='non-existent' onClose={mockOnClose} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render task details when taskId is provided', () => {
    render(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('in Todo')).toBeInTheDocument()
    expect(screen.getByText('This is a test task description')).toBeInTheDocument()
  })

  it('should display "No description provided" when task has no description', () => {
    // Mock task without description
    const taskWithoutDesc = createMockTask({ description: null })
    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) {
        return [taskWithoutDesc]
      }
      if (query.label?.includes('getBoardColumns')) {
        return mockColumns
      }
      return []
    })

    render(<TaskModal taskId='task-no-desc' onClose={mockOnClose} />)

    expect(screen.getByText('No description provided.')).toBeInTheDocument()
  })

  it('should display creation and update dates', () => {
    render(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Last Updated')).toBeInTheDocument()

    // Check that dates are formatted (contains "Jan" for January) - should have 2 instances
    expect(screen.getAllByText(/Jan 1, 2023/)).toHaveLength(2)
  })

  it('should call onClose when close button is clicked', () => {
    render(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    render(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const backdrop = screen.getByRole('dialog').parentElement!
    fireEvent.click(backdrop)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose when modal content is clicked', () => {
    render(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const modalContent = screen.getByRole('dialog')
    fireEvent.click(modalContent)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    render(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'task-modal-title')

    const title = screen.getByText('Test Task')
    expect(title).toHaveAttribute('id', 'task-modal-title')
  })

  it('should prevent body scroll when modal is open', () => {
    const originalOverflow = document.body.style.overflow

    const { unmount } = render(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('unset')

    // Restore original value
    document.body.style.overflow = originalOverflow
  })
})
