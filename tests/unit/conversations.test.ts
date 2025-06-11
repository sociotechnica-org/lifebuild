import { describe, expect, it } from 'vitest'
import { events, tables } from '../../src/livestore/schema.js'
import {
  getConversations$,
  getConversation$,
  getConversationMessages$,
} from '../../src/livestore/queries.js'

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

  it('should define getConversationMessages query', () => {
    expect(getConversationMessages$).toBeDefined()
    const testId = 'test-conversation-id'
    const query = getConversationMessages$(testId)
    expect(query.label).toBe(`getConversationMessages:${testId}`)
  })
})

describe('Chat Message Events and Materialization', () => {
  it('should have chat message sent event function', () => {
    expect(events.chatMessageSent).toBeDefined()
    expect(typeof events.chatMessageSent).toBe('function')
  })

  it('should define chatMessages table', () => {
    expect(tables.chatMessages).toBeDefined()
  })

  it('should create chat message event with correct schema including conversationId', () => {
    const testMessage = {
      id: 'test-message-id',
      conversationId: 'test-conversation-id',
      message: 'Hello, LLM!',
      role: 'user' as const,
      createdAt: new Date(),
    }

    const event = events.chatMessageSent(testMessage)

    expect(event).toBeDefined()
    expect(event.name).toBe('v1.ChatMessageSent')
    expect(event.args).toEqual(testMessage)
    expect(event.args.conversationId).toBe('test-conversation-id')
  })

  it('should create LLM response event with correct schema', () => {
    const testResponse = {
      id: 'test-response-id',
      conversationId: 'test-conversation-id',
      message: 'Hello! How can I help you with your project?',
      role: 'assistant' as const,
      modelId: 'gpt-4o',
      responseToMessageId: 'test-user-message-id',
      createdAt: new Date(),
      metadata: { source: 'braintrust' },
    }

    const event = events.llmResponseReceived(testResponse)

    expect(event).toBeDefined()
    expect(event.name).toBe('v1.LLMResponseReceived')
    expect(event.args).toEqual(testResponse)
    expect(event.args.role).toBe('assistant')
  })
})
