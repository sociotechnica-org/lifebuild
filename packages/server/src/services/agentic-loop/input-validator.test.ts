import { describe, it, expect } from 'vitest'
import { InputValidator } from './input-validator.js'

describe('InputValidator', () => {
  it('preserves CHORUS_TAG markup in worker system prompt', () => {
    const validator = new InputValidator()

    const result = validator.validateWorkerContext({
      name: 'Marvin',
      systemPrompt: 'Go: <CHORUS_TAG path="project:abc123">View project →</CHORUS_TAG>',
    })

    expect(result.isValid).toBe(true)
    expect(result.sanitizedContent).toBeTruthy()

    const sanitized = JSON.parse(result.sanitizedContent!)
    expect(sanitized.systemPrompt).toContain(
      '<CHORUS_TAG path="project:abc123">View project →</CHORUS_TAG>'
    )
  })

  it('preserves CHORUS_TAG markup in message content', () => {
    const validator = new InputValidator()

    const result = validator.validateMessages([
      {
        role: 'assistant',
        content: 'Go: <CHORUS_TAG path="drafting-stage1:abc123">Start planning →</CHORUS_TAG>',
      },
    ])

    expect(result.isValid).toBe(true)
    expect(result.sanitizedContent).toBeTruthy()

    const sanitizedMessages = JSON.parse(result.sanitizedContent!)
    expect(sanitizedMessages[0].content).toContain(
      '<CHORUS_TAG path="drafting-stage1:abc123">Start planning →</CHORUS_TAG>'
    )
  })

  it('strips non-CHORUS_TAG html-like tags', () => {
    const validator = new InputValidator()

    const result = validator.validateMessages([
      {
        role: 'user',
        content: 'Hello <b>world</b> <script>alert(1)</script>',
      },
    ])

    expect(result.isValid).toBe(true)
    const sanitizedMessages = JSON.parse(result.sanitizedContent!)
    expect(sanitizedMessages[0].content).toBe('Hello world alert(1)')
  })
})
