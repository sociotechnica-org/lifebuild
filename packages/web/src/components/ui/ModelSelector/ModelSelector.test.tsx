import React from 'react'
import { render, screen, fireEvent } from '../../../../tests/test-utils.js'
import { describe, expect, it, vi } from 'vitest'
import { ModelSelector } from './ModelSelector.js'
import { DEFAULT_MODEL, MODEL_IDS } from '../../../utils/models.js'

describe('ModelSelector', () => {
  it('should display the selected model and allow changing it', () => {
    const onModelChange = vi.fn()

    render(<ModelSelector selectedModel={DEFAULT_MODEL} onModelChange={onModelChange} />)

    // Check that the select shows the current model
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue(DEFAULT_MODEL)

    // Check that provider is displayed
    expect(screen.getByText('anthropic')).toBeInTheDocument()

    // Change the model
    fireEvent.change(select, { target: { value: MODEL_IDS.GPT_5 } })
    expect(onModelChange).toHaveBeenCalledWith(MODEL_IDS.GPT_5)
  })

  it('should show all supported models as options', () => {
    const onModelChange = vi.fn()

    render(<ModelSelector selectedModel={DEFAULT_MODEL} onModelChange={onModelChange} />)

    // Check that all models are available as options
    expect(screen.getByRole('option', { name: 'Claude 4.5 Sonnet' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Claude 4.5 Haiku' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'GPT-5' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'OpenAI O3' })).toBeInTheDocument()
  })
})
