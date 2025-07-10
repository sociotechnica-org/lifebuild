# Work Squared Architecture

## Overview

Work Squared is an AI-powered consultancy workflow automation platform built on LiveStore's event-sourcing architecture. The system demonstrates how LLMs can interact with real-world tools (Kanban boards, documents, chat) through a unified event-driven interface.

The platform has evolved from a demo application to a production system supporting persistent AI workers, document management, and collaborative project planning.

## Core Architecture Principles

### 1. Event-First Design

Every action in Work Squared is an event flowing through LiveStore's event stream:

- Chat messages and LLM responses
- Task creation, updates, and moves
- Document creation and edits
- Worker actions and tool calls

### 2. Tool-Oriented AI Integration

LLMs interact with the system through well-defined tools:

- **Kanban Tools**: Create, move, update tasks on boards
- **Document Tools**: Read, create, edit markdown documents
- **Project Tools**: Manage document collections and contexts

### 3. Client-Side Agentic Loop

The AI integration uses a sophisticated client-side agentic loop that:

- Executes multiple tool calls in sequence
- Handles continuation conversations with tool results
- Provides real-time UI feedback during tool execution
- Supports up to 5 iterations to prevent infinite loops

### 4. Multi-Service Architecture

The current production architecture spans multiple services:

```
┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│ CF Worker       │
│  (CF Pages)     │     │ (WebSocket)     │
├─────────────────┤     ├─────────────────┤
│ • UI Components │     │ • Event relay   │
│ • User actions  │     │ • WebSocket hub │
│ • Real-time UI  │     │ • Sync logic    │
└─────────────────┘     └─────────────────┘
         │                       │
         └───────────────────────┴
                              │
                        ┌─────▼─────┐
                        │ LiveStore │
                        │ (SQLite)  │
                        └───────────┘
```

## System Components

### Frontend (React SPA)

- **User Interface**: Projects, Tasks, Documents, Worker chats
- **Real-time Updates**: Subscribes to LiveStore queries for reactive UI
- **Event Emission**: All user actions emit events to the system
- **Routing**: Global navigation between Projects | Tasks | Documents | Workers

### Cloudflare Worker (Sync Server)

- **WebSocket Hub**: Manages real-time connections between clients
- **Event Relay**: Distributes events across all connected clients
- **Durable Objects**: Maintains connection state and message ordering

### Data Layer

- **LiveStore (SQLite)**: Event sourcing with materialized views
- **Real-time Sync**: WebSocket-based synchronization across clients

## Data Model

### Core Event Types

Work Squared uses event sourcing with events defined in `src/livestore/events.ts`.

### LiveStore Schema

Events are materialized into core tables listed in `src/livestore/schema.ts`

## Current Implementation Status

### ✅ Completed Features

- **Kanban System**: Full CRUD operations, drag-and-drop, real-time sync
- **LLM Chat**: Conversations, streaming responses, tool integration
- **Worker Tools**: Task creation, project listing via LLM
- **Real-time Sync**: Multi-client synchronization via WebSocket
- **Testing**: Playwright E2E tests, comprehensive unit tests
- **Document System**: Markdown editor, project organization

### 🚧 In Progress

- **Enhanced Worker Tools**: Expanding LLM tool coverage for all operations
- **Projects/Boards Separation**: Architectural improvement to separate concepts

### 📋 Planned

- **Multi-user Support**: Authentication, user awareness
- **Worker Autonomy**: Scheduled tasks, event-driven triggers
- **Advanced Tools**: File uploads, external integrations

## AI Integration Architecture

### Current Implementation

Work Squared implements AI integration through a hybrid client-server approach:

1. **Cloudflare Worker Proxy**: Handles LLM API calls securely via Braintrust
2. **Client-Side Agentic Loop**: Executes tools and manages conversation flow
3. **Tool Execution**: Direct LiveStore integration for immediate state updates

### Agentic Loop Details

The agentic loop in `src/components/chat/ChatInterface/ChatInterface.tsx` provides sophisticated AI interaction:

```typescript
// Agentic loop flow:
1. User sends message → ChatInterface
2. LLM called via Cloudflare Worker → Returns tool calls
3. Tools executed client-side → Results added to conversation
4. Continuation call to LLM → Process results, possibly more tools
5. Repeat until no more tool calls (max 5 iterations)
```

**Key Features:**
- **Multi-turn conversations**: Tools results fed back to LLM for further processing
- **Real-time UI updates**: Each tool execution shows immediate feedback
- **Error handling**: Tool failures gracefully handled and reported
- **Context awareness**: Board and worker context passed through all calls

### Tool Calling Architecture

Tools are defined in the Cloudflare Worker (`functions/_worker.ts`) but executed client-side:

**Available Tools:**
- `create_task`: Create Kanban tasks with full validation
- `list_projects`: Get all available projects
- `list_documents`: Get all documents with metadata
- `read_document`: Read full document content
- `search_documents`: Search through document content

**Execution Flow:**
1. Worker defines tool schemas for LLM
2. LLM returns tool calls in response
3. Client executes tools via `executeLLMTool()` in `src/utils/llm-tools.ts`
4. Results formatted and sent back to LLM for continuation

### Worker Context Support

The system supports specialized AI workers with custom system prompts:

- **Worker Profiles**: Custom name, role description, avatar, default model
- **System Prompts**: Worker-specific instructions and behavior
- **Conversation Binding**: Workers can be bound to specific conversations
- **Context Injection**: Worker context passed through entire conversation flow

## Historical Context

### Evolution from Demo to Production

Work Squared has evolved through several architectural phases:

1. **Demo Phase**: Frontend-only LLM calls for simplicity
2. **Feature Development**: Added Kanban system and real-time sync
3. **Current State**: Hybrid approach with secure proxy and client-side execution

### Current Approach Benefits

The hybrid client-server approach provides several advantages:

- **Security**: API keys secured in Cloudflare Worker environment
- **Performance**: Tools execute directly against LiveStore for immediate updates
- **Real-time**: Users see tool execution progress in real-time
- **Flexibility**: Easy to add new tools without backend changes

## Architecture Decisions

The current architecture is documented through formal ADRs:

- **[ADR-001](./adrs/001-background-job-system.md)**: PROPOSED - SQLite-based task queue for background jobs
- **[ADR-002](./adrs/002-nodejs-hosting-platform.md)**: PROPOSED - Render.com hosting for Node.js workers
- **[ADR-003](./adrs/003-backup-storage-strategy.md)**: PROPOSED - Cloudflare R2 for automated backups

## Related Documentation

- **[Production Plan](./plans/004-projects-and-workers/work-squared-production-plan.md)**: Roadmap for transitioning to production use
- **[Kanban Implementation](./plans/002-kanban/kanban-todo.md)**: User story slices for task management
- **[LLM Chat Implementation](./plans/003-llm-chat/llm-chat-todo.md)**: Conversation and tool integration features

## System Benefits

### ✅ Event-Driven Consistency

- All state changes flow through unified event stream
- Real-time synchronization across all clients
- Clear audit trail of all system operations

### ✅ Scalable AI Integration

- Persistent workers can handle complex, long-running tasks
- Tool-based architecture enables extensible capabilities
- Background processing with retry and error handling

### ✅ Production Ready

- Automated backups and disaster recovery
- Multi-service deployment for reliability
- Comprehensive testing at unit and E2E levels

### ✅ Developer Experience

- LiveStore provides reactive queries and optimistic updates
- TypeScript throughout for type safety
- Playwright tests ensure feature reliability
