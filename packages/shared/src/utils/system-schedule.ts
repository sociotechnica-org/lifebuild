import type { SystemCadence } from '../livestore/schema'

/**
 * Computes the next generation date for a system task template based on cadence.
 * Uses UTC methods to avoid DST-related time shifts.
 *
 * Cadence → interval mapping:
 * - daily → +1 day
 * - weekly → +7 days
 * - monthly → +1 calendar month (same day, clamped to month end)
 * - quarterly → +3 calendar months
 * - annually → +1 year
 */
export function computeNextGenerateAt(cadence: SystemCadence, from: Date): Date {
  const result = new Date(from.getTime())

  switch (cadence) {
    case 'daily':
      result.setUTCDate(result.getUTCDate() + 1)
      break
    case 'weekly':
      result.setUTCDate(result.getUTCDate() + 7)
      break
    case 'monthly':
      addMonthsUTC(result, 1)
      break
    case 'quarterly':
      addMonthsUTC(result, 3)
      break
    case 'annually':
      addMonthsUTC(result, 12)
      break
  }

  return result
}

/**
 * Adds months to a date using UTC methods, clamping to the last day of the
 * target month when the source day exceeds the target month's days.
 *
 * Example: Jan 31 + 1 month = Feb 28 (or 29 in leap year)
 */
function addMonthsUTC(date: Date, months: number): void {
  const targetMonth = date.getUTCMonth() + months
  const day = date.getUTCDate()

  // Set to day 1 of target month first to avoid overflow
  date.setUTCDate(1)
  date.setUTCMonth(targetMonth)

  // Clamp day to last day of target month
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
}
