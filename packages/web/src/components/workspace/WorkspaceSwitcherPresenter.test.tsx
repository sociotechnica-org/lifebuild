import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkspaceSwitcherPresenter } from './WorkspaceSwitcherPresenter.js'
import { AuthInstance } from '@work-squared/shared/auth'

const mockWorkspaces: AuthInstance[] = [
  {
    id: '1',
    name: 'Personal',
    createdAt: new Date('2024-01-01'),
    lastAccessedAt: new Date('2024-01-15'),
    role: 'owner',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Work',
    createdAt: new Date('2024-01-02'),
    lastAccessedAt: new Date('2024-01-14'),
    role: 'admin',
    isDefault: false,
  },
  {
    id: '3',
    name: 'Side Project',
    createdAt: new Date('2024-01-03'),
    lastAccessedAt: new Date('2024-01-13'),
    role: 'member',
    isDefault: false,
  },
]

describe('WorkspaceSwitcherPresenter', () => {
  it('renders the current workspace name', () => {
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    expect(screen.getByText('Personal')).toBeInTheDocument()
  })

  it('shows placeholder when no workspace is selected', () => {
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId={null}
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    expect(screen.getByText('Select workspace')).toBeInTheDocument()
  })

  it('disables button when loading', () => {
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={true}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    expect(button).toBeDisabled()
  })

  it('opens dropdown when button is clicked', () => {
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    expect(screen.getByText('Workspaces')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Side Project')).toBeInTheDocument()
  })

  it('calls onSwitchWorkspace when a different workspace is clicked', async () => {
    const onSwitchWorkspace = vi.fn()
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={onSwitchWorkspace}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    const workWorkspace = screen.getByText('Work')
    fireEvent.click(workWorkspace)

    expect(onSwitchWorkspace).toHaveBeenCalledWith('2')
  })

  it('does not call onSwitchWorkspace when current workspace is clicked', () => {
    const onSwitchWorkspace = vi.fn()
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={onSwitchWorkspace}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    const personalWorkspaces = screen.getAllByText('Personal')
    const personalWorkspace = personalWorkspaces[1] // Second one is in the dropdown
    if (personalWorkspace) {
      fireEvent.click(personalWorkspace)
    }

    expect(onSwitchWorkspace).not.toHaveBeenCalled()
  })

  it('calls onCreateWorkspace when create button is clicked', () => {
    const onCreateWorkspace = vi.fn()
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={onCreateWorkspace}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    const createButton = screen.getByText('Create new workspace')
    fireEvent.click(createButton)

    expect(onCreateWorkspace).toHaveBeenCalled()
  })

  it('shows default badge for default workspace', () => {
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('allows renaming a workspace', async () => {
    const onRenameWorkspace = vi.fn()
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={onRenameWorkspace}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    // Find the rename button for the Work workspace
    const renameButton = screen.getByLabelText('Rename Work')
    fireEvent.click(renameButton)

    // Find the input field and change the name
    const input = screen.getByDisplayValue('Work') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Work Updated' } })

    // Submit by pressing Enter
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(onRenameWorkspace).toHaveBeenCalledWith('2', 'Work Updated')
    })
  })

  it('allows setting a workspace as default', () => {
    const onSetDefaultWorkspace = vi.fn()
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={onSetDefaultWorkspace}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    // Find the set default button for the Work workspace
    const setDefaultButton = screen.getByLabelText('Set Work as default')
    fireEvent.click(setDefaultButton)

    expect(onSetDefaultWorkspace).toHaveBeenCalledWith('2')
  })

  it('allows deleting a workspace with confirmation', async () => {
    const onDeleteWorkspace = vi.fn()
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={onDeleteWorkspace}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    // Find the delete button for the Work workspace
    const deleteButton = screen.getByLabelText('Delete Work')
    fireEvent.click(deleteButton)

    // Should show confirmation
    expect(screen.getByText('Delete this workspace?')).toBeInTheDocument()

    // Click confirm
    const confirmButton = screen.getByText('Delete')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(onDeleteWorkspace).toHaveBeenCalledWith('2')
    })
  })

  it('allows canceling delete confirmation', () => {
    const onDeleteWorkspace = vi.fn()
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={onDeleteWorkspace}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    // Find the delete button for the Work workspace
    const deleteButton = screen.getByLabelText('Delete Work')
    fireEvent.click(deleteButton)

    // Click cancel
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(onDeleteWorkspace).not.toHaveBeenCalled()
    expect(screen.queryByText('Delete this workspace?')).not.toBeInTheDocument()
  })

  it('hides delete button for current workspace', () => {
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    // Should not have delete button for Personal (current workspace)
    expect(screen.queryByLabelText('Delete Personal')).not.toBeInTheDocument()

    // But should have delete button for other workspaces
    expect(screen.getByLabelText('Delete Work')).toBeInTheDocument()
  })

  it('closes dropdown on escape key', () => {
    render(
      <WorkspaceSwitcherPresenter
        workspaces={mockWorkspaces}
        currentWorkspaceId='1'
        isLoading={false}
        onSwitchWorkspace={vi.fn()}
        onCreateWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onSetDefaultWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />
    )

    const button = screen.getByTestId('workspace-switcher-button')
    fireEvent.click(button)

    expect(screen.getByText('Workspaces')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByText('Workspaces')).not.toBeInTheDocument()
  })
})
