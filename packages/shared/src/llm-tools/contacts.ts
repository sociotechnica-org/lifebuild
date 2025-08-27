import type { Store } from '@livestore/livestore'
import {
  wrapToolFunction,
  wrapStringParamFunction,
  wrapNoParamFunction,
  validators,
} from './base.js'
import {
  getContacts$,
  getContactById$,
  getContactByEmail$,
  getProjectContactAssociations$,
  getContactProjectAssociations$,
} from '../livestore/queries.js'
import { events } from '../livestore/schema.js'
import { parseEmailList } from '../utils/contact-import.js'

// ===== BASIC CONTACT OPERATIONS =====

/**
 * Get all contacts in the system
 */
export const listContacts = wrapNoParamFunction(async (store: Store) => {
  const contacts = (await store.query(getContacts$)) as any[]
  return {
    success: true,
    contacts: contacts
      .filter(c => !c.deletedAt)
      .map(contact => ({
        id: contact.id,
        name: contact.name || contact.email?.split('@')[0] || 'Unknown',
        email: contact.email || '',
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })),
  }
})

/**
 * Get detailed information about a specific contact
 */
export const getContact = wrapStringParamFunction(async (store: Store, contactId: string) => {
  const contacts = await store.query(getContactById$(contactId))
  const contact = validators.requireEntity(contacts, 'Contact', contactId)

  if (contact.deletedAt) {
    throw new Error(`Contact with ID ${contactId} has been deleted`)
  }

  // Get associated projects
  const projectAssociations = (await store.query(
    getContactProjectAssociations$(contactId)
  )) as any[] as any[]

  return {
    success: true,
    contact: {
      id: contact.id,
      name: contact.name || contact.email?.split('@')[0] || 'Unknown',
      email: contact.email,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      projects: projectAssociations.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
      })),
    },
  }
})

/**
 * Search contacts by name or email
 */
export const searchContacts = wrapStringParamFunction(async (store: Store, query: string) => {
  const allContacts = (await store.query(getContacts$)) as any[]
  const searchTerm = query.toLowerCase()

  const filteredContacts = allContacts
    .filter(c => !c.deletedAt)
    .filter(contact => {
      const name = (contact.name || '').toLowerCase()
      const email = contact.email.toLowerCase()
      return name.includes(searchTerm) || email.includes(searchTerm)
    })
    .map(contact => ({
      id: contact.id,
      name: contact.name || contact.email?.split('@')[0] || 'Unknown',
      email: contact.email,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    }))

  return {
    success: true,
    contacts: filteredContacts,
    query: query,
  }
})

/**
 * Create a new contact with duplicate email checking
 */
export const createContact = wrapToolFunction(
  async (store: Store, params: { name?: string; email: string }) => {
    const { name, email } = params

    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`)
    }

    // Check for duplicate email
    const existingContacts = await store.query(getContactByEmail$(email.toLowerCase()))
    if (existingContacts.length > 0 && !existingContacts[0].deletedAt) {
      throw new Error(`Contact with email ${email} already exists`)
    }

    const contactId = `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    await store.commit(
      events.contactCreated({
        id: contactId,
        name: name || '',
        email: email.toLowerCase(),
        createdAt: now,
      })
    )

    return {
      success: true,
      contact: {
        id: contactId,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        createdAt: now,
      },
    }
  }
)

/**
 * Update an existing contact's details
 */
