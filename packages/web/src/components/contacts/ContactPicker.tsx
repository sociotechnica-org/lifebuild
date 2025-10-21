import React, { useState } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { Contact, events } from '@work-squared/shared/schema'
import { getContacts$ } from '@work-squared/shared/queries'

type Event = ReturnType<(typeof events)[keyof typeof events]>

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
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set(existingContactIds)
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredContacts = contacts.filter((contact: Contact) => {
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
    const filteredContactIds = filteredContacts.map(c => c.id)
    const allFilteredSelected = filteredContactIds.every(id => selectedContactIds.has(id))

    if (allFilteredSelected) {
      // Deselect all filtered contacts
      const newSelected = new Set(selectedContactIds)
      filteredContactIds.forEach(id => newSelected.delete(id))
      setSelectedContactIds(newSelected)
    } else {
      // Select all filtered contacts
      const newSelected = new Set(selectedContactIds)
      filteredContactIds.forEach(id => newSelected.add(id))
      setSelectedContactIds(newSelected)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const eventsToCommit: Event[] = []

      // Find contacts to add (selected but not in existing)
      const contactsToAdd = Array.from(selectedContactIds).filter(
        id => !existingContactIds.includes(id)
      )
      // Find contacts to remove (in existing but not selected)
      const contactsToRemove = existingContactIds.filter(id => !selectedContactIds.has(id))

      // Add events for new associations
      contactsToAdd.forEach(contactId => {
        eventsToCommit.push(
          events.projectContactAdded({
            id: crypto.randomUUID(),
            projectId,
            contactId,
            createdAt: new Date(),
          })
        )
      })

      // Add events for removed associations
      contactsToRemove.forEach(contactId => {
        eventsToCommit.push(
          events.projectContactRemoved({
            projectId,
            contactId,
          })
        )
      })

      if (eventsToCommit.length > 0) {
        await store.commit(...eventsToCommit)
      }
      onClose()
    } catch (error) {
      console.error('Failed to update contact associations:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-[9999]'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-lg shadow-xl w-full max-w-2xl h-[85vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='p-6 border-b border-gray-200'>
          <h3 className='text-lg font-medium leading-6 text-gray-900'>Manage Project Contacts</h3>
        </div>

        {/* Content */}
        <div className='flex-1 flex flex-col p-6'>
          {contacts.length === 0 ? (
            <div className='flex-1 flex items-center justify-center'>
              <p className='text-sm text-gray-500'>
                No contacts available. Create some contacts first.
              </p>
            </div>
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
                    {filteredContacts.every(c => selectedContactIds.has(c.id))
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}

              <div className='mt-2 space-y-2 flex-1 overflow-y-auto'>
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

              <div className='mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? 'Updating...' : 'Update Associations'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
