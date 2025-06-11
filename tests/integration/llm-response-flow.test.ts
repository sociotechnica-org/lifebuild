import { describe, expect, it, vi } from 'vitest'
import { events } from '../../src/livestore/schema.js'

// Mock fetch to avoid actual API calls
global.fetch = vi.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
  writable: true,
})

describe('LLM Response Flow Integration', () => {
  it('should create valid user message and LLM response events', () => {
    const conversationId = 'test-conversation-id'
    const userMessageId = 'user-message-id'
    const llmResponseId = 'llm-response-id'

    // 1. Create a conversation event
    const conversationEvent = events.conversationCreated({
      id: conversationId,
      title: 'Test Conversation',
      createdAt: new Date(),
    })

    expect(conversationEvent.name).toBe('v1.ConversationCreated')
    expect(conversationEvent.args.id).toBe(conversationId)

    // 2. Create a user message event
    const userMessageEvent = events.chatMessageSent({
      id: userMessageId,
      conversationId,
      message: 'What are the first tasks for a new project?',
      role: 'user',
      createdAt: new Date(),
    })

    expect(userMessageEvent.name).toBe('v1.ChatMessageSent')
    expect(userMessageEvent.args.role).toBe('user')
    expect(userMessageEvent.args.conversationId).toBe(conversationId)

    // 3. Create an LLM response event
    const llmResponseEvent = events.llmResponseReceived({
      id: llmResponseId,
      conversationId,
      message:
        'Here are the first 5 key tasks: 1. Define scope, 2. Identify stakeholders, 3. Create timeline, 4. Set up communication, 5. Establish metrics.',
      role: 'assistant',
      modelId: 'gpt-4o',
      createdAt: new Date(),
      metadata: { source: 'braintrust' },
    })

    expect(llmResponseEvent.name).toBe('v1.LLMResponseReceived')
    expect(llmResponseEvent.args.role).toBe('assistant')
    expect(llmResponseEvent.args.conversationId).toBe(conversationId)
    expect(llmResponseEvent.args.modelId).toBe('gpt-4o')
    expect(llmResponseEvent.args.metadata).toEqual({ source: 'braintrust' })
  })

  it('should create valid LLM response started event', () => {
    const conversationId = 'test-conversation-id'
    const userMessageId = 'user-message-id'

    const startedEvent = events.llmResponseStarted({
      conversationId,
      userMessageId,
      createdAt: new Date(),
    })

    expect(startedEvent.name).toBe('v1.LLMResponseStarted')
    expect(startedEvent.args.conversationId).toBe(conversationId)
    expect(startedEvent.args.userMessageId).toBe(userMessageId)
  })

  it('should validate event data structure for multi-turn conversation', () => {
    const conversationId = 'multi-exchange-conversation'

    // Create multiple message events for the same conversation
    const events_sequence = [
      events.chatMessageSent({
        id: 'user-1',
        conversationId,
        message: 'I need help planning a website project',
        role: 'user',
        createdAt: new Date(),
      }),
      events.llmResponseReceived({
        id: 'assistant-1',
        conversationId,
        message:
          "I can help you plan your website project. Let's start with defining the scope and requirements.",
        role: 'assistant',
        modelId: 'gpt-4o',
        createdAt: new Date(),
        metadata: { source: 'braintrust' },
      }),
      events.chatMessageSent({
        id: 'user-2',
        conversationId,
        message: 'What should be my first 3 tasks?',
        role: 'user',
        createdAt: new Date(),
      }),
      events.llmResponseReceived({
        id: 'assistant-2',
        conversationId,
        message:
          'Your first 3 tasks should be: 1. Define target audience, 2. Create site map, 3. Design wireframes.',
        role: 'assistant',
        modelId: 'gpt-4o',
        createdAt: new Date(),
        metadata: { source: 'braintrust' },
      }),
    ]

    expect(events_sequence).toHaveLength(4)
    expect(events_sequence.map(e => e.args.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ])
    expect(events_sequence.every(e => e.args.conversationId === conversationId)).toBe(true)
  })

  it('should handle different conversation IDs in events', () => {
    const conv1Id = 'conversation-1'
    const conv2Id = 'conversation-2'

    const conv1Events = [
      events.chatMessageSent({
        id: 'user-conv1',
        conversationId: conv1Id,
        message: 'Message in conversation 1',
        role: 'user',
        createdAt: new Date(),
      }),
      events.llmResponseReceived({
        id: 'assistant-conv1',
        conversationId: conv1Id,
        message: 'Response in conversation 1',
        role: 'assistant',
        modelId: 'gpt-4o',
        createdAt: new Date(),
        metadata: { source: 'braintrust' },
      }),
    ]

    const conv2Events = [
      events.chatMessageSent({
        id: 'user-conv2',
        conversationId: conv2Id,
        message: 'Message in conversation 2',
        role: 'user',
        createdAt: new Date(),
      }),
    ]

    expect(conv1Events.every(e => e.args.conversationId === conv1Id)).toBe(true)
    expect(conv2Events.every(e => e.args.conversationId === conv2Id)).toBe(true)
    expect(conv1Events[0]?.args.conversationId).not.toBe(conv2Events[0]?.args.conversationId)
  })
})