export const updateContact = wrapToolFunction(
  async (store: Store, params: { contactId: string; name?: string; email?: string }) => {
    const { contactId, name, email } = params

    if (!contactId) {
      throw new Error('Contact ID is required')
    }

    // Verify contact exists
    const contacts = await store.query(getContactById$(contactId))
    const contact = validators.requireEntity(contacts, 'Contact', contactId)

    if (contact.deletedAt) {
      throw new Error(`Contact with ID ${contactId} has been deleted`)
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email format: ${email}`)
      }

      // Check for duplicate email (excluding current contact)
      const existingContacts = await store.query(getContactByEmail$(email.toLowerCase()))
      const duplicateContact = existingContacts.find(c => c.id !== contactId && !c.deletedAt)
      if (duplicateContact) {
        throw new Error(`Contact with email ${email} already exists`)
      }
    }

    const updates: any = {
      id: contactId,
      updatedAt: new Date(),
    }

    if (name !== undefined) updates.name = name || undefined
    if (email !== undefined) updates.email = email.toLowerCase()

    await store.commit(events.contactUpdated(updates))

    return {
      success: true,
      contact: {
        id: contactId,
        name: updates.name || contact.name || (email || contact.email || '').split('@')[0],
        email: updates.email || contact.email,
        updatedAt: updates.updatedAt,
      },
    }
  }
)

/**
 * Delete a contact and all its associations
 */
export const deleteContact = wrapStringParamFunction(async (store: Store, contactId: string) => {
  // Verify contact exists
  const contacts = await store.query(getContactById$(contactId))
  const contact = validators.requireEntity(contacts, 'Contact', contactId)

  if (contact.deletedAt) {
    throw new Error(`Contact with ID ${contactId} has already been deleted`)
  }

  // Delete the contact (this will cascade to remove project associations via materializer)
  await store.commit(
    events.contactDeleted({
      id: contactId,
      deletedAt: new Date(),
    })
  )

  return {
    success: true,
    message: `Contact ${contact.name || contact.email} has been deleted`,
  }
})

// ===== PROJECT-CONTACT ASSOCIATION OPERATIONS =====

/**
 * Get all contacts for a specific project
 */
export const getProjectContacts = wrapStringParamFunction(
  async (store: Store, projectId: string) => {
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    const contacts = (await store.query(getProjectContactAssociations$(projectId))) as any[]

    return {
      success: true,
      projectId,
      contacts: contacts.map(contact => ({
        id: contact.id,
        name: contact.name || contact.email?.split('@')[0] || 'Unknown',
        email: contact.email || '',
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })),
    }
  }
)

/**
 * Get all projects for a specific contact
 */
export const getContactProjects = wrapStringParamFunction(
  async (store: Store, contactId: string) => {
    if (!contactId) {
      throw new Error('Contact ID is required')
    }

    // Verify contact exists
    const contacts = await store.query(getContactById$(contactId))
    const contact = validators.requireEntity(contacts, 'Contact', contactId)

    if (contact.deletedAt) {
      throw new Error(`Contact with ID ${contactId} has been deleted`)
    }

    const projects = (await store.query(getContactProjectAssociations$(contactId))) as any[]

    return {
      success: true,
      contactId,
      contact: {
        name: contact.name || contact.email?.split('@')[0] || 'Unknown',
        email: contact.email || '',
      },
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    }
  }
)

/**
 * Associate a contact with a project
 */
export const addContactToProject = wrapToolFunction(
  async (store: Store, params: { contactId: string; projectId: string }) => {
    const { contactId, projectId } = params

    if (!contactId || !projectId) {
      throw new Error('Both contact ID and project ID are required')
    }

    // Verify contact exists
    const contacts = await store.query(getContactById$(contactId))
    const contact = validators.requireEntity(contacts, 'Contact', contactId)

    if (contact.deletedAt) {
      throw new Error(`Contact with ID ${contactId} has been deleted`)
    }

    // Check if association already exists
    const existingContacts = (await store.query(getProjectContactAssociations$(projectId))) as any[]
    if (existingContacts.some(c => c.id === contactId)) {
      return {
        success: true,
        message: 'Contact is already associated with this project',
      }
    }

    const associationId = `pc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await store.commit(
      events.projectContactAdded({
        id: associationId,
        projectId,
        contactId,
        createdAt: new Date(),
      })
    )

    return {
      success: true,
      message: `Contact ${contact.name || contact.email} has been added to project`,
    }
  }
)

/**
 * Remove a contact association from a project
 */
export const removeContactFromProject = wrapToolFunction(
  async (store: Store, params: { contactId: string; projectId: string }) => {
    const { contactId, projectId } = params

    if (!contactId || !projectId) {
      throw new Error('Both contact ID and project ID are required')
    }

    // Verify contact exists
    const contacts = await store.query(getContactById$(contactId))
    const contact = validators.requireEntity(contacts, 'Contact', contactId)

    // Check if association exists
    const existingContacts = (await store.query(getProjectContactAssociations$(projectId))) as any[]
    if (!existingContacts.some(c => c.id === contactId)) {
      return {
        success: true,
        message: 'Contact is not associated with this project',
      }
    }

    await store.commit(
      events.projectContactRemoved({
        projectId,
        contactId,
      })
    )

    return {
      success: true,
      message: `Contact ${contact.name || contact.email} has been removed from project`,
    }
  }
)

/**
 * Get formatted email list for a project (for MCP email tools)
 */
export const getProjectEmailList = wrapStringParamFunction(
  async (store: Store, projectId: string) => {
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    const contacts = (await store.query(getProjectContactAssociations$(projectId))) as any[]
    const emails = contacts.map(contact => contact.email)

    return {
      success: true,
      projectId,
      emails,
      formattedList: emails.join(', '),
      count: emails.length,
    }
  }
)

// ===== EMAIL UTILITY OPERATIONS =====

/**
 * Find contacts by matching email addresses
 */
export const findContactsByEmail = wrapToolFunction(
  async (store: Store, params: { emails: string[] }) => {
    const { emails } = params

    if (!emails || !Array.isArray(emails)) {
      throw new Error('Emails parameter must be an array of email addresses')
    }

    const allContacts = (await store.query(getContacts$)) as any[]
    const activeContacts = allContacts.filter(c => !c.deletedAt)

    const results = emails.map(email => {
      const normalizedEmail = email.toLowerCase().trim()
      const matchingContact = activeContacts.find(c => c.email === normalizedEmail)

      return {
        email: email,
        matched: !!matchingContact,
        contact: matchingContact
          ? {
              id: matchingContact.id,
              name: matchingContact.name || matchingContact.email.split('@')[0],
              email: matchingContact.email,
            }
          : null,
      }
    })

    const matchedEmails = results.filter(r => r.matched).map(r => r.email)
    const unmatchedEmails = results.filter(r => !r.matched).map(r => r.email)

    return {
      success: true,
      results,
      summary: {
        total: emails.length,
        matched: matchedEmails.length,
        unmatched: unmatchedEmails.length,
        matchedEmails,
        unmatchedEmails,
      },
    }
  }
)

/**
 * Get contact emails for a project (for email filtering)
 */
export const getProjectContactEmails = wrapStringParamFunction(
  async (store: Store, projectId: string) => {
    return getProjectEmailList(store, projectId)
  }
)

/**
 * Validate and normalize email addresses
 */
export const validateEmailList = wrapToolFunction(
  async (store: Store, params: { emails: string[] }) => {
    const { emails } = params

    if (!emails || !Array.isArray(emails)) {
      throw new Error('Emails parameter must be an array of email addresses')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const results = emails.map(email => {
      const trimmed = email.trim()
      const normalized = trimmed.toLowerCase()
      const valid = emailRegex.test(trimmed)

      return {
        original: email,
        normalized: valid ? normalized : null,
        valid,
        error: valid ? null : `Invalid email format: ${email}`,
      }
    })

    const validEmails = results.filter(r => r.valid).map(r => r.normalized!)
    const invalidEmails = results.filter(r => !r.valid).map(r => r.original)

    return {
      success: true,
      results,
      summary: {
        total: emails.length,
        valid: validEmails.length,
        invalid: invalidEmails.length,
        validEmails,
        invalidEmails,
      },
    }
  }
)

/**
 * Suggest creating contacts for unknown email addresses
 */
export const suggestContactsFromEmails = wrapToolFunction(
  async (store: Store, params: { emails: string[] }) => {
    const { emails } = params

    if (!emails || !Array.isArray(emails)) {
      throw new Error('Emails parameter must be an array of email addresses')
    }

    // First validate the emails
    const validationResult = await validateEmailList(store, { emails })
    if (!validationResult.success) {
      throw new Error('Email validation failed')
    }

    // Then check which ones already exist
    const emailMatchResult = await findContactsByEmail(store, {
      emails: validationResult.summary.validEmails,
    })
    if (!emailMatchResult.success) {
      throw new Error('Email matching failed')
    }

    // Parse email list to extract names where possible
    const emailString = validationResult.summary.validEmails.join(', ')
    const { contacts: parsedContacts } = parseEmailList(emailString)

    const suggestions = emailMatchResult.summary.unmatchedEmails.map((email: string) => {
      const parsed = parsedContacts.find(p => p.email === email)
      return {
        email,
        suggestedName: parsed?.name || email.split('@')[0],
        canCreate: true,
      }
    })

    return {
      success: true,
      suggestions,
      summary: {
        totalEmails: emails.length,
        validEmails: validationResult.summary.valid,
        existingContacts: emailMatchResult.summary.matched,
        newSuggestions: suggestions.length,
      },
    }
  }
)
