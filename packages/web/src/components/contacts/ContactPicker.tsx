import React, { useState } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { Contact, events } from '@work-squared/shared/schema'
import { getContacts$ } from '@work-squared/shared/queries'

interface ContactPickerProps {
  projectId: string
  existingContactIds: string[]
  onClose: () => void
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  projectId,
  existingContactIds,
  onClose,
}) => {
  const contacts = useQuery(getContacts$) ?? []
  const { store } = useStore()
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableContacts = contacts.filter((c: Contact) => !existingContactIds.includes(c.id))

  const filteredContacts = availableContacts.filter((contact: Contact) => {
    const search = searchTerm.toLowerCase()
    return (
      contact.name.toLowerCase().includes(search) ||
      (contact.email && contact.email.toLowerCase().includes(search))
    )
  })

  const handleToggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContactIds)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContactIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set())
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c: Contact) => c.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedContactIds.size === 0) return

    setIsSubmitting(true)
    try {
      const eventsToCommit = Array.from(selectedContactIds).map(contactId =>
        events.projectContactAdded({
          id: crypto.randomUUID(),
          projectId,
          contactId,
          createdAt: new Date(),
        })
      )

      await store.commit(...eventsToCommit)
      onClose()
    } catch (error) {
      console.error('Failed to add contacts to project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
          onClick={onClose}
        />

        <div className='inline-block w-full max-w-md px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6'>
          <div>
            <h3 className='text-lg font-medium leading-6 text-gray-900'>Add Contacts</h3>

            {availableContacts.length === 0 ? (
              <p className='mt-4 text-sm text-gray-500'>
                All contacts are already associated with this project.
              </p>
            ) : (
              <>
                <div className='mt-4'>
                  <input
                    type='text'
                    placeholder='Search contacts...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                {filteredContacts.length > 0 && (
                  <div className='mt-2 flex justify-end'>
                    <button
                      type='button'
                      onClick={handleSelectAll}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      {selectedContactIds.size === filteredContacts.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                )}

                <div className='mt-2 space-y-2 max-h-60 overflow-y-auto'>
                  {filteredContacts.length === 0 ? (
                    <p className='text-sm text-gray-500 py-4 text-center'>No contacts found</p>
                  ) : (
                    filteredContacts.map((contact: Contact) => (
                      <label
                        key={contact.id}
                        className='flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={selectedContactIds.has(contact.id)}
                          onChange={() => handleToggleContact(contact.id)}
                          className='mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900'>{contact.name}</p>
                          {contact.email && (
                            <p className='text-xs text-gray-500 mt-1'>{contact.email}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className='mt-5 sm:mt-6 flex justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={selectedContactIds.size === 0 || isSubmitting}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting
                      ? 'Adding...'
                      : `Add ${selectedContactIds.size} Contact${selectedContactIds.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
