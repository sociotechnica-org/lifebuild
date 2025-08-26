/**
 * Utilities for parsing and importing bulk contact data
 */

export interface ParsedContact {
  email: string
  name?: string
}

export interface ParseResult {
  contacts: ParsedContact[]
  errors: string[]
}

/**
 * Parse a comma-delimited list of emails into contact objects
 * Supports formats:
 * - "email@example.com"
 * - "Name <email@example.com>"
 * - Mixed comma-separated list
 */
export function parseEmailList(input: string): ParseResult {
  const contacts: ParsedContact[] = []
  const errors: string[] = []
  const seenEmails = new Set<string>()

  if (!input.trim()) {
    return { contacts, errors }
  }

  // Split by comma and process each entry
  const entries = input
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)

  for (const entry of entries) {
    const parsed = parseEmailEntry(entry)

    if (parsed.error) {
      errors.push(parsed.error)
      continue
    }

    if (!parsed.contact) {
      continue
    }

    const normalizedEmail = parsed.contact.email.toLowerCase()

    // Skip duplicates within the import
    if (seenEmails.has(normalizedEmail)) {
      errors.push(`Duplicate email in import list: ${parsed.contact.email}`)
      continue
    }

    seenEmails.add(normalizedEmail)
    contacts.push(parsed.contact)
  }

  return { contacts, errors }
}

interface ParseEntryResult {
  contact?: ParsedContact
  error?: string
}

/**
 * Parse a single email entry
 * Supports formats:
 * - "email@example.com"
 * - "Name <email@example.com>"
 * - "Name Name <email@example.com>"
 */
function parseEmailEntry(entry: string): ParseEntryResult {
  const trimmed = entry.trim()

  if (!trimmed) {
    return {}
  }

  // Check for "Name <email>" format
  const nameEmailMatch = trimmed.match(/^(.+?)\s*<(.+?)>$/)

  if (nameEmailMatch) {
    const [, name, email] = nameEmailMatch
    const cleanName = name?.trim()
    const cleanEmail = email?.trim()

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { error: `Invalid email format: ${cleanEmail || 'undefined'}` }
    }

    return {
      contact: {
        email: cleanEmail,
        name: cleanName || undefined,
      },
    }
  }

  // Assume it's just an email address
  const cleanEmail = trimmed

  if (!isValidEmail(cleanEmail)) {
    return { error: `Invalid email format: ${cleanEmail}` }
  }

  return {
    contact: {
      email: cleanEmail,
    },
  }
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
