import type { LLMProvider, LLMResponse } from '@work-squared/shared'
import { llmToolSchemas } from '@work-squared/shared/llm-tools/schemas'
import { DEFAULT_MODEL } from '@work-squared/shared/llm/models'

export class RateLimitError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

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
    model: string = DEFAULT_MODEL,
    workerContext?: { systemPrompt: string; name: string; roleDescription?: string },
    options?: {
      onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
    }
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

    const maxRetries = 3
    let lastError: any = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (response.status === 429 || response.status === 503 || response.status === 529) {
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
            console.warn(
              `🔄 Rate limited (status ${response.status}). Retrying in ${delay}ms (attempt ${
                attempt + 1
              }/${maxRetries})`
            )
            options?.onRetry?.(
              attempt + 1,
              maxRetries,
              delay,
              new Error(`Rate limited: ${response.status}`)
            )
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          const errorText = await response.text()
          lastError = new RateLimitError(
            response.status,
            `LLM API rate limit: ${errorText || response.status}`
          )
          break
        }

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
        lastError = error
        if (attempt === maxRetries) {
          console.error('🔴 Error calling LLM API:', error)
          throw error
        }
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
        options?.onRetry?.(attempt + 1, maxRetries, delay, error as Error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}
