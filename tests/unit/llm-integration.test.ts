import { describe, expect, it, vi, beforeEach } from 'vitest'
import { events } from '../../src/livestore/schema.js'

// Mock the Cloudflare Worker classes
const mockCommit = vi.fn()
const mockEnv = {
  BRAINTRUST_API_KEY: 'test-api-key',
  BRAINTRUST_PROJECT_ID: 'test-project-id',
}

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
  writable: true,
})

// Mock the WebSocketServer class methods
class MockWebSocketServer {
  env = mockEnv
  ctx = { commit: mockCommit }

  private async buildConversationContext(
    conversationId: string,
    currentMessage: string
  ): Promise<Array<{ role: string; content: string }>> {
    const systemPrompt = `You are an AI assistant for Work Squared, a consultancy workflow automation system. You help consultants and project managers by:

1. **Project Planning**: Breaking down client requirements into actionable tasks
2. **Task Management**: Creating, organizing, and tracking work items in Kanban boards  
3. **Documentation**: Helping create and maintain project documents
4. **Workflow Automation**: Guiding users through consultancy processes from contract closure to iteration zero planning

You have access to tools for:
- Creating and managing Kanban tasks and boards
- Creating and editing documents
- Tracking project workflows and milestones

Maintain a professional but conversational tone. Focus on practical, actionable advice. When users describe project requirements, break them down into specific, manageable tasks.`

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: currentMessage },
    ]
  }

  private async callLLM(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.env.BRAINTRUST_API_KEY) {
      throw new Error('BRAINTRUST_API_KEY not configured')
    }

    if (!this.env.BRAINTRUST_PROJECT_ID) {
      throw new Error('BRAINTRUST_PROJECT_ID not configured')
    }

    const response = await fetch('https://api.braintrust.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.BRAINTRUST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        metadata: {
          project_id: this.env.BRAINTRUST_PROJECT_ID,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API call failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response generated'
  }

  private async emitLLMResponse(conversationId: string, responseMessage: string) {
    const responseEvent = {
      type: 'v1.LLMResponseReceived',
      id: crypto.randomUUID(),
      conversationId,
      message: responseMessage,
      role: 'assistant' as const,
      modelId: 'gpt-4o',
      createdAt: new Date(),
      metadata: { source: 'braintrust' },
    }

    console.log('Emitting LLM response event:', responseEvent)
    await this.ctx.commit([responseEvent])
  }

  async processUserMessage(event: any) {
    try {
      console.log('Processing user message:', event)

      // 1. Build conversation context
      const messages = await this.buildConversationContext(event.conversationId, event.message)

      // 2. Call LLM
      const response = await this.callLLM(messages)

      // 3. Emit response event back to LiveStore
      await this.emitLLMResponse(event.conversationId, response)
    } catch (error) {
      console.error('Error processing user message:', error)
      throw error
    }
  }
}

