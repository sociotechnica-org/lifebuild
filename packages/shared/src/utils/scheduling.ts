/**
 * Calculates the next execution time for a recurring task based on the current time and interval.
 * @param now Current timestamp in milliseconds
 * @param intervalHours Interval in hours
 * @returns Next execution timestamp in milliseconds
 */
export function calculateNextExecution(now: number, intervalHours: number): number {
  return now + intervalHours * 60 * 60 * 1000
}

/**
 * Formats interval hours into a human-readable string
 * @param intervalHours Interval in hours
 * @returns Formatted interval string
 */
export function formatInterval(intervalHours: number): string {
  if (intervalHours < 24) {
    return `${intervalHours} hour${intervalHours === 1 ? '' : 's'}`
  }

  const days = Math.floor(intervalHours / 24)
  const remainingHours = intervalHours % 24

  if (remainingHours === 0) {
    return `${days} day${days === 1 ? '' : 's'}`
  }

  return `${days} day${days === 1 ? '' : 's'}, ${remainingHours} hour${remainingHours === 1 ? '' : 's'}`
}

/**
 * Formats a timestamp to a relative time string (e.g., "in 2 hours", "3 minutes ago")
 * @param timestamp Target timestamp in milliseconds
 * @param now Current timestamp in milliseconds (defaults to Date.now())
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = timestamp - now
  const absDiff = Math.abs(diff)
  const isPast = diff < 0

  const minutes = Math.floor(absDiff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let timeStr: string

  if (days > 0) {
    timeStr = `${days} day${days === 1 ? '' : 's'}`
  } else if (hours > 0) {
    timeStr = `${hours} hour${hours === 1 ? '' : 's'}`
  } else if (minutes > 0) {
    timeStr = `${minutes} minute${minutes === 1 ? '' : 's'}`
  } else {
    timeStr = 'less than a minute'
  }

  return isPast ? `${timeStr} ago` : `in ${timeStr}`
}
