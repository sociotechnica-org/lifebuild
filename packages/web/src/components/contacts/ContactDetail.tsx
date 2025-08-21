import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useContact, useContacts } from '../../hooks/useContacts.js'
import { LoadingSpinner } from '../ui/LoadingSpinner.js'
import { ErrorMessage } from '../ui/ErrorMessage.js'
import { EditContactModal } from './EditContactModal.js'
import { ROUTES } from '../../constants/routes.js'

export const ContactDetail: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>()
  const navigate = useNavigate()
  const { deleteContact } = useContacts()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!contactId) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-red-500'>Invalid contact ID</div>
      </div>
    )
  }

  const contact = useContact(contactId)

  if (contact === undefined) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner />
      </div>
    )
  }

  if (contact === null) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div>
          <div className='text-gray-400 text-6xl mb-4'>👤</div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Contact not found</h3>
          <p className='text-gray-600 mb-4'>The contact you're looking for doesn't exist.</p>
          <Link
            to={ROUTES.CONTACTS}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
          >
            Back to Contacts
          </Link>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      await deleteContact(contactId)
      navigate(ROUTES.CONTACTS)
    } catch (error) {
      console.error('Error deleting contact:', error)
      setError('Failed to delete contact. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  return (
    <div className='h-full bg-gray-50 flex flex-col'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Link
              to={ROUTES.CONTACTS}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              ← Back to Contacts
            </Link>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{contact.name}</h1>
              <p className='text-sm text-gray-600'>{contact.email}</p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto px-6 py-6'>
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>Contact Information</h2>

          <dl className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2'>
            <div>
              <dt className='text-sm font-medium text-gray-500'>Name</dt>
              <dd className='mt-1 text-sm text-gray-900'>{contact.name}</dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-gray-500'>Email</dt>
              <dd className='mt-1 text-sm text-gray-900'>{contact.email || 'Not provided'}</dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-gray-500'>Created</dt>
              <dd className='mt-1 text-sm text-gray-900'>
                {new Date(contact.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-gray-500'>Last Updated</dt>
              <dd className='mt-1 text-sm text-gray-900'>
                {new Date(contact.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Associated Projects Section - Placeholder for Phase 3 */}
        <div className='mt-6 bg-white rounded-lg border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>Associated Projects</h2>
          <div className='text-center py-8 text-gray-500'>
            <div className='text-4xl mb-2'>🔗</div>
            <p>Project associations will be available in Phase 3</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditContactModal
          contact={contact}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={e => e.target === e.currentTarget && setShowDeleteConfirmation(false)}
        >
          <div className='bg-white rounded-lg max-w-md w-full mx-4 p-6'>
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4'>
                <svg
                  className='h-6 w-6 text-red-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>Delete Contact</h3>
              <p className='text-gray-600 mb-6'>
                Are you sure you want to delete "{contact.name}"? This action cannot be undone and
                will remove the contact from all projects.
              </p>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors'
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ErrorMessage error={error} onDismiss={() => setError(null)} />
    </div>
  )
}
