interface ValidationResult {
  isValid: boolean
  sanitizedContent?: string
  reason?: string
}

interface ValidationConfig {
  maxMessageLength: number
  maxMessagesCount: number
  allowedRoles: Set<string>
  blockedPatterns: RegExp[]
  suspiciousPatterns: RegExp[]
}

export class InputValidator {
  private static readonly DEFAULT_CONFIG: ValidationConfig = {
    maxMessageLength: 10000, // 10KB per message
    maxMessagesCount: 100, // Max 100 messages in conversation
    allowedRoles: new Set(['system', 'user', 'assistant', 'tool']),
    
    // Patterns that should block the request entirely
    blockedPatterns: [
      // Attempts to break out of role
      /ignore\s+(?:all\s+)?(?:previous\s+)?(?:system\s+)?(?:instructions?|prompts?|rules?)/i,
      /forget\s+(?:everything|all)\s+(?:above|before|previous)/i,
      /you\s+are\s+now\s+(?:a\s+)?(?:different|new|another)/i,
      
      // Direct system message injection attempts
      /\n\s*system\s*:\s*/i,
      /<\s*system\s*>/i,
      /\[system\]/i,
      
      // Role manipulation
      /pretend\s+(?:to\s+be|you\s+are)\s+(?:a\s+)?(?:system|admin|developer|programmer)/i,
      /act\s+as\s+(?:if\s+you\s+are\s+)?(?:a\s+)?(?:system|admin|developer)/i,
      
      // Prompt injection markers
      /#\s*system\s*#/i,
      /--\s*system\s*--/i,
      /\*\*system\*\*/i,
    ],
    
    // Patterns that are suspicious but might be legitimate (will be sanitized)
    suspiciousPatterns: [
      // Multiple newlines that could be used for formatting attacks
      /\n{5,}/g,
      // Excessive whitespace
      /\s{20,}/g,
      // Unicode control characters
      /[\u0000-\u001F\u007F-\u009F]/g,
      // HTML/XML-like tags
      /<[^>]+>/g,
    ]
  }

  private config: ValidationConfig

  constructor(customConfig?: Partial<ValidationConfig>) {
    this.config = {
      ...InputValidator.DEFAULT_CONFIG,
      ...customConfig,
      // Merge arrays/sets properly
      allowedRoles: customConfig?.allowedRoles ?? InputValidator.DEFAULT_CONFIG.allowedRoles,
      blockedPatterns: [
        ...InputValidator.DEFAULT_CONFIG.blockedPatterns,
        ...(customConfig?.blockedPatterns ?? [])
      ],
      suspiciousPatterns: [
        ...InputValidator.DEFAULT_CONFIG.suspiciousPatterns,
        ...(customConfig?.suspiciousPatterns ?? [])
      ]
    }
  }

  /**
   * Validate and sanitize an array of messages
   */
  validateMessages(messages: any[]): ValidationResult {
    // Check message count
    if (messages.length > this.config.maxMessagesCount) {
      return {
        isValid: false,
        reason: `Too many messages: ${messages.length} exceeds limit of ${this.config.maxMessagesCount}`
      }
    }

    const sanitizedMessages: any[] = []

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      
      // Validate message structure
      if (!message || typeof message !== 'object') {
        return {
          isValid: false,
          reason: `Invalid message structure at index ${i}`
        }
      }

      // Validate role
      if (!message.role || !this.config.allowedRoles.has(message.role)) {
        return {
          isValid: false,
          reason: `Invalid or missing role at index ${i}: ${message.role}`
        }
      }

      // Validate and sanitize content
      if (message.content) {
        const contentValidation = this.validateContent(message.content)
        if (!contentValidation.isValid) {
          return {
            isValid: false,
            reason: `Invalid content at index ${i}: ${contentValidation.reason}`
          }
        }

        sanitizedMessages.push({
          ...message,
          content: contentValidation.sanitizedContent
        })
      } else {
        // Handle messages without content (e.g., tool calls)
        sanitizedMessages.push(message)
      }
    }

