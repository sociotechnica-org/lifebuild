import React from 'react'
import { ConfirmModal } from '../ui/ConfirmModal/index.js'

interface DeleteUserModalProps {
  isOpen: boolean
  userEmail: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  userEmail,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title='Delete User'
      message={
        <div>
          <p className='mb-4'>
            Are you sure you want to delete the user <strong>{userEmail}</strong>?
          </p>
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-yellow-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-yellow-700'>
                  <strong>This action cannot be undone.</strong> The user will be permanently
                  deleted, but their instances will remain accessible to other users who have access
                  to them.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
      confirmText='Delete User'
      destructive
      isLoading={isDeleting}
    />
  )
}
