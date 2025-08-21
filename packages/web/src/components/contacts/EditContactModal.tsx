import React, { useState, useEffect } from 'react'
import { Contact } from '@work-squared/shared/schema'
import { useContacts } from '../../hooks/useContacts.js'
import { ErrorMessage } from '../ui/ErrorMessage.js'

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

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
      <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
        <div className='mt-3'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>Edit Contact</h3>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label htmlFor='edit-name' className='block text-sm font-medium text-gray-700 mb-1'>
                Name *
              </label>
              <input
                type='text'
                id='edit-name'
                value={name}
                onChange={e => setName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                placeholder='Enter contact name'
                required
              />
            </div>

            <div>
              <label htmlFor='edit-email' className='block text-sm font-medium text-gray-700 mb-1'>
                Email
              </label>
              <input
                type='email'
                id='edit-email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                placeholder='Enter email address'
              />
            </div>

            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting || !hasChanges()}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />
    </div>
  )
}
