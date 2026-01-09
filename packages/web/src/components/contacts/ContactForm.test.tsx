import React from 'react'
import { render, screen, fireEvent, waitFor } from "../../../tests/test-utils.js"
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ContactForm } from './ContactForm.js'

describe('ContactForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow creating a contact with just an email (no name)', async () => {
    mockOnSubmit.mockResolvedValueOnce(true)

    render(<ContactForm onSubmit={mockOnSubmit} />)

    // Only fill in email, leave name empty
    await fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'test@example.com' },
    })

    // Submit should be enabled since only email is required
    const submitButton = screen.getByText('Add Contact')
    expect(submitButton).not.toBeDisabled()

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Unnamed Contact', 'test@example.com')
    })
  })

  it('should create contact with provided name', async () => {
    mockOnSubmit.mockResolvedValueOnce(true)

    render(<ContactForm onSubmit={mockOnSubmit} />)

    await fireEvent.change(screen.getByPlaceholderText('Enter contact name'), {
      target: { value: 'John Doe' },
    })
    await fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'john@example.com' },
    })

    fireEvent.click(screen.getByText('Add Contact'))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com')
    })
  })

  it('should require email', async () => {
    render(<ContactForm onSubmit={mockOnSubmit} />)

    // Submit button should be disabled when email is empty
    const submitButton = screen.getByText('Add Contact')
    expect(submitButton).toBeDisabled()

    // Even if we try to click, the form shouldn't submit
    fireEvent.click(submitButton)
    expect(mockOnSubmit).not.toHaveBeenCalled()

    // Fill in email and button should become enabled
    await fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'test@example.com' },
    })

    expect(submitButton).not.toBeDisabled()
  })

  it('should validate email format', async () => {
    render(<ContactForm onSubmit={mockOnSubmit} />)

    await fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'invalid-email' },
    })

    fireEvent.click(screen.getByText('Add Contact'))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})
