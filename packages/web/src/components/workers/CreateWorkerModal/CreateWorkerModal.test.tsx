import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CreateWorkerModal } from './CreateWorkerModal.js'
import { MODEL_IDS, DEFAULT_MODEL } from '@work-squared/shared/llm/models'

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
vi.mock('../../../util/workerNames.js', () => ({
  generateRandomWorkerName: () => 'Test Worker',
  systemPromptTemplates: [
    {
      name: 'General Assistant',
      prompt:
        'You are a helpful AI assistant. You provide clear, accurate, and helpful responses to user queries. You are professional, friendly, and always strive to be as useful as possible.',
    },
  ],
}))

// Mock ModelSelector component
vi.mock('../../ui/ModelSelector/ModelSelector.js', () => ({
  ModelSelector: ({ selectedModel, onModelChange }: any) => (
    <select
      data-testid='model-selector'
      value={selectedModel}
      onChange={e => onModelChange(e.target.value)}
    >
      <option value={MODEL_IDS.CLAUDE_SONNET}>Claude 4 Sonnet</option>
      <option value={MODEL_IDS.GPT_5}>GPT-5</option>
    </select>
  ),
}))

describe('CreateWorkerModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should populate system prompt when template is selected', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const templateSelect = screen.getByLabelText('System Prompt Template')
    fireEvent.change(templateSelect, { target: { value: 'General Assistant' } })

    const systemPromptInput = screen.getByLabelText('System Prompt *') as HTMLTextAreaElement
    expect(systemPromptInput.value).toBe(
      'You are a helpful AI assistant. You provide clear, accurate, and helpful responses to user queries. You are professional, friendly, and always strive to be as useful as possible.'
    )
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
          defaultModel: DEFAULT_MODEL,
        }),
      })
    )

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should include selected model when creating worker', async () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const nameInput = screen.getByLabelText('Name *')
    const systemPromptInput = screen.getByLabelText('System Prompt *')
    const modelSelector = screen.getByTestId('model-selector')
    const submitButton = screen.getByRole('button', { name: 'Create Worker' })

    fireEvent.change(nameInput, { target: { value: 'Test Worker' } })
    fireEvent.change(systemPromptInput, { target: { value: 'Test system prompt' } })
    fireEvent.change(modelSelector, { target: { value: MODEL_IDS.GPT_5 } })

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
          defaultModel: MODEL_IDS.GPT_5,
        }),
      })
    )
  })

  it('should render model selector with default model', () => {
    render(<CreateWorkerModal isOpen={true} onClose={mockOnClose} />)

    const modelSelector = screen.getByTestId('model-selector')
    expect(modelSelector).toHaveValue(DEFAULT_MODEL)
  })
})
