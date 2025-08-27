export interface ValidationResult {
  isValid: boolean
  reason?: string
  sanitizedContent?: string
}

export interface SecurityConfig {
  maxMessageLength: number
  maxContextSize: number
  enableSanitization: boolean
  logSecurityViolations: boolean
}

/**
 * Input validator to prevent prompt injection attacks and validate user inputs
 * before server-side LLM processing.
 */
export class InputValidator {
  private readonly blockedPatterns = [
    // Prompt injection attempts
    /ignore\s+(?:all\s+)?(?:previous\s+)?(?:system\s+)?(?:instructions?|prompts?|rules?)/i,
    /forget\s+(?:everything|all)\s+(?:above|before|previous)/i,
    /you\s+are\s+now\s+(?:a\s+)?(?:different|new|another)/i,
    /disregard\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|prompts?)/i,
    /override\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|settings?)/i,

    // System prompt extraction attempts
    /(?:show|reveal|display|tell\s+me)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?)/i,
    /show\s+me\s+your\s+system\s+prompt/i,
    /what\s+(?:are|is)\s+your\s+(?:system\s+)?(?:prompt|instructions?)/i,
    /(?:print|output|return)\s+your\s+(?:system\s+)?(?:prompt|instructions?)/i,

    // Role manipulation attempts
    /act\s+as\s+(?:if\s+you\s+are\s+)?(?:a\s+)?(?:different|new|other|unrestricted|uncensored)/i,
    /pretend\s+(?:to\s+be|you\s+are)\s+(?:a\s+)?(?:different|new|other|unrestricted|uncensored)/i,
    /pretend\s+you\s+are\s+(?:an?\s+)?unrestricted\s+AI/i,
    /roleplay\s+as\s+(?:a\s+)?(?:different|new|other|unrestricted|uncensored)/i,

    // Information extraction attempts
    /(?:list|show|tell\s+me)\s+all\s+your\s+(?:capabilities|functions|tools)/i,
    /what\s+(?:can|are)\s+you\s+(?:do|capable\s+of)/i,

    // Jailbreak attempts
    /(?:simulate|emulate)\s+(?:a\s+|an\s+)?(?:different|unrestricted|uncensored)(?:\s+AI)?/i,
    /bypass\s+(?:all\s+)?(?:safety|security|restrictions?)/i,
    /enable\s+(?:developer|admin|debug)\s+mode/i,
  ]

  private readonly suspiciousPatterns = [
    // Multiple instructions in sequence
    /\.\s*(?:now|then|next)\s+(?:ignore|forget|disregard)/i,
    // Hidden instructions (unusual spacing/formatting)
    /\u200B|\u200C|\u200D|\uFEFF/g, // Zero-width characters
    // Excessive repetition (possible obfuscation)
    /(.{1,10})\1{10,}/,
  ]

  private config: SecurityConfig

  constructor(customConfig?: Partial<SecurityConfig>) {
    this.config = {
      maxMessageLength: 10000,
      maxContextSize: 50000,
      enableSanitization: true,
      logSecurityViolations: true,
      ...customConfig,
    }
  }

  /**
   * Validate an array of chat messages
   */
  validateMessages(messages: any[]): ValidationResult {
    if (!Array.isArray(messages)) {
      return {
        isValid: false,
        reason: 'Messages must be an array',
      }
    }

    if (messages.length === 0) {
      return {
        isValid: false,
        reason: 'Messages array cannot be empty',
      }
    }

    // Validate each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]

      if (!message || typeof message !== 'object') {
        return {
          isValid: false,
          reason: `Message at index ${i} is not a valid object`,
        }
      }

      if (!message.role || !['user', 'assistant', 'system', 'tool'].includes(message.role)) {
        return {
          isValid: false,
          reason: `Message at index ${i} has invalid role: ${message.role}`,
        }
      }

      if (!message.content || typeof message.content !== 'string') {
        return {
          isValid: false,
          reason: `Message at index ${i} has invalid content`,
        }
      }

      // Check message length
      if (message.content.length > this.config.maxMessageLength) {
        return {
          isValid: false,
          reason: `Message at index ${i} exceeds maximum length (${this.config.maxMessageLength} chars)`,
        }
      }

      // Check for malicious content
      const contentValidation = this.validateTextContent(message.content, `message[${i}].content`)
      if (!contentValidation.isValid) {
        return contentValidation
      }
    }

    // Serialize and return sanitized version if needed
    const sanitizedMessages = this.config.enableSanitization
      ? messages.map(msg => ({
          ...msg,
          content: this.sanitizeText(msg.content),
        }))
      : messages

    return {
      isValid: true,
      sanitizedContent: JSON.stringify(sanitizedMessages),
    }
  }

  /**
   * Validate board context object
   */
  validateBoardContext(context: any): ValidationResult {
    if (!context || typeof context !== 'object') {
      return {
        isValid: false,
        reason: 'Board context must be an object',
      }
    }

    const serialized = JSON.stringify(context)
    if (serialized.length > this.config.maxContextSize) {
      return {
        isValid: false,
        reason: `Board context exceeds maximum size (${this.config.maxContextSize} chars)`,
      }
    }

    // Validate text fields
    const textFields = ['name', 'description', 'notes']
    for (const field of textFields) {
      if (context[field] && typeof context[field] === 'string') {
        const fieldValidation = this.validateTextContent(context[field], `boardContext.${field}`)
        if (!fieldValidation.isValid) {
          return fieldValidation
        }
      }
    }

    return {
      isValid: true,
      sanitizedContent: this.config.enableSanitization ? this.sanitizeObject(context) : undefined,
    }
  }

  /**
   * Validate worker context object
   */
  validateWorkerContext(context: any): ValidationResult {
    if (!context || typeof context !== 'object') {
      return {
        isValid: false,
        reason: 'Worker context must be an object',
      }
    }

    const serialized = JSON.stringify(context)
    if (serialized.length > this.config.maxContextSize) {
      return {
        isValid: false,
        reason: `Worker context exceeds maximum size (${this.config.maxContextSize} chars)`,
      }
    }

    // Validate text fields
    const textFields = ['name', 'systemPrompt', 'roleDescription']
    for (const field of textFields) {
      if (context[field] && typeof context[field] === 'string') {
        const fieldValidation = this.validateTextContent(context[field], `workerContext.${field}`)
        if (!fieldValidation.isValid) {
          return fieldValidation
        }
      }
    }

    return {
      isValid: true,
      sanitizedContent: this.config.enableSanitization ? this.sanitizeObject(context) : undefined,
    }
  }

  /**
   * Validate text content for malicious patterns
   */
  private validateTextContent(content: string, fieldName: string): ValidationResult {
    if (typeof content !== 'string') {
      return {
        isValid: false,
        reason: `${fieldName} must be a string`,
      }
    }

    // Check for blocked patterns (security violations)
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(content)) {
        const violation = `Blocked malicious pattern in ${fieldName}`
        this.logSecurityViolation(violation, content, pattern)
        return {
          isValid: false,
          reason: violation,
        }
      }
    }

    // Check for suspicious patterns (warnings, but allow through with sanitization)
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        const warning = `Suspicious pattern detected in ${fieldName}`
        this.logSecurityViolation(warning, content, pattern, 'warning')
        // Continue processing but will be sanitized
      }
    }

    return { isValid: true }
  }

  /**
   * Sanitize text content by removing/replacing suspicious elements
   */
  private sanitizeText(content: string): string {
    if (!this.config.enableSanitization) {
      return content
    }

    let sanitized = content

    // Remove zero-width characters
    sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '')

    // Limit excessive character repetition
    sanitized = sanitized.replace(/(.)\1{5,}/g, '$1$1$1') // Max 3 consecutive chars

    // Remove potential hidden instructions
    sanitized = sanitized.replace(
      /\s*\.\s*(?:now|then|next)\s+(?:ignore|forget|disregard)\s+[^\n.]*/gi,
      ''
    )

    return sanitized
  }

  /**
   * Sanitize an object by sanitizing all string values
   */
  private sanitizeObject(obj: any): string {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        return this.sanitizeText(value)
      } else if (Array.isArray(value)) {
        return value.map(sanitizeValue)
      } else if (value && typeof value === 'object') {
        const sanitizedObj: any = {}
        for (const [key, val] of Object.entries(value)) {
          sanitizedObj[key] = sanitizeValue(val)
        }
        return sanitizedObj
      }
      return value
    }

    return JSON.stringify(sanitizeValue(obj))
  }

  /**
   * Log security violations
   */
  private logSecurityViolation(
    message: string,
    content: string,
    pattern: RegExp,
    level: 'error' | 'warning' = 'error'
  ): void {
    if (!this.config.logSecurityViolations) {
      return
    }

    const emoji = level === 'error' ? '🚨' : '⚠️'
    const timestamp = new Date().toISOString()

    // Log violation without exposing full content (security risk)
    const contentPreview = content.length > 30 ? content.slice(0, 30) + '...' : content
    const patternStr = pattern.source

    if (level === 'error') {
      console.error(`${emoji} [${timestamp}] SECURITY VIOLATION: ${message}`)
      console.error(`  Pattern: ${patternStr}`)
      console.error(`  Content preview: "${contentPreview}"`)
    } else {
      console.warn(`${emoji} [${timestamp}] SECURITY WARNING: ${message}`)
      console.warn(`  Pattern: ${patternStr}`)
      console.warn(`  Content preview: "${contentPreview}"`)
    }
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config }
  }
}
