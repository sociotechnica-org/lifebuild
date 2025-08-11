import type { LLMProvider, LLMResponse } from '@work-squared/shared'
import { llmToolSchemas } from '@work-squared/shared/llm-tools/schemas'

interface LLMAPIResponse {
  message: string | null
  toolCalls: Array<{
    id: string
    function: {
      name: string
      arguments: string
    }
  }> | null
}

/**
 * Braintrust LLM Provider implementation
 * This will eventually move to the server package
 */
export class BraintrustProvider implements LLMProvider {
  private proxyUrl: string

  constructor() {
    // Use relative path for production, fallback to localhost for local development
    this.proxyUrl = import.meta.env.PROD ? '/api/llm/chat' : 'http://localhost:8787/api/llm/chat'
  }

  async call(
    messages: any[],
    boardContext?: { id: string; name: string },
    model: string = 'claude-3-5-sonnet-20241022',
    workerContext?: { systemPrompt: string; name: string; roleDescription?: string }
  ): Promise<LLMResponse> {
    console.log('🔗 Calling LLM API via proxy...')
    console.log('🔗 PROD mode:', import.meta.env.PROD, 'Using URL:', this.proxyUrl)

    // Extract user message if this is the initial call
    const lastMessage = messages[messages.length - 1]
    const userMessage = lastMessage?.role === 'user' ? lastMessage.content : ''

    // Build conversation history for API
    const historyForAPI = messages.map(msg => {
      // Handle both our format and OpenAI format
      const content = (msg as any).content || (msg as any).message || ''
      return {
        role: msg.role,
        content: content,
        ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
        ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
      }
    })

    const requestBody = {
      message: userMessage,
      history: historyForAPI,
      tools: llmToolSchemas,
      model,
      ...(boardContext && { boardContext }),
      ...(workerContext && { workerContext }),
    }

    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔴 LLM API Error:', response.status, errorText)
        throw new Error(`LLM API request failed: ${response.status} ${errorText}`)
      }

      const data: LLMAPIResponse = await response.json()
      console.log('✅ LLM API Response received:', {
        hasMessage: !!data.message,
        hasToolCalls: !!data.toolCalls?.length,
        toolCallCount: data.toolCalls?.length || 0,
      })

      return {
        message: data.message,
        toolCalls:
          data.toolCalls?.map(tc => ({
            id: tc.id,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })) || null,
      }
    } catch (error) {
      console.error('🔴 Error calling LLM API:', error)
      throw error
    }
  }
}
