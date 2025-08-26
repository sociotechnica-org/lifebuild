import { describe, expect, it } from 'vitest'
import { parseEmailList } from '../../../shared/src/utils/contact-import'

describe('Contact Import', () => {
  describe('parseEmailList', () => {
    it('should parse a single email address', () => {
      const result = parseEmailList('test@example.com')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(1)
      expect(result.contacts[0]).toEqual({
        email: 'test@example.com'
      })
    })

    it('should parse email with name in angle bracket format', () => {
      const result = parseEmailList('John Doe <john@example.com>')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(1)
      expect(result.contacts[0]).toEqual({
        email: 'john@example.com',
        name: 'John Doe'
      })
    })

    it('should parse multiple comma-separated emails', () => {
      const result = parseEmailList('test1@example.com, test2@example.com, test3@example.com')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(3)
      expect(result.contacts[0]).toEqual({ email: 'test1@example.com' })
      expect(result.contacts[1]).toEqual({ email: 'test2@example.com' })
      expect(result.contacts[2]).toEqual({ email: 'test3@example.com' })
    })

    it('should parse mixed format emails', () => {
      const result = parseEmailList('plain@example.com, John Doe <john@example.com>, jane@example.com')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(3)
      expect(result.contacts[0]).toEqual({ email: 'plain@example.com' })
      expect(result.contacts[1]).toEqual({ email: 'john@example.com', name: 'John Doe' })
      expect(result.contacts[2]).toEqual({ email: 'jane@example.com' })
    })

    it('should handle names with multiple words', () => {
      const result = parseEmailList('Mary Jane Watson <mary.jane@example.com>')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(1)
      expect(result.contacts[0]).toEqual({
        email: 'mary.jane@example.com',
        name: 'Mary Jane Watson'
      })
    })

    it('should trim whitespace around emails and names', () => {
      const result = parseEmailList('  John Doe  < john@example.com >, jane@example.com  ')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(2)
      expect(result.contacts[0]).toEqual({ email: 'john@example.com', name: 'John Doe' })
      expect(result.contacts[1]).toEqual({ email: 'jane@example.com' })
    })

    it('should skip duplicate emails within the same import', () => {
      const result = parseEmailList('test@example.com, john@example.com, test@example.com')
      
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toBe('Duplicate email in import list: test@example.com')
      expect(result.contacts).toHaveLength(2)
      expect(result.contacts[0]).toEqual({ email: 'test@example.com' })
      expect(result.contacts[1]).toEqual({ email: 'john@example.com' })
    })

    it('should handle case-insensitive duplicate detection', () => {
      const result = parseEmailList('Test@Example.com, test@example.com')
      
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toBe('Duplicate email in import list: test@example.com')
      expect(result.contacts).toHaveLength(1)
      expect(result.contacts[0]).toEqual({ email: 'Test@Example.com' })
    })

    it('should reject invalid email formats', () => {
      const result = parseEmailList('invalid-email, test@, @example.com, test@example')
      
      expect(result.errors).toHaveLength(4)
      expect(result.errors).toContain('Invalid email format: invalid-email')
      expect(result.errors).toContain('Invalid email format: test@')
      expect(result.errors).toContain('Invalid email format: @example.com')
      expect(result.errors).toContain('Invalid email format: test@example')
      expect(result.contacts).toHaveLength(0)
    })

    it('should handle mixed valid and invalid emails', () => {
      const result = parseEmailList('valid@example.com, invalid-email, another@example.com')
      
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toBe('Invalid email format: invalid-email')
      expect(result.contacts).toHaveLength(2)
      expect(result.contacts[0]).toEqual({ email: 'valid@example.com' })
      expect(result.contacts[1]).toEqual({ email: 'another@example.com' })
    })

    it('should handle empty input', () => {
      const result = parseEmailList('')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(0)
    })

    it('should handle whitespace-only input', () => {
      const result = parseEmailList('   ')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(0)
    })

    it('should skip empty entries between commas', () => {
      const result = parseEmailList('test1@example.com,, ,test2@example.com')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(2)
      expect(result.contacts[0]).toEqual({ email: 'test1@example.com' })
      expect(result.contacts[1]).toEqual({ email: 'test2@example.com' })
    })

    it('should handle angle brackets with invalid email inside', () => {
      const result = parseEmailList('John Doe <invalid-email>')
      
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toBe('Invalid email format: invalid-email')
      expect(result.contacts).toHaveLength(0)
    })

    it('should handle complex real-world scenario', () => {
      const input = `
        john.doe@company.com,
        Jane Smith <jane.smith@example.com>,
        invalid-email,
        Bob Wilson <bob@company.org>,
        alice@test.com,
        alice@test.com,
        Mary Jane Watson <mary.jane.watson@university.edu>
      `
      
      const result = parseEmailList(input)
      
      expect(result.errors).toHaveLength(2) // invalid-email and duplicate alice@test.com
      expect(result.errors).toContain('Invalid email format: invalid-email')
      expect(result.errors).toContain('Duplicate email in import list: alice@test.com')
      
      expect(result.contacts).toHaveLength(5)
      expect(result.contacts[0]).toEqual({ email: 'john.doe@company.com' })
      expect(result.contacts[1]).toEqual({ email: 'jane.smith@example.com', name: 'Jane Smith' })
      expect(result.contacts[2]).toEqual({ email: 'bob@company.org', name: 'Bob Wilson' })
      expect(result.contacts[3]).toEqual({ email: 'alice@test.com' })
      expect(result.contacts[4]).toEqual({ email: 'mary.jane.watson@university.edu', name: 'Mary Jane Watson' })
    })

    it('should handle trailing and leading commas', () => {
      const result = parseEmailList(',test1@example.com, test2@example.com,')
      
      expect(result.errors).toHaveLength(0)
      expect(result.contacts).toHaveLength(2)
      expect(result.contacts[0]).toEqual({ email: 'test1@example.com' })
      expect(result.contacts[1]).toEqual({ email: 'test2@example.com' })
    })
  })
})