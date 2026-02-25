import { describe, it, expect } from 'vitest'
import { computeNextGenerateAt } from '../../src/utils/system-schedule'

describe('computeNextGenerateAt', () => {
  it('daily: adds 1 day', () => {
    const from = new Date('2026-01-01T10:00:00Z')
    const result = computeNextGenerateAt('daily', from)
    expect(result.toISOString()).toBe('2026-01-02T10:00:00.000Z')
  })

  it('weekly: adds 7 days', () => {
    const from = new Date('2026-01-01T10:00:00Z')
    const result = computeNextGenerateAt('weekly', from)
    expect(result.toISOString()).toBe('2026-01-08T10:00:00.000Z')
  })

  it('monthly: adds 1 calendar month', () => {
    const from = new Date('2026-01-15T10:00:00Z')
    const result = computeNextGenerateAt('monthly', from)
    expect(result.toISOString()).toBe('2026-02-15T10:00:00.000Z')
  })

  it('monthly: clamps to end of month (Jan 31 → Feb 28)', () => {
    const from = new Date('2026-01-31T10:00:00Z')
    const result = computeNextGenerateAt('monthly', from)
    expect(result.toISOString()).toBe('2026-02-28T10:00:00.000Z')
  })

  it('monthly: handles leap year (Jan 31 → Feb 29)', () => {
    const from = new Date('2028-01-31T10:00:00Z')
    const result = computeNextGenerateAt('monthly', from)
    expect(result.toISOString()).toBe('2028-02-29T10:00:00.000Z')
  })

  it('quarterly: adds 3 calendar months', () => {
    const from = new Date('2026-01-15T10:00:00Z')
    const result = computeNextGenerateAt('quarterly', from)
    expect(result.toISOString()).toBe('2026-04-15T10:00:00.000Z')
  })

  it('quarterly: clamps to end of month', () => {
    const from = new Date('2026-01-31T10:00:00Z')
    const result = computeNextGenerateAt('quarterly', from)
    expect(result.toISOString()).toBe('2026-04-30T10:00:00.000Z')
  })

  it('annually: adds 1 year', () => {
    const from = new Date('2026-01-15T10:00:00Z')
    const result = computeNextGenerateAt('annually', from)
    expect(result.toISOString()).toBe('2027-01-15T10:00:00.000Z')
  })

  it('annually: handles leap year (Feb 29 → Feb 28 next year)', () => {
    const from = new Date('2028-02-29T10:00:00Z')
    const result = computeNextGenerateAt('annually', from)
    expect(result.toISOString()).toBe('2029-02-28T10:00:00.000Z')
  })

  it('does not mutate the input date', () => {
    const from = new Date('2026-01-01T10:00:00Z')
    const originalTime = from.getTime()
    computeNextGenerateAt('weekly', from)
    expect(from.getTime()).toBe(originalTime)
  })
})
