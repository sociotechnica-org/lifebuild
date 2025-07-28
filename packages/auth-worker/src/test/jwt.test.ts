import { describe, it, expect, beforeEach } from 'vitest'
import { createAccessToken, createRefreshToken, verifyToken, isTokenExpired, decodeTokenPayload } from '../utils/jwt.js'
import type { JWTPayload, RefreshTokenPayload } from '../types.js'

// Mock environment for testing
const mockEnv = {
  JWT_SECRET: 'test-secret-for-testing-only',
  USER_STORE: {} as any
}

describe('JWT utilities', () => {
  describe('token creation', () => {
    it('should create valid access tokens', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      const token = await createAccessToken(userId, email, mockEnv)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT format: header.payload.signature
    })

    it('should create valid refresh tokens', async () => {
      const userId = 'user-123'
      
      const token = await createRefreshToken(userId, mockEnv)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should create unique refresh tokens', async () => {
      const userId = 'user-123'
      
      const token1 = await createRefreshToken(userId, mockEnv)
      const token2 = await createRefreshToken(userId, mockEnv)
      
      // Refresh tokens should be different due to unique token IDs
      expect(token1).not.toBe(token2)
    })
  })

  describe('token verification', () => {
    it('should verify valid access tokens', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      const token = await createAccessToken(userId, email, mockEnv)
      const payload = await verifyToken<JWTPayload>(token, mockEnv)
      
      expect(payload).toBeDefined()
      expect(payload!.userId).toBe(userId)
      expect(payload!.email).toBe(email)
      expect(payload!.iss).toBe('work-squared-auth')
      expect(payload!.iat).toBeDefined()
      expect(payload!.exp).toBeDefined()
    })

    it('should verify valid refresh tokens', async () => {
      const userId = 'user-123'
      
      const token = await createRefreshToken(userId, mockEnv)
      const payload = await verifyToken<RefreshTokenPayload>(token, mockEnv)
      
      expect(payload).toBeDefined()
      expect(payload!.userId).toBe(userId)
      expect(payload!.tokenId).toBeDefined()
      expect(payload!.iss).toBe('work-squared-auth')
      expect(payload!.iat).toBeDefined()
      expect(payload!.exp).toBeDefined()
    })

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.signature'
      
      // Suppress console errors for this test since we expect the error
      const originalConsoleError = console.error
      console.error = () => {}
      
      const payload = await verifyToken(invalidToken, mockEnv)
      
      // Restore console.error
      console.error = originalConsoleError
      
      expect(payload).toBeNull()
    })

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'invalid-token',
        'header.payload', // missing signature
        'header.payload.signature.extra' // too many parts
      ]

      for (const token of malformedTokens) {
        const payload = await verifyToken(token, mockEnv)
        expect(payload).toBeNull()
      }
    })

    it('should reject tokens with wrong signature', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      const token = await createAccessToken(userId, email, mockEnv)
      const parts = token.split('.')
      const tamperedToken = parts[0] + '.' + parts[1] + '.tampered-signature'
      
      const payload = await verifyToken(tamperedToken, mockEnv)
      expect(payload).toBeNull()
    })
  })

  describe('token expiration', () => {
    it('should detect expired tokens', () => {
      const expiredPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
        iss: 'work-squared-auth'
      }
      
      expect(isTokenExpired(expiredPayload)).toBe(true)
    })

    it('should detect valid tokens', () => {
      const validPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
        exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
        iss: 'work-squared-auth'
      }
      
      expect(isTokenExpired(validPayload)).toBe(false)
    })

    it('should handle grace period', () => {
      const recentlyExpiredPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 60, // 1 minute ago
        iss: 'work-squared-auth'
      }
      
      // Without grace period - expired
      expect(isTokenExpired(recentlyExpiredPayload)).toBe(true)
      
      // With 5 minute grace period - still valid
      expect(isTokenExpired(recentlyExpiredPayload, 300)).toBe(false)
    })
  })

  describe('token payload decoding', () => {
    it('should decode token payload without verification', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      const token = await createAccessToken(userId, email, mockEnv)
      const payload = decodeTokenPayload<JWTPayload>(token)
      
      expect(payload).toBeDefined()
      expect(payload!.userId).toBe(userId)
      expect(payload!.email).toBe(email)
    })

    it('should return null for malformed tokens', () => {
      const malformedTokens = [
        'invalid-token',
        'header.payload',
        'header.invalid-base64.signature'
      ]

      malformedTokens.forEach(token => {
        const payload = decodeTokenPayload(token)
        expect(payload).toBeNull()
      })
    })
  })
})