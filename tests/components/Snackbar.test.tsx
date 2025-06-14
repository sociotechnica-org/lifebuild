import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SnackbarProvider, useSnackbar } from '../../src/components/Snackbar.js'

// Mock store for undo functionality
const mockStore = vi.hoisted(() => ({
  commit: vi.fn(),
}))

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
}))

// Test component that uses the snackbar hook
function TestComponent() {
  const { showSnackbar } = useSnackbar()

  return (
    <div>
      <button
        onClick={() =>
          showSnackbar({
            message: 'Task archived',
            type: 'archive-undo',
            actionLabel: 'Undo',
            actionData: { taskId: 'test-task' },
            duration: 1000,
          })
        }
      >
        Show Snackbar
      </button>
      <button
        onClick={() =>
          showSnackbar({
            message: 'Simple message',
            type: 'info',
          })
        }
      >
        Show Simple
      </button>
    </div>
  )
}

describe('Snackbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.commit.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not render when no snackbar is shown', () => {
    render(
      <SnackbarProvider>
        <div>No snackbar</div>
      </SnackbarProvider>
    )
    expect(screen.queryByText('Task archived')).not.toBeInTheDocument()
  })

  it('should render snackbar when showSnackbar is called', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    )

    fireEvent.click(screen.getByText('Show Snackbar'))

    expect(screen.getByText('Task archived')).toBeInTheDocument()
    expect(screen.getByText('Undo')).toBeInTheDocument()
    expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
  })

  it('should hide snackbar when close button is clicked', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    )

    fireEvent.click(screen.getByText('Show Snackbar'))
    expect(screen.getByText('Task archived')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close notification'))
    expect(screen.queryByText('Task archived')).not.toBeInTheDocument()
  })

  it('should perform undo action when undo button is clicked', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    )

    fireEvent.click(screen.getByText('Show Snackbar'))
    fireEvent.click(screen.getByText('Undo'))

    // Should commit unarchive event
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.TaskUnarchived',
        args: expect.objectContaining({
          taskId: 'test-task',
        }),
      })
    )

    // Snackbar should be hidden after undo
    expect(screen.queryByText('Task archived')).not.toBeInTheDocument()
  })

  it('should auto-hide snackbar when timeout expires', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    )

    fireEvent.click(screen.getByText('Show Snackbar'))
    expect(screen.getByText('Task archived')).toBeInTheDocument()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.queryByText('Task archived')).not.toBeInTheDocument()
  })

  it('should immediately hide if snackbar is already expired', () => {
    // Create a component that shows an expired snackbar
    function ExpiredTestComponent() {
      const { showSnackbar } = useSnackbar()

      React.useEffect(() => {
        showSnackbar({
          message: 'Expired message',
          type: 'info',
          duration: -1000, // Already expired
        })
      }, [showSnackbar])

      return <div>Test</div>
    }

    render(
      <SnackbarProvider>
        <ExpiredTestComponent />
      </SnackbarProvider>
    )

    // Should not render expired snackbar
    expect(screen.queryByText('Expired message')).not.toBeInTheDocument()
  })

  it('should render snackbar without action button when no actionLabel is provided', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    )

    fireEvent.click(screen.getByText('Show Simple'))

    expect(screen.getByText('Simple message')).toBeInTheDocument()
    expect(screen.queryByText('Undo')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
  })
})
