import React, { useState, useEffect } from 'react'
import { Contact } from '@work-squared/shared/schema'
import { useContacts } from '../../hooks/useContacts.js'

interface EditContactModalProps {
  contact: Contact
  onClose: () => void
  onSuccess: () => void
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  onClose,
  onSuccess,
}) => {
  const { updateContact } = useContacts()
  const [name, setName] = useState(contact.name)
  const [email, setEmail] = useState(contact.email || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Clear error when name becomes valid
  useEffect(() => {
    if (error === 'Name is required' && name.trim()) {
      setError(null)
    }
    if (
      error === 'Please enter a valid email address' &&
      email.trim() &&
      isValidEmail(email.trim())
    ) {
      setError(null)
    }
  }, [name, email, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (email.trim() && !isValidEmail(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const updates: { name?: string; email?: string | null } = {}

      if (name.trim() !== contact.name) {
        updates.name = name.trim()
      }

      const trimmedEmail = email.trim()
      if (trimmedEmail !== (contact.email || '')) {
        updates.email = trimmedEmail || null
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await updateContact(contact.id, updates)
      }

      onSuccess()
    } catch (error) {
      console.error('Error updating contact:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to update contact. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = () => {
    return name.trim() !== contact.name || email.trim() !== (contact.email || '')
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Edit Contact</h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100'
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
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label htmlFor='edit-name' className='block text-sm font-medium text-gray-900 mb-2'>
                Name *
              </label>
              <input
                type='text'
                id='edit-name'
                value={name}
                onChange={e => setName(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter contact name'
                autoFocus
              />
            </div>

            <div>
              <label htmlFor='edit-email' className='block text-sm font-medium text-gray-900 mb-2'>
                Email
              </label>
              <input
                type='text'
                id='edit-email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter email address'
              />
            </div>

            {error && <p className='text-sm text-red-600'>{error}</p>}

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting || !hasChanges()}
                className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
