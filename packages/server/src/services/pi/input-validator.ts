interface ValidationResult {
  isValid: boolean
  sanitizedContent?: string
  reason?: string
}

interface ValidationConfig {
  maxMessageLength: number
  blockedPatterns: RegExp[]
  suspiciousPatterns: RegExp[]
}

/**
 * Lightweight, defense-in-depth validator for live user prompts sent to Pi.
 * It blocks common prompt-injection override patterns and sanitizes risky markup.
 */
export class PiInputValidator {
  private static readonly DEFAULT_CONFIG: ValidationConfig = {
    maxMessageLength: 10_000,
    blockedPatterns: [
      /ignore\s+(?:all\s+)?(?:previous\s+)?(?:system\s+)?(?:instructions?|prompts?|rules?)/i,
      /forget\s+(?:everything|all)\s+(?:above|before|previous)/i,
      /you\s+are\s+now\s+(?:a\s+)?(?:different|new|another)/i,
      /\n\s*system\s*:\s*/i,
      /<\s*system\s*>/i,
      /\[system\]/i,
      /pretend\s+(?:to\s+be|you\s+are)\s+(?:a\s+)?(?:system|admin|developer|programmer)/i,
      /act\s+as\s+(?:if\s+you\s+are\s+)?(?:a\s+)?(?:system|admin|developer)/i,
      /#\s*system\s*#/i,
      /--\s*system\s*--/i,
      /\*\*system\*\*/i,
    ],
    suspiciousPatterns: [
      /\n{5,}/g,
      /\s{20,}/g,
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,
      /<\/?(?!CHORUS_TAG\b)[A-Za-z][A-Za-z0-9:-]*(?:\s[^>]*)?>/g,
    ],
  }

  private readonly config: ValidationConfig

  constructor(customConfig?: Partial<ValidationConfig>) {
    this.config = {
      maxMessageLength:
        customConfig?.maxMessageLength ?? PiInputValidator.DEFAULT_CONFIG.maxMessageLength,
      blockedPatterns: [
        ...PiInputValidator.DEFAULT_CONFIG.blockedPatterns,
        ...(customConfig?.blockedPatterns ?? []),
      ],
      suspiciousPatterns: [
        ...PiInputValidator.DEFAULT_CONFIG.suspiciousPatterns,
        ...(customConfig?.suspiciousPatterns ?? []),
      ],
    }
  }

  validateUserMessage(content: unknown): ValidationResult {
    if (typeof content !== 'string') {
      return { isValid: false, reason: 'Content must be a string' }
    }

    if (content.length > this.config.maxMessageLength) {
      return {
        isValid: false,
        reason: `Content too long: ${content.length} exceeds limit of ${this.config.maxMessageLength}`,
      }
    }

    for (const pattern of this.config.blockedPatterns) {
      pattern.lastIndex = 0
      if (pattern.test(content)) {
        return {
          isValid: false,
          reason: `Content contains blocked pattern: ${pattern.source}`,
        }
      }
    }

    let sanitizedContent = content
    for (const pattern of this.config.suspiciousPatterns) {
      pattern.lastIndex = 0
      sanitizedContent = sanitizedContent.replace(pattern, match => {
        if (match.includes('\n')) {
          return '\n\n\n'
        }
        if (/\s/.test(match)) {
          return ' '
        }
        return ''
      })
    }

    sanitizedContent = sanitizedContent.trim()
    if (sanitizedContent.length === 0) {
      return { isValid: false, reason: 'Content is empty after sanitization' }
    }

    return {
      isValid: true,
      sanitizedContent,
    }
  }
}