    return {
      isValid: true,
      sanitizedContent: JSON.stringify(sanitizedMessages)
    }
  }

  /**
   * Validate and sanitize message content
   */
  private validateContent(content: any): ValidationResult {
    // Ensure content is a string
    if (typeof content !== 'string') {
      return {
        isValid: false,
        reason: 'Content must be a string'
      }
    }

    // Check length
    if (content.length > this.config.maxMessageLength) {
      return {
        isValid: false,
        reason: `Content too long: ${content.length} exceeds limit of ${this.config.maxMessageLength}`
      }
    }

    // Check for blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          reason: `Content contains blocked pattern: ${pattern.source}`
        }
      }
    }

    // Sanitize suspicious patterns
    let sanitizedContent = content
    for (const pattern of this.config.suspiciousPatterns) {
      sanitizedContent = sanitizedContent.replace(pattern, match => {
        // For newlines, reduce to max 3
        if (match.includes('\n')) {
          return '\n\n\n'
        }
        // For excessive whitespace, reduce to single space
        if (/\s/.test(match)) {
          return ' '
        }
        // For other patterns, remove entirely
        return ''
      })
    }

    // Trim excessive whitespace
    sanitizedContent = sanitizedContent.trim()

    return {
      isValid: true,
      sanitizedContent
    }
  }

  /**
   * Validate board context
   */
  validateBoardContext(boardContext: any): ValidationResult {
    if (!boardContext) {
      return { isValid: true }
    }

    // Validate required fields
    if (!boardContext.id || !boardContext.name) {
      return {
        isValid: false,
        reason: 'Board context missing required id or name'
      }
    }

    // Validate field types and sanitize
    const sanitized = {
      id: String(boardContext.id).substring(0, 100), // Limit ID length
      name: this.sanitizeText(String(boardContext.name), 200) // Limit name length
    }

    return {
      isValid: true,
      sanitizedContent: JSON.stringify(sanitized)
    }
  }

  /**
   * Validate worker context
   */
  validateWorkerContext(workerContext: any): ValidationResult {
    if (!workerContext) {
      return { isValid: true }
    }

    const sanitized: any = {}

    // Validate and sanitize system prompt
    if (workerContext.systemPrompt) {
      const promptValidation = this.validateContent(workerContext.systemPrompt)
      if (!promptValidation.isValid) {
        return {
          isValid: false,
          reason: `Invalid worker system prompt: ${promptValidation.reason}`
        }
      }
      sanitized.systemPrompt = promptValidation.sanitizedContent
    }

    // Sanitize other fields
    if (workerContext.name) {
      sanitized.name = this.sanitizeText(String(workerContext.name), 100)
    }

    if (workerContext.roleDescription) {
      sanitized.roleDescription = this.sanitizeText(String(workerContext.roleDescription), 500)
    }

    return {
      isValid: true,
      sanitizedContent: JSON.stringify(sanitized)
    }
  }

  /**
   * Sanitize text content
   */
  private sanitizeText(text: string, maxLength: number): string {
    let sanitized = text
    
    // Remove suspicious patterns
    for (const pattern of this.config.suspiciousPatterns) {
      sanitized = sanitized.replace(pattern, match => {
        if (match.includes('\n')) return '\n'
        if (/\s/.test(match)) return ' '
        return ''
      })
    }

    // Trim and limit length
    return sanitized.trim().substring(0, maxLength)
  }

  /**
   * Create a validator with stricter settings
   */
  static createStrict(): InputValidator {
    return new InputValidator({
      maxMessageLength: 5000,
      maxMessagesCount: 50,
      blockedPatterns: [
        ...InputValidator.DEFAULT_CONFIG.blockedPatterns,
        // Additional strict patterns
        /bypass\s+(?:security|safety|restrictions)/i,
        /override\s+(?:system|safety|security)/i,
        /disable\s+(?:safety|security|filters?)/i,
      ]
    })
  }

  /**
   * Create a validator with more permissive settings for development
   */
  static createPermissive(): InputValidator {
    return new InputValidator({
      maxMessageLength: 50000,
      maxMessagesCount: 200,
      blockedPatterns: [
        // Only the most critical patterns
        /ignore\s+(?:all\s+)?(?:previous\s+)?(?:system\s+)?instructions?/i,
        /you\s+are\s+now\s+(?:a\s+)?different/i,
      ]
    })
  }
}