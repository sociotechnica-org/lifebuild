import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../tests/test-utils.js'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PROJECT_CATEGORIES } from '@lifebuild/shared'
import { QuickAddProjectModal } from './QuickAddProjectModal.js'

// Mock LiveStore hooks
const mockCommit = vi.fn()
const mockStore = { commit: mockCommit }

vi.mock('../../livestore-compat.js', () => ({
  useStore: () => ({ store: mockStore }),
  useQuery: () => null, // Mock useQuery for useCategoryAdvisor hook
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

const HEALTH_CATEGORY = PROJECT_CATEGORIES.find(category => category.value === 'health')
const HEALTH_CATEGORY_NAME = HEALTH_CATEGORY?.name ?? 'Health'

describe('QuickAddProjectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open with category name', () => {
    render(<QuickAddProjectModal isOpen={true} onClose={() => {}} categoryId='health' />)

    expect(screen.getByText('Add Project')).toBeInTheDocument()
    expect(screen.getByText(HEALTH_CATEGORY_NAME)).toBeInTheDocument()
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
        message: `New Health Project added to ${HEALTH_CATEGORY_NAME}`,
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