describe('LLM Integration', () => {
  let mockServer: MockWebSocketServer
  const mockFetch = fetch as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockServer = new MockWebSocketServer()
  })

  describe('Event Processing', () => {
    it('should process user message events', async () => {
      const userEvent = {
        id: 'test-message-id',
        conversationId: 'test-conversation-id',
        message: 'Hello, can you help me plan a project?',
        role: 'user',
        createdAt: '2025-06-11T19:32:26.941Z',
      }

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  "Hello! I'd be happy to help you plan your project. Here are the first 5 key tasks to tackle on any project: 1. Define project scope and objectives, 2. Identify stakeholders and requirements, 3. Create initial project timeline, 4. Set up communication channels, 5. Establish success metrics.",
              },
            },
          ],
        }),
      })

      await mockServer.processUserMessage(userEvent)

      // Verify API was called with correct URL and method
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

      // Verify the request body contains the expected structure
      const callArgs = mockFetch.mock.calls[0][1]
      const requestBody = JSON.parse(callArgs.body)

      expect(requestBody.model).toBe('gpt-4o')
      expect(requestBody.temperature).toBe(0.7)
      expect(requestBody.max_tokens).toBe(1000)
      expect(requestBody.metadata.project_id).toBe('test-project-id')
      expect(requestBody.messages).toHaveLength(2)
      expect(requestBody.messages[0].role).toBe('system')
      expect(requestBody.messages[0].content).toContain('You are an AI assistant for Work Squared')
      expect(requestBody.messages[1].role).toBe('user')
      expect(requestBody.messages[1].content).toBe('Hello, can you help me plan a project?')

      // Verify response event was emitted
      expect(mockCommit).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'v1.LLMResponseReceived',
          conversationId: 'test-conversation-id',
          message: expect.stringContaining('Here are the first 5 key tasks'),
          role: 'assistant',
          modelId: 'gpt-4o',
          metadata: { source: 'braintrust' },
        }),
      ])
    })

    it('should handle API errors gracefully', async () => {
      const userEvent = {
        id: 'test-message-id',
        conversationId: 'test-conversation-id',
        message: 'Test message',
        role: 'user',
        createdAt: '2025-06-11T19:32:26.941Z',
      }

      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      await expect(mockServer.processUserMessage(userEvent)).rejects.toThrow(
        'LLM API call failed: 500 Internal Server Error'
      )

      // Verify no response event was emitted
      expect(mockCommit).not.toHaveBeenCalled()
    })

    it('should handle missing environment variables', async () => {
      const serverWithoutEnv = new MockWebSocketServer()
      serverWithoutEnv.env = { BRAINTRUST_API_KEY: '', BRAINTRUST_PROJECT_ID: '' }

      const userEvent = {
        id: 'test-message-id',
        conversationId: 'test-conversation-id',
        message: 'Test message',
        role: 'user',
        createdAt: '2025-06-11T19:32:26.941Z',
      }

      await expect(serverWithoutEnv.processUserMessage(userEvent)).rejects.toThrow(
        'BRAINTRUST_API_KEY not configured'
      )
    })

    it('should handle missing project ID', async () => {
      const serverWithoutProjectId = new MockWebSocketServer()
      serverWithoutProjectId.env = { BRAINTRUST_API_KEY: 'test-key', BRAINTRUST_PROJECT_ID: '' }

      const userEvent = {
        id: 'test-message-id',
        conversationId: 'test-conversation-id',
        message: 'Test message',
        role: 'user',
        createdAt: '2025-06-11T19:32:26.941Z',
      }

      await expect(serverWithoutProjectId.processUserMessage(userEvent)).rejects.toThrow(
        'BRAINTRUST_PROJECT_ID not configured'
      )
    })
  })

  describe('Conversation Context Building', () => {
    it('should build proper conversation context', async () => {
      const userEvent = {
        id: 'test-message-id',
        conversationId: 'test-conversation-id',
        message: 'What should I do first?',
        role: 'user',
        createdAt: '2025-06-11T19:32:26.941Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Start with project scoping.' } }],
        }),
      })

      await mockServer.processUserMessage(userEvent)

      const callArgs = mockFetch.mock.calls[0][1].body
      const requestBody = JSON.parse(callArgs)

      expect(requestBody.messages).toHaveLength(2)
      expect(requestBody.messages[0].role).toBe('system')
      expect(requestBody.messages[0].content).toContain('Work Squared')
      expect(requestBody.messages[1].role).toBe('user')
      expect(requestBody.messages[1].content).toBe('What should I do first?')
    })
  })

  describe('Response Event Generation', () => {
    it('should generate properly formatted response events', async () => {
      const userEvent = {
        id: 'test-message-id',
        conversationId: 'test-conversation-id',
        message: 'Help me create a project plan',
        role: 'user',
        createdAt: '2025-06-11T19:32:26.941Z',
      }

      const mockResponse = 'Here is a comprehensive project plan...'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockResponse } }],
        }),
      })

      await mockServer.processUserMessage(userEvent)

      expect(mockCommit).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'v1.LLMResponseReceived',
          id: expect.stringMatching(/^mock-uuid-/),
          conversationId: 'test-conversation-id',
          message: mockResponse,
          role: 'assistant',
          modelId: 'gpt-4o',
          createdAt: expect.any(Date),
          metadata: { source: 'braintrust' },
        }),
      ])
    })
  })
})

describe('LLM Response Events', () => {
  it('should create LLM response received event', () => {
    const responseData = {
      id: 'response-id',
      conversationId: 'conversation-id',
      message: 'Hello! How can I help you?',
      role: 'assistant' as const,
      modelId: 'gpt-4o',
      createdAt: new Date(),
      metadata: { source: 'braintrust' },
    }

    const event = events.llmResponseReceived(responseData)

    expect(event).toBeDefined()
    expect(event.name).toBe('v1.LLMResponseReceived')
    expect(event.args).toEqual(responseData)
  })

  it('should create LLM response started event', () => {
    const startData = {
      conversationId: 'conversation-id',
      userMessageId: 'user-message-id',
      createdAt: new Date(),
    }

    const event = events.llmResponseStarted(startData)

    expect(event).toBeDefined()
    expect(event.name).toBe('v1.LLMResponseStarted')
    expect(event.args).toEqual(startData)
  })
})
