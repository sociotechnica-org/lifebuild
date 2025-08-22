import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { EditContactModal } from './EditContactModal.js'
import { createMockContact } from '../../../tests/test-utils.js'

// Mock the useContacts hook
const mockUpdateContact = vi.fn()
vi.mock('../../hooks/useContacts.js', () => ({
  useContacts: () => ({
    updateContact: mockUpdateContact,
  }),
}))

describe('EditContactModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const mockContact = createMockContact({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with contact details pre-filled', () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    expect(screen.getByText('Edit Contact')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument()
  })

  it('should handle contact without email', () => {
    const contactWithoutEmail = createMockContact({
      name: 'John Doe',
      email: null,
    })

    render(
      <EditContactModal
        contact={contactWithoutEmail}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // Email field should be empty
  })

  it('should call onClose when cancel button is clicked', () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should disable save button when no changes are made', () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const saveButton = screen.getByText('Save Changes')
    expect(saveButton).toBeDisabled()
  })

  it('should enable save button when name is changed', () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const nameInput = screen.getByDisplayValue('Jane Smith')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    const saveButton = screen.getByText('Save Changes')
    expect(saveButton).toBeEnabled()
  })

  it('should enable save button when email is changed', () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const emailInput = screen.getByDisplayValue('jane.smith@example.com')
    fireEvent.change(emailInput, { target: { value: 'jane.doe@example.com' } })

    const saveButton = screen.getByText('Save Changes')
    expect(saveButton).toBeEnabled()
  })

  it('should allow empty name and use "Unnamed Contact" fallback', async () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const nameInput = screen.getByDisplayValue('Jane Smith')
    fireEvent.change(nameInput, { target: { value: '' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith('test-contact', { name: 'Unnamed Contact' })
    })
  })

  it('should show error for invalid email', async () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const emailInput = screen.getByDisplayValue('jane.smith@example.com')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    expect(mockUpdateContact).not.toHaveBeenCalled()
  })

  it('should allow empty email', async () => {
    mockUpdateContact.mockResolvedValue(undefined)

    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const emailInput = screen.getByDisplayValue('jane.smith@example.com')
    fireEvent.change(emailInput, { target: { value: '' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith('test-contact', {
        email: null,
      })
    })

    expect(mockOnSuccess).toHaveBeenCalledTimes(1)
  })

  it('should save changes when both name and email are modified', async () => {
    mockUpdateContact.mockResolvedValue(undefined)

    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const nameInput = screen.getByDisplayValue('Jane Smith')
    const emailInput = screen.getByDisplayValue('jane.smith@example.com')

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    fireEvent.change(emailInput, { target: { value: 'jane.doe@example.com' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith('test-contact', {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      })
    })

    expect(mockOnSuccess).toHaveBeenCalledTimes(1)
  })

  it('should only save changed fields', async () => {
    mockUpdateContact.mockResolvedValue(undefined)

    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const nameInput = screen.getByDisplayValue('Jane Smith')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith('test-contact', {
        name: 'Jane Doe',
      })
    })

    expect(mockOnSuccess).toHaveBeenCalledTimes(1)
  })

  it('should handle update error from duplicate email', async () => {
    mockUpdateContact.mockRejectedValue(new Error('A contact with this email already exists'))

    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const emailInput = screen.getByDisplayValue('jane.smith@example.com')
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(screen.getByText('A contact with this email already exists')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should handle generic update error', async () => {
    mockUpdateContact.mockRejectedValue(new Error('Network error'))

    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const nameInput = screen.getByDisplayValue('Jane Smith')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should show loading state during save', async () => {
    // Create a promise that we can control
    let resolvePromise: () => void
    const updatePromise = new Promise<void>(resolve => {
      resolvePromise = resolve
    })
    mockUpdateContact.mockReturnValue(updatePromise)

    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const nameInput = screen.getByDisplayValue('Jane Smith')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    fireEvent.click(screen.getByText('Save Changes'))

    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeDisabled()

    // Resolve the promise
    resolvePromise!()
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('should trim whitespace from inputs', async () => {
    mockUpdateContact.mockResolvedValue(undefined)

    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const nameInput = screen.getByDisplayValue('Jane Smith')
    const emailInput = screen.getByDisplayValue('jane.smith@example.com')

    fireEvent.change(nameInput, { target: { value: '  Jane Doe  ' } })
    fireEvent.change(emailInput, { target: { value: '  jane.doe@example.com  ' } })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith('test-contact', {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      })
    })
  })

  it('should clear email validation error when valid email is entered', async () => {
    render(
      <EditContactModal contact={mockContact} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const emailInput = screen.getByDisplayValue('jane.smith@example.com')

    // Enter invalid email to trigger error
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
    })
  })
})
