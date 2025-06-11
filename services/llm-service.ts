#!/usr/bin/env tsx

import { makeAdapter } from '@livestore/adapter-node'
import { makeCfSync } from '@livestore/sync-cf'
import { createStorePromise, queryDb } from '@livestore/livestore'

// Import the actual schema and events (shared with frontend)
import { schema, tables } from '../src/livestore/schema.js'
import { llmResponseReceived } from '../src/livestore/events.js'

console.log('🤖 LLM Service - Starting...')

// Get storeId from environment or use default for development
const STORE_ID = process.env.STORE_ID || 'work-squared-default'

console.log(`📡 Connecting to store: ${STORE_ID}`)

const store = await createStorePromise({
  adapter: makeAdapter({
    storage: { type: 'memory' },
    sync: {
      backend: makeCfSync({
        url: 'ws://localhost:8787',
        authToken: 'insecure-token-change-me',
      }),
    },
  }),
  schema,
  storeId: STORE_ID,
  syncPayload: { authToken: 'insecure-token-change-me' },
})

console.log('✅ Connected to LiveStore')

// Track processed messages to avoid duplicates
const processedMessages = new Set()

// LLM API credentials
const BRAINTRUST_API_KEY =
  process.env.BRAINTRUST_API_KEY || 'sk-z0wNBIkLURT2XB6Xpg201dFuFf87I3anYenpgDUDrw2hcNkz'
const BRAINTRUST_PROJECT_ID =
  process.env.BRAINTRUST_PROJECT_ID || '1266bed9-997c-4c1f-a6b4-24eb2ece48b3'

async function callBraintrustAPI(userMessage: string): Promise<string> {
  console.log('🔗 Calling Braintrust API...')

  // Build conversation context
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

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  const response = await fetch('https://api.braintrust.dev/v1/proxy/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BRAINTRUST_API_KEY}`,
      'Content-Type': 'application/json',
      'x-bt-parent': `project_id:${BRAINTRUST_PROJECT_ID}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Braintrust API call failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const responseMessage = data.choices[0]?.message?.content || 'No response generated'

  console.log(`✅ Got LLM response: ${responseMessage.substring(0, 100)}...`)

  return responseMessage
}

// Create query for user messages
const userMessagesQuery = queryDb(
  tables.chatMessages
    .select()
    .where({ role: 'user' })
    .orderBy([{ col: 'createdAt', direction: 'desc' }]),
  { label: 'userMessages' }
)

console.log('👂 Subscribing to user messages...')

// Subscribe to user messages (correct API)
store.subscribe(userMessagesQuery, {
  onUpdate: async messages => {
    console.log(`📨 Query updated: ${messages.length} total user messages`)

    // Process only new messages
    for (const message of messages) {
      if (!processedMessages.has(message.id)) {
        processedMessages.add(message.id)

        console.log(`🧠 Processing new message: "${message.message}"`)

        try {
          // Call real LLM API
          const llmResponse = await callBraintrustAPI(message.message)

          // Create LLM response event
          const responseEvent = llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: message.conversationId,
            message: llmResponse,
            role: 'assistant',
            modelId: 'gpt-4o',
            createdAt: new Date(),
            metadata: { source: 'braintrust' },
          })

          console.log(`📤 Sending LLM response...`)

          // Commit the response
          store.commit(responseEvent)

          console.log(`✅ LLM response sent for message: ${message.id}`)
        } catch (error) {
          console.error(`❌ Error processing message ${message.id}:`, error)

          // Send error response
          const errorResponse = llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: message.conversationId,
            message: 'Sorry, I encountered an error processing your message. Please try again.',
            role: 'assistant',
            modelId: 'error',
            createdAt: new Date(),
            metadata: { source: 'error' },
          })

          store.commit(errorResponse)
        }
      }
    }
  },
})

console.log('🚀 LLM Service ready!')
console.log(`💡 Processing messages for storeId: ${STORE_ID}`)
console.log('💡 Send a message in the chat to get AI responses')

// Keep alive
process.on('SIGINT', () => {
  console.log('\n👋 Stopping LLM service...')
  process.exit(0)
})
