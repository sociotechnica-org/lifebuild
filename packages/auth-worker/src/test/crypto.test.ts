import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/crypto.js'

describe('crypto utilities', () => {
  describe('password hashing', () => {
    it('should hash passwords consistently', async () => {
      const password = 'testPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2)
      
      // Both hashes should contain salt and hash separated by ':'
      expect(hash1).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/)
      expect(hash2).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/)
    })

    it('should verify correct passwords', async () => {
      const password = 'testPassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const password = 'testPassword123!'
      const wrongPassword = 'wrongPassword456!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should handle invalid hash format', async () => {
      const password = 'testPassword123!'
      const invalidHash = 'invalid-hash-format'
      
      const isValid = await verifyPassword(password, invalidHash)
      expect(isValid).toBe(false)
    })
  })

  describe('password strength validation', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password2024',
        'Complex#Password$456'
      ]

      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(true)
        expect(result.message).toBeUndefined()
      })
    })

    it('should reject short passwords', () => {
      const shortPassword = 'Short1!'
      const result = validatePasswordStrength(shortPassword)
      
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Password must be at least 8 characters long')
    })

    it('should reject very long passwords', () => {
      const longPassword = 'a'.repeat(129)
      const result = validatePasswordStrength(longPassword)
      
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Password must be less than 128 characters long')
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password123', // only lowercase + numbers
        'PASSWORD123', // only uppercase + numbers
        'password!@#', // only lowercase + special
        'PASSWORD!@#'  // only uppercase + special
      ]

      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(false)
        expect(result.message).toContain('at least 3 of')
      })
    })

    it('should reject common passwords', () => {
      const commonPasswords = [
        'password',
        'password123',
        '12345678'
      ]

      commonPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(false)
        // Some common passwords fail strength checks rather than common checks
        expect(result.message).toBeDefined()
        expect(result.valid).toBe(false)
      })
    })
  })
})