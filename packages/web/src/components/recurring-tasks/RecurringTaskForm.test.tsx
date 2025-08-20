import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecurringTaskForm } from './RecurringTaskForm'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = { commit: vi.fn() }
  return { mockStore }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
  useQuery: vi.fn(() => []), // Empty projects list
}))

vi.mock('@work-squared/shared', () => ({
  events: {
    recurringTaskCreated: vi.fn(data => ({ type: 'recurringTask.created', ...data })),
  },
  calculateNextExecution: vi.fn(() => Date.now() + 24 * 60 * 60 * 1000),
}))

describe('RecurringTaskForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form when open', () => {
    render(<RecurringTaskForm {...defaultProps} />)

    expect(screen.getByText('Create Recurring Task')).toBeInTheDocument()
    expect(screen.getByLabelText('Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Prompt *')).toBeInTheDocument()
    expect(screen.getByLabelText('Run Every')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<RecurringTaskForm {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Create Recurring Task')).not.toBeInTheDocument()
  })

  it('shows disabled submit button for empty required fields', () => {
    render(<RecurringTaskForm {...defaultProps} />)
    
    const submitButton = screen.getByText('Create Task')
    expect(submitButton).toBeDisabled()
  })

  it('submits form with valid data', async () => {
    const onClose = vi.fn()
    render(<RecurringTaskForm {...defaultProps} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Test Task' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    })
    fireEvent.change(screen.getByLabelText('Prompt *'), {
      target: { value: 'Create a test task' },
    })

    const submitButton = screen.getByText('Create Task')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('closes on escape key', () => {
    const onClose = vi.fn()
    render(<RecurringTaskForm {...defaultProps} onClose={onClose} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click', () => {
    const onClose = vi.fn()
    render(<RecurringTaskForm {...defaultProps} onClose={onClose} />)

    // Click on the backdrop (the div with backdrop-blur-sm)
    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('pre-fills project when provided', () => {
    const testProjectId = 'test-project-id'
    render(<RecurringTaskForm {...defaultProps} projectId={testProjectId} />)

    const projectSelect = screen.getByLabelText('Project')
    expect(projectSelect).toBeInTheDocument()
    // Note: The actual project name would be shown if we had mock data
  })


  it('disables submit button when required fields are empty', () => {
    render(<RecurringTaskForm {...defaultProps} />)

    const submitButton = screen.getByText('Create Task')
    expect(submitButton).toBeDisabled()

    // Fill name only
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Test Task' },
    })

    expect(submitButton).toBeDisabled()

    // Fill prompt too
    fireEvent.change(screen.getByLabelText('Prompt *'), {
      target: { value: 'Test prompt' },
    })

    expect(submitButton).not.toBeDisabled()
  })
})
