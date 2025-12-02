import React from 'react'
import type { Project } from '@work-squared/shared/schema'

export type DialogMode = 'activate' | 'release'

export interface TableConfirmDialogProps {
  isOpen: boolean
  mode: DialogMode
  incomingProject: Project | null
  outgoingProject: Project | null
  outgoingHasProgress: boolean
  stream: 'gold' | 'silver'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog shown when activating or releasing a project from the table
 */
export const TableConfirmDialog: React.FC<TableConfirmDialogProps> = ({
  isOpen,
  mode,
  incomingProject,
  outgoingProject,
  outgoingHasProgress,
  stream,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  // For activate mode, we need an incoming project
  // For release mode, we need an outgoing project
  if (mode === 'activate' && !incomingProject) return null
  if (mode === 'release' && !outgoingProject) return null

  const streamLabel = stream.charAt(0).toUpperCase() + stream.slice(1)

  return (
    <div className='sorting-room-dialog-overlay' onClick={onCancel}>
      <div className='sorting-room-dialog' onClick={e => e.stopPropagation()}>
        {mode === 'activate' ? (
          <>
            <h3 className='sorting-room-dialog-title'>Activate {streamLabel} Project</h3>

            <div className='sorting-room-dialog-content'>
              <p>
                <strong>{incomingProject!.name}</strong> will become your active {stream} project.
              </p>

              {outgoingProject && (
                <div className='sorting-room-dialog-info'>
                  {outgoingHasProgress ? (
                    <p>
                      <strong>{outgoingProject.name}</strong> has tasks in progress and will remain
                      active. It will be moved to the top of your active projects list.
                    </p>
                  ) : (
                    <p>
                      <strong>{outgoingProject.name}</strong> has no tasks in progress. It will be
                      moved back to the top of your backlog queue.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 className='sorting-room-dialog-title'>Release {streamLabel} Project</h3>

            <div className='sorting-room-dialog-content'>
              <p>
                <strong>{outgoingProject!.name}</strong> will be removed from the {stream} table.
              </p>

              <div className='sorting-room-dialog-info'>
                {outgoingHasProgress ? (
                  <p>
                    This project has tasks in progress and will remain active. It will be moved to
                    the top of your active projects list.
                  </p>
                ) : (
                  <p>
                    This project has no tasks in progress. It will be moved back to the top of your
                    backlog queue.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div className='sorting-room-dialog-actions'>
          <button type='button' className='sorting-room-dialog-btn cancel' onClick={onCancel}>
            Cancel
          </button>
          <button type='button' className='sorting-room-dialog-btn confirm' onClick={onConfirm}>
            {mode === 'activate' ? 'Activate' : 'Release'}
          </button>
        </div>
      </div>
    </div>
  )
}
