import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecurringTaskFormPresentation } from './RecurringTaskFormPresentation'
import type { Project } from '@work-squared/shared'

describe('RecurringTaskFormPresentation', () => {
  const mockProjects: Project[] = [
    {
      id: 'project-1',
      name: 'Test Project 1',
      description: 'First test project',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'project-2', 
      name: 'Test Project 2',
      description: 'Second test project',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    projects: mockProjects,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form when open', () => {
    render(<RecurringTaskFormPresentation {...defaultProps} />)
    
    expect(screen.getByText('Create Recurring Task')).toBeInTheDocument()
    expect(screen.getByLabelText('Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Prompt *')).toBeInTheDocument()
    expect(screen.getByLabelText('Run Every')).toBeInTheDocument()
    expect(screen.getByLabelText('Project')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<RecurringTaskFormPresentation {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Create Recurring Task')).not.toBeInTheDocument()
  })

  it('shows disabled submit button for empty required fields', () => {
    render(<RecurringTaskFormPresentation {...defaultProps} />)
    
    const submitButton = screen.getByText('Create Task')
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when required fields are filled', () => {
    render(<RecurringTaskFormPresentation {...defaultProps} />)
    
    const submitButton = screen.getByText('Create Task')
    expect(submitButton).toBeDisabled()
    
    // Fill name field
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Test Task' },
    })
    expect(submitButton).toBeDisabled()
    
    // Fill prompt field
    fireEvent.change(screen.getByLabelText('Prompt *'), {
      target: { value: 'Test prompt' },
    })
    expect(submitButton).not.toBeDisabled()
  })

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    
    render(
      <RecurringTaskFormPresentation 
        {...defaultProps} 
        onSubmit={onSubmit}
        onClose={onClose}
      />
    )
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Test Task' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    })
    fireEvent.change(screen.getByLabelText('Prompt *'), {
      target: { value: 'Create a test task' },
    })
    
    // Select interval
    fireEvent.change(screen.getByLabelText('Run Every'), {
      target: { value: '4' },
    })
    
    // Select project
    fireEvent.change(screen.getByLabelText('Project'), {
      target: { value: 'project-1' },
    })
    
    const submitButton = screen.getByText('Create Task')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Task',
        description: 'Test description',
        prompt: 'Create a test task',
        intervalHours: 4,
        projectId: 'project-1',
      })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('handles form interaction correctly', () => {
    render(<RecurringTaskFormPresentation {...defaultProps} />)
    
    // Test that form fields can be filled
    const nameField = screen.getByLabelText('Name *')
    const promptField = screen.getByLabelText('Prompt *')
    
    fireEvent.change(nameField, { target: { value: 'Test Name' } })
    fireEvent.change(promptField, { target: { value: 'Test Prompt' } })
    
    expect(nameField).toHaveValue('Test Name')
    expect(promptField).toHaveValue('Test Prompt')
  })

  it('closes on escape key', () => {
    const onClose = vi.fn()
    render(<RecurringTaskFormPresentation {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click', () => {
    const onClose = vi.fn()
    render(<RecurringTaskFormPresentation {...defaultProps} onClose={onClose} />)
    
    // Click on the backdrop (the outermost div)
    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('pre-fills project when provided', () => {
    render(<RecurringTaskFormPresentation {...defaultProps} projectId="project-2" />)
    
    const projectSelect = screen.getByLabelText('Project') as HTMLSelectElement
    expect(projectSelect.value).toBe('project-2')
  })

  it('resets form when reopened', () => {
    const { rerender } = render(<RecurringTaskFormPresentation {...defaultProps} />)
    
    // Fill some fields
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Test Task' },
    })
    
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
    
    // Close and reopen
    rerender(<RecurringTaskFormPresentation {...defaultProps} isOpen={false} />)
    rerender(<RecurringTaskFormPresentation {...defaultProps} isOpen={true} />)
    
    // Form should be reset
    expect(screen.getByLabelText('Name *')).toHaveValue('')
  })
})