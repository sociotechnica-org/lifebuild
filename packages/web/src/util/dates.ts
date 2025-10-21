/**
 * Shared date formatting utilities for consistent date display across the application
 */

/**
 * Format a date for display with short month, day, and year
 * @param date - Date object or string to format
 * @returns Formatted date string (e.g. "Jan 15, 2025")
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Format a date and time for display with short month, day, year, and time
 * @param date - Date object or string to format
 * @returns Formatted date string (e.g. "Jan 15, 2025, 2:30 PM")
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format a date for registration display (used in admin interfaces)
 * @param date - Date object or string to format
 * @returns Formatted date string (e.g. "Jan 15, 2025, 2:30 PM")
 */
export function formatRegistrationDate(date: Date | string): string {
  return formatDateTime(date)
}

/**
 * Format a timestamp as relative time
 * @param timestamp - Timestamp in milliseconds or null
 * @returns Human-readable relative time (e.g., "Active today", "3 days ago", "2 weeks ago")
 */
export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'No activity'

  const now = Date.now()
  const diffMs = now - timestamp
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffDays === 0) return 'Active today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks === 1) return '1 week ago'
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return '1 month ago'
  if (diffMonths < 12) return `${diffMonths} months ago`

  return 'Over a year ago'
}
