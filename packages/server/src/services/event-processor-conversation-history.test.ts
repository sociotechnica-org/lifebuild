import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventProcessor } from './event-processor.js'
import type { Message } from '@mariozechner/pi-ai'
import type { ChatMessage } from './pi/types.js'

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

const sentryContainer = vi.hoisted(() => {
  const makeScope = () => ({
    setTag: vi.fn(),
    setContext: vi.fn(),
  })

  return {
    captureException: vi.fn(),
    withScope: vi.fn((callback: (scope: ReturnType<typeof makeScope>) => void) => {
      callback(makeScope())
    }),
  }
})

vi.mock('@sentry/node', () => ({
  captureException: sentryContainer.captureException,
  withScope: sentryContainer.withScope,
}))

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
    eventProcessor = new EventProcessor(createMockStoreManager() as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    eventProcessor.stopAll()
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
    ) as Message[]

    expect(conversationHistory).toHaveLength(0)
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
    ) as Message[]

    expect(conversationHistory).toHaveLength(2)
    expect(
      conversationHistory.map(({ role, content }: Message) => [
        role,
        role === 'assistant'
          ? content.find(part => part.type === 'text')?.text
          : typeof content === 'string'
            ? content
            : null,
      ])
    ).toEqual([
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
    ) as Message[]

    expect(conversationHistory).toHaveLength(2)
    expect(
      conversationHistory
        .filter((message: Message) => message.role === 'user')
        .map(message => (typeof message.content === 'string' ? message.content : ''))
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

  it('detects assistant error messages using stopReason and errorMessage', () => {
    const assistantErrorMessage: Message = {
      role: 'assistant',
      content: [{ type: 'text', text: 'Something failed' }],
      api: 'anthropic-messages',
      provider: 'anthropic',
      model: 'claude-opus-4-5',
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          total: 0,
        },
      },
      stopReason: 'error',
      errorMessage: 'Provider error',
      timestamp: Date.now(),
    }

    const assistantSuccessMessage: Message = {
      ...assistantErrorMessage,
      stopReason: 'stop',
      errorMessage: undefined,
    }

    expect((eventProcessor as any).isAssistantErrorMessage(assistantErrorMessage)).toBe(true)
    expect((eventProcessor as any).isAssistantErrorMessage(assistantSuccessMessage)).toBe(false)
  })

  it('reports actual Pi iterations from turn_end events', async () => {
    const commit = vi.fn()
    const store = {
      commit,
      query: vi.fn().mockReturnValue([]),
    }
    const storeManager = createMockStoreManager()
    storeManager.getStore = vi.fn(() => store as any)

    const processor = new EventProcessor(storeManager as any)
    const listeners: Array<(event: any) => void> = []
    const fakeSession = {
      agent: {
        setSystemPrompt: vi.fn(),
        state: { messages: [] },
        replaceMessages: vi.fn(),
      },
      subscribe: vi.fn((listener: (event: any) => void) => {
        listeners.push(listener)
        return vi.fn()
      }),
      setModel: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn().mockImplementation(async () => {
        for (let i = 0; i < 3; i++) {
          for (const listener of listeners) {
            listener({ type: 'turn_end', message: { role: 'assistant' }, toolResults: [] })
          }
        }
        for (const listener of listeners) {
          listener({ type: 'agent_end', messages: [] })
        }
      }),
    }

    vi.spyOn(processor as any, 'getOrCreatePiSession').mockResolvedValue({
      session: fakeSession,
      sessionDir: '/tmp/pi-session',
      lastAccessedAt: Date.now(),
    })

    const completed = await (processor as any).runAgenticLoop(
      'store-1',
      {
        id: 'message-1',
        conversationId: 'conversation-1',
        role: 'user',
        message: 'Plan this task',
        createdAt: new Date(),
      } satisfies ChatMessage,
      { stopping: false } as any
    )

    expect(completed).toBe(true)
    const completionEvents = commit.mock.calls.filter(
      ([event]: any[]) => event?.name === 'v1.LLMResponseCompleted'
    )
    expect(completionEvents.length).toBe(1)
    expect(completionEvents[0][0].args.iterations).toBe(3)

    processor.stopAll()
  })

  it('captures Pi prompt errors in Sentry with failure completion metadata', async () => {
    const commit = vi.fn()
    const store = {
      commit,
      query: vi.fn().mockReturnValue([]),
    }
    const storeManager = createMockStoreManager()
    storeManager.getStore = vi.fn(() => store as any)

    const processor = new EventProcessor(storeManager as any)
    const fakeSession = {
      agent: {
        setSystemPrompt: vi.fn(),
        state: { messages: [] },
        replaceMessages: vi.fn(),
      },
      subscribe: vi.fn(() => vi.fn()),
      setModel: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn().mockRejectedValue(new Error('Pi prompt failed')),
    }

    vi.spyOn(processor as any, 'getOrCreatePiSession').mockResolvedValue({
      session: fakeSession,
      sessionDir: '/tmp/pi-session',
      lastAccessedAt: Date.now(),
    })

    const completed = await (processor as any).runAgenticLoop(
      'store-1',
      {
        id: 'message-2',
        conversationId: 'conversation-2',
        role: 'user',
        message: 'Do the thing',
        createdAt: new Date(),
      } satisfies ChatMessage,
      { stopping: false } as any
    )

    expect(completed).toBe(true)
    expect(sentryContainer.captureException).toHaveBeenCalledTimes(1)

    const completionEvents = commit.mock.calls.filter(
      ([event]: any[]) => event?.name === 'v1.LLMResponseCompleted'
    )
    expect(completionEvents.length).toBe(1)
    expect(completionEvents[0][0].args.success).toBe(false)
    expect(completionEvents[0][0].args.iterations).toBe(0)

    processor.stopAll()
  })

  it('evicts least-recently-used Pi sessions when cache capacity is reached', () => {
    const disposeOldest = vi.fn()
    const disposeNewest = vi.fn()
    const storeState = {
      activeConversations: new Set<string>(),
      piSessions: new Map<string, any>([
        [
          'conv-old',
          { session: { dispose: disposeOldest }, sessionDir: '/tmp/old', lastAccessedAt: 100 },
        ],
        [
          'conv-new',
          { session: { dispose: disposeNewest }, sessionDir: '/tmp/new', lastAccessedAt: 200 },
        ],
      ]),
    }

    ;(eventProcessor as any).maxPiSessionsPerStore = 2
    ;(eventProcessor as any).piSessionIdleTtlMs = 0
    ;(eventProcessor as any).evictPiSessionsIfNeeded('store-1', storeState, 'conv-incoming')

    expect(disposeOldest).toHaveBeenCalledTimes(1)
    expect(disposeNewest).not.toHaveBeenCalled()
    expect(storeState.piSessions.has('conv-old')).toBe(false)
    expect(storeState.piSessions.has('conv-new')).toBe(true)
  })

  it('uses stub responses when LLM_PROVIDER=stub', async () => {
    const previousProvider = process.env.LLM_PROVIDER
    const previousStubResponse = process.env.LLM_STUB_DEFAULT_RESPONSE

    process.env.LLM_PROVIDER = 'stub'
    process.env.LLM_STUB_DEFAULT_RESPONSE = 'stub says hi'

    try {
      const commit = vi.fn()
      const stubStore = {
        commit,
        query: vi.fn(),
      }
      const storeManager = createMockStoreManager()
      storeManager.getStore = vi.fn(() => stubStore as any)

      const stubProcessor = new EventProcessor(storeManager as any)
      const completed = await (stubProcessor as any).runAgenticLoop(
        'store-1',
        {
          id: 'user-msg-1',
          conversationId: 'conv-1',
          role: 'user',
          message: 'ping',
          createdAt: new Date(),
        } satisfies ChatMessage,
        {} as any
      )

      expect(completed).toBe(true)
      expect((stubProcessor as any).piModel).toBeUndefined()
      expect(
        commit.mock.calls.some(
          ([event]: any[]) =>
            event?.name === 'v1.LLMResponseReceived' &&
            event?.args?.modelId === 'stub' &&
            event?.args?.message === 'stub says hi'
        )
      ).toBe(true)

      stubProcessor.stopAll()
    } finally {
      if (previousProvider === undefined) {
        delete process.env.LLM_PROVIDER
      } else {
        process.env.LLM_PROVIDER = previousProvider
      }

      if (previousStubResponse === undefined) {
        delete process.env.LLM_STUB_DEFAULT_RESPONSE
      } else {
        process.env.LLM_STUB_DEFAULT_RESPONSE = previousStubResponse
      }
    }
  })
})
