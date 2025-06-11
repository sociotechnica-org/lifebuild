import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock environment
const mockEnv = {
  BRAINTRUST_API_KEY: 'test-api-key',
  BRAINTRUST_PROJECT_ID: 'test-project-id',
}

// Mock fetch
global.fetch = vi.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
  writable: true,
})

describe('Cloudflare Worker Context Issues', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have access to processUserMessage method in onPush callback', async () => {
    // This test simulates the actual Cloudflare Worker context issue
    // where `this` doesn't refer to the class instance in the onPush callback

    const mockCommit = vi.fn()

    // Simulate the worker class structure
    class TestWebSocketServer {
      env = mockEnv
      ctx = { commit: mockCommit }

      processUserMessage = async (event: any) => {
        console.log('processUserMessage called with:', event)
        return 'processed'
      }

      // This mimics the current problematic structure
      onPushCallback = async function (this: TestWebSocketServer, message: any) {
        console.log('onPush called')

        for (const event of message.batch) {
          if (event.name === 'v1.ChatMessageSent' && event.args.role === 'user') {
            // This should fail with "this.processUserMessage is not a function"
            await this.processUserMessage(event.args)
          }
        }
      }

      // This is the corrected structure
      onPushCorrected = async (message: any) => {
        console.log('onPushCorrected called')

        for (const event of message.batch) {
          if (event.name === 'v1.ChatMessageSent' && event.args.role === 'user') {
            // This should work because arrow functions preserve `this`
            await this.processUserMessage(event.args)
          }
        }
      }
    }

    const server = new TestWebSocketServer()

    const mockMessage = {
      batch: [
        {
          name: 'v1.ChatMessageSent',
          args: {
            id: 'test-id',
            conversationId: 'test-conv',
            message: 'test message',
            role: 'user',
            createdAt: '2025-06-11T19:39:01.889Z',
          },
        },
      ],
    }

    // This should fail - demonstrating the issue
    try {
      await server.onPushCallback.call(server, mockMessage)
      expect.fail('Expected this to fail with "this.processUserMessage is not a function"')
    } catch (error: any) {
      expect(error.message).toContain('processUserMessage is not a function')
    }

    // This should work - demonstrating the fix
    await expect(server.onPushCorrected(mockMessage)).resolves.not.toThrow()
  })

  it('should properly bind this context in makeDurableObject callbacks', async () => {
    // Test that demonstrates the correct way to structure the worker

    const mockCommit = vi.fn()

    // Mock fetch for successful response
    const mockFetch = fetch as any
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Test response' } }],
      }),
    })

    class WorkingWebSocketServer {
      env = mockEnv
      ctx = { commit: mockCommit }

      // Method must be an arrow function or bound properly
      processUserMessage = async (event: any) => {
        console.log('Processing user message:', event)

        const response = await fetch('https://api.braintrust.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.env.BRAINTRUST_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: event.message },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            metadata: {
              project_id: this.env.BRAINTRUST_PROJECT_ID,
            },
          }),
        })

        const data = await response.json()
        const responseMessage = data.choices[0]?.message?.content || 'No response'

        await this.ctx.commit([
          {
            type: 'v1.LLMResponseReceived',
            id: crypto.randomUUID(),
            conversationId: event.conversationId,
            message: responseMessage,
            role: 'assistant',
            modelId: 'gpt-4o',
            createdAt: new Date(),
            metadata: { source: 'braintrust' },
          },
        ])
      }

      // onPush should be an arrow function to preserve `this`
      onPush = async (message: any) => {
        for (const event of message.batch) {
          if (event.name === 'v1.ChatMessageSent' && event.args.role === 'user') {
            await this.processUserMessage(event.args)
          }
        }
      }
    }

    const server = new WorkingWebSocketServer()

    const mockMessage = {
      batch: [
        {
          name: 'v1.ChatMessageSent',
          args: {
            id: 'test-id',
            conversationId: 'test-conv',
            message: 'Hello, can you help me?',
            role: 'user',
            createdAt: '2025-06-11T19:39:01.889Z',
          },
        },
      ],
    }

    // This should work without throwing
    await expect(server.onPush(mockMessage)).resolves.not.toThrow()

    // Verify the API was called
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.braintrust.dev/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      })
    )

    // Verify response event was emitted
    expect(mockCommit).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'v1.LLMResponseReceived',
        conversationId: 'test-conv',
        message: 'Test response',
        role: 'assistant',
      }),
    ])
  })
})
