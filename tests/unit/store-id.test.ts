import { describe, it, expect } from 'vitest'
import { getStoreId } from '../../src/util/store-id.js'

describe('getStoreId', () => {
  it('returns existing storeId from query string', () => {
    const originalHref = window.location.href
    window.history.replaceState({}, '', '?storeId=abc123')
    const id = getStoreId()
    expect(id).toBe('abc123')
    window.history.replaceState({}, '', originalHref)
  })

  it('generates new id when none present', () => {
    const originalWindow: any = globalThis.window
    const mockWindow: any = { location: { search: '' } }
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
