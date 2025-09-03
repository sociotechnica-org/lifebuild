import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventProcessor } from './event-processor.js'
import { createMockStoreManager } from '../test-utils/mock-store-manager.js'
import type { StoreManager } from './store-manager.js'
import type { ChatMessage } from './agentic-loop/types.js'
import { ProcessedMessageTracker } from './processed-message-tracker.js'

describe('EventProcessor - Database Initialization Failure', () => {
  let eventProcessor: EventProcessor
  let mockStoreManager: StoreManager
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let processedTrackerInitializeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Mock console.error to capture critical error messages
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    // Mock ProcessedMessageTracker to fail initialization
    processedTrackerInitializeSpy = vi
      .spyOn(ProcessedMessageTracker.prototype, 'initialize')
      .mockRejectedValue(new Error('Database connection failed'))

    mockStoreManager = createMockStoreManager()
    eventProcessor = new EventProcessor(mockStoreManager)
  })

  afterEach(async () => {
    await eventProcessor.stopAll()
    vi.restoreAllMocks()
  })

  it('should stop all message processing when database initialization fails', async () => {
    // Wait for database initialization to fail
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify database initialization was attempted and failed
    expect(processedTrackerInitializeSpy).toHaveBeenCalledOnce()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ CRITICAL: Failed to initialize processed message tracker:',
      expect.any(Error)
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ STOPPING ALL MESSAGE PROCESSING to prevent duplicate processing'
    )

    // Start monitoring a store
    const mockStore = mockStoreManager.createMockStore()
    await eventProcessor.startMonitoring('test-store', mockStore)

    // Create a chat message
    const chatMessage: ChatMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      content: 'Hello test',
      role: 'user',
      createdAt: new Date().toISOString(),
      userId: 'user-1',
    }

    // Simulate message processing - this would normally be called by the table update handler
    const eventProcessorAny = eventProcessor as any
    const storeState = eventProcessorAny.storeStates.get('test-store')

    // Clear previous console calls to focus on processChatMessage behavior
    consoleErrorSpy.mockClear()

    // Attempt to process the message
    await eventProcessorAny.processChatMessage('test-store', chatMessage, storeState)

    // Verify the message was NOT processed due to database failure
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `🚨 CRITICAL: Database not initialized - SKIPPING message ${chatMessage.id} to prevent duplicate processing`
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `🚨 Fix database initialization issue and restart server`
    )

    // Verify NO attempt was made to check if message was processed
    // (this would throw if database was not initialized)
    const processedTracker = eventProcessorAny.processedTracker
    const isProcessedSpy = vi.spyOn(processedTracker, 'isProcessed')
    const markProcessedSpy = vi.spyOn(processedTracker, 'markProcessed')

    expect(isProcessedSpy).not.toHaveBeenCalled()
    expect(markProcessedSpy).not.toHaveBeenCalled()
  })

  it('should prevent message processing from infinite loops on database failure', async () => {
    // Wait for database initialization to fail
    await new Promise(resolve => setTimeout(resolve, 100))

    // Start monitoring a store
    const mockStore = mockStoreManager.createMockStore()
    await eventProcessor.startMonitoring('test-store', mockStore)

    const eventProcessorAny = eventProcessor as any
    const storeState = eventProcessorAny.storeStates.get('test-store')

    // Create multiple messages to simulate a batch that could cause infinite processing
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'Message 1',
        role: 'user',
        createdAt: new Date().toISOString(),
        userId: 'user-1',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        content: 'Message 2',
        role: 'user',
        createdAt: new Date().toISOString(),
        userId: 'user-1',
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        content: 'Message 3',
        role: 'user',
        createdAt: new Date().toISOString(),
        userId: 'user-1',
      },
    ]

    consoleErrorSpy.mockClear()

    // Process all messages - they should all be skipped
    for (const message of messages) {
      await eventProcessorAny.processChatMessage('test-store', message, storeState)
    }

    // Verify each message was skipped with critical error
    expect(consoleErrorSpy).toHaveBeenCalledTimes(messages.length * 2) // 2 console.error calls per message

    // Verify all messages generated the correct error messages
    for (const message of messages) {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `🚨 CRITICAL: Database not initialized - SKIPPING message ${message.id} to prevent duplicate processing`
      )
    }

    // Verify the fix message is repeated (showing we're not processing)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `🚨 Fix database initialization issue and restart server`
    )
  })
})