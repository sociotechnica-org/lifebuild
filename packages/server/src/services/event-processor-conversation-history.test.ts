import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventProcessor } from './event-processor.js'
import type { ChatMessage, LLMMessage } from './agentic-loop/types.js'

const { createLoggerMock, loggerContainer } = vi.hoisted(() => {
  const factory = () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })

  return {
    createLoggerMock: factory,
    loggerContainer: { logger: null as ReturnType<typeof factory> | null },
  }
})

vi.mock('../utils/logger.js', () => {
  loggerContainer.logger = createLoggerMock()
  return {
    logger: loggerContainer.logger,
    storeLogger: vi.fn(() => createLoggerMock()),
    createContextLogger: vi.fn(() => createLoggerMock()),
  }
})

vi.mock('./processed-message-tracker.js', () => ({
  ProcessedMessageTracker: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isProcessed: vi.fn(),
    markProcessed: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}))

// Mock StoreManager with EventEmitter methods
const createMockStoreManager = () => ({
  on: vi.fn(),
  emit: vi.fn(),
  removeListener: vi.fn(),
  getAllStores: vi.fn(() => new Map()),
  getStore: vi.fn(),
  updateActivity: vi.fn(),
})

describe('EventProcessor conversation history builder', () => {
  let eventProcessor: EventProcessor

  beforeEach(() => {
    process.env.BRAINTRUST_API_KEY = 'test-key'
    process.env.BRAINTRUST_PROJECT_ID = 'test-project'
    eventProcessor = new EventProcessor(createMockStoreManager() as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    eventProcessor.stopAll()
    delete process.env.BRAINTRUST_API_KEY
    delete process.env.BRAINTRUST_PROJECT_ID
    vi.clearAllMocks()
  })

  it('excludes the live user message from the conversation history', () => {
    const userMessage: ChatMessage = {
      id: 'user-1',
      conversationId: 'conv-1',
      role: 'user',
      message: 'Hello there',
      createdAt: new Date('2024-01-01T00:00:10Z'),
    }

    const chatHistory: ChatMessage[] = [
      {
        id: 'system-1',
        conversationId: 'conv-1',
        role: 'system',
        message: 'You are a helpful assistant',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      },
      userMessage,
    ]

    const conversationHistory = (eventProcessor as any).buildConversationHistory(
      chatHistory,
      userMessage
    ) as LLMMessage[]

    expect(conversationHistory).toHaveLength(1)
    expect(conversationHistory[0]).toMatchObject({
      role: 'system',
      content: 'You are a helpful assistant',
    })
    expect(
      conversationHistory.some(
        (message: LLMMessage) => message.role === 'user' && message.content === userMessage.message
      )
    ).toBe(false)
    expect(loggerContainer.logger!.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        userMessageId: 'user-1',
      }),
      'Trimming current user message from conversation history before LLM call'
    )
  })

  it('keeps historical messages when the latest entry is not the live user message', () => {
    const userMessage: ChatMessage = {
      id: 'user-2',
      conversationId: 'conv-1',
      role: 'user',
      message: 'New input',
      createdAt: new Date('2024-01-01T00:01:00Z'),
    }

    const chatHistory: ChatMessage[] = [
      {
        id: 'system-1',
        conversationId: 'conv-1',
        role: 'system',
        message: 'You are a helpful assistant',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'user-previous',
        conversationId: 'conv-1',
        role: 'user',
        message: 'Previous input',
        createdAt: new Date('2024-01-01T00:00:30Z'),
      },
      {
        id: 'assistant-1',
        conversationId: 'conv-1',
        role: 'assistant',
        message: 'Assistant response',
        createdAt: new Date('2024-01-01T00:00:40Z'),
      },
    ]

    const conversationHistory = (eventProcessor as any).buildConversationHistory(
      chatHistory,
      userMessage
    ) as LLMMessage[]

    expect(conversationHistory).toHaveLength(3)
    expect(conversationHistory.map(({ role, content }: LLMMessage) => [role, content])).toEqual([
      ['system', 'You are a helpful assistant'],
      ['user', 'Previous input'],
      ['assistant', 'Assistant response'],
    ])
    expect(loggerContainer.logger!.debug).not.toHaveBeenCalled()
  })

  it('logs a warning when duplicate consecutive user messages remain', () => {
    const userMessage: ChatMessage = {
      id: 'user-latest',
      conversationId: 'conv-1',
      role: 'user',
      message: 'Latest input',
      createdAt: new Date('2024-01-01T00:02:00Z'),
    }

    const chatHistory: ChatMessage[] = [
      {
        id: 'user-1',
        conversationId: 'conv-1',
        role: 'user',
        message: 'Repeated input',
        createdAt: new Date('2024-01-01T00:00:10Z'),
      },
      {
        id: 'user-2',
        conversationId: 'conv-1',
        role: 'user',
        message: 'Repeated input',
        createdAt: new Date('2024-01-01T00:00:20Z'),
      },
    ]

    const conversationHistory = (eventProcessor as any).buildConversationHistory(
      chatHistory,
      userMessage
    ) as LLMMessage[]

    expect(conversationHistory).toHaveLength(2)
    expect(
      conversationHistory
        .filter((message: LLMMessage) => message.role === 'user')
        .map((message: LLMMessage) => message.content)
    ).toEqual(['Repeated input', 'Repeated input'])
    expect(loggerContainer.logger!.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        userMessageId: 'user-latest',
        duplicates: expect.arrayContaining([
          expect.objectContaining({ preview: 'Repeated input' }),
        ]),
      }),
      'Detected duplicate consecutive user messages in conversation history'
    )
  })
})
