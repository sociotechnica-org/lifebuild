# Agentic Loop Refactoring

## Overview

This document describes the refactoring of the `runAgenticLoop` function from the ChatInterface component into a modular, testable, and server-ready architecture.

## Problem Statement

The original `runAgenticLoop` function in ChatInterface.tsx was:
- **Monolithic**: ~300 lines of deeply nested code
- **Untestable**: Business logic mixed with UI concerns
- **Unmaintainable**: Tool result formatting scattered throughout
- **Not server-ready**: Tightly coupled to React component

## Solution Architecture

### 1. Tool Result Formatters (`packages/shared/src/llm/tool-formatters/`)

**Purpose**: Centralize and standardize how tool results are formatted for AI consumption.

**Structure**:
- `TaskToolFormatter`: Formats task-related tool results
- `DocumentToolFormatter`: Formats document-related tool results  
- `ProjectToolFormatter`: Formats project-related tool results
- `ToolResultFormatterService`: Composite formatter that delegates to appropriate formatter

**Benefits**:
- Consistent formatting across all tools
- Easy to add new tools
- Testable in isolation
- Shared between client and server

### 2. Tool Executor (`packages/shared/src/llm/tool-executor/`)

**Purpose**: Abstract tool execution logic with proper error handling and event callbacks.

**Features**:
- Sequential and parallel execution modes
- Event callbacks for monitoring progress
- Automatic result formatting
- Error handling and recovery

### 3. Conversation History (`packages/shared/src/llm/conversation/`)

**Purpose**: Manage conversation history with proper OpenAI API formatting.

**Features**:
- Type-safe message management
- OpenAI format conversion
- History manipulation (clear, clone, get last N)
- Supports all message types (user, assistant, tool, system)

### 4. Agentic Loop Core (`packages/shared/src/llm/agentic-loop/`)

**Purpose**: Orchestrate the iterative LLM conversation flow.

**Features**:
- Event-driven architecture
- Maximum iteration control
- Provider-agnostic (works with any LLM)
- Ready for server migration

### 5. LLM Provider Abstraction (`packages/web/src/utils/llm/`)

**Purpose**: Abstract LLM API calls behind a provider interface.

**Implementation**:
- `BraintrustProvider`: Current implementation using proxy
- `LLMProvider` interface: Allows swapping providers
- Ready to move to server with minimal changes

### 6. Chat Handler (`packages/web/src/utils/llm/chat-handler.ts`)

**Purpose**: Bridge between UI and agentic loop.

**Features**:
- Handles UI event storage
- Manages conversation state
- Provides clean API for components

## Migration Path to Server

When moving to server (per Milestone 4):

1. **Move to Server Package**:
   - `BraintrustProvider` → Server (with real API keys)
   - `ChatHandler` → Server (modified for WebSocket events)
   - Agentic loop runs server-side

2. **Client Changes**:
   - Replace direct `ChatHandler` calls with WebSocket messages
   - Subscribe to server events for updates
   - UI becomes purely reactive

3. **Shared Code** (already in shared package):
   - Tool formatters
   - Tool executor
   - Conversation history
   - Agentic loop core

## Testing Strategy

### Unit Tests
- **Tool Formatters**: Test each formatter independently
- **Conversation History**: Test message management
- **Agentic Loop**: Test flow control with mock providers

### Integration Tests
- **Tool Executor**: Test with mock store
- **Chat Handler**: Test event emission

### E2E Tests
- Full flow from UI to tool execution

## Benefits Achieved

1. **Reduced Complexity**: ChatInterface reduced from ~500 to ~100 lines
2. **Testability**: 100% of business logic is testable
3. **Maintainability**: Clear separation of concerns
4. **Reusability**: Code shared between client and server
5. **Server-Ready**: Minimal changes needed for server migration
6. **Type Safety**: Full TypeScript coverage
7. **Extensibility**: Easy to add new tools and formatters

## File Structure

```
packages/shared/src/llm/
├── tool-formatters/
│   ├── types.ts
│   ├── task-formatter.ts
│   ├── document-formatter.ts
│   ├── project-formatter.ts
│   ├── formatter-service.ts
│   └── formatters.test.ts
├── tool-executor/
│   └── tool-executor.ts
├── conversation/
│   ├── conversation-history.ts
│   └── conversation-history.test.ts
├── agentic-loop/
│   ├── types.ts
│   ├── agentic-loop.ts
│   └── agentic-loop.test.ts
└── index.ts

packages/web/src/utils/llm/
├── braintrust-provider.ts
└── chat-handler.ts
```

## Usage Example

```typescript
// Simple usage with new architecture
const chatHandler = new ChatHandler(store)

await chatHandler.handleMessage('Create a document and add it to project X', {
  conversationId: 'conv-123',
  model: 'claude-3-5-sonnet',
  boardContext: { id: 'project-x', name: 'Project X' },
  maxIterations: 10
})
```

Compare to the original ~300 line nested function call!

## Next Steps

1. **Gradual Migration**: Start using `ChatHandler` in new features
2. **Deprecate Old Code**: Mark `runAgenticLoop` as deprecated
3. **Server Preparation**: Set up WebSocket infrastructure
4. **Complete Migration**: Move to server in Milestone 4