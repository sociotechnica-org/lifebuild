import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BulkImportModal } from './BulkImportModal.js'

// Mock the useContacts hook
const mockCreateContactsBulk = vi.fn()
vi.mock('../../hooks/useContacts.js', () => ({
  useContacts: () => ({
    createContactsBulk: mockCreateContactsBulk,
    contacts: [
      { id: '1', email: 'existing@example.com', name: 'Existing User' }
    ]
  })
}))

describe('BulkImportModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with initial state', () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    expect(screen.getByText('Bulk Import Contacts')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/john@example.com/)).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText(/Import 0 Contact/)).toBeInTheDocument()
    expect(screen.getByText(/Import 0 Contact/)).toBeDisabled()
  })

  it('should show parsing preview for valid emails', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'john@example.com, Jane Doe <jane@example.com>' }
    })

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Will Create count
      expect(screen.getByText('0')).toBeInTheDocument() // Already Exist count
    })

    // Check preview shows the contacts
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe <jane@example.com>')).toBeInTheDocument()
    
    // Import button should be enabled with correct count
    expect(screen.getByText('Import 2 Contacts')).toBeInTheDocument()
    expect(screen.getByText('Import 2 Contacts')).not.toBeDisabled()
  })

  it('should detect existing emails and show them as skipped', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'existing@example.com, new@example.com' }
    })

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Will Create count
      expect(screen.getByText('1')).toBeInTheDocument() // Already Exist count
    })

    // Check existing email is shown as skipped
    expect(screen.getByText('existing@example.com - Email already exists')).toBeInTheDocument()
    expect(screen.getByText('new@example.com')).toBeInTheDocument()
    
    expect(screen.getByText('Import 1 Contact')).toBeInTheDocument()
  })

  it('should show parsing errors for invalid emails', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'valid@example.com, invalid-email, another@' }
    })

    await waitFor(() => {
      expect(screen.getByText('Parsing Errors:')).toBeInTheDocument()
      expect(screen.getByText('• Invalid email format: invalid-email')).toBeInTheDocument()
      expect(screen.getByText('• Invalid email format: another@')).toBeInTheDocument()
    })

    // Should still show preview for valid emails
    expect(screen.getByText('1')).toBeInTheDocument() // Will Create count
    expect(screen.getByText('valid@example.com')).toBeInTheDocument()
    expect(screen.getByText('Import 1 Contact')).toBeInTheDocument()
  })

  it('should handle duplicate emails within import', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'test@example.com, test@example.com' }
    })

    await waitFor(() => {
      expect(screen.getByText('Parsing Errors:')).toBeInTheDocument()
      expect(screen.getByText('• Duplicate email in import list: test@example.com')).toBeInTheDocument()
    })

    expect(screen.getByText('1')).toBeInTheDocument() // Will Create count (only one instance)
    expect(screen.getByText('Import 1 Contact')).toBeInTheDocument()
  })

  it('should disable import when no valid contacts', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'invalid-email, another@' }
    })

    await waitFor(() => {
      expect(screen.getByText('Parsing Errors:')).toBeInTheDocument()
    })

    const importButton = screen.getByText('Import 0 Contacts')
    expect(importButton).toBeDisabled()
  })

  it('should close modal when clicking backdrop', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    // Click the backdrop (the outermost div)
    const backdrop = screen.getByText('Bulk Import Contacts').closest('.fixed')
    if (backdrop) {
      fireEvent.click(backdrop)
    }
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when clicking cancel button', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when clicking close button', async () => {
    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should perform bulk import and show success', async () => {
    const mockResults = {
      created: [
        { id: '1', email: 'john@example.com', name: 'John' },
        { id: '2', email: 'jane@example.com', name: 'Jane' }
      ],
      skipped: []
    }
    mockCreateContactsBulk.mockResolvedValueOnce(mockResults)

    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'john@example.com, jane@example.com' }
    })

    await waitFor(() => {
      expect(screen.getByText('Import 2 Contacts')).toBeInTheDocument()
    })

    const importButton = screen.getByText('Import 2 Contacts')
    fireEvent.click(importButton)

    // Should show importing state
    await waitFor(() => {
      expect(screen.getByText('Importing...')).toBeInTheDocument()
    })

    // Should show success screen
    await waitFor(() => {
      expect(screen.getByText('Import Complete')).toBeInTheDocument()
      expect(screen.getByText('2 contacts created')).toBeInTheDocument()
      expect(screen.getByText('0 contacts skipped')).toBeInTheDocument()
    })

    // Should call onSuccess after a delay
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({ created: 2, skipped: 0 })
    }, { timeout: 3000 })
  })

  it('should show success with skipped contacts', async () => {
    const mockResults = {
      created: [
        { id: '1', email: 'john@example.com', name: 'John' }
      ],
      skipped: [
        { email: 'existing@example.com', reason: 'Email already exists', name: 'Existing' }
      ]
    }
    mockCreateContactsBulk.mockResolvedValueOnce(mockResults)

    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'john@example.com, existing@example.com' }
    })

    await waitFor(() => {
      const importButton = screen.getByText('Import 1 Contact')
      fireEvent.click(importButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Import Complete')).toBeInTheDocument()
      expect(screen.getByText('1 contacts created')).toBeInTheDocument()
      expect(screen.getByText('1 contacts skipped')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({ created: 1, skipped: 1 })
    }, { timeout: 3000 })
  })

  it('should handle import errors', async () => {
    mockCreateContactsBulk.mockRejectedValueOnce(new Error('Network error'))

    render(<BulkImportModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
    
    const textarea = screen.getByPlaceholderText(/john@example.com/)
    await fireEvent.change(textarea, {
      target: { value: 'john@example.com' }
    })

    await waitFor(() => {
      const importButton = screen.getByText('Import 1 Contact')
      fireEvent.click(importButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
})