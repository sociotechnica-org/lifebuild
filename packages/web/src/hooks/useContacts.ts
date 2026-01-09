import { useQuery, useStore } from '../livestore-compat.js'
import { getContacts$, getContactById$, getContactByEmail$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { ParsedContact } from '@lifebuild/shared'

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

  const updateContact = async (
    contactId: string,
    updates: { name?: string; email?: string | null }
  ) => {
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

  const createContactsBulk = async (parsedContacts: ParsedContact[]) => {
    const results = {
      created: [] as { id: string; email: string; name?: string }[],
      skipped: [] as { email: string; reason: string; name?: string }[],
    }

    for (const contact of parsedContacts) {
      try {
        // Check for duplicate email against existing contacts
        const existingContact = contacts.find(
          c => c.email?.toLowerCase() === contact.email.toLowerCase()
        )
        if (existingContact) {
          results.skipped.push({
            email: contact.email,
            name: contact.name,
            reason: 'Email already exists',
          })
          continue
        }

        const contactId = crypto.randomUUID()
        await store.commit(
          events.contactCreated({
            id: contactId,
            name: contact.name || contact.email.split('@')[0] || 'Unknown',
            email: contact.email,
            createdAt: new Date(),
          })
        )

        results.created.push({
          id: contactId,
          email: contact.email,
          name: contact.name,
        })
      } catch (error) {
        results.skipped.push({
          email: contact.email,
          name: contact.name,
          reason: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  return {
    contacts,
    createContact,
    updateContact,
    deleteContact,
    createContactsBulk,
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
