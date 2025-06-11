# Work Squared LLM Architecture

## Overview
Work Squared implements AI chat responses through a separated services architecture that maintains clean separation of concerns while leveraging LiveStore's event-driven system for real-time communication.

## Architecture

### Service Separation
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  CF Worker      │    │ LLM Service     │
│   (React)       │    │  (Sync Only)    │    │ (Node/Bun)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Send messages │    │ • Relay events  │    │ • Listen for    │
│ • Display chat  │    │ • Store events  │    │   user messages │
│ • UI updates    │    │ • WebSocket hub │    │ • Call LLM APIs │
└─────────────────┘    └─────────────────┘    │ • Emit responses│
         │                       │             └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   LiveStore     │
                    │  Event Stream   │
                    └─────────────────┘
```

### Event Flow
```
1. User types message
   Frontend → ChatMessageSent → CF Worker → All Clients

2. LLM Service sees user message
   LLM Service ← ChatMessageSent ← CF Worker
   
3. LLM Service processes
   LLM Service → LLM API → Response
   
4. LLM Service emits response
   LLM Service → LLMResponseReceived → CF Worker → All Clients
   
5. Frontend displays response
   Frontend ← LLMResponseReceived ← CF Worker
```

## Implementation

### Cloudflare Worker (Sync Server)
```typescript
// functions/_worker.ts - Pure sync server
export class WebSocketServer extends makeDurableObject({
  onPush: async function (message) {
    console.log('Sync server: relaying', message.batch.length, 'events')
    for (const event of message.batch) {
      console.log(`Syncing event: ${event.name} (${event.args.role || 'no role'})`)
    }
  },
  onPull: async function (message) {
    console.log('onPull', message)
  },
}) {}
```

### LLM Service (Node.js)
```typescript
// services/llm-service.ts
import { makeAdapter } from '@livestore/adapter-node'
import { createStorePromise, queryDb } from '@livestore/livestore'
import { schema, tables } from '../src/livestore/schema.js'
import { llmResponseReceived } from '../src/livestore/events.js'

const store = await createStorePromise({
  adapter: makeAdapter({ 
    storage: { type: 'memory' },
    sync: { backend: makeCfSync({ url: 'ws://localhost:8787' }) }
  }),
  schema,
  storeId: 'llm-test-shared-store',
  syncPayload: { authToken: 'insecure-token-change-me' }
})

// Subscribe to user messages
const userMessagesQuery = queryDb(
  tables.chatMessages.select().where({ role: 'user' }),
  { label: 'userMessages' }
)

store.subscribe(userMessagesQuery, {
  onUpdate: async (messages) => {
    for (const message of messages) {
      if (!processedMessages.has(message.id)) {
        processedMessages.add(message.id)
        
        // Call LLM API and emit response
        const llmResponse = await callBraintrustAPI(message.message)
        const response = llmResponseReceived({
          id: crypto.randomUUID(),
          conversationId: message.conversationId,
          message: llmResponse,
          role: 'assistant',
          modelId: 'gpt-4o',
          createdAt: new Date(),
          metadata: { source: 'braintrust' }
        })
        
        store.commit(response)
      }
    }
  }
})
```

## Development Workflow

```bash
# Terminal 1: CF Worker (sync server)
pnpm dev

# Terminal 2: LLM Service  
pnpm llm:service

# Terminal 3: Open frontend
http://localhost:5173
```

## LLM Configuration

### Provider: OpenAI via Braintrust

```typescript
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
```

### System Prompt

The LLM is configured with a system prompt that positions it as a Work Squared assistant for consultancy workflow automation, focusing on project planning, task management, and workflow guidance.

### Environment Variables

```bash
BRAINTRUST_API_KEY=your-api-key
BRAINTRUST_PROJECT_ID=your-project-id
STORE_ID=production-store-id
```

## Benefits of This Architecture

### ✅ Separation of Concerns
- **CF Worker**: Pure sync server, fast and reliable
- **LLM Service**: Dedicated to AI processing, can be scaled independently
- **Frontend**: Pure UI, no business logic

### ✅ Scalability
- LLM service can run multiple instances
- CF Worker stays lightweight and fast
- Can add more AI services (image gen, etc.) easily

### ✅ Development Experience  
- Can test LLM service independently
- CF Worker is stable and rarely changes
- Clear boundaries between services

### ✅ Error Handling
- LLM failures don't break sync
- Sync failures don't break LLM processing
- Each service can retry/recover independently

### ✅ Technology Choice
- LLM service can use Node.js (better for AI libraries)
- CF Worker optimized for WebSocket handling
- Each service uses appropriate runtime

## Next Steps

1. **Remove LLM logic from CF Worker** - clean it up to be sync-only
2. **Install Node adapter** - `pnpm add @livestore/adapter-node`  
3. **Create LLM service** - new Node.js service that subscribes to events
4. **Test event flow** - verify messages flow through both services
5. **Add proper deployment** - figure out how to deploy the LLM service

This is much cleaner than trying to make the CF Worker do everything!