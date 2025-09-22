import React from 'react'

export interface DeleteUserModalProps {
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
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg max-w-md w-full mx-4 p-6'>
        <div className='flex items-center mb-4'>
          <div className='flex-shrink-0'>
            <svg
              className='h-6 w-6 text-red-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-lg font-medium text-gray-900'>Delete User</h3>
          </div>
        </div>

        <div className='mb-6'>
          <p className='text-gray-600 mb-4'>
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

        <div className='flex justify-end space-x-3'>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center'
          >
            {isDeleting ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
