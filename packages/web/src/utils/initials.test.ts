import { describe, it, expect } from 'vitest'
import { getInitials } from './initials.js'

describe('getInitials', () => {
  it('should generate initials from normal names', () => {
    expect(getInitials('John Smith')).toBe('JS')
    expect(getInitials('Alice Johnson')).toBe('AJ')
    expect(getInitials('Bob Wilson Brown')).toBe('BW') // Limit to 2 characters
  })

  it('should handle extra spaces between names', () => {
    expect(getInitials('John  Smith')).toBe('JS')
    expect(getInitials('Alice   Johnson')).toBe('AJ')
    expect(getInitials('Bob    Wilson    Brown')).toBe('BW')
  })

  it('should handle leading and trailing spaces', () => {
    expect(getInitials(' John Smith ')).toBe('JS')
    expect(getInitials('  Alice Johnson  ')).toBe('AJ')
    expect(getInitials('\t Bob Wilson \n')).toBe('BW')
  })

  it('should handle single names', () => {
    expect(getInitials('John')).toBe('J')
    expect(getInitials('Alice')).toBe('A')
    expect(getInitials('Madonna')).toBe('M')
  })

  it('should handle empty or whitespace-only names', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials('   ')).toBe('?')
    expect(getInitials('\t\n')).toBe('?')
  })

  it('should handle names with special characters', () => {
    expect(getInitials("John O'Connor")).toBe('JO')
    expect(getInitials('Marie-Claire Dubois')).toBe('MD')
    expect(getInitials('José María')).toBe('JM')
  })

  it('should return uppercase initials', () => {
    expect(getInitials('john smith')).toBe('JS')
    expect(getInitials('alice johnson')).toBe('AJ')
    expect(getInitials('bob WILSON')).toBe('BW')
  })

  it('should limit to 2 characters maximum', () => {
    expect(getInitials('John Michael Smith Wilson Brown')).toBe('JM')
    expect(getInitials('A B C D E F')).toBe('AB')
  })
})
