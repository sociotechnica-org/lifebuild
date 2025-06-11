# Work Squared LLM Architecture

## Overview
Work Squared implements AI chat responses through a simplified event-driven architecture where the frontend handles LLM processing directly, maintaining clean separation of concerns while leveraging LiveStore's reactive system.

## Architecture

### Simplified Architecture
```
┌─────────────────────────────────┐    ┌─────────────────┐
│         Frontend                │    │  CF Worker      │
│         (React)                 │    │  (Sync Only)    │
├─────────────────────────────────┤    ├─────────────────┤
│ • Send messages                 │    │ • Relay events  │
│ • Listen for user messages      │    │ • Store events  │
│ • Call LLM APIs directly        │    │ • WebSocket hub │
│ • Emit LLM responses            │    │                 │
│ • Display chat UI              │    │                 │
└─────────────────────────────────┘    └─────────────────┘
                │                                │
                └────────────────────────────────┘
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

2. Frontend listens for own user message
   Frontend ← ChatMessageSent ← CF Worker
   
3. Frontend processes LLM call
   Frontend → LLM API → Response
   
4. Frontend emits LLM response  
   Frontend → LLMResponseReceived → CF Worker → All Clients
   
5. Frontend displays response reactively
   Frontend ← LLMResponseReceived ← CF Worker
```

## Implementation

### Cloudflare Worker (Sync Server + LLM Proxy)
```typescript
// functions/_worker.ts - Sync server with LLM proxy
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

### Frontend LLM Integration
```typescript
// src/components/ChatInterface.tsx
async function callLLMAPI(userMessage: string): Promise<string> {
  const response = await fetch('http://localhost:8787/api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage }),
  })
  
  const data = await response.json()
  return data.message || 'No response generated'
}

// Event-driven LLM processing
React.useEffect(() => {
  if (!selectedConversationId) return

  const unsubscribe = store.subscribe(getConversationMessages$(selectedConversationId), {
    onUpdate: async (messages) => {
      const userMessages = messages.filter(m => m.role === 'user')
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      
      const lastUserMessage = userMessages[userMessages.length - 1]
      if (!lastUserMessage) return
      
      // Check if we already have a response for this user message
      const hasResponse = assistantMessages.some(response => 
        response.createdAt > lastUserMessage.createdAt
      )
      
      if (!hasResponse) {
        const llmResponse = await callLLMAPI(lastUserMessage.message)
        
        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: selectedConversationId,
            message: llmResponse,
            role: 'assistant',
            modelId: 'gpt-4o',
            createdAt: new Date(),
            metadata: { source: 'braintrust' },
          })
        )
      }
    }
  })

  return unsubscribe
}, [store, selectedConversationId])
```

## Development Workflow

```bash
# Start both sync worker and frontend
pnpm dev
```

The frontend automatically handles LLM processing when users send messages. No additional services needed!

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
# For production, set these in your frontend build
VITE_BRAINTRUST_API_KEY=your-api-key
VITE_BRAINTRUST_PROJECT_ID=your-project-id
```

## Benefits of This Architecture

### ✅ Simplicity
- **CF Worker**: Pure sync server, fast and reliable
- **Frontend**: Handles both UI and LLM processing in one place
- **No separate services**: Everything runs in the browser

### ✅ Development Experience  
- Single codebase for frontend logic
- No need to coordinate multiple services
- Easy debugging - everything happens in browser dev tools

### ✅ Deployment Simplicity
- Deploy frontend to Cloudflare Pages
- Deploy sync worker to Cloudflare Workers
- No Node.js servers to manage

### ✅ Event-Driven Architecture
- LLM calls triggered by user message events
- Responses flow through the same event system
- Clean separation between UI and data flow

### ✅ Real-time Sync
- All LLM responses are synced across browser tabs
- Works with existing LiveStore architecture
- No additional complexity for multi-user scenarios

## Deployment

### Production Deployment
```bash
# Deploy sync worker
pnpm wrangler:deploy

# Build and deploy frontend to Cloudflare Pages
pnpm build
# (Then upload dist/ to Cloudflare Pages)
```

This architecture is much simpler and easier to deploy than managing separate services!