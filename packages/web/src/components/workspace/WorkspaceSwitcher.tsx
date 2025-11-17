/**
 * WorkspaceSwitcher - Container component for workspace switching
 */

import React from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext.js'
import { useSnackbar } from '../ui/Snackbar/Snackbar.js'
import { WorkspaceSwitcherPresenter } from './WorkspaceSwitcherPresenter.js'

export const WorkspaceSwitcher: React.FC = () => {
  const {
    workspaces,
    currentWorkspaceId,
    isLoading,
    switchWorkspace,
    createWorkspace,
    renameWorkspace,
    setDefaultWorkspace,
    deleteWorkspace,
  } = useWorkspace()
  const { showSnackbar } = useSnackbar()

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await switchWorkspace(workspaceId)
  }

  const handleCreateWorkspace = async () => {
    const success = await createWorkspace()
    if (success) {
      showSnackbar({
        message: 'Workspace created successfully',
        type: 'success',
      })
    }
  }

  const handleRenameWorkspace = async (workspaceId: string, name: string) => {
    const success = await renameWorkspace(workspaceId, name)
    if (success) {
      showSnackbar({
        message: `Workspace renamed to "${name}"`,
        type: 'success',
      })
    }
  }

  const handleSetDefaultWorkspace = async (workspaceId: string) => {
    const success = await setDefaultWorkspace(workspaceId)
    if (success) {
      showSnackbar({
        message: 'Default workspace updated',
        type: 'success',
      })
    }
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    const success = await deleteWorkspace(workspaceId)
    if (success) {
      showSnackbar({
        message: 'Workspace deleted',
        type: 'success',
      })
    }
  }

  return (
    <WorkspaceSwitcherPresenter
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspaceId}
      isLoading={isLoading}
      onSwitchWorkspace={handleSwitchWorkspace}
      onCreateWorkspace={handleCreateWorkspace}
      onRenameWorkspace={handleRenameWorkspace}
      onSetDefaultWorkspace={handleSetDefaultWorkspace}
      onDeleteWorkspace={handleDeleteWorkspace}
    />
  )
}
