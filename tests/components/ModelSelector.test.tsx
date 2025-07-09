import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModelSelector } from '../../src/components/ui/ModelSelector.js'

describe('ModelSelector', () => {
  it('should display the selected model and allow changing it', () => {
    const onModelChange = vi.fn()

    render(<ModelSelector selectedModel='claude-sonnet-4-20250514' onModelChange={onModelChange} />)

    // Check that the select shows the current model
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('claude-sonnet-4-20250514')

    // Check that provider is displayed
    expect(screen.getByText('anthropic')).toBeInTheDocument()

    // Change the model
    fireEvent.change(select, { target: { value: 'gpt-4o' } })
    expect(onModelChange).toHaveBeenCalledWith('gpt-4o')
  })

  it('should show all supported models as options', () => {
    const onModelChange = vi.fn()

    render(<ModelSelector selectedModel='claude-sonnet-4-20250514' onModelChange={onModelChange} />)

    // Check that all models are available as options
    expect(screen.getByRole('option', { name: 'Claude 4 Sonnet' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'GPT-4o' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Claude 4 Opus' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'OpenAI O3' })).toBeInTheDocument()
  })
})
