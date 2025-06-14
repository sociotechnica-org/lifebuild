import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Snackbar } from '../../src/components/Snackbar.js'

// Hoisted mocks
const { mockUseQuery, mockStore } = vi.hoisted(() => {
  const mockUseQuery = vi.fn()
  const mockStore = { commit: vi.fn() }
  return { mockUseQuery, mockStore }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useQuery: mockUseQuery,
  useStore: () => ({ store: mockStore }),
}))

describe('Snackbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.commit.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not render when no snackbar is present', () => {
    mockUseQuery.mockReturnValue(null)
    render(<Snackbar />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should not render when app state has no snackbar', () => {
    mockUseQuery.mockReturnValue({ newTodoText: '', filter: 'all' })
    render(<Snackbar />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should render snackbar with message when snackbar is present', () => {
    const mockApp = {
      newTodoText: '',
      filter: 'all',
      snackbar: {
        message: 'Task "Test Task" archived',
        type: 'archive-undo',
        actionLabel: 'Undo',
        actionData: { taskId: 'test-task' },
        showUntil: new Date(Date.now() + 5000),
      },
    }
    mockUseQuery.mockReturnValue(mockApp)

    render(<Snackbar />)

    expect(screen.getByText('Task "Test Task" archived')).toBeInTheDocument()
    expect(screen.getByText('Undo')).toBeInTheDocument()
    expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
  })

  it('should hide snackbar when close button is clicked', () => {
    const mockApp = {
      newTodoText: '',
      filter: 'all',
      snackbar: {
        message: 'Task "Test Task" archived',
        type: 'archive-undo',
        actionLabel: 'Undo',
        actionData: { taskId: 'test-task' },
        showUntil: new Date(Date.now() + 5000),
      },
    }
    mockUseQuery.mockReturnValue(mockApp)

    render(<Snackbar />)

    const closeButton = screen.getByLabelText('Close notification')
    fireEvent.click(closeButton)

    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'uiStateSet',
        args: expect.objectContaining({
          value: expect.objectContaining({
            snackbar: undefined,
          }),
        }),
      })
    )
  })

  it('should perform undo action when undo button is clicked', () => {
    const mockApp = {
      newTodoText: '',
      filter: 'all',
      snackbar: {
        message: 'Task "Test Task" archived',
        type: 'archive-undo',
        actionLabel: 'Undo',
        actionData: { taskId: 'test-task' },
        showUntil: new Date(Date.now() + 5000),
      },
    }
    mockUseQuery.mockReturnValue(mockApp)

    render(<Snackbar />)

    const undoButton = screen.getByText('Undo')
    fireEvent.click(undoButton)

    // Should commit unarchive event
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.TaskUnarchived',
        args: expect.objectContaining({
          taskId: 'test-task',
        }),
      })
    )

    // Should also hide the snackbar
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'uiStateSet',
        args: expect.objectContaining({
          value: expect.objectContaining({
            snackbar: undefined,
          }),
        }),
      })
    )
  })

  it('should auto-hide snackbar when timeout expires', () => {
    const showTime = 3000
    const mockApp = {
      newTodoText: '',
      filter: 'all',
      snackbar: {
        message: 'Task "Test Task" archived',
        type: 'archive-undo',
        actionLabel: 'Undo',
        actionData: { taskId: 'test-task' },
        showUntil: new Date(Date.now() + showTime),
      },
    }
    mockUseQuery.mockReturnValue(mockApp)

    render(<Snackbar />)

    // Snackbar should be visible
    expect(screen.getByText('Task "Test Task" archived')).toBeInTheDocument()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(showTime)
    })

    // Should have hidden the snackbar
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'uiStateSet',
        args: expect.objectContaining({
          value: expect.objectContaining({
            snackbar: undefined,
          }),
        }),
      })
    )
  })

  it('should immediately hide if snackbar is already expired', () => {
    const mockApp = {
      newTodoText: '',
      filter: 'all',
      snackbar: {
        message: 'Task "Test Task" archived',
        type: 'archive-undo',
        actionLabel: 'Undo',
        actionData: { taskId: 'test-task' },
        showUntil: new Date(Date.now() - 1000), // Already expired
      },
    }
    mockUseQuery.mockReturnValue(mockApp)

    render(<Snackbar />)

    // Should immediately hide the snackbar
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'uiStateSet',
        args: expect.objectContaining({
          value: expect.objectContaining({
            snackbar: undefined,
          }),
        }),
      })
    )
  })

  it('should render snackbar without action button when no actionLabel is provided', () => {
    const mockApp = {
      newTodoText: '',
      filter: 'all',
      snackbar: {
        message: 'Operation completed',
        type: 'info',
        showUntil: new Date(Date.now() + 5000),
      },
    }
    mockUseQuery.mockReturnValue(mockApp)

    render(<Snackbar />)

    expect(screen.getByText('Operation completed')).toBeInTheDocument()
    expect(screen.queryByText('Undo')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
  })
})

