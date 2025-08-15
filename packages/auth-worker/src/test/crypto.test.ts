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
    it('should accept passwords with 8+ characters', () => {
      const validPasswords = [
        'StrongPass123!',
        'MySecure@Password2024',
        'Complex#Password$456',
        'simple12', // simple password with 8 chars
        '12345678', // just numbers
        'password', // common but 8+ chars
        'UPPERCASE', // just uppercase
      ]

      validPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(true)
        expect(result.message).toBeUndefined()
      })
    })

    it('should reject short passwords', () => {
      const shortPasswords = [
        'Short1!', // 7 chars
        '1234567', // 7 chars
        'abc123', // 6 chars
      ]

      shortPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Password must be at least 8 characters long')
      })
    })
  })
})
