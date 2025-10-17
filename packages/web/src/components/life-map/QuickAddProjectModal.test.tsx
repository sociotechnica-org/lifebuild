import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuickAddProjectModal } from './QuickAddProjectModal.js'

// Mock LiveStore hooks
const mockCommit = vi.fn()
const mockStore = { commit: mockCommit }

vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
}))

// Mock AuthContext
vi.mock('../../contexts/AuthContext.js', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

// Mock Snackbar
const mockShowSnackbar = vi.fn()
vi.mock('../ui/Snackbar/Snackbar.js', () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}))

describe('QuickAddProjectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open with category name', () => {
    render(<QuickAddProjectModal isOpen={true} onClose={() => {}} categoryId='health' />)

    expect(screen.getByText('Add Project')).toBeInTheDocument()
    expect(screen.getByText('Health & Well-Being')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter project name')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const { container } = render(
      <QuickAddProjectModal isOpen={false} onClose={() => {}} categoryId='health' />
    )

    expect(container.firstChild).toBeNull()
  })

  it('shows validation error when submitting empty name', async () => {
    render(<QuickAddProjectModal isOpen={true} onClose={() => {}} categoryId='health' />)

    const createButton = screen.getByRole('button', { name: /create/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument()
    })
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<QuickAddProjectModal isOpen={true} onClose={onClose} categoryId='health' />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when close icon is clicked', () => {
    const onClose = vi.fn()
    render(<QuickAddProjectModal isOpen={true} onClose={onClose} categoryId='health' />)

    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('creates project and closes modal on successful submission', async () => {
    const onClose = vi.fn()
    render(<QuickAddProjectModal isOpen={true} onClose={onClose} categoryId='health' />)

    const input = screen.getByPlaceholderText('Enter project name')
    fireEvent.change(input, { target: { value: 'New Health Project' } })

    const createButton = screen.getByRole('button', { name: /create/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalled()
      expect(mockShowSnackbar).toHaveBeenCalledWith({
        message: 'New Health Project added to Health & Well-Being',
        type: 'success',
        duration: 3000,
      })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('clears validation error when typing in input', async () => {
    render(<QuickAddProjectModal isOpen={true} onClose={() => {}} categoryId='health' />)

    // Trigger validation error
    const createButton = screen.getByRole('button', { name: /create/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument()
    })

    // Type in input
    const input = screen.getByPlaceholderText('Enter project name')
    fireEvent.change(input, { target: { value: 'New Project' } })

    // Error should be cleared
    expect(screen.queryByText('Project name is required')).not.toBeInTheDocument()
  })
})
