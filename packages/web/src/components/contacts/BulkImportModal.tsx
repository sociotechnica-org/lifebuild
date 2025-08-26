import React, { useState, useMemo } from 'react'
import { parseEmailList, ParsedContact } from '../../../../shared/src/utils/contact-import'
import { useContacts } from '../../hooks/useContacts.js'

interface BulkImportModalProps {
  onClose: () => void
  onSuccess: (results: { created: number; skipped: number }) => void
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { createContactsBulk, contacts: existingContacts } = useContacts()
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importComplete, setImportComplete] = useState(false)
  const [importResults, setImportResults] = useState<{
    created: Array<{ id: string; email: string; name?: string }>
    skipped: Array<{ email: string; reason: string; name?: string }>
  } | null>(null)

  // Parse the input in real-time for preview
  const parseResult = useMemo(() => {
    if (!input.trim()) return { contacts: [], errors: [] }
    return parseEmailList(input)
  }, [input])

  // Check which emails already exist for preview
  const previewData = useMemo(() => {
    const existingEmails = new Set(
      existingContacts.map(c => c.email?.toLowerCase()).filter(Boolean)
    )

    const willCreate: ParsedContact[] = []
    const willSkip: Array<ParsedContact & { reason: string }> = []

    for (const contact of parseResult.contacts) {
      if (existingEmails.has(contact.email.toLowerCase())) {
        willSkip.push({ ...contact, reason: 'Email already exists' })
      } else {
        willCreate.push(contact)
      }
    }

    return { willCreate, willSkip }
  }, [parseResult.contacts, existingContacts])

  const handleImport = async () => {
    if (parseResult.contacts.length === 0) {
      setError('No valid contacts to import')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const results = await createContactsBulk(parseResult.contacts)
      setImportResults(results)
      setImportComplete(true)

      // Auto-close after a short delay and notify parent
      setTimeout(() => {
        onSuccess({
          created: results.created.length,
          skipped: results.skipped.length,
        })
      }, 2000)
    } catch (error) {
      console.error('Error importing contacts:', error)
      setError(error instanceof Error ? error.message : 'Failed to import contacts')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  const totalContacts = parseResult.contacts.length
  const validContacts = previewData.willCreate.length
  const existingContactCount = previewData.willSkip.length
  const hasParseErrors = parseResult.errors.length > 0

  if (importComplete && importResults) {
    return (
      <div
        className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
        onClick={handleBackdropClick}
      >
        <div className='bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'>
          <div className='p-6 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 text-green-500'>
              <svg fill='none' stroke='currentColor' viewBox='0 0 24 24' className='w-full h-full'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Import Complete</h3>
            <div className='space-y-2 text-sm text-gray-600'>
              <p><strong>{importResults.created.length}</strong> contacts created</p>
              <p><strong>{importResults.skipped.length}</strong> contacts skipped</p>
            </div>
            <p className='text-xs text-gray-500 mt-4'>Closing automatically...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Bulk Import Contacts</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50'
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
        <div className='p-6 space-y-6'>
          <div>
            <label htmlFor='bulk-input' className='block text-sm font-medium text-gray-900 mb-2'>
              Email List
            </label>
            <p className='text-xs text-gray-600 mb-3'>
              Enter emails separated by commas. Formats supported:
              <br />
              • email@example.com
              <br />
              • Name &lt;email@example.com&gt;
            </p>
            <textarea
              id='bulk-input'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSubmitting}
              className='w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
              placeholder='john@example.com, Jane Doe <jane@example.com>, bob@company.com'
              autoFocus
            />
          </div>

          {/* Parse Errors */}
          {hasParseErrors && (
            <div className='bg-red-50 border border-red-200 rounded-md p-3'>
              <h4 className='text-sm font-medium text-red-800 mb-2'>Parsing Errors:</h4>
              <ul className='text-xs text-red-700 space-y-1'>
                {parseResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {totalContacts > 0 && (
            <div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
              <h4 className='text-sm font-medium text-gray-900 mb-3'>Preview</h4>
              
              <div className='grid grid-cols-2 gap-4 mb-4 text-sm'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>{validContacts}</div>
                  <div className='text-gray-600'>Will Create</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-yellow-600'>{existingContactCount}</div>
                  <div className='text-gray-600'>Already Exist</div>
                </div>
              </div>

              {previewData.willCreate.length > 0 && (
                <div className='mb-4'>
                  <h5 className='text-xs font-medium text-gray-700 mb-2'>New Contacts:</h5>
                  <div className='max-h-32 overflow-y-auto'>
                    {previewData.willCreate.map((contact, index) => (
                      <div key={index} className='text-xs text-gray-600 py-1'>
                        {contact.name ? `${contact.name} <${contact.email}>` : contact.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.willSkip.length > 0 && (
                <div>
                  <h5 className='text-xs font-medium text-gray-700 mb-2'>Will Skip:</h5>
                  <div className='max-h-32 overflow-y-auto'>
                    {previewData.willSkip.map((contact, index) => (
                      <div key={index} className='text-xs text-yellow-600 py-1'>
                        {contact.name ? `${contact.name} <${contact.email}>` : contact.email} - {contact.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className='text-sm text-red-600'>{error}</p>}

          {/* Actions */}
          <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className='px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isSubmitting || validContacts === 0}
              className='px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
            >
              {isSubmitting ? 'Importing...' : `Import ${validContacts} Contact${validContacts !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}