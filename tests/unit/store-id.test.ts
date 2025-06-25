import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStoreId } from '../../src/util/store-id.js'

describe('getStoreId', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns existing storeId from query string', () => {
    const originalHref = window.location.href
    // Simulate being on a non-root path with storeId
    window.history.replaceState({}, '', '/projects?storeId=abc123')
    const id = getStoreId()
    expect(id).toBe('abc123')
    window.history.replaceState({}, '', originalHref)
  })

  it('returns sessionId from URL when on /session/[id] path', () => {
    const originalHref = window.location.href
    window.history.replaceState({}, '', '/session/test-session-123')
    const id = getStoreId()
    expect(id).toBe('test-session-123')
    window.history.replaceState({}, '', originalHref)
  })

  it('returns session ID from localStorage when at root path', () => {
    const originalHref = window.location.href
    window.history.replaceState({}, '', '/')

    // Mock localStorage to return a session ID
    localStorage.setItem('sessionId', 'existing-session-456')

    const id = getStoreId()
    expect(id).toBe('existing-session-456')
    window.history.replaceState({}, '', originalHref)
  })

  it('generates new session ID when at root path with no localStorage', () => {
    const originalHref = window.location.href
    window.history.replaceState({}, '', '/')

    const id = getStoreId()
    expect(id).toBeTruthy()
    expect(localStorage.getItem('sessionId')).toBe(id)
    window.history.replaceState({}, '', originalHref)
  })

  it('generates new id when none present on non-root path', () => {
    const originalWindow: any = globalThis.window
    const mockWindow: any = {
      location: {
        search: '',
        pathname: '/projects',
      },
    }
    globalThis.window = mockWindow
    const id = getStoreId()
    expect(mockWindow.location.search).toBe(`storeId=${id}`)
    globalThis.window = originalWindow
  })

  it('returns "unused" when window is undefined', () => {
    const globalAny: any = globalThis
    const originalWindow = globalAny.window
    delete globalAny.window
    const id = getStoreId()
    expect(id).toBe('unused')
    globalAny.window = originalWindow
  })
})
