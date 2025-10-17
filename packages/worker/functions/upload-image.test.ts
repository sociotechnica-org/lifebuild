import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleImageUpload } from './upload-image.js'
import type { Env } from './_worker.js'

// Mock environment
const createMockEnv = (overrides?: Partial<Env>): Env =>
  ({
    IMAGES: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    } as any,
    REQUIRE_AUTH: 'false',
    ENVIRONMENT: 'development',
    JWT_SECRET: 'test-secret',
    DB: {} as any, // Required by SyncEnv
    ...overrides,
  }) as Env

// Helper to create a mock file
const createMockFile = (
  name: string,
  type: string,
  size: number,
  content: ArrayBuffer = new ArrayBuffer(size)
): File => {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

// Helper to create a mock request with FormData
const createMockRequest = (file?: File, authToken?: string): Request => {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }

  const headers: Record<string, string> = {}
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  return new Request('http://localhost/api/upload-image', {
    method: 'POST',
    body: formData,
    headers,
  })
}

describe('handleImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully upload a valid image', async () => {
    const env = createMockEnv()
    const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024) // 1MB
    const request = createMockRequest(file)

    const response = await handleImageUpload(request, env)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('url')
    expect(data).toHaveProperty('key')
    expect(data.key).toMatch(/^covers\/[a-f0-9-]+\.jpg$/)
    expect(env.IMAGES.put).toHaveBeenCalledTimes(1)
  })

  it('should reject request without file', async () => {
    const env = createMockEnv()
    const request = createMockRequest() // No file

    const response = await handleImageUpload(request, env)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No file provided')
    expect(data.code).toBe('NO_FILE')
    expect(env.IMAGES.put).not.toHaveBeenCalled()
  })

  it('should reject file that is too large', async () => {
    const env = createMockEnv()
    const file = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024) // 6MB (over 5MB limit)
    const request = createMockRequest(file)

    const response = await handleImageUpload(request, env)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('File too large')
    expect(data.code).toBe('INVALID_FILE')
    expect(env.IMAGES.put).not.toHaveBeenCalled()
  })

  it('should reject invalid file type', async () => {
    const env = createMockEnv()
    const file = createMockFile('test.pdf', 'application/pdf', 1024)
    const request = createMockRequest(file)

    const response = await handleImageUpload(request, env)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid file type')
    expect(data.code).toBe('INVALID_FILE')
    expect(env.IMAGES.put).not.toHaveBeenCalled()
  })

  it('should accept all supported image types', async () => {
    const env = createMockEnv()
    const supportedTypes = [
      { ext: 'jpg', type: 'image/jpeg' },
      { ext: 'png', type: 'image/png' },
      { ext: 'webp', type: 'image/webp' },
      { ext: 'gif', type: 'image/gif' },
    ]

    for (const { ext, type } of supportedTypes) {
      vi.clearAllMocks()
      const file = createMockFile(`test.${ext}`, type, 1024)
      const request = createMockRequest(file)

      const response = await handleImageUpload(request, env)

      expect(response.status).toBe(200)
      expect(env.IMAGES.put).toHaveBeenCalledTimes(1)
    }
  })

  it('should store file with correct metadata', async () => {
    const env = createMockEnv()
    const file = createMockFile('test.jpg', 'image/jpeg', 1024)
    const request = createMockRequest(file)

    await handleImageUpload(request, env)

    expect(env.IMAGES.put).toHaveBeenCalledWith(
      expect.stringMatching(/^covers\/[a-f0-9-]+\.jpg$/),
      expect.any(ArrayBuffer),
      expect.objectContaining({
        httpMetadata: {
          contentType: 'image/jpeg',
        },
        customMetadata: expect.objectContaining({
          originalName: 'test.jpg',
          uploadedBy: expect.any(String),
          uploadedAt: expect.any(String),
        }),
      })
    )
  })

  it('should generate unique keys for multiple uploads', async () => {
    const env = createMockEnv()
    const keys = new Set<string>()

    for (let i = 0; i < 5; i++) {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const request = createMockRequest(file)

      const response = await handleImageUpload(request, env)
      const data = await response.json()

      keys.add(data.key)
    }

    // All keys should be unique
    expect(keys.size).toBe(5)
  })

  it('should handle authentication in production mode', async () => {
    const env = createMockEnv({
      ENVIRONMENT: 'production',
      REQUIRE_AUTH: 'true',
    })
    const file = createMockFile('test.jpg', 'image/jpeg', 1024)
    const request = createMockRequest(file) // No auth token

    const response = await handleImageUpload(request, env)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Authentication required')
    expect(env.IMAGES.put).not.toHaveBeenCalled()
  })

  it('should include CORS headers in response', async () => {
    const env = createMockEnv()
    const file = createMockFile('test.jpg', 'image/jpeg', 1024)
    const request = createMockRequest(file)

    const response = await handleImageUpload(request, env)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
