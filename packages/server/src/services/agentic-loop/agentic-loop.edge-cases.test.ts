import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AgenticLoop } from './agentic-loop.js'
import { BraintrustProvider } from './braintrust-provider.js'
import type { Store } from '@livestore/livestore'
import type { LLMResponse, AgenticLoopEvents } from './types.js'

// Mock dependencies
vi.mock('./tool-executor.js')
vi.mock('./braintrust-provider.js')

describe('AgenticLoop Edge Cases', () => {
  let agenticLoop: AgenticLoop
  let mockStore: Store
  let mockLLMProvider: BraintrustProvider
  let mockEvents: AgenticLoopEvents

  beforeEach(() => {
    // Mock Store
    mockStore = {
      subscribe: vi.fn(),
      query: vi.fn(),
      commit: vi.fn(),
    } as unknown as Store

    // Mock LLMProvider
    mockLLMProvider = {
      call: vi.fn(),
    } as unknown as BraintrustProvider

    // Mock events
    mockEvents = {
      onIterationStart: vi.fn(),
      onIterationComplete: vi.fn(),
      onToolsExecuting: vi.fn(),
      onToolsComplete: vi.fn(),
      onFinalMessage: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
      onRetry: vi.fn(),
    }

    agenticLoop = new AgenticLoop(mockStore, mockLLMProvider, mockEvents)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Maximum iterations handling', () => {
    it('should respect environment variable for max iterations', async () => {
      process.env.LLM_MAX_ITERATIONS = '7'

      const customLoop = new AgenticLoop(mockStore, mockLLMProvider, mockEvents)

      // Mock infinite loop scenario
      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: '',
        toolCalls: [
          { id: 'call-1', type: 'function' as const, function: { name: 'test', arguments: '{}' } },
        ],
      })

      const mockToolExecutor = customLoop['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([])

      await customLoop.run('Test message', { model: 'gpt-4' })

      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Maximum iterations reached (7)'),
        }),
        7
      )

      delete process.env.LLM_MAX_ITERATIONS
    })

    it('should handle invalid environment variable gracefully', async () => {
      process.env.LLM_MAX_ITERATIONS = 'invalid-number'

      const customLoop = new AgenticLoop(mockStore, mockLLMProvider, mockEvents)

      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Final response',
        toolCalls: [],
      })

      await customLoop.run('Test message', { model: 'gpt-4' })

      // Should use default of 15
      expect(mockLLMProvider.call).toHaveBeenCalled()

      delete process.env.LLM_MAX_ITERATIONS
    })

    it('should handle negative max iterations', async () => {
      process.env.LLM_MAX_ITERATIONS = '-5'

      const customLoop = new AgenticLoop(mockStore, mockLLMProvider, mockEvents)

      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Final response',
        toolCalls: [],
      })

      await customLoop.run('Test message', { model: 'gpt-4' })

      // Should enforce minimum of 1
      expect(mockLLMProvider.call).toHaveBeenCalled()

      delete process.env.LLM_MAX_ITERATIONS
    })
  })

  describe('Stuck loop detection', () => {
    it('should detect identical tool calls in succession', async () => {
      const identicalToolCall = {
        id: 'call-1',
        type: 'function' as const,
        function: { name: 'test_tool', arguments: '{"param": "value"}' },
      }

      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: '',
        toolCalls: [identicalToolCall],
      })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([])

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      // Should detect stuck loop after 3 identical calls
      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Stuck loop detected: Repeating same tool calls',
        }),
        expect.any(Number)
      )
    })

    it('should not trigger stuck loop for different tool arguments', async () => {
      const toolCall1 = {
        id: 'call-1',
        type: 'function' as const,
        function: { name: 'test_tool', arguments: '{"param": "value1"}' },
      }

      const toolCall2 = {
        id: 'call-2',
        type: 'function' as const,
        function: { name: 'test_tool', arguments: '{"param": "value2"}' },
      }

      let callCount = 0
      mockLLMProvider.call = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 3) {
          return Promise.resolve({ message: '', toolCalls: [toolCall1] })
        } else if (callCount <= 6) {
          return Promise.resolve({ message: '', toolCalls: [toolCall2] })
        } else {
          return Promise.resolve({ message: 'Done', toolCalls: [] })
        }
      })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([])

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      // Should complete successfully without stuck loop detection
      expect(mockEvents.onError).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Stuck loop'),
        }),
        expect.any(Number)
      )
    })

    it('should handle rapid alternating tool calls', async () => {
      const toolCall1 = {
        id: 'call-1',
        type: 'function' as const,
        function: { name: 'tool_a', arguments: '{}' },
      }

      const toolCall2 = {
        id: 'call-2',
        type: 'function' as const,
        function: { name: 'tool_b', arguments: '{}' },
      }

      let callCount = 0
      mockLLMProvider.call = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount % 2 === 1) {
          return Promise.resolve({ message: '', toolCalls: [toolCall1] })
        } else if (callCount < 10) {
          return Promise.resolve({ message: '', toolCalls: [toolCall2] })
        } else {
          return Promise.resolve({ message: 'Final answer', toolCalls: [] })
        }
      })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([])

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      // Should complete without stuck loop (alternating is allowed)
      expect(mockEvents.onComplete).toHaveBeenCalled()
    })
  })

  describe('LLM response edge cases', () => {
    it('should handle empty LLM responses', async () => {
      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: null,
        toolCalls: null,
      })

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      expect(mockEvents.onComplete).toHaveBeenCalled()
    })

    it('should handle LLM responses with empty message but tool calls', async () => {
      mockLLMProvider.call = vi
        .fn()
        .mockResolvedValueOnce({
          message: '',
          toolCalls: [
            {
              id: 'call-1',
              type: 'function' as const,
              function: { name: 'test', arguments: '{}' },
            },
          ],
        })
        .mockResolvedValueOnce({
          message: 'Tool execution complete',
          toolCalls: [],
        })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi
        .fn()
        .mockResolvedValue([{ role: 'tool', content: 'Tool result', tool_call_id: 'call-1' }])

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      expect(mockEvents.onFinalMessage).toHaveBeenCalledWith('Tool execution complete')
    })

    it('should handle LLM responses with malformed tool calls', async () => {
      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: '',
        toolCalls: [
          null, // Invalid tool call
          { id: 'call-1' }, // Missing function
          { function: { name: 'test' } }, // Missing id
          { id: 'call-2', type: 'function', function: { name: 'valid_tool', arguments: '{}' } },
        ] as any,
      })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([])

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      // Should attempt to execute tools despite malformed ones
      expect(mockToolExecutor.executeTools).toHaveBeenCalled()
    })

    it('should handle whitespace-only messages', async () => {
      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: '   \n\t  \n   ',
        toolCalls: [],
      })

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      // Should complete successfully even with whitespace-only message
      expect(mockEvents.onComplete).toHaveBeenCalled()
    })
  })

  describe('Tool execution edge cases', () => {
    it('should handle tool execution errors gracefully', async () => {
      mockLLMProvider.call = vi
        .fn()
        .mockResolvedValueOnce({
          message: '',
          toolCalls: [
            {
              id: 'call-1',
              type: 'function' as const,
              function: { name: 'failing_tool', arguments: '{}' },
            },
          ],
        })
        .mockResolvedValueOnce({
          message: 'Handled the error',
          toolCalls: [],
        })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi
        .fn()
        .mockRejectedValueOnce(new Error('Tool execution failed'))

      await expect(agenticLoop.run('Test message', { model: 'gpt-4' })).rejects.toThrow(
        'Tool execution failed'
      )
    })

    it('should handle empty tool results', async () => {
      mockLLMProvider.call = vi
        .fn()
        .mockResolvedValueOnce({
          message: '',
          toolCalls: [
            {
              id: 'call-1',
              type: 'function' as const,
              function: { name: 'test_tool', arguments: '{}' },
            },
          ],
        })
        .mockResolvedValueOnce({
          message: 'Processed empty results',
          toolCalls: [],
        })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([])

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      expect(mockEvents.onToolsComplete).toHaveBeenCalledWith([])
      expect(mockEvents.onFinalMessage).toHaveBeenCalledWith('Processed empty results')
    })

    it('should handle very large tool results', async () => {
      const largeToolResult = {
        role: 'tool' as const,
        content: 'x'.repeat(100000), // 100KB of data
        tool_call_id: 'call-1',
      }

      mockLLMProvider.call = vi
        .fn()
        .mockResolvedValueOnce({
          message: '',
          toolCalls: [
            {
              id: 'call-1',
              type: 'function' as const,
              function: { name: 'large_data_tool', arguments: '{}' },
            },
          ],
        })
        .mockResolvedValueOnce({
          message: 'Processed large data',
          toolCalls: [],
        })

      const mockToolExecutor = agenticLoop['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([largeToolResult])

      await agenticLoop.run('Test message', { model: 'gpt-4' })

      expect(mockEvents.onToolsComplete).toHaveBeenCalledWith([largeToolResult])
    })
  })

  describe('Context handling edge cases', () => {
    it('should handle missing board context gracefully', async () => {
      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Response without board context',
        toolCalls: [],
      })

      await agenticLoop.run('Test message', {
        model: 'gpt-4',
        boardContext: undefined,
        workerContext: undefined,
      })

      expect(mockLLMProvider.call).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        'gpt-4',
        undefined,
        expect.any(Object)
      )
    })

    it('should handle malformed worker context', async () => {
      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Response with malformed context',
        toolCalls: [],
      })

      const malformedWorkerContext = {
        name: null,
        systemPrompt: undefined,
        extraField: 'should be ignored',
      } as any

      await agenticLoop.run('Test message', {
        model: 'gpt-4',
        workerContext: malformedWorkerContext,
      })

      expect(mockLLMProvider.call).toHaveBeenCalled()
    })

    it('should handle model parameter edge cases', async () => {
      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Response with edge case model',
        toolCalls: [],
      })

      // Test with empty string model
      await agenticLoop.run('Test message', { model: '' })

      expect(mockLLMProvider.call).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        '',
        undefined,
        expect.any(Object)
      )
    })
  })

  describe('Event handling edge cases', () => {
    it('should handle missing event callbacks gracefully', async () => {
      const loopWithoutEvents = new AgenticLoop(mockStore, mockLLMProvider, {})

      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Response without events',
        toolCalls: [],
      })

      await expect(loopWithoutEvents.run('Test message', { model: 'gpt-4' })).resolves.not.toThrow()
    })

    it('should handle event callback errors gracefully', async () => {
      const eventsWithErrors = {
        onIterationStart: vi.fn().mockImplementation(() => {
          throw new Error('Event callback failed')
        }),
        onFinalMessage: vi.fn(),
        onComplete: vi.fn(),
      }

      const loopWithBadEvents = new AgenticLoop(mockStore, mockLLMProvider, eventsWithErrors)

      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Final message',
        toolCalls: [],
      })

      await expect(loopWithBadEvents.run('Test message', { model: 'gpt-4' })).rejects.toThrow(
        'Event callback failed'
      )
    })

    it('should provide iteration warnings at correct thresholds', async () => {
      process.env.LLM_MAX_ITERATIONS = '10'

      const loopWithWarnings = new AgenticLoop(mockStore, mockLLMProvider, mockEvents)

      let callCount = 0
      mockLLMProvider.call = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount < 8) {
          // 80% of 10
          return Promise.resolve({
            message: '',
            toolCalls: [
              {
                id: `call-${callCount}`,
                type: 'function' as const,
                function: { name: 'test', arguments: '{}' },
              },
            ],
          })
        } else if (callCount === 8) {
          return Promise.resolve({
            message: '',
            toolCalls: [
              {
                id: `call-${callCount}`,
                type: 'function' as const,
                function: { name: 'test', arguments: '{}' },
              },
            ],
          })
        } else {
          return Promise.resolve({ message: 'Final message', toolCalls: [] })
        }
      })

      const mockToolExecutor = loopWithWarnings['toolExecutor']
      mockToolExecutor.executeTools = vi.fn().mockResolvedValue([])

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await loopWithWarnings.run('Test message', { model: 'gpt-4' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Approaching iteration limit (8/10)')
      )

      consoleSpy.mockRestore()
      delete process.env.LLM_MAX_ITERATIONS
    })
  })

  describe('Memory and resource edge cases', () => {
    it('should handle conversation history with many messages', async () => {
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i}`,
      }))

      const loopWithLargeHistory = new AgenticLoop(
        mockStore,
        mockLLMProvider,
        mockEvents,
        largeHistory
      )

      mockLLMProvider.call = vi.fn().mockResolvedValue({
        message: 'Handled large history',
        toolCalls: [],
      })

      await loopWithLargeHistory.run('New message', { model: 'gpt-4' })

      // Should pass all history messages plus the new user message and system prompt
      expect(mockLLMProvider.call).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'New message' })]),
        undefined,
        'gpt-4',
        undefined,
        expect.any(Object)
      )
    })

    it('should clear history correctly', () => {
      const initialHistory = [{ role: 'user' as const, content: 'Test message' }]

      const loopWithHistory = new AgenticLoop(
        mockStore,
        mockLLMProvider,
        mockEvents,
        initialHistory
      )

      expect(loopWithHistory.getHistory().getMessageCount()).toBe(1)

      loopWithHistory.clearHistory()

      expect(loopWithHistory.getHistory().getMessageCount()).toBe(0)
    })
  })
})
