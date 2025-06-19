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

### 3. Multi-Service Architecture

The current production architecture spans multiple services:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│ CF Worker       │◀────│ Node.js Worker  │
│  (CF Pages)     │     │ (WebSocket)     │     │ (Render.com)    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • UI Components │     │ • Event relay   │     │ • AI Workers    │
│ • User actions  │     │ • WebSocket hub │     │ • Long tasks    │
│ • Real-time UI  │     │ • Sync logic    │     │ • Tool execution│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                              │
                        ┌─────▼─────┐
                        │ LiveStore │
                        │ (SQLite)  │
                        └───────────┘
                              │
                        ┌─────▼─────┐
                        │ CF R2     │
                        │ (Backups) │
                        └───────────┘
```

## System Components

### Frontend (React SPA)

- **User Interface**: Projects, Documents, Kanban boards, Worker chats
- **Real-time Updates**: Subscribes to LiveStore queries for reactive UI
- **Event Emission**: All user actions emit events to the system
- **Routing**: Global navigation between Projects | Boards | Documents | Workers

### Cloudflare Worker (Sync Server)

- **WebSocket Hub**: Manages real-time connections between clients
- **Event Relay**: Distributes events across all connected clients
- **Durable Objects**: Maintains connection state and message ordering

### Node.js Worker Service (Render.com)

- **AI Workers**: Persistent entities that process long-running tasks
- **Tool Execution**: Implements Kanban, document, and project tools
- **Task Queue**: SQLite-based queue for background job processing
- **LLM Integration**: Secure API calls to AI providers (OpenAI/Anthropic)

### Data Layer

- **LiveStore (SQLite)**: Event sourcing with materialized views
- **Cloudflare R2**: Automated backups every 6 hours
- **Real-time Sync**: WebSocket-based synchronization across clients

## Data Model

### Core Event Types

Work Squared uses event sourcing with these primary event categories:

```typescript
// Core event types
type WorkSquaredEvent =
  | ChatMessageEvent // Worker conversations
  | TaskEvent // Kanban board operations
  | DocumentEvent // Document management
  | ProjectEvent // Project organization
  | WorkerEvent // AI worker lifecycle
  | ToolExecutionEvent // LLM tool calls

// Example implementations
interface ChatMessageEvent {
  type: 'chat.message'
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  workerId?: string
  metadata?: {
    toolCalls?: ToolCall[]
    model?: string
  }
}

interface TaskEvent {
  type: 'task.created' | 'task.updated' | 'task.moved' | 'task.archived'
  taskId: string
  boardId: string
  updates: Partial<Task>
}

interface DocumentEvent {
  type: 'document.created' | 'document.updated' | 'document.addedToProject'
  documentId: string
  content?: string
  projectIds?: string[]
}
```

### LiveStore Schema

Events are materialized into these core tables:

```typescript
const schema = {
  tables: {
    // Project Management
    projects: { id: 'string', name: 'string', description: 'string?', createdAt: 'number' },
    documents: { id: 'string', title: 'string', content: 'string', createdAt: 'number' },
    documentProjects: { documentId: 'string', projectId: 'string' },

    // Kanban System
    boards: { id: 'string', name: 'string', createdAt: 'number' },
    columns: { id: 'string', boardId: 'string', name: 'string', position: 'number' },
    tasks: {
      id: 'string',
      boardId: 'string',
      columnId: 'string',
      title: 'string',
      position: 'number',
    },

    // AI Workers
    workers: { id: 'string', name: 'string', systemPrompt: 'string', isActive: 'boolean' },
    workerProjects: { workerId: 'string', projectId: 'string' },
    conversations: { id: 'string', workerId: 'string', title: 'string', createdAt: 'number' },
    chatMessages: { id: 'string', conversationId: 'string', role: 'string', content: 'string' },

    // Background Jobs
    workerTasks: {
      id: 'string',
      workerId: 'string',
      type: 'string',
      status: 'string',
      payload: 'json',
    },
  },
}
```

## AI Worker System

### Worker Architecture

AI Workers are persistent entities that can process long-running tasks:

```typescript
interface AIWorker {
  id: string
  name: string
  specialization: string
  systemPrompt: string
  assignedProjects: string[]
  isActive: boolean
}

