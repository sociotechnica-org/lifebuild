/**
 * Helper function to safely generate initials from a name
 * Handles edge cases like extra spaces, empty names, etc.
 */
export const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/) // Split on one or more whitespace characters
    .filter(part => part.length > 0) // Filter out empty parts
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) // Limit to 2 characters max
  
  // Fallback for empty names
  return initials || '?'
}