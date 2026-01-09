import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from "../../../tests/test-utils.js"
import { RecurringTaskPromptEditor } from './RecurringTaskPromptEditor'

describe('RecurringTaskPromptEditor', () => {
  it('renders textarea with correct value', () => {
    const mockOnChange = vi.fn()
    const testValue = 'Task: {{name}}'

    render(<RecurringTaskPromptEditor value={testValue} onChange={mockOnChange} />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue(testValue)
  })

  it('calls onChange when textarea value changes', () => {
    const mockOnChange = vi.fn()

    render(<RecurringTaskPromptEditor value='' onChange={mockOnChange} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'New prompt' } })

    expect(mockOnChange).toHaveBeenCalledWith('New prompt')
  })

  it('shows validation errors for invalid template', () => {
    const mockOnChange = vi.fn()
    const invalidTemplate = 'Invalid {{badVariable}}'

    render(<RecurringTaskPromptEditor value={invalidTemplate} onChange={mockOnChange} />)

    expect(screen.getByText('Template errors:')).toBeInTheDocument()
    expect(screen.getByText(/Invalid variable: {{badVariable}}/)).toBeInTheDocument()
  })

  it('shows red border for invalid template', () => {
    const mockOnChange = vi.fn()
    const invalidTemplate = 'Invalid {{badVar}}'

    render(<RecurringTaskPromptEditor value={invalidTemplate} onChange={mockOnChange} />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('border-red-300')
  })

  it('shows green border for valid template', () => {
    const mockOnChange = vi.fn()
    const validTemplate = 'Task: {{name}}'

    render(<RecurringTaskPromptEditor value={validTemplate} onChange={mockOnChange} />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('border-gray-300')
  })

  it('toggles variables help when button is clicked', () => {
    const mockOnChange = vi.fn()

    render(<RecurringTaskPromptEditor value='' onChange={mockOnChange} />)

    const helpButton = screen.getByText(/Available Variables/)
    expect(screen.queryByText('Use these variables in your template:')).not.toBeInTheDocument()

    fireEvent.click(helpButton)
    expect(screen.getByText('Use these variables in your template:')).toBeInTheDocument()

    fireEvent.click(helpButton)
    expect(screen.queryByText('Use these variables in your template:')).not.toBeInTheDocument()
  })

  it('shows available variables in help section', () => {
    const mockOnChange = vi.fn()

    render(<RecurringTaskPromptEditor value='' onChange={mockOnChange} />)

    const helpButton = screen.getByText(/Available Variables/)
    fireEvent.click(helpButton)

    // Check for some expected variables
    expect(screen.getByText('{{name}}')).toBeInTheDocument()
    expect(screen.getByText('{{description}}')).toBeInTheDocument()
    expect(screen.getByText('{{prompt}}')).toBeInTheDocument()
    expect(screen.getByText('{{intervalHours}}')).toBeInTheDocument()
  })

  it('does not show validation errors for valid template', () => {
    const mockOnChange = vi.fn()
    const validTemplate = 'Task: {{name}} with description {{description}}'

    render(<RecurringTaskPromptEditor value={validTemplate} onChange={mockOnChange} />)

    expect(screen.queryByText('Template errors:')).not.toBeInTheDocument()
  })

  it('does not show validation errors for empty template', () => {
    const mockOnChange = vi.fn()

    render(<RecurringTaskPromptEditor value='' onChange={mockOnChange} />)

    expect(screen.queryByText('Template errors:')).not.toBeInTheDocument()
  })
})
