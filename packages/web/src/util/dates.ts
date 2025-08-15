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
