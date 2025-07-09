import React from 'react'
import { screen } from '@testing-library/react'
import { AddExistingDocumentModal } from '../../src/components/AddExistingDocumentModal.js'
import { render as renderWithProviders } from '../../src/test-utils.js'

describe('AddExistingDocumentModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: () => {},
    projectId: 'project-1',
  }

  it('renders when open', () => {
    renderWithProviders(<AddExistingDocumentModal {...mockProps} />)

    expect(screen.getByText('Add Existing Document')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Add to Project')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderWithProviders(<AddExistingDocumentModal {...mockProps} isOpen={false} />)

    expect(screen.queryByText('Add Existing Document')).not.toBeInTheDocument()
  })

  it('shows empty state when no documents available', () => {
    renderWithProviders(<AddExistingDocumentModal {...mockProps} />)

    expect(screen.getByText('No documents available to add')).toBeInTheDocument()
  })

  it('shows preview prompt when no document selected', () => {
    renderWithProviders(<AddExistingDocumentModal {...mockProps} />)

    expect(screen.getByText('Select a document to preview')).toBeInTheDocument()
  })

  it('disables Add to Project button when no document selected', () => {
    renderWithProviders(<AddExistingDocumentModal {...mockProps} />)

    const addButton = screen.getByText('Add to Project')
    expect(addButton).toBeDisabled()
  })
})
