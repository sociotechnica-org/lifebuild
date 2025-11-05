/**
 * WorkspaceSwitcher - Container component for workspace switching
 */

import React from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext.js'
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

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await switchWorkspace(workspaceId)
  }

  const handleCreateWorkspace = async () => {
    await createWorkspace()
  }

  const handleRenameWorkspace = async (workspaceId: string, name: string) => {
    await renameWorkspace(workspaceId, name)
  }

  const handleSetDefaultWorkspace = async (workspaceId: string) => {
    await setDefaultWorkspace(workspaceId)
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    await deleteWorkspace(workspaceId)
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
