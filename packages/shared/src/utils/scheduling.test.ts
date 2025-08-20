import { describe, it, expect } from 'vitest'
import { calculateNextExecution, formatInterval, formatRelativeTime } from './scheduling'

describe('scheduling utils', () => {
  describe('calculateNextExecution', () => {
    it('should calculate next execution time correctly', () => {
      const now = new Date('2023-01-01T12:00:00Z').getTime()
      const intervalHours = 4
      const expected = new Date('2023-01-01T16:00:00Z').getTime()

      expect(calculateNextExecution(now, intervalHours)).toBe(expected)
    })

    it('should handle 24 hour intervals', () => {
      const now = new Date('2023-01-01T12:00:00Z').getTime()
      const intervalHours = 24
      const expected = new Date('2023-01-02T12:00:00Z').getTime()

      expect(calculateNextExecution(now, intervalHours)).toBe(expected)
    })

    it('should handle fractional hours', () => {
      const now = new Date('2023-01-01T12:00:00Z').getTime()
      const intervalHours = 0.5
      const expected = new Date('2023-01-01T12:30:00Z').getTime()

      expect(calculateNextExecution(now, intervalHours)).toBe(expected)
    })
  })

  describe('formatInterval', () => {
    it('should format single hour correctly', () => {
      expect(formatInterval(1)).toBe('1 hour')
    })

    it('should format multiple hours correctly', () => {
      expect(formatInterval(4)).toBe('4 hours')
    })

    it('should format single day correctly', () => {
      expect(formatInterval(24)).toBe('1 day')
    })

    it('should format multiple days correctly', () => {
      expect(formatInterval(48)).toBe('2 days')
    })

    it('should format days with remaining hours', () => {
      expect(formatInterval(25)).toBe('1 day, 1 hour')
      expect(formatInterval(50)).toBe('2 days, 2 hours')
    })
  })

  describe('formatRelativeTime', () => {
    const now = new Date('2023-01-01T12:00:00Z').getTime()

    it('should format future times correctly', () => {
      const futureTime = new Date('2023-01-01T13:00:00Z').getTime()
      expect(formatRelativeTime(futureTime, now)).toBe('in 1 hour')
    })

    it('should format past times correctly', () => {
      const pastTime = new Date('2023-01-01T11:00:00Z').getTime()
      expect(formatRelativeTime(pastTime, now)).toBe('1 hour ago')
    })

    it('should format minutes correctly', () => {
      const futureTime = new Date('2023-01-01T12:30:00Z').getTime()
      expect(formatRelativeTime(futureTime, now)).toBe('in 30 minutes')
    })

    it('should format days correctly', () => {
      const futureTime = new Date('2023-01-02T12:00:00Z').getTime()
      expect(formatRelativeTime(futureTime, now)).toBe('in 1 day')
    })

    it('should handle very short times', () => {
      const almostNow = new Date('2023-01-01T12:00:30Z').getTime()
      expect(formatRelativeTime(almostNow, now)).toBe('in less than a minute')
    })

    it('should use current time by default', () => {
      const result = formatRelativeTime(Date.now() + 60000) // 1 minute in future
      expect(result).toBe('in 1 minute')
    })
  })
})
