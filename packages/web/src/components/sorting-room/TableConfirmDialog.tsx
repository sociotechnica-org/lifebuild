import React from 'react'
import type { Project } from '@lifebuild/shared/schema'

export type DialogMode = 'activate' | 'release'

export interface TableConfirmDialogProps {
  isOpen: boolean
  mode: DialogMode
  incomingProject: Project | null
  outgoingProject: Project | null
  outgoingHasProgress: boolean
  allTasksDone: boolean
  stream: 'gold' | 'silver'
  onConfirm: () => void
  onComplete: () => void
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
  allTasksDone,
  stream,
  onConfirm,
  onComplete,
  onCancel,
}) => {
  if (!isOpen) return null

  // For activate mode, we need an incoming project
  // For release mode, we need an outgoing project
  if (mode === 'activate' && !incomingProject) return null
  if (mode === 'release' && !outgoingProject) return null

  const streamLabel = stream === 'gold' ? 'Initiative' : 'Optimization'

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
      onClick={onCancel}
    >
      <div
        className='bg-white rounded-xl p-6 max-w-[480px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
        onClick={e => e.stopPropagation()}
      >
        {mode === 'activate' ? (
          <>
            <h3 className='m-0 mb-4 text-lg font-semibold text-[#2f2b27]'>
              Activate {streamLabel} Project
            </h3>

            <div className='mb-6'>
              <p className='m-0 mb-3 text-sm text-[#2f2b27] leading-relaxed'>
                <strong>{incomingProject!.name}</strong> will become your active{' '}
                {streamLabel.toLowerCase()} project.
              </p>

              {outgoingProject && (
                <div className='bg-[#faf9f7] rounded-lg p-4 mt-4'>
                  {outgoingHasProgress ? (
                    <p className='m-0 text-sm text-[#2f2b27] leading-relaxed'>
                      <strong>{outgoingProject.name}</strong> has tasks in progress and will remain
                      active. It will be moved to the top of your active projects list.
                    </p>
                  ) : (
                    <p className='m-0 text-sm text-[#2f2b27] leading-relaxed'>
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
            <h3 className='m-0 mb-4 text-lg font-semibold text-[#2f2b27]'>
              {allTasksDone ? 'Complete' : 'Release'} {streamLabel} Project
            </h3>

            <div className='mb-6'>
              <p className='m-0 mb-3 text-sm text-[#2f2b27] leading-relaxed'>
                <strong>{outgoingProject!.name}</strong> will be removed from the{' '}
                {streamLabel.toLowerCase()} table.
              </p>

              <div className='bg-[#faf9f7] rounded-lg p-4 mt-4'>
                {allTasksDone ? (
                  <p className='m-0 text-sm text-[#2f2b27] leading-relaxed'>
                    All tasks are complete! Would you like to mark this project as completed?
                  </p>
                ) : outgoingHasProgress ? (
                  <p className='m-0 text-sm text-[#2f2b27] leading-relaxed'>
                    This project has tasks in progress and will remain active. It will be moved to
                    the top of your active projects list.
                  </p>
                ) : (
                  <p className='m-0 text-sm text-[#2f2b27] leading-relaxed'>
                    This project has no tasks in progress. It will be moved back to the top of your
                    backlog queue.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div className='flex gap-3 justify-end'>
          <button
            type='button'
            className='py-2 px-5 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
            onClick={onCancel}
          >
            Cancel
          </button>
          {mode === 'release' && allTasksDone ? (
            <>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                onClick={onConfirm}
              >
                Just Release
              </button>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black'
                onClick={onComplete}
              >
                Complete Project
              </button>
            </>
          ) : (
            <button
              type='button'
              className='py-2 px-5 rounded-lg text-sm font-medium bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black'
              onClick={onConfirm}
            >
              {mode === 'activate' ? 'Activate' : 'Release'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
