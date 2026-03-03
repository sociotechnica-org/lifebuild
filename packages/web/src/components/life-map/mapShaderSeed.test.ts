import { describe, expect, it } from 'vitest'
import {
  createInitialMapShaderSeed,
  deriveMapShaderSeedFromStoreId,
  formatMapShaderSeed,
  getStoreIdFromSearch,
  parseMapShaderSeed,
} from './mapShaderSeed.js'

describe('mapShaderSeed', () => {
  it('derives deterministic unit seeds from store ids', () => {
    const first = deriveMapShaderSeedFromStoreId('store-alpha')
    const second = deriveMapShaderSeedFromStoreId('store-alpha')
    const third = deriveMapShaderSeedFromStoreId('store-beta')

    expect(first).toBe(second)
    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(1)
    expect(third).not.toBe(first)
  })

  it('parses and normalizes persisted seed values', () => {
    expect(parseMapShaderSeed('0.42')).toBeCloseTo(0.42, 6)
    expect(parseMapShaderSeed('1.25')).toBeCloseTo(0.25, 6)
    expect(parseMapShaderSeed('-0.25')).toBeCloseTo(0.75, 6)
    expect(parseMapShaderSeed('invalid')).toBeNull()
    expect(parseMapShaderSeed(null)).toBeNull()
  })

  it('formats seeds with stable precision', () => {
    expect(formatMapShaderSeed(0.1234567)).toBe('0.123457')
    expect(formatMapShaderSeed(1.75)).toBe('0.750000')
  })

  it('extracts store ids from URL search params', () => {
    expect(getStoreIdFromSearch('?storeId=abc-123')).toBe('abc-123')
    expect(getStoreIdFromSearch('storeId=xyz')).toBe('xyz')
    expect(getStoreIdFromSearch('?foo=bar')).toBeNull()
  })

  it('uses deterministic initialization when store id is available', () => {
    const resolved = createInitialMapShaderSeed('store-123')
    expect(resolved).toBe(deriveMapShaderSeedFromStoreId('store-123'))
  })
})
