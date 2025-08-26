import React, { useState, useMemo } from 'react'
import { parseEmailList, ParsedContact } from '@work-squared/shared'
import { useContacts } from '../../hooks/useContacts.js'

interface BulkImportModalProps {
  onClose: () => void
  onSuccess: (results: { created: number; skipped: number }) => void
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, onSuccess }) => {
  const { createContactsBulk, contacts: existingContacts } = useContacts()
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      onSuccess({
        created: results.created.length,
        skipped: results.skipped.length,
      })
    } catch (error) {
      console.error('Error importing contacts:', error)
      setError(error instanceof Error ? error.message : 'Failed to import contacts')
    } finally {
      setIsSubmitting(false)
    }
  }

  const validContacts = previewData.willCreate.length
  const existingContactCount = previewData.willSkip.length

  return (
    <div className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'>
      <div className='bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Bulk Import Contacts</h3>
          <button onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          <div>
            <label htmlFor='bulk-input'>Email List</label>
            <textarea
              id='bulk-input'
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isSubmitting}
              className='w-full h-32 p-3 border border-gray-300 rounded-md'
              placeholder='john@example.com, Jane Doe <jane@example.com>, bob@company.com'
              autoFocus
            />
          </div>

          {/* Preview */}
          {(parseResult.contacts.length > 0 || parseResult.errors.length > 0) && (
            <div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
              <h4 className='font-semibold mb-2'>Preview</h4>
              <div className='space-y-1 text-sm'>
                <div>
                  Will Create: <span className='font-medium text-green-600'>{validContacts}</span>
                </div>
                <div>
                  Already Exist:{' '}
                  <span className='font-medium text-yellow-600'>{existingContactCount}</span>
                </div>
                {parseResult.errors.length > 0 && (
                  <div>
                    Parsing Errors:{' '}
                    <span className='font-medium text-red-600'>{parseResult.errors.length}</span>
                  </div>
                )}
              </div>
              {parseResult.errors.length > 0 && (
                <div className='mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm'>
                  <div className='font-medium text-red-800 mb-1'>Issues found:</div>
                  <ul className='text-red-700 space-y-1 list-disc list-inside'>
                    {parseResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && <p className='text-red-600'>{error}</p>}

          {/* Actions */}
          <div className='flex justify-end space-x-3'>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isSubmitting || validContacts === 0}
              className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
            >
              {isSubmitting
                ? 'Importing...'
                : `Import ${validContacts} Contact${validContacts !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
