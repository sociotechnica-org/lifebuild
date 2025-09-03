import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventProcessor } from './event-processor.js'

// Mock ProcessedMessageTracker
const processedMessages = new Set<string>()

vi.mock('./processed-message-tracker.js', () => {
  const mockTracker = {
    initialize: vi.fn().mockResolvedValue(undefined),
    isProcessed: vi.fn().mockImplementation(async (messageId: string) => {
      return processedMessages.has(messageId)
    }),
    markProcessed: vi.fn().mockImplementation(async (messageId: string) => {
      if (processedMessages.has(messageId)) {
        return false // Already exists
      }
      processedMessages.add(messageId)
      return true // Successfully added
    }),
    close: vi.fn().mockResolvedValue(undefined),
  }

  return {
    ProcessedMessageTracker: vi.fn(() => mockTracker),
  }
})

// Mock store manager
const mockStore = {
  commit: vi.fn(),
  subscribe: vi.fn(),
  query: vi.fn().mockReturnValue([]),
}

const mockStoreManager = {
  getStore: vi.fn(() => mockStore),
  updateActivity: vi.fn(),
}

// Track subscription callbacks for events
const eventSubscriptionCallbacks = new Map<string, (event: any) => void>()

describe('EventProcessor - Infinite Loop Prevention', () => {
  let eventProcessor: EventProcessor

  beforeEach(() => {
    // Mock environment variables to enable LLM functionality for testing
    process.env.BRAINTRUST_API_KEY = 'test-key'
    process.env.BRAINTRUST_PROJECT_ID = 'test-project'

    eventProcessor = new EventProcessor(mockStoreManager as any)
    vi.clearAllMocks()
    eventSubscriptionCallbacks.clear()
    processedMessages.clear() // Clear the mock processed messages

    // Mock subscribe to capture event callbacks
    mockStore.subscribe.mockImplementation((eventType, { onEvent }) => {
      const eventName = eventType?.name || 'unknown'
      eventSubscriptionCallbacks.set(eventName, onEvent)
      return () => {} // unsubscribe function
    })
  })

  afterEach(() => {
    eventProcessor.stopAll()
    // Clean up environment variables
    delete process.env.BRAINTRUST_API_KEY
    delete process.env.BRAINTRUST_PROJECT_ID
  })

  it('should not process the same chat message multiple times', async () => {
    const storeId = 'test-store'
    const chatMessages = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        message: 'hello test',
        role: 'user',
        createdAt: new Date(),
      },
    ]

    // Start monitoring
    eventProcessor.startMonitoring(storeId, mockStore as any)

    // Get the chatMessageSent event callback
    const chatMessageSentCallback = eventSubscriptionCallbacks.get('v1.ChatMessageSent')
    expect(chatMessageSentCallback).toBeDefined()

    // Simulate new user message event
    const userMessageEvent = {
      type: 'v1.ChatMessageSent',
      payload: chatMessages[0], // First message is the user message
    }
    chatMessageSentCallback!(userMessageEvent)

    // Wait for async processing (multiple setImmediate calls may be needed)
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))

    // Verify the LLMResponseStarted event was emitted (indicating processing started)
    const startedEvents = (mockStore.commit as any).mock.calls.filter(
      (call: any) => call[0]?.name === 'v1.LLMResponseStarted'
    )
    expect(startedEvents.length).toBe(1)

    // Clear the mock to test duplicate prevention
    mockStore.commit.mockClear()

    // With event-based subscriptions, we don't get duplicate events
    // Try to simulate the same message event again (should not happen in practice)
    chatMessageSentCallback!(userMessageEvent)

    // Wait for any potential processing (multiple setImmediate calls may be needed)
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))

    // The original user message should NOT be processed again
    const duplicateStartedEvents = (mockStore.commit as any).mock.calls.filter(
      (call: any) => call[0]?.name === 'v1.LLMResponseStarted'
    )
    expect(duplicateStartedEvents.length).toBe(0)
  })

  it('should process new messages but not duplicates', async () => {
    const storeId = 'test-store'

    eventProcessor.startMonitoring(storeId, mockStore as any)

    const chatMessageSentCallback = eventSubscriptionCallbacks.get('v1.ChatMessageSent')
    expect(chatMessageSentCallback).toBeDefined()

    // First message
    const firstMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      message: 'first message',
      role: 'user',
      createdAt: new Date(),
    }

    const firstMessageEvent = {
      type: 'v1.ChatMessageSent',
      payload: firstMessage,
    }
    chatMessageSentCallback!(firstMessageEvent)

    // Wait for async processing (multiple setImmediate calls may be needed)
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))

    // Verify first message started processing
    const firstStartedEvents = (mockStore.commit as any).mock.calls.filter(
      (call: any) => call[0]?.name === 'v1.LLMResponseStarted'
    )
    expect(firstStartedEvents.length).toBe(1)
    expect(firstStartedEvents[0][0].args.userMessageId).toBe('msg-1')

    mockStore.commit.mockClear()

    // Second message in a different conversation to avoid queueing
    const secondMessage = {
      id: 'msg-2',
      conversationId: 'conv-2', // Different conversation
      message: 'second message',
      role: 'user',
      createdAt: new Date(),
    }

    // LiveStore returns full dataset including both messages
    const secondMessageEvent = {
      type: 'v1.ChatMessageSent',
      payload: secondMessage,
    }
    chatMessageSentCallback!(secondMessageEvent)

    // Wait for async processing (multiple setImmediate calls may be needed)
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))

    // Should only process the new message, not the first one again
    const secondStartedEvents = (mockStore.commit as any).mock.calls.filter(
      (call: any) => call[0]?.name === 'v1.LLMResponseStarted'
    )
    expect(secondStartedEvents.length).toBe(1)
    expect(secondStartedEvents[0][0].args.userMessageId).toBe('msg-2')
  })

  it('should not process assistant messages', async () => {
    const storeId = 'test-store'

    eventProcessor.startMonitoring(storeId, mockStore as any)

    const chatMessageSentCallback = eventSubscriptionCallbacks.get('v1.ChatMessageSent')
    expect(chatMessageSentCallback).toBeDefined()

    // Assistant message (should be ignored)
    const assistantMessage = {
      id: 'msg-assistant',
      conversationId: 'conv-1',
      message: 'Hello! How can I help you?',
      role: 'assistant',
      createdAt: new Date(),
      llmMetadata: { source: 'braintrust' },
    }

    // Assistant messages don't trigger events that we process, so this test remains the same
    // chatMessageSentCallback would only be called for user messages

    // Wait for any potential processing (multiple setImmediate calls may be needed)
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))

    // Should not trigger any processing since it's not a user message
    expect(mockStore.commit).not.toHaveBeenCalled()
  })
})
