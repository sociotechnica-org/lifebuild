import { describe, expect, it } from 'vitest'
import { events, tables } from '../../src/livestore/schema.js'
import { getConversations$, getConversation$ } from '../../src/livestore/queries.js'

describe('Conversation Events and Materialization', () => {
  it('should have conversation creation event function', () => {
    expect(events.conversationCreated).toBeDefined()
    expect(typeof events.conversationCreated).toBe('function')
  })

  it('should define conversations table', () => {
    expect(tables.conversations).toBeDefined()
  })

  it('should define getConversations query', () => {
    expect(getConversations$).toBeDefined()
    expect(getConversations$.label).toBe('getConversations')
  })

  it('should define getConversation query', () => {
    expect(getConversation$).toBeDefined()
    const testId = 'test-conversation-id'
    const query = getConversation$(testId)
    expect(query.label).toBe(`getConversation:${testId}`)
  })

  it('should create conversation event with correct schema', () => {
    const testConversation = {
      id: 'test-id',
      title: 'Test Conversation',
      createdAt: new Date(),
    }

    const event = events.conversationCreated(testConversation)

    expect(event).toBeDefined()
    expect(event.name).toBe('v1.ConversationCreated')
    expect(event.args).toEqual(testConversation)
  })
})
