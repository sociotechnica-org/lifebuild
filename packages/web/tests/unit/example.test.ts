// Vitest provides describe, it, expect globally when globals: true is set in config

// Example unit test for LiveStore event
describe('LiveStore Events', () => {
  it('should create a chat message event', () => {
    const event = {
      type: 'chat.message',
      id: '123',
      role: 'user',
      content: 'Hello, world!',
      timestamp: Date.now(),
    }

    expect(event).toHaveProperty('type', 'chat.message')
    expect(event).toHaveProperty('id')
    expect(event).toHaveProperty('content')
  })

  it('should validate event structure', () => {
    const createChatEvent = (content: string) => ({
      type: 'chat.message' as const,
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    })

    const event = createChatEvent('Test message')

    expect(event.type).toBe('chat.message')
    expect(event.content).toBe('Test message')
    expect(event.timestamp).toBeLessThanOrEqual(Date.now())
  })
})
