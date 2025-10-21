import React from 'react'
import { Modal } from './Modal/index.js'

interface ArchiveConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ArchiveConfirmModal: React.FC<ArchiveConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      backdropBlur={false}
      align='center'
      ariaLabel='Archive Document Confirmation'
    >
      <div className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Archive Document</h3>
        <p className='text-gray-600 mb-6'>
          Are you sure you want to archive this document? It will be removed from all lists but can
          be restored later.
        </p>
        <div className='flex justify-end space-x-3'>
          <button
            onClick={onCancel}
            className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors'
          >
            Archive
          </button>
        </div>
      </div>
    </Modal>
  )
}
