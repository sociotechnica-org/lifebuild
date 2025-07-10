import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { EditWorkerModal } from './EditWorkerModal.js'
import type { Worker } from '../../../livestore/schema.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = { commit: vi.fn() }
  return { mockStore }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
}))

// Mock system prompt templates
vi.mock('../../../util/workerNames.js', () => ({
  systemPromptTemplates: [
    {
      name: 'General Assistant',
      prompt:
        'You are a helpful AI assistant. You provide clear, accurate, and helpful responses to user queries. You are professional, friendly, and always strive to be as useful as possible.',
    },
    {
      name: 'Code Reviewer',
      prompt: 'You are a code reviewer. Review code carefully.',
    },
  ],
}))

describe('EditWorkerModal', () => {
  const mockOnClose = vi.fn()
  const mockWorker: Worker = {
    id: 'test-worker-id',
    name: 'Test Worker',
    roleDescription: 'Test Role',
    systemPrompt: 'Original system prompt',
    avatar: '🤖',
    defaultModel: 'claude-3-5-sonnet-latest',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with worker data pre-populated', () => {
    render(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    expect(screen.getByDisplayValue('Test Worker')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Role')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original system prompt')).toBeInTheDocument()
    expect(screen.getByDisplayValue('🤖')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(<EditWorkerModal isOpen={false} onClose={mockOnClose} worker={mockWorker} />)

    expect(screen.queryByText('Edit Worker')).not.toBeInTheDocument()
  })

  it('should populate system prompt when template is selected', () => {
    render(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    const templateSelect = screen.getByLabelText('System Prompt Template')
    fireEvent.change(templateSelect, { target: { value: 'General Assistant' } })

    const systemPromptInput = screen.getByLabelText('System Prompt *') as HTMLTextAreaElement
    expect(systemPromptInput.value).toBe(
      'You are a helpful AI assistant. You provide clear, accurate, and helpful responses to user queries. You are professional, friendly, and always strive to be as useful as possible.'
    )
  })

  it('should require name and system prompt', async () => {
    render(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    const nameInput = screen.getByLabelText('Name *')
    const systemPromptInput = screen.getByLabelText('System Prompt *')
    const submitButton = screen.getByRole('button', { name: 'Save Changes' })

    // Clear the name and system prompt
    fireEvent.change(nameInput, { target: { value: '   ' } }) // Just spaces
    fireEvent.change(systemPromptInput, { target: { value: '   ' } }) // Just spaces

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Worker name is required')).toBeInTheDocument()
    })

    expect(screen.getByText('System prompt is required')).toBeInTheDocument()
    expect(mockStore.commit).not.toHaveBeenCalled()
  })

  it('should not emit event when no changes are made', async () => {
    render(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    const submitButton = screen.getByRole('button', { name: 'Save Changes' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })

    expect(mockStore.commit).not.toHaveBeenCalled()
  })

  it('should emit update event when changes are made', async () => {
    render(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    const nameInput = screen.getByLabelText('Name *')
    const roleInput = screen.getByLabelText('Role Description')
    const systemPromptInput = screen.getByLabelText('System Prompt *')
    const submitButton = screen.getByRole('button', { name: 'Save Changes' })

    // Make changes
    fireEvent.change(nameInput, { target: { value: 'Updated Worker' } })
    fireEvent.change(roleInput, { target: { value: 'Updated Role' } })
    fireEvent.change(systemPromptInput, { target: { value: 'Updated system prompt' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalledTimes(1)
    })

    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.WorkerUpdated',
        args: expect.objectContaining({
          id: 'test-worker-id',
          updates: {
            name: 'Updated Worker',
            roleDescription: 'Updated Role',
            systemPrompt: 'Updated system prompt',
          },
        }),
      })
    )

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should only include changed fields in update', async () => {
    render(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    const nameInput = screen.getByLabelText('Name *')
    const submitButton = screen.getByRole('button', { name: 'Save Changes' })

    // Only change the name
    fireEvent.change(nameInput, { target: { value: 'Only Name Changed' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalledTimes(1)
    })

    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.WorkerUpdated',
        args: expect.objectContaining({
          id: 'test-worker-id',
          updates: {
            name: 'Only Name Changed',
          },
        }),
      })
    )
  })

  it('should handle empty optional fields correctly', async () => {
    const workerWithOptionalFields: Worker = {
      ...mockWorker,
      roleDescription: 'Original Role',
      avatar: '🤖',
    }

    render(
      <EditWorkerModal isOpen={true} onClose={mockOnClose} worker={workerWithOptionalFields} />
    )

    const roleInput = screen.getByLabelText('Role Description')
    const avatarInput = screen.getByLabelText('Avatar (emoji)')
    const submitButton = screen.getByRole('button', { name: 'Save Changes' })

    // Clear optional fields
    fireEvent.change(roleInput, { target: { value: '' } })
    fireEvent.change(avatarInput, { target: { value: '' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalledTimes(1)
    })

    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.WorkerUpdated',
        args: expect.objectContaining({
          id: 'test-worker-id',
          updates: {
            roleDescription: null,
            avatar: null,
          },
        }),
      })
    )
  })

  it('should reset form when modal is closed', () => {
    render(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    const nameInput = screen.getByLabelText('Name *')
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })

    // Make a change
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } })
    expect(nameInput).toHaveValue('Changed Name')

    // Cancel the modal
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should reset form when reopened', () => {
    const { rerender } = render(
      <EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />
    )

    const nameInput = screen.getByLabelText('Name *')

    // Make a change
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } })
    expect(nameInput).toHaveValue('Changed Name')

    // Close and reopen modal
    rerender(<EditWorkerModal isOpen={false} onClose={mockOnClose} worker={mockWorker} />)
    rerender(<EditWorkerModal isOpen={true} onClose={mockOnClose} worker={mockWorker} />)

    // Should be reset to original value
    const reopenedNameInput = screen.getByLabelText('Name *')
    expect(reopenedNameInput).toHaveValue('Test Worker')
  })
})
