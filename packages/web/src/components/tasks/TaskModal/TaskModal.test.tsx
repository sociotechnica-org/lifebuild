import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TaskModal } from './TaskModal.js'
import { SnackbarProvider } from '../../ui/Snackbar/Snackbar.js'
import { createMockTask, createMockColumn } from '../../../../tests/test-utils.js'

// Hoisted mocks
const { mockUseQuery, mockStore, mockUseAuth } = vi.hoisted(() => {
  const mockUseQuery = vi.fn()
  const mockStore = { commit: vi.fn() }
  const mockUseAuth = vi.fn()
  return { mockUseQuery, mockStore, mockUseAuth }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useQuery: mockUseQuery,
  useStore: () => ({ store: mockStore }),
}))

vi.mock('../../../contexts/AuthContext.js', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('TaskModal', () => {
  const mockOnClose = vi.fn()

  const mockTask = createMockTask({
    description: 'This is a test task description',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
  })

  const mockColumns = [createMockColumn({ name: 'Todo' })]
  const mockUsers = [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date('2023-01-01T09:00:00Z'),
      syncedAt: null,
    },
    {
      id: 'user-2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date('2023-01-01T09:30:00Z'),
      syncedAt: null,
    },
  ]

  // Helper to render with providers
  const renderWithProviders = (component: React.ReactElement) => {
    return render(<SnackbarProvider>{component}</SnackbarProvider>)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.commit.mockClear()
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        instances: [],
      },
    })

    // Default mock implementation
    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) {
        return [mockTask]
      }
      if (query.label?.includes('getBoardColumns')) {
        return mockColumns
      }
      if (query.label?.includes('getUsers')) {
        return mockUsers
      }
      return []
    })
  })

  it('should not render when taskId is null', () => {
    renderWithProviders(<TaskModal taskId={null} onClose={mockOnClose} />)
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

    renderWithProviders(<TaskModal taskId='non-existent' onClose={mockOnClose} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render task details when taskId is provided', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

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

    renderWithProviders(<TaskModal taskId='task-no-desc' onClose={mockOnClose} />)

    expect(screen.getByText('No description provided.')).toBeInTheDocument()
  })

  it('should display creation and update dates', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Last Updated')).toBeInTheDocument()

    // Check that dates are formatted (contains "Jan" for January) - should have 2 instances
    expect(screen.getAllByText(/Jan 1, 2023/)).toHaveLength(2)
  })

  it('uses authenticated user for comment composer when available', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-2',
        email: 'bob@example.com',
        instances: [],
      },
    })

    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const composerContainer = screen.getByPlaceholderText('Add a comment...').parentElement
      ?.parentElement?.parentElement as HTMLElement

    expect(within(composerContainer).getByTitle('Bob Smith')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const backdrop = screen.getByRole('dialog').parentElement!
    fireEvent.click(backdrop)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose when modal content is clicked', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const modalContent = screen.getByRole('dialog')
    fireEvent.click(modalContent)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'task-modal-title')

    const title = screen.getByText('Test Task')
    expect(title).toHaveAttribute('id', 'task-modal-title')
  })

  it('should prevent body scroll when modal is open', () => {
    const originalOverflow = document.body.style.overflow

    const { unmount } = renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('unset')

    // Restore original value
    document.body.style.overflow = originalOverflow
  })

  it('should enter edit mode when edit button is clicked', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Should show save/cancel buttons instead of edit button
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()

    // Should show editable fields
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument() // Title input
    expect(screen.getByDisplayValue('This is a test task description')).toBeInTheDocument() // Description textarea
  })

  it('should cancel edit mode and restore original values', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'))

    // Modify values
    const titleInput = screen.getByDisplayValue('Test Task')
    const descriptionTextarea = screen.getByDisplayValue('This is a test task description')

    fireEvent.change(titleInput, { target: { value: 'Modified Title' } })
    fireEvent.change(descriptionTextarea, { target: { value: 'Modified description' } })

    // Cancel edit
    fireEvent.click(screen.getByText('Cancel'))

    // Should return to view mode
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.queryByText('Save')).not.toBeInTheDocument()

    // Original values should be displayed
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('This is a test task description')).toBeInTheDocument()
  })

  it('should validate that title is required', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'))

    // Clear the title
    const titleInput = screen.getByDisplayValue('Test Task')
    fireEvent.change(titleInput, { target: { value: '' } })

    // Try to save
    fireEvent.click(screen.getByText('Save'))

    // Should show validation error
    expect(screen.getByText('Title is required')).toBeInTheDocument()

    // Should still be in edit mode
    expect(screen.getByText('Save')).toBeInTheDocument()

    // Should not have committed any changes
    expect(mockStore.commit).not.toHaveBeenCalled()
  })

  it('should save changes when title and description are modified', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'))

    // Modify values
    const titleInput = screen.getByDisplayValue('Test Task')
    const descriptionTextarea = screen.getByDisplayValue('This is a test task description')

    fireEvent.change(titleInput, { target: { value: 'Updated Task Title' } })
    fireEvent.change(descriptionTextarea, { target: { value: 'Updated description' } })

    // Save changes
    fireEvent.click(screen.getByText('Save'))

    // Should commit the changes
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.TaskUpdated',
        args: expect.objectContaining({
          taskId: 'test-task',
          title: 'Updated Task Title',
          description: 'Updated description',
          updatedAt: expect.any(Date),
        }),
      })
    )

    // Should return to view mode
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.queryByText('Save')).not.toBeInTheDocument()
  })

  it('should only save changed fields', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'))

    // Only modify the title
    const titleInput = screen.getByDisplayValue('Test Task')
    fireEvent.change(titleInput, { target: { value: 'Only Title Changed' } })

    // Save changes
    fireEvent.click(screen.getByText('Save'))

    // Should only include the changed title field
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.TaskUpdated',
        args: expect.objectContaining({
          taskId: 'test-task',
          title: 'Only Title Changed',
          updatedAt: expect.any(Date),
        }),
      })
    )

    // Should not include description in the update (should be undefined)
    const commitCall = mockStore.commit.mock.calls[0]?.[0]
    expect(commitCall?.args?.description).toBeUndefined()
  })

  it('should clear title validation error when typing valid text', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'))

    // Clear the title to trigger validation error
    const titleInput = screen.getByDisplayValue('Test Task')
    fireEvent.change(titleInput, { target: { value: '' } })
    fireEvent.click(screen.getByText('Save'))

    // Should show error
    expect(screen.getByText('Title is required')).toBeInTheDocument()

    // Type valid text
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } })

    // Error should be cleared
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
  })

  it('should allow clearing task description', () => {
    renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'))

    // Clear the description
    const descriptionTextarea = screen.getByDisplayValue('This is a test task description')
    fireEvent.change(descriptionTextarea, { target: { value: '' } })

    // Save changes
    fireEvent.click(screen.getByText('Save'))

    // Should commit the change with empty description
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.TaskUpdated',
        args: expect.objectContaining({
          taskId: 'test-task',
          description: '',
          updatedAt: expect.any(Date),
        }),
      })
    )
  })

  describe('Archive functionality', () => {
    beforeEach(() => {
      // Mock app$ query for UI state
      mockUseQuery.mockImplementation((query: any) => {
        if (query.label?.includes('getTaskById')) {
          return [mockTask]
        }
        if (query.label?.includes('getBoardColumns')) {
          return mockColumns
        }
        if (query.label?.includes('app')) {
          return { filter: 'all' }
        }
        return []
      })
    })

    it('should display more actions dropdown when three dots button is clicked', () => {
      renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

      // More actions button should be visible (not in edit mode)
      const moreActionsButton = screen.getByLabelText('More actions')
      expect(moreActionsButton).toBeInTheDocument()

      // Dropdown should not be visible initially
      expect(screen.queryByText('Archive Task')).not.toBeInTheDocument()

      // Click more actions button
      fireEvent.click(moreActionsButton)

      // Dropdown should now be visible
      expect(screen.getByText('Archive Task')).toBeInTheDocument()
    })

    it('should hide more actions dropdown when clicking outside', () => {
      renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

      // Open dropdown
      const moreActionsButton = screen.getByLabelText('More actions')
      fireEvent.click(moreActionsButton)
      expect(screen.getByText('Archive Task')).toBeInTheDocument()

      // Simulate clicking outside by firing mousedown on document
      fireEvent.mouseDown(document.body)

      // Dropdown should be hidden
      expect(screen.queryByText('Archive Task')).not.toBeInTheDocument()
    })

    it('should archive task when Archive Task button is clicked', () => {
      renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

      // Open more actions dropdown
      const moreActionsButton = screen.getByLabelText('More actions')
      fireEvent.click(moreActionsButton)

      // Click Archive Task
      const archiveButton = screen.getByText('Archive Task')
      fireEvent.click(archiveButton)

      // Should commit archive event
      expect(mockStore.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'v1.TaskArchived',
          args: expect.objectContaining({
            taskId: 'test-task',
            archivedAt: expect.any(Date),
          }),
        })
      )

      // Should only commit one event (the archive event)
      expect(mockStore.commit).toHaveBeenCalledTimes(1)

      // Should close modal
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not show more actions dropdown in edit mode', () => {
      renderWithProviders(<TaskModal taskId='test-task' onClose={mockOnClose} />)

      // Enter edit mode
      fireEvent.click(screen.getByText('Edit'))

      // More actions button should not be visible in edit mode
      expect(screen.queryByLabelText('More actions')).not.toBeInTheDocument()
    })
  })
})
