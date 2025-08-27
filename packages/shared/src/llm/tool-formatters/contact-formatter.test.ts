import { describe, it, expect } from 'vitest'
import { ContactFormatter } from './contact-formatter.js'

describe('ContactFormatter', () => {
  let formatter: ContactFormatter

  beforeEach(() => {
    formatter = new ContactFormatter()
  })

  describe('Tool recognition', () => {
    it('should recognize contact tool names', () => {
      expect(formatter.canFormat('list_contacts')).toBe(true)
      expect(formatter.canFormat('get_contact')).toBe(true)
      expect(formatter.canFormat('create_contact')).toBe(true)
      expect(formatter.canFormat('unknown_tool')).toBe(false)
    })
  })

  describe('Contact list formatting', () => {
    it('should format empty contact list', () => {
      const result = { success: true, contacts: [] }
      const toolCall = { function: { name: 'list_contacts' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('No contacts found')
      expect(formatted).toContain('create_contact tool')
    })

    it('should format contact list with contacts', () => {
      const result = {
        success: true,
        contacts: [
          { id: '1', name: 'Alice', email: 'alice@example.com' },
          { id: '2', name: 'Bob', email: 'bob@test.com' },
        ],
      }
      const toolCall = { function: { name: 'list_contacts' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Found 2 contacts')
      expect(formatted).toContain('Alice')
      expect(formatted).toContain('alice@example.com')
      expect(formatted).toContain('Bob')
    })
  })

  describe('Contact detail formatting', () => {
    it('should format contact details with projects', () => {
      const result = {
        success: true,
        contact: {
          id: '1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          projects: [
            { id: 'p1', name: 'Project A', description: 'Test project' },
            { id: 'p2', name: 'Project B', description: null },
          ],
        },
      }
      const toolCall = { function: { name: 'get_contact' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Contact Details')
      expect(formatted).toContain('Alice Smith')
      expect(formatted).toContain('alice@example.com')
      expect(formatted).toContain('Project A')
      expect(formatted).toContain('Project B')
    })

    it('should handle contact with no projects', () => {
      const result = {
        success: true,
        contact: {
          id: '1',
          name: 'Bob',
          email: 'bob@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          projects: [],
        },
      }
      const toolCall = { function: { name: 'get_contact' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('No projects associated')
    })
  })

  describe('Search results formatting', () => {
    it('should format search results', () => {
      const result = {
        success: true,
        query: 'alice',
        contacts: [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
      }
      const toolCall = { function: { name: 'search_contacts' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Found 1 contact matching "alice"')
      expect(formatted).toContain('Alice')
    })

    it('should handle no search results', () => {
      const result = {
        success: true,
        query: 'nonexistent',
        contacts: [],
      }
      const toolCall = { function: { name: 'search_contacts' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('No contacts found matching "nonexistent"')
      expect(formatted).toContain('create_contact tool')
    })
  })

  describe('Contact creation formatting', () => {
    it('should format successful contact creation', () => {
      const result = {
        success: true,
        contact: {
          id: 'new-id',
          name: 'New User',
          email: 'new@example.com',
        },
      }
      const toolCall = { function: { name: 'create_contact' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Contact created successfully')
      expect(formatted).toContain('New User')
      expect(formatted).toContain('new@example.com')
    })
  })

  describe('Email utility formatting', () => {
    it('should format email matching results', () => {
      const result = {
        success: true,
        summary: {
          total: 3,
          matched: 2,
          unmatched: 1,
          matchedEmails: ['alice@example.com', 'bob@test.com'],
          unmatchedEmails: ['unknown@example.com'],
        },
        results: [
          { email: 'alice@example.com', matched: true, contact: { id: '1', name: 'Alice' } },
          { email: 'bob@test.com', matched: true, contact: { id: '2', name: 'Bob' } },
          { email: 'unknown@example.com', matched: false, contact: null },
        ],
      }
      const toolCall = { function: { name: 'find_contacts_by_email' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Email matching results')
      expect(formatted).toContain('Total emails: 3')
      expect(formatted).toContain('Matched: 2')
      expect(formatted).toContain('Unmatched: 1')
      expect(formatted).toContain('alice@example.com → **Alice**')
      expect(formatted).toContain('unknown@example.com')
    })

    it('should format email validation results', () => {
      const result = {
        success: true,
        summary: {
          total: 3,
          valid: 2,
          invalid: 1,
          validEmails: ['alice@example.com', 'bob@test.com'],
          invalidEmails: ['invalid-email'],
        },
        results: [
          { original: 'alice@example.com', valid: true },
          { original: 'bob@test.com', valid: true },
          { original: 'invalid-email', valid: false, error: 'Invalid format' },
        ],
      }
      const toolCall = { function: { name: 'validate_email_list' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Email validation results')
      expect(formatted).toContain('Valid: 2')
      expect(formatted).toContain('Invalid: 1')
      expect(formatted).toContain('alice@example.com')
      expect(formatted).toContain('invalid-email')
    })

    it('should format contact suggestions', () => {
      const result = {
        success: true,
        summary: {
          totalEmails: 3,
          validEmails: 3,
          existingContacts: 1,
          newSuggestions: 2,
        },
        suggestions: [
          { email: 'new1@example.com', suggestedName: 'new1', canCreate: true },
          { email: 'new2@test.com', suggestedName: 'New User', canCreate: true },
        ],
      }
      const toolCall = { function: { name: 'suggest_contacts_from_emails' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Contact creation suggestions')
      expect(formatted).toContain('New suggestions: 2')
      expect(formatted).toContain('new1@example.com')
      expect(formatted).toContain('New User')
      expect(formatted).toContain('create_contact tool')
    })
  })

  describe('Project email list formatting', () => {
    it('should format project email list', () => {
      const result = {
        success: true,
        projectId: 'proj-123',
        emails: ['alice@example.com', 'bob@test.com'],
        formattedList: 'alice@example.com, bob@test.com',
        count: 2,
      }
      const toolCall = { function: { name: 'get_project_email_list' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Email list for project proj-123')
      expect(formatted).toContain('2 contacts')
      expect(formatted).toContain('alice@example.com, bob@test.com')
      expect(formatted).toContain('1. alice@example.com')
      expect(formatted).toContain('2. bob@test.com')
    })

    it('should handle empty project email list', () => {
      const result = {
        success: true,
        projectId: 'proj-123',
        emails: [],
        formattedList: '',
        count: 0,
      }
      const toolCall = { function: { name: 'get_project_email_list' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('No email addresses found for project proj-123')
      expect(formatted).toContain('Add contacts to this project first')
    })
  })

  describe('Error handling', () => {
    it('should format errors properly', () => {
      const result = { success: false, error: 'Contact not found' }
      const toolCall = { function: { name: 'get_contact' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Failed to retrieve contact')
      expect(formatted).toContain('Contact not found')
    })

    it('should handle unknown tools', () => {
      const result = { success: true, message: 'Done' }
      const toolCall = { function: { name: 'unknown_tool' } }

      const formatted = formatter.format(result, toolCall)
      expect(formatted).toContain('Operation completed successfully')
      expect(formatted).toContain('Done')
    })
  })
})
