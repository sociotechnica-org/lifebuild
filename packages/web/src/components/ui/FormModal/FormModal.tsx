import React from 'react'
import { Modal } from '../Modal/Modal.js'

export interface FormModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title (can be a string or React element) */
  title: string | React.ReactNode
  /** ARIA label for accessibility (optional, uses title if title is a string) */
  ariaLabel?: string
  /** Form content */
  children: React.ReactNode
  /** Form submit handler */
  onSubmit?: (e: React.FormEvent) => void
  /** Text for submit button (default: "Submit") */
  submitText?: string
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string
  /** Whether submit button is disabled */
  submitDisabled?: boolean
  /** Whether form is submitting (shows loading state) */
  isSubmitting?: boolean
  /** Maximum width (default: "max-w-md") */
  maxWidth?: string
  /** Optional footer content (replaces default buttons) */
  footer?: React.ReactNode
  /** Hide the default footer (default: false) */
  hideFooter?: boolean
}

/**
 * Reusable modal with standard form structure: header, content, and footer.
 *
 * @example
 * ```tsx
 * <FormModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Create Project"
 *   onSubmit={handleSubmit}
 *   submitText="Create"
 *   submitDisabled={!values.name}
 *   isSubmitting={isSubmitting}
 * >
 *   <div className="space-y-4">
 *     <div>
 *       <label>Project Name</label>
 *       <input value={values.name} onChange={handleChange('name')} />
 *     </div>
 *   </div>
 * </FormModal>
 * ```
 */
export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submitDisabled = false,
  isSubmitting = false,
  maxWidth = 'max-w-md',
  footer,
  hideFooter = false,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit?.(e)
    } catch (error) {
      // Error handling should be done by the onSubmit handler
      // This catch prevents unhandled promise rejection
      console.error('Form submission error:', error)
    }
  }

  // Use provided ariaLabel, or title if it's a string, or a default
  const modalAriaLabel = ariaLabel || (typeof title === 'string' ? title : 'Form Modal')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      ariaLabel={modalAriaLabel}
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            disabled={isSubmitting}
            className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Close modal'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>{children}</div>

        {/* Footer */}
        {!hideFooter && (
          <div className='flex gap-3 px-6 py-4 border-t border-gray-200'>
            {footer || (
              <>
                <button
                  type='submit'
                  disabled={submitDisabled || isSubmitting}
                  className='flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors'
                >
                  {isSubmitting ? 'Loading...' : submitText}
                </button>
                <button
                  type='button'
                  onClick={onClose}
                  disabled={isSubmitting}
                  className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {cancelText}
                </button>
              </>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}
