import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../../tests/test-utils.js'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { DocumentCreateModal } from './DocumentCreateModal.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = { commit: vi.fn() }
  return { mockStore }
})

// Mock livestore-compat
vi.mock('../../../livestore-compat.js', () => ({
  useStore: () => ({ store: mockStore }),
  useQuery: vi.fn(() => []),
}))

describe('DocumentCreateModal', () => {
  const mockOnClose = vi.fn()
  const mockProjectId = 'test-project-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(<DocumentCreateModal isOpen={false} onClose={mockOnClose} projectId={mockProjectId} />)

    expect(screen.queryByText('Create New Document')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(<DocumentCreateModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />)

    expect(screen.getByText('Create New Document')).toBeInTheDocument()
    expect(screen.getByLabelText('Title *')).toBeInTheDocument()
    expect(screen.getByLabelText('Content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Document' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should require non-empty title', () => {
    render(<DocumentCreateModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />)

    const submitButton = screen.getByRole('button', { name: 'Create Document' })
    expect(submitButton).toBeDisabled()

    const titleInput = screen.getByLabelText('Title *')
    fireEvent.change(titleInput, { target: { value: '   ' } }) // Just spaces
    expect(submitButton).toBeDisabled() // Should still be disabled
  })

  it('should create document when form is valid', async () => {
    render(<DocumentCreateModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />)

    const titleInput = screen.getByLabelText('Title *')
    const contentInput = screen.getByLabelText('Content')
    const submitButton = screen.getByRole('button', { name: 'Create Document' })

    fireEvent.change(titleInput, { target: { value: 'Test Document' } })
    fireEvent.change(contentInput, { target: { value: 'This is test content' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalledTimes(2)
    })

    // Just verify that the events were called - the exact structure may vary
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.DocumentCreated',
      })
    )

    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.DocumentAddedToProject',
      })
    )

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when cancel button is clicked', () => {
    render(<DocumentCreateModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when close button is clicked', () => {
    render(<DocumentCreateModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />)

    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should disable submit button when title is empty', () => {
    render(<DocumentCreateModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />)

    const submitButton = screen.getByRole('button', { name: 'Create Document' })
    expect(submitButton).toBeDisabled()

    const titleInput = screen.getByLabelText('Title *')
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })

    expect(submitButton).toBeEnabled()
  })
})
