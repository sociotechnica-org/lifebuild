/**
 * Shared category utilities for Life Map and Life Category features
 */

/**
 * Check if a category should show a warning for being neglected
 * A category is considered neglected if it hasn't had activity for more than 1 week (7 days)
 * @param timestamp - Last activity timestamp in milliseconds or null
 * @returns true if category hasn't been active for >7 days
 */
export function isNeglected(timestamp: number | null): boolean {
  if (!timestamp) return false
  const now = Date.now()
  const diffMs = now - timestamp
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 7
}
