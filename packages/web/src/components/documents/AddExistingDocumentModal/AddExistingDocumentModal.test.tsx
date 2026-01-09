import React from 'react'
import { render, screen } from '../../../../tests/test-utils.js'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AddExistingDocumentModal } from './AddExistingDocumentModal.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = { commit: vi.fn(), query: vi.fn() }
  return { mockStore }
})

// Mock livestore-compat
vi.mock('../../../livestore-compat.js', () => ({
  useStore: () => ({ store: mockStore }),
  useQuery: (queryFn: any) => {
    // Mock empty arrays for queries to simulate no data
    if (queryFn?.toString().includes('getAllDocuments')) {
      return []
    }
    if (queryFn?.toString().includes('getDocumentProjectsByProject')) {
      return []
    }
    return []
  },
}))

describe('AddExistingDocumentModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    projectId: 'project-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    render(<AddExistingDocumentModal {...mockProps} />)

    expect(screen.getByText('Add Existing Document')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Add to Project')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<AddExistingDocumentModal {...mockProps} isOpen={false} />)

    expect(screen.queryByText('Add Existing Document')).not.toBeInTheDocument()
  })

  it('shows empty state when no documents available', () => {
    render(<AddExistingDocumentModal {...mockProps} />)

    expect(screen.getByText('No documents available to add')).toBeInTheDocument()
  })

  it('shows preview prompt when no document selected', () => {
    render(<AddExistingDocumentModal {...mockProps} />)

    expect(screen.getByText('Select a document to preview')).toBeInTheDocument()
  })

  it('disables Add to Project button when no document selected', () => {
    render(<AddExistingDocumentModal {...mockProps} />)

    const addButton = screen.getByText('Add to Project')
    expect(addButton).toBeDisabled()
  })
})
