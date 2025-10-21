import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACCESS_TOKEN_REFRESH_BUFFER_SECONDS,
  decodeAccessToken,
  getAccessTokenExpiry,
  getCurrentAccessToken,
  isAccessTokenExpiringSoon,
  storeTokens,
  clearStoredAuth,
} from './auth.js'
import { TOKEN_STORAGE_KEYS } from '@work-squared/shared/auth'

const encodeSegment = (input: object) =>
  Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const createTestToken = (payload: Record<string, unknown>) => {
  const header = { alg: 'HS256', typ: 'JWT' }
  return `${encodeSegment(header)}.${encodeSegment(payload)}.signature`
}

describe('auth utils', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    clearStoredAuth()
    vi.restoreAllMocks()
  })

  it('decodes access tokens safely', () => {
    const exp = Math.floor(Date.now() / 1000) + 300
    const token = createTestToken({ exp, userId: 'user-123' })

    const decoded = decodeAccessToken(token)

    expect(decoded).toMatchObject({ exp, userId: 'user-123' })
    expect(getAccessTokenExpiry(token)).toBe(exp * 1000)
  })

  it('detects tokens expiring within the refresh buffer', () => {
    const expSoon = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_REFRESH_BUFFER_SECONDS / 2
    const token = createTestToken({ exp: expSoon })

    expect(isAccessTokenExpiringSoon(token, ACCESS_TOKEN_REFRESH_BUFFER_SECONDS)).toBe(true)
  })

  it('refreshes the access token when expiring', async () => {
    const expiring = Math.floor(Date.now() / 1000) + 60
    const refreshed = Math.floor(Date.now() / 1000) + 60 * 10

    const currentAccessToken = createTestToken({ exp: expiring })
    const currentRefreshToken = 'refresh-123'
    const newAccessToken = createTestToken({ exp: refreshed })
    const newRefreshToken = 'refresh-456'

    storeTokens({ accessToken: currentAccessToken, refreshToken: currentRefreshToken })

    vi.stubEnv('VITE_AUTH_SERVICE_URL', 'https://auth.test')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const token = await getCurrentAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://auth.test/refresh', expect.any(Object))
    expect(token).toBe(newAccessToken)
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)).toBe(newAccessToken)
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)).toBe(newRefreshToken)
  })
})
