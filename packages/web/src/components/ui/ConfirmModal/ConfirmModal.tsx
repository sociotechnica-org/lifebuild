import React from 'react'
import { Modal } from '../Modal/Modal.js'

export interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Callback when user confirms */
  onConfirm: () => void
  /** Modal title */
  title: string
  /** Modal message/description */
  message: string | React.ReactNode
  /** Text for confirm button (default: "Confirm") */
  confirmText?: string
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string
  /** Whether this is a destructive action (shows red button, default: false) */
  destructive?: boolean
  /** Whether confirm action is loading */
  isLoading?: boolean
}

/**
 * Reusable confirmation modal for yes/no decisions.
 *
 * @example
 * ```tsx
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmText="Delete"
 *   destructive
 * />
 * ```
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm()
    // Note: Parent component is responsible for closing the modal
    // after the confirm action completes
  }

  const confirmButtonClass = destructive
    ? 'px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    : 'px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      align='center'
      backdropBlur={false}
      ariaLabel={title}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>{title}</h3>
        {typeof message === 'string' ? (
          <p className='text-gray-600 mb-6'>{message}</p>
        ) : (
          <div className='text-gray-600 mb-6'>{message}</div>
        )}
        <div className='flex justify-end space-x-3'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {cancelText}
          </button>
          <button onClick={handleConfirm} disabled={isLoading} className={confirmButtonClass}>
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
