import React from 'react'
import { ConfirmModal } from './ConfirmModal/index.js'

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
    <ConfirmModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title='Archive Document'
      message='Are you sure you want to archive this document? It will be removed from all lists but can be restored later.'
      confirmText='Archive'
      destructive
    />
  )
}
