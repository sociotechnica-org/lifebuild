import React, { useState } from 'react'
import { useStore } from '@livestore/react'
import { Contact } from '@work-squared/shared/schema'
import { getProjectContacts$, getContacts$ } from '@work-squared/shared/queries'
import { ContactPicker } from '../contacts/ContactPicker'

interface ProjectContactsProps {
  projectId: string
}

export const ProjectContacts: React.FC<ProjectContactsProps> = ({ projectId }) => {
  const projectContactJunctions = useStore(getProjectContacts$(projectId))
  const allContacts = useStore(getContacts$)
  const { mutate } = useStore.store()
  const [showContactPicker, setShowContactPicker] = useState(false)

  // Map junction data to actual contacts
  const contactIds = new Set(projectContactJunctions.map(pc => pc.contactId))
  const contacts = allContacts.filter(c => contactIds.has(c.id))

  const handleRemoveContact = async (contactId: string) => {
    await mutate([
      {
        type: 'v1.ProjectContactRemoved',
        projectId,
        contactId,
      },
    ])
  }

  return (
    <div className='bg-white shadow rounded-lg p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-medium text-gray-900'>Contacts</h3>
        <button
          onClick={() => setShowContactPicker(true)}
          className='px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
        >
          Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <p className='text-gray-500 text-sm py-4'>No contacts associated with this project yet.</p>
      ) : (
        <div className='space-y-2'>
          {contacts.map((contact: Contact) => (
            <div
              key={contact.id}
              className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
            >
              <div>
                <p className='font-medium text-gray-900'>{contact.name}</p>
                {contact.email && <p className='text-sm text-gray-500'>{contact.email}</p>}
              </div>
              <button
                onClick={() => handleRemoveContact(contact.id)}
                className='text-sm text-red-600 hover:text-red-800'
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showContactPicker && (
        <ContactPicker
          projectId={projectId}
          existingContactIds={contacts.map((c: Contact) => c.id)}
          onClose={() => setShowContactPicker(false)}
        />
      )}
    </div>
  )
}
