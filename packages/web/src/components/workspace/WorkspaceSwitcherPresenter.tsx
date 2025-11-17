/**
 * WorkspaceSwitcherPresenter - Pure presentation component for workspace switching
 */

import React, { useState, useEffect, useRef } from 'react'
import { AuthInstance } from '@work-squared/shared/auth'

export interface WorkspaceSwitcherPresenterProps {
  workspaces: AuthInstance[]
  currentWorkspaceId: string | null
  isLoading: boolean
  onSwitchWorkspace: (workspaceId: string) => void
  onCreateWorkspace: () => void
  onRenameWorkspace: (workspaceId: string, name: string) => void
  onSetDefaultWorkspace: (workspaceId: string) => void
  onDeleteWorkspace: (workspaceId: string) => void
}

export const WorkspaceSwitcherPresenter: React.FC<WorkspaceSwitcherPresenterProps> = ({
  workspaces,
  currentWorkspaceId,
  isLoading,
  onSwitchWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onSetDefaultWorkspace,
  onDeleteWorkspace,
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId)

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingWorkspaceId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingWorkspaceId])

  // Handle dropdown toggle with position calculation
  const handleToggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
    setShowDropdown(!showDropdown)
    setEditingWorkspaceId(null)
    setShowDeleteConfirm(null)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setEditingWorkspaceId(null)
        setShowDeleteConfirm(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    if (!showDropdown) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false)
        setEditingWorkspaceId(null)
        setShowDeleteConfirm(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDropdown])

  const handleStartEdit = (workspace: AuthInstance, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingWorkspaceId(workspace.id)
    setEditingName(workspace.name)
    setShowDeleteConfirm(null)
  }

  const handleSaveEdit = (workspaceId: string) => {
    if (
      editingName.trim() &&
      editingName.trim() !== workspaces.find(w => w.id === workspaceId)?.name
    ) {
      onRenameWorkspace(workspaceId, editingName.trim())
    }
    setEditingWorkspaceId(null)
  }

  const handleCancelEdit = () => {
    setEditingWorkspaceId(null)
    setEditingName('')
  }

  const handleEditKeyDown = (event: React.KeyboardEvent, workspaceId: string) => {
    if (event.key === 'Enter') {
      handleSaveEdit(workspaceId)
    } else if (event.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleSetDefault = (workspaceId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onSetDefaultWorkspace(workspaceId)
  }

  const handleDelete = (workspaceId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setShowDeleteConfirm(workspaceId)
    setEditingWorkspaceId(null)
  }

  const handleConfirmDelete = (workspaceId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onDeleteWorkspace(workspaceId)
    setShowDeleteConfirm(null)
  }

  const handleCancelDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    setShowDeleteConfirm(null)
  }

  const handleWorkspaceClick = (workspaceId: string) => {
    if (workspaceId !== currentWorkspaceId && !editingWorkspaceId && !showDeleteConfirm) {
      onSwitchWorkspace(workspaceId)
      setShowDropdown(false)
    }
  }

  const handleCreateClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onCreateWorkspace()
  }

  return (
    <div className='relative'>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        disabled={isLoading}
        className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
        aria-label='Switch workspace'
        aria-expanded={showDropdown}
        aria-haspopup='true'
        data-testid='workspace-switcher-button'
      >
        <svg
          className='w-4 h-4 mr-2 text-gray-500'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
          />
        </svg>
        <span className='truncate max-w-[150px]'>
          {currentWorkspace?.name || 'Select workspace'}
        </span>
        <svg
          className='w-4 h-4 ml-2 text-gray-500'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className='fixed min-w-[320px] max-w-md bg-white rounded-md shadow-lg py-1 z-[9999] border border-gray-200'
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
          role='menu'
          aria-orientation='vertical'
          aria-labelledby='workspace-menu'
        >
          <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100'>
            Workspaces
          </div>

          <div className='max-h-[400px] overflow-y-auto'>
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                className={`group relative ${
                  workspace.id === currentWorkspaceId ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                role='menuitem'
              >
                {editingWorkspaceId === workspace.id ? (
                  <div
                    className='px-4 py-2 flex items-center gap-2'
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      ref={editInputRef}
                      type='text'
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => handleEditKeyDown(e, workspace.id)}
                      className='flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      onClick={() => handleSaveEdit(workspace.id)}
                      className='p-1 text-green-600 hover:text-green-700'
                      title='Save'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className='p-1 text-gray-600 hover:text-gray-700'
                      title='Cancel'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>
                ) : showDeleteConfirm === workspace.id ? (
                  <div className='px-4 py-2 bg-red-50' onClick={e => e.stopPropagation()}>
                    <div className='text-sm text-red-900 mb-2'>Delete this workspace?</div>
                    <div className='flex gap-2'>
                      <button
                        onClick={e => handleConfirmDelete(workspace.id, e)}
                        className='px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700'
                      >
                        Delete
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className='px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className='px-4 py-2 flex items-center justify-between cursor-pointer'
                    onClick={() => handleWorkspaceClick(workspace.id)}
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-gray-900 truncate'>
                          {workspace.name}
                        </span>
                        {workspace.isDefault && (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
                            Default
                          </span>
                        )}
                        {workspace.id === currentWorkspaceId && (
                          <svg
                            className='w-4 h-4 text-blue-600'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <button
                        onClick={e => handleStartEdit(workspace, e)}
                        className='p-1 text-gray-600 hover:text-blue-600 rounded'
                        title='Rename'
                        aria-label={`Rename ${workspace.name}`}
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                          />
                        </svg>
                      </button>
                      {!workspace.isDefault && (
                        <button
                          onClick={e => handleSetDefault(workspace.id, e)}
                          className='p-1 text-gray-600 hover:text-blue-600 rounded'
                          title='Set as default'
                          aria-label={`Set ${workspace.name} as default`}
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                            />
                          </svg>
                        </button>
                      )}
                      {workspace.id !== currentWorkspaceId && (
                        <button
                          onClick={e => handleDelete(workspace.id, e)}
                          className='p-1 text-gray-600 hover:text-red-600 rounded'
                          title='Delete'
                          aria-label={`Delete ${workspace.name}`}
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className='border-t border-gray-100 mt-1'>
            <button
              onClick={handleCreateClick}
              className='w-full px-4 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2'
              role='menuitem'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              Create new workspace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
