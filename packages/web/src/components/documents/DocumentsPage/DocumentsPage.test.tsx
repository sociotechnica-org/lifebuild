import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DocumentsPage } from './DocumentsPage.js'
import { getAllDocuments$, getProjects$, getAllDocumentProjects$ } from '@lifebuild/shared/queries'
import { useQuery } from '@livestore/react'

// Hoisted mocks
const { mockStore, mockDocuments, mockProjects } = vi.hoisted(() => {
  const mockStore = { commit: vi.fn() }
  const mockDocuments = [
    {
      id: 'doc1',
      title: 'Test Document 1',
      content: 'This is test content for document 1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      archivedAt: null,
    },
    {
      id: 'doc2',
      title: 'Another Document',
      content: 'Different content here',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      archivedAt: null,
    },
  ]
  const mockProjects = [
    { id: 'proj1', name: 'Project 1', description: 'Test project 1' },
    { id: 'proj2', name: 'Project 2', description: 'Test project 2' },
  ]
  return { mockStore, mockDocuments, mockProjects }
})

// Mock queries first
vi.mock('@lifebuild/shared/queries', () => ({
  getAllDocuments$: vi.fn(),
  getProjects$: vi.fn(),
  getAllDocumentProjects$: vi.fn(),
}))

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
  useQuery: vi.fn(),
}))

// Mock DocumentCreateModal
vi.mock('../DocumentCreateModal/DocumentCreateModal.js', () => ({
  DocumentCreateModal: ({ isOpen, _onClose }: any) =>
    isOpen ? <div data-testid='document-create-modal'>Document Create Modal</div> : null,
}))

describe('DocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock implementation
    vi.mocked(useQuery).mockImplementation((query: any) => {
      if (query === getAllDocuments$) {
        return mockDocuments
      }
      if (query === getProjects$) {
        return mockProjects
      }
      if (query === getAllDocumentProjects$) {
        return [] // Empty document-project associations by default
      }
      return []
    })
  })

  it('should render the documents page with header', () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New Document/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument()
  })

  it('should display documents list', () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Test Document 1')).toBeInTheDocument()
    expect(screen.getByText('This is test content for document 1')).toBeInTheDocument()
    expect(screen.getByText('Another Document')).toBeInTheDocument()
    expect(screen.getByText('Different content here')).toBeInTheDocument()
  })

  it('should filter documents based on search query', () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText('Search documents...')
    fireEvent.change(searchInput, { target: { value: 'Test Document' } })

    expect(screen.getByText('Test Document 1')).toBeInTheDocument()
    expect(screen.queryByText('Another Document')).not.toBeInTheDocument()
  })

  it('should show empty state when no documents', () => {
    vi.mocked(useQuery).mockImplementation(query => {
      if (query === getAllDocuments$) {
        return []
      }
      if (query === getProjects$) {
        return mockProjects
      }
      if (query === getAllDocumentProjects$) {
        return []
      }
      return []
    })

    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('No documents')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating a new document.')).toBeInTheDocument()
  })

  it('should open create document modal when clicking new document button', () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    )

    const newButton = screen.getByRole('button', { name: /New Document/i })
    fireEvent.click(newButton)

    expect(screen.getByTestId('document-create-modal')).toBeInTheDocument()
  })

  it('should archive document when clicking archive button', async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    )

    const archiveButtons = screen.getAllByTitle('Archive document')
    fireEvent.click(archiveButtons[0]!)

    // Should show confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Archive Document')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to archive this document/)).toBeInTheDocument()
    })

    // Click Archive button in modal
    const archiveButton = screen.getByRole('button', { name: 'Archive' })
    fireEvent.click(archiveButton)

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'v1.DocumentArchived',
          args: expect.objectContaining({
            id: 'doc1',
          }),
        })
      )
    })
  })

  it('should not archive document when user cancels', async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    )

    const archiveButtons = screen.getAllByTitle('Archive document')
    fireEvent.click(archiveButtons[0]!)

    // Should show confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Archive Document')).toBeInTheDocument()
    })

    // Click Cancel button in modal
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    // Modal should close and no commit should be called
    await waitFor(() => {
      expect(screen.queryByText('Archive Document')).not.toBeInTheDocument()
    })
    expect(mockStore.commit).not.toHaveBeenCalled()
  })
})