// Worker capabilities
interface WorkerTools {
  // Document management
  readDocument(documentId: string): Promise<string>
  createDocument(title: string, content: string): Promise<string>
  updateDocument(documentId: string, content: string): Promise<void>
  searchDocuments(query: string, projectId?: string): Promise<Document[]>

  // Task management
  createTask(boardId: string, title: string, description?: string): Promise<string>
  moveTask(taskId: string, columnId: string): Promise<void>
  updateTask(taskId: string, updates: Partial<Task>): Promise<void>
  listTasks(boardId?: string): Promise<Task[]>

  // Project management
  listProjects(): Promise<Project[]>
  getProjectDocuments(projectId: string): Promise<Document[]>

  // Worker collaboration
  createWorker(name: string, specialization: string): Promise<string>
  assignWorkerToProject(workerId: string, projectId: string): Promise<void>
}
```

### Background Task Processing

The Node.js service implements a SQLite-based queue for long-running tasks:

```typescript
interface WorkerTask {
  id: string
  workerId: string
  type: 'process_message' | 'analyze_documents' | 'execute_workflow'
  payload: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  attempts: number
  createdAt: Date
  processAfter: Date
}

// Task queue operations
class TaskQueue {
  async enqueue(task: WorkerTask): Promise<void>
  async dequeue(): Promise<WorkerTask | null>
  async markCompleted(taskId: string, result?: any): Promise<void>
  async markFailed(taskId: string, error: string): Promise<void>
  async retry(taskId: string, delay?: number): Promise<void>
}
```

## Current Implementation Status

### ✅ Completed Features

- **Kanban System**: Full CRUD operations, drag-and-drop, real-time sync
- **LLM Chat**: Conversations, streaming responses, tool integration
- **Worker Tools**: Task creation, project listing via LLM
- **Real-time Sync**: Multi-client synchronization via WebSocket
- **Testing**: Playwright E2E tests, comprehensive unit tests

### 🚧 In Progress

- **Document System**: Markdown editor, project organization
- **AI Workers**: Persistent worker entities, background processing
- **Node.js Backend**: Long-running task support, secure LLM calls

### 📋 Planned

- **Multi-user Support**: Authentication, user awareness
- **Worker Autonomy**: Scheduled tasks, event-driven triggers
- **Advanced Tools**: File uploads, external integrations

## Historical Context

### Evolution from Demo to Production

Work Squared has evolved through several architectural phases:

1. **Demo Phase**: Frontend-only LLM calls for simplicity
2. **Feature Development**: Added Kanban system and real-time sync
3. **Production Transition**: Introduced Node.js backend for persistent workers
4. **Current State**: Multi-service architecture supporting long-running AI tasks

### Legacy Frontend Integration

The original implementation handled LLM calls directly in the browser for development simplicity. This approach worked for the demo but had limitations:

- API keys exposed to clients
- Limited to 30-second Cloudflare Worker timeouts
- No background processing capabilities
- Single-user context only

### Migration to Backend Workers

The current architecture moves LLM processing to a dedicated Node.js service, enabling:

- Secure API key management
- Long-running tasks (hours if needed)
- Persistent worker entities
- Background job queuing
- Multi-user collaboration

## Development Workflow

### Current Development Setup

```bash
# Start frontend and sync worker
pnpm dev

# Run LLM service (separate terminal)
pnpm llm:service

# Run tests
pnpm test              # Unit tests
pnpm test:e2e          # E2E tests with Playwright
pnpm test:storybook    # Component visual testing
```

### Production Deployment

```bash
# Deploy sync worker to Cloudflare
pnpm wrangler:deploy

# Build and deploy frontend to Cloudflare Pages
pnpm build

# Deploy Node.js service to Render.com
# (via git push to connected repository)
```

## Architecture Decisions

The current architecture is documented through formal ADRs:

- **[ADR-001](./adrs/001-background-job-system.md)**: SQLite-based task queue for background jobs
- **[ADR-002](./adrs/002-nodejs-hosting-platform.md)**: Render.com hosting for Node.js workers
- **[ADR-003](./adrs/003-backup-storage-strategy.md)**: Cloudflare R2 for automated backups

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
