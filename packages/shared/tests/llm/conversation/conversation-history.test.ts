import { describe, it, expect } from 'vitest'
import { ConversationHistory } from '../../../src/llm/conversation/conversation-history.js'

describe('ConversationHistory', () => {
  it('should add and retrieve messages', () => {
    const history = new ConversationHistory()

    history.addUserMessage('Hello')
    history.addAssistantMessage('Hi there!')
    history.addSystemMessage('System notification')

    const messages = history.getMessages()
    expect(messages).toHaveLength(3)
    expect(messages[0]).toEqual({ role: 'user', content: 'Hello' })
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Hi there!' })
    expect(messages[2]).toEqual({ role: 'system', content: 'System notification' })
  })

  it('should add tool messages', () => {
    const history = new ConversationHistory()

    history.addToolMessages([
      { role: 'tool', content: 'Tool result 1', tool_call_id: 'call-1' },
      { role: 'tool', content: 'Tool result 2', tool_call_id: 'call-2' },
    ])

    const messages = history.getMessages()
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('tool')
    expect(messages[0].content).toBe('Tool result 1')
  })

  it('should convert to OpenAI format', () => {
    const history = new ConversationHistory()

    history.addUserMessage('Create a task')
    history.addAssistantMessage('Creating task...', [
      {
        id: 'call-1',
        function: { name: 'create_task', arguments: '{"title":"Test"}' },
      },
    ])
    history.addToolMessages([{ role: 'tool', content: 'Task created', tool_call_id: 'call-1' }])

    const openAIFormat = history.getOpenAIFormat()

    expect(openAIFormat).toHaveLength(3)
    expect(openAIFormat[0]).toEqual({
      role: 'user',
      content: 'Create a task',
    })
    expect(openAIFormat[1]).toEqual({
      role: 'assistant',
      content: 'Creating task...',
      tool_calls: [
        {
          id: 'call-1',
          type: 'function',
          function: { name: 'create_task', arguments: '{"title":"Test"}' },
        },
      ],
    })
    expect(openAIFormat[2]).toEqual({
      role: 'tool',
      content: 'Task created',
      tool_call_id: 'call-1',
    })
  })

  it('should get last N messages', () => {
    const history = new ConversationHistory()

    history.addUserMessage('Message 1')
    history.addAssistantMessage('Response 1')
    history.addUserMessage('Message 2')
    history.addAssistantMessage('Response 2')

    const lastTwo = history.getLastMessages(2)
    expect(lastTwo).toHaveLength(2)
    expect(lastTwo[0].content).toBe('Message 2')
    expect(lastTwo[1].content).toBe('Response 2')
  })

  it('should clear history', () => {
    const history = new ConversationHistory()

    history.addUserMessage('Hello')
    history.addAssistantMessage('Hi')
    expect(history.getMessageCount()).toBe(2)

    history.clear()
    expect(history.getMessageCount()).toBe(0)
    expect(history.getMessages()).toEqual([])
  })

  it('should clone history', () => {
    const history = new ConversationHistory()

    history.addUserMessage('Original message')
    const cloned = history.clone()

    // Modify original
    history.addAssistantMessage('New message')

    // Cloned should be unchanged
    expect(cloned.getMessageCount()).toBe(1)
    expect(history.getMessageCount()).toBe(2)
  })

  it('should handle null content in OpenAI format', () => {
    const history = new ConversationHistory()

    history.addAssistantMessage('', [
      {
        id: 'call-1',
        function: { name: 'test', arguments: '{}' },
      },
    ])

    const openAIFormat = history.getOpenAIFormat()
    expect(openAIFormat[0].content).toBeNull()
  })

  it('should initialize with existing messages', () => {
    const initialMessages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
    ]

    const history = new ConversationHistory(initialMessages)
    expect(history.getMessageCount()).toBe(2)
    expect(history.getMessages()).toEqual(initialMessages)
  })
})
