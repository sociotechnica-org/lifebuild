import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgenticLoop } from './agentic-loop.js'
import type { LLMProvider, LLMResponse, AgenticLoopContext } from './types.js'

// Mock store
const createMockStore = () => ({
  query: vi.fn(),
  commit: vi.fn(),
  subscribe: vi.fn(),
  getState: vi.fn(),
})

// Mock LLM provider
class MockLLMProvider implements LLMProvider {
  private responses: LLMResponse[] = []
  private currentIndex = 0

  constructor(responses: LLMResponse[]) {
    this.responses = responses
  }

  async call(): Promise<LLMResponse> {
    if (this.currentIndex >= this.responses.length) {
      throw new Error('No more mock responses')
    }
    return this.responses[this.currentIndex++]
  }

  reset() {
    this.currentIndex = 0
  }
}

describe('AgenticLoop', () => {
  let mockStore: any
  let mockProvider: MockLLMProvider
  let events: any

  beforeEach(() => {
    mockStore = createMockStore()
    events = {
      onIterationStart: vi.fn(),
      onIterationComplete: vi.fn(),
      onToolsExecuting: vi.fn(),
      onToolsComplete: vi.fn(),
      onFinalMessage: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    }
  })

  it('should handle simple message without tools', async () => {
    mockProvider = new MockLLMProvider([
      { message: 'Hello! How can I help you?', toolCalls: null },
    ])

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { model: 'test-model' }

    await loop.run('Hello', context)

    expect(events.onIterationStart).toHaveBeenCalledWith(1)
    expect(events.onIterationComplete).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ message: 'Hello! How can I help you?' })
    )
    expect(events.onFinalMessage).toHaveBeenCalledWith('Hello! How can I help you?')
    expect(events.onComplete).toHaveBeenCalledWith(1)
  })

  it('should handle tool calls and continue', async () => {
    mockProvider = new MockLLMProvider([
      {
        message: 'Let me create a task for you',
        toolCalls: [
          {
            id: 'call-1',
            function: { name: 'create_task', arguments: '{"title":"Test"}' },
          },
        ],
      },
      {
        message: 'Task created successfully!',
        toolCalls: null,
      },
    ])

    // Mock executeLLMTool
    vi.mock('../../llm-tools/index.js', () => ({
      executeLLMTool: vi.fn().mockResolvedValue({
        success: true,
        taskId: 'task-123',
        taskTitle: 'Test',
      }),
    }))

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { model: 'test-model' }

    await loop.run('Create a task', context)

    expect(events.onIterationStart).toHaveBeenCalledTimes(2)
    expect(events.onToolsExecuting).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'call-1' }),
    ])
    expect(events.onFinalMessage).toHaveBeenCalledWith('Task created successfully!')
    expect(events.onComplete).toHaveBeenCalledWith(2)
  })

  it('should handle multiple tool calls in one iteration', async () => {
    mockProvider = new MockLLMProvider([
      {
        message: 'Creating multiple items',
        toolCalls: [
          {
            id: 'call-1',
            function: { name: 'create_task', arguments: '{"title":"Task 1"}' },
          },
          {
            id: 'call-2',
            function: { name: 'create_task', arguments: '{"title":"Task 2"}' },
          },
        ],
      },
      {
        message: 'Both tasks created!',
        toolCalls: null,
      },
    ])

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { model: 'test-model' }

    await loop.run('Create two tasks', context)

    expect(events.onToolsExecuting).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'call-1' }),
        expect.objectContaining({ id: 'call-2' }),
      ])
    )
  })

  it('should handle errors gracefully', async () => {
    mockProvider = new MockLLMProvider([])
    mockProvider.call = vi.fn().mockRejectedValue(new Error('API error'))

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { model: 'test-model' }

    await expect(loop.run('Test', context)).rejects.toThrow('API error')
    expect(events.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'API error' }),
      1
    )
  })

  it('should respect max iterations', async () => {
    // Create a provider that always returns tool calls
    const responses = Array(15).fill({
      message: null,
      toolCalls: [
        {
          id: 'call-1',
          function: { name: 'test', arguments: '{}' },
        },
      ],
    })
    mockProvider = new MockLLMProvider(responses)

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { 
      model: 'test-model',
      maxIterations: 3,
    }

    await loop.run('Test', context)

    // Should only run 3 iterations
    expect(events.onIterationStart).toHaveBeenCalledTimes(3)
    expect(events.onComplete).toHaveBeenCalledWith(3)
  })

  it('should handle empty responses', async () => {
    mockProvider = new MockLLMProvider([
      { message: '', toolCalls: null },
    ])

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { model: 'test-model' }

    await loop.run('Test', context)

    // Should complete without calling onFinalMessage for empty message
    expect(events.onFinalMessage).not.toHaveBeenCalled()
    expect(events.onComplete).toHaveBeenCalledWith(1)
  })

  it('should preserve conversation history', async () => {
    mockProvider = new MockLLMProvider([
      { message: 'First response', toolCalls: null },
    ])

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { model: 'test-model' }

    await loop.run('First message', context)

    const history = loop.getHistory()
    const messages = history.getMessages()

    expect(messages).toHaveLength(2)
    expect(messages[0]).toEqual({ role: 'user', content: 'First message' })
    expect(messages[1]).toEqual({ role: 'assistant', content: 'First response' })
  })

  it('should clear history', async () => {
    mockProvider = new MockLLMProvider([
      { message: 'Response', toolCalls: null },
    ])

    const loop = new AgenticLoop(mockStore, mockProvider, events)
    const context: AgenticLoopContext = { model: 'test-model' }

    await loop.run('Message', context)
    expect(loop.getHistory().getMessageCount()).toBe(2)

    loop.clearHistory()
    expect(loop.getHistory().getMessageCount()).toBe(0)
  })
})