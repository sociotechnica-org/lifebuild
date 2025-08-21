import { useQuery, useStore } from '@livestore/react'
import React, { useState } from 'react'
import { getContacts$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { ErrorMessage } from '../ui/ErrorMessage.js'
import { ContactForm } from './ContactForm.js'
import { ContactItem } from './ContactItem.js'

export const ContactList: React.FC = () => {
  const { store } = useStore()
  const contacts = useQuery(getContacts$) ?? []
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateContact = async (name: string, email: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Check for duplicate email
      const existingContacts = contacts.filter(c => c.email?.toLowerCase() === email.toLowerCase())
      if (existingContacts.length > 0) {
        setError('A contact with this email already exists')
        return false
      }

      await store.commit(
        events.contactCreated({
          id: crypto.randomUUID(),
          name,
          email,
          createdAt: new Date(),
        })
      )
      return true
    } catch (error) {
      console.error('Error creating contact:', error)
      setError('Failed to create contact. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='h-full bg-gray-50 flex flex-col'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Contacts</h1>
        <p className='text-sm text-gray-600 mt-1'>Manage your contacts for email integration</p>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto px-6 py-6'>
        {/* Create Contact Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>Add New Contact</h2>
          <ContactForm onSubmit={handleCreateContact} isLoading={isLoading} />
        </div>

        {/* Contacts List */}
        <div className='bg-white rounded-lg border border-gray-200'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>
              All Contacts ({contacts.length})
            </h2>
          </div>

          {contacts.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 text-6xl mb-4'>👥</div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>No contacts yet</h3>
              <p className='text-gray-600'>
                Add your first contact using the form above to get started.
              </p>
            </div>
          ) : (
            <div>
              {contacts.map(contact => (
                <ContactItem key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />
    </div>
  )
}
