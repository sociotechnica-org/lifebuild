import React from 'react'

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Modal content */
  children: React.ReactNode
  /** Maximum width class (default: 'max-w-md') */
  maxWidth?: string
  /** Whether to show backdrop blur (default: true) */
  backdropBlur?: boolean
  /** Whether to close on backdrop click (default: true) */
  closeOnBackdropClick?: boolean
  /** Whether to close on Escape key (default: true) */
  closeOnEscape?: boolean
  /** Vertical alignment (default: 'start') */
  align?: 'start' | 'center'
  /** Additional className for the content container */
  contentClassName?: string
  /** ARIA label for the modal */
  ariaLabel?: string
}

/**
 * Reusable modal component with consistent z-index and backdrop styling.
 *
 * Usage:
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose}>
 *   <div className="p-6">
 *     Modal content here
 *   </div>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-md',
  backdropBlur = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  align = 'start',
  contentClassName = '',
  ariaLabel,
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (closeOnEscape && e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  const backdropClass = backdropBlur ? 'backdrop-blur-sm' : 'bg-black bg-opacity-50'
  const alignClass = align === 'center' ? 'items-center' : 'items-start pt-5'

  return (
    <div
      className={`fixed inset-0 ${backdropClass} flex ${alignClass} justify-center px-4 z-[9999]`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`bg-white rounded-lg shadow-lg ${maxWidth} w-full max-h-[90vh] overflow-y-auto ${contentClassName}`}
        role='dialog'
        aria-modal='true'
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  )
}
