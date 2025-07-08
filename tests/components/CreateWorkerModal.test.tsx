import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CreateWorkerModal } from '../../src/components/CreateWorkerModal.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = { commit: vi.fn() }
  return { mockStore }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
}))

// Mock random worker name generation
vi.mock('../../src/util/workerNames.js', () => ({
  generateRandomWorkerName: () => 'Test Worker',
  systemPromptTemplates: [
    {
      name: 'General Assistant',
      prompt: 'You are a helpful AI assistant.',
    },
    {
      name: 'Code Review Assistant',
      prompt: 'You are a code review assistant.',
    },
  ],
}))

describe('CreateWorkerModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(<CreateWorkerModal isOpen={false} onClose={mockOnClose} />)

    expect(screen.queryByText('Create New Worker')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByText('Create New Worker')).toBeInTheDocument()
    expect(screen.getByLabelText('Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Role Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Avatar (emoji)')).toBeInTheDocument()
    expect(screen.getByLabelText('System Prompt Template')).toBeInTheDocument()
    expect(screen.getByLabelText('System Prompt *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Worker' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should auto-generate worker name when modal opens', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const nameInput = screen.getByLabelText('Name *') as HTMLInputElement
    expect(nameInput.value).toBe('Test Worker')
  })

  it('should generate new name when Generate button is clicked', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const generateButton = screen.getByRole('button', { name: 'Generate' })
    fireEvent.click(generateButton)

    const nameInput = screen.getByLabelText('Name *') as HTMLInputElement
    expect(nameInput.value).toBe('Test Worker')
  })

  it('should populate system prompt when template is selected', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const templateSelect = screen.getByLabelText('System Prompt Template')
    fireEvent.change(templateSelect, { target: { value: 'General Assistant' } })

    const systemPromptInput = screen.getByLabelText('System Prompt *') as HTMLTextAreaElement
    expect(systemPromptInput.value).toBe('You are a helpful AI assistant.')
  })

  it('should require name and system prompt', async () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const nameInput = screen.getByLabelText('Name *')
    const systemPromptInput = screen.getByLabelText('System Prompt *')
    const submitButton = screen.getByRole('button', { name: 'Create Worker' })

    // Clear the auto-generated name and system prompt
    fireEvent.change(nameInput, { target: { value: '   ' } }) // Just spaces
    fireEvent.change(systemPromptInput, { target: { value: '   ' } }) // Just spaces

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Worker name is required')).toBeInTheDocument()
    })

    expect(screen.getByText('System prompt is required')).toBeInTheDocument()
    expect(mockStore.commit).not.toHaveBeenCalled()
  })

  it('should create worker when form is valid', async () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const nameInput = screen.getByLabelText('Name *')
    const roleInput = screen.getByLabelText('Role Description')
    const avatarInput = screen.getByLabelText('Avatar (emoji)')
    const systemPromptInput = screen.getByLabelText('System Prompt *')
    const submitButton = screen.getByRole('button', { name: 'Create Worker' })

    fireEvent.change(nameInput, { target: { value: 'Test Worker' } })
    fireEvent.change(roleInput, { target: { value: 'Test Role' } })
    fireEvent.change(avatarInput, { target: { value: '🤖' } })
    fireEvent.change(systemPromptInput, { target: { value: 'Test system prompt' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalledTimes(1)
    })

    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.WorkerCreated',
        args: expect.objectContaining({
          name: 'Test Worker',
          roleDescription: 'Test Role',
          systemPrompt: 'Test system prompt',
          avatar: '🤖',
        }),
      })
    )

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when cancel button is clicked', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when close button is clicked', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const closeButton = screen.getByRole('button', { name: 'Close modal' })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle optional fields properly', async () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const nameInput = screen.getByLabelText('Name *')
    const systemPromptInput = screen.getByLabelText('System Prompt *')
    const submitButton = screen.getByRole('button', { name: 'Create Worker' })

    fireEvent.change(nameInput, { target: { value: 'Test Worker' } })
    fireEvent.change(systemPromptInput, { target: { value: 'Test system prompt' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalledTimes(1)
    })

    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.WorkerCreated',
        args: expect.objectContaining({
          name: 'Test Worker',
          systemPrompt: 'Test system prompt',
          roleDescription: undefined,
          avatar: undefined,
        }),
      })
    )
  })
})
