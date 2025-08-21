import { useQuery, useStore } from '@livestore/react'
import { getContacts$, getContactById$, getContactByEmail$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'

/**
 * Custom hook for contact management operations
 */
export function useContacts() {
  const { store } = useStore()
  const contacts = useQuery(getContacts$) ?? []

  const createContact = async (name: string, email: string) => {
    // Check for duplicate email
    const existingContact = contacts.find(c => c.email?.toLowerCase() === email.toLowerCase())
    if (existingContact) {
      throw new Error('A contact with this email already exists')
    }

    const contactId = crypto.randomUUID()
    await store.commit(
      events.contactCreated({
        id: contactId,
        name,
        email,
        createdAt: new Date(),
      })
    )

    return contactId
  }

  const updateContact = async (contactId: string, updates: { name?: string; email?: string }) => {
    // If email is being updated, check for duplicates
    if (updates.email) {
      const existingContact = contacts.find(
        c => c.email?.toLowerCase() === updates.email?.toLowerCase() && c.id !== contactId
      )
      if (existingContact) {
        throw new Error('A contact with this email already exists')
      }
    }

    await store.commit(
      events.contactUpdated({
        id: contactId,
        updates,
        updatedAt: new Date(),
      })
    )
  }

  const deleteContact = async (contactId: string) => {
    await store.commit(
      events.contactDeleted({
        id: contactId,
        deletedAt: new Date(),
      })
    )
  }

  return {
    contacts,
    createContact,
    updateContact,
    deleteContact,
  }
}

/**
 * Hook to get a specific contact by ID
 */
export function useContact(contactId: string) {
  const contact = useQuery(getContactById$(contactId))
  return contact?.[0] || null
}

/**
 * Hook to check if an email already exists
 */
export function useContactByEmail(email: string) {
  const contact = useQuery(getContactByEmail$(email))
  return contact?.[0] || null
}
