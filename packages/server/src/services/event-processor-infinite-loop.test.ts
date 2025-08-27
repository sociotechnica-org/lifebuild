import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventProcessor } from './event-processor.js'

// Mock store manager
const mockStore = {
  commit: vi.fn(),
  subscribe: vi.fn(),
}

const mockStoreManager = {
  getStore: vi.fn(() => mockStore),
  updateActivity: vi.fn(),
}

// Track subscription callbacks by table
const subscriptionCallbacks = new Map<string, (records: any[]) => void>()

describe('EventProcessor - Infinite Loop Prevention', () => {
  let eventProcessor: EventProcessor

  beforeEach(() => {
    eventProcessor = new EventProcessor(mockStoreManager as any)
    vi.clearAllMocks()
    subscriptionCallbacks.clear()

    // Mock subscribe to capture callbacks by query label
    mockStore.subscribe.mockImplementation((query, { onUpdate }) => {
      const label = query?.label || 'unknown'
      const tableName = label.includes('monitor-chatMessages') ? 'chatMessages' : 'other'
      subscriptionCallbacks.set(tableName, onUpdate)
      return () => {} // unsubscribe function
    })
  })

  afterEach(() => {
    eventProcessor.stopAll()
  })

  it('should not process the same chat message multiple times', () => {
    const storeId = 'test-store'
    const chatMessages = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        message: 'server: hello test',
        role: 'user',
        createdAt: new Date(),
      },
    ]

    // Start monitoring
    eventProcessor.startMonitoring(storeId, mockStore as any)

    // Get the chatMessages subscription callback
    const chatMessagesCallback = subscriptionCallbacks.get('chatMessages')
    expect(chatMessagesCallback).toBeDefined()

    // Simulate initial message arrival
    chatMessagesCallback!(chatMessages)

    // Verify handleUserMessage was called once
    expect(mockStore.commit).toHaveBeenCalledTimes(1)
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'v1.LLMResponseReceived',
        args: expect.objectContaining({
          conversationId: 'conv-1',
          message: 'Echo: hello test',
          role: 'assistant',
          responseToMessageId: 'msg-1',
        }),
      })
    )

    // Clear the mock to test duplicate prevention
    mockStore.commit.mockClear()

    // Simulate the same message being returned again (LiveStore re-query scenario)
    // This would happen when our assistant response triggers a subscription update
    const chatMessagesWithResponse = [
      ...chatMessages,
      {
        id: 'msg-2', // Assistant response
        conversationId: 'conv-1',
        message: 'Echo: hello test',
        role: 'assistant',
        createdAt: new Date(),
        llmMetadata: { source: 'server-test-echo' },
      },
    ]

    // Simulate subscription re-fire with full dataset (including original user message)
    chatMessagesCallback!(chatMessagesWithResponse)

    // The original user message should NOT be processed again
    expect(mockStore.commit).not.toHaveBeenCalled()
  })

  it('should process new messages but not duplicates', () => {
    const storeId = 'test-store'

    eventProcessor.startMonitoring(storeId, mockStore as any)

    const chatMessagesCallback = subscriptionCallbacks.get('chatMessages')
    expect(chatMessagesCallback).toBeDefined()

    // First message
    const firstMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      message: 'server: first message',
      role: 'user',
      createdAt: new Date(),
    }

    chatMessagesCallback!([firstMessage])
    expect(mockStore.commit).toHaveBeenCalledTimes(1)
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        args: expect.objectContaining({
          message: 'Echo: first message',
        }),
      })
    )

    mockStore.commit.mockClear()

    // Second message added to the dataset
    const secondMessage = {
      id: 'msg-2',
      conversationId: 'conv-1',
      message: 'server: second message',
      role: 'user',
      createdAt: new Date(),
    }

    // LiveStore returns full dataset including both messages
    chatMessagesCallback!([firstMessage, secondMessage])

    // Should only process the new message, not the first one again
    expect(mockStore.commit).toHaveBeenCalledTimes(1)
    expect(mockStore.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        args: expect.objectContaining({
          message: 'Echo: second message',
        }),
      })
    )
  })

  it('should not process assistant messages from server', () => {
    const storeId = 'test-store'

    eventProcessor.startMonitoring(storeId, mockStore as any)

    const chatMessagesCallback = subscriptionCallbacks.get('chatMessages')
    expect(chatMessagesCallback).toBeDefined()

    // Assistant message (should be ignored)
    const assistantMessage = {
      id: 'msg-assistant',
      conversationId: 'conv-1',
      message: 'Echo: hello test',
      role: 'assistant',
      createdAt: new Date(),
      llmMetadata: { source: 'server-test-echo' },
    }

    chatMessagesCallback!([assistantMessage])

    // Should not trigger any processing
    expect(mockStore.commit).not.toHaveBeenCalled()
  })
})
