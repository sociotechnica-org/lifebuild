# Work Squared Production Plan - From Demo to Daily Driver

## Vision

Transform Work Squared from a demo application into a production-ready AI consultancy platform where persistent AI workers collaborate with humans through documents, tasks, and conversations.

## Core Concepts

### Projects

- **Definition**: Containers for contextual knowledge (documents + metadata)
- **Purpose**: Organize related documents that workers need to understand a domain
- **Not**: Kanban boards (boards are cross-project task management)

### AI Workers

- **Definition**: Persistent AI entities with names, avatars, and specializations
- **Lifecycle**: Created once, assigned to projects, work autonomously
- **Communication**: Each has a public chat channel (like Slack DMs but visible to all)
- **Capabilities**: Same toolset as current LLM, but with specialized prompts

### Documents

- **Storage**: LiveStore (SQLite) for now, Obsidian bridge later
- **Format**: Markdown only initially
- **Organization**: Central repository, can be added to zero or more projects
- **Access**: Workers assigned to a project see all its documents

## Architecture Decision: Add Node.js Backend

### Why We Need It

Your requirements essentially demand a traditional backend:

1. **Persistent Workers**: Cloudflare Workers timeout after 30s. Your AI workers need to run for minutes/hours on complex tasks.

2. **Document Processing**:

   - Full-text search across documents
   - Document parsing and indexing
   - Cross-document analysis for workers

3. **Worker Orchestration**:

   - Queue management for long-running tasks
   - Event-driven worker triggers (future)
   - Worker-to-worker communication

4. **Future-Proofing**:
   - Scheduled workers (cron jobs)
   - File uploads/attachments
   - Email integration
   - External API integrations

### Proposed Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│ CF Worker       │◀────│ Node.js Worker  │
│  (CF Pages)     │     │ (WebSocket)     │     │ (Render.com)    │
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

### Architectural Decisions

1. **Background Jobs**: SQLite-based queue using LiveStore tables (see [ADR-001](adrs/001-background-job-system.md))
2. **Node.js Hosting**: Render.com for worker service (see [ADR-002](adrs/002-nodejs-hosting-platform.md))
3. **Backup Storage**: Cloudflare R2 with 6-hour snapshots (see [ADR-003](adrs/003-backup-storage-strategy.md))

## Implementation Phases

### Phase 1: Documents & Projects Foundation

**Goal**: Replace Claude Projects' document management

#### 1.0 Global Navigation
- [ ] Create fixed top navigation bar
- [ ] Navigation items: Projects | Boards | Documents | Workers
- [ ] Active state indicators
- [ ] User profile section (placeholder for Phase 3)
- [ ] Update routing to support new sections
- [ ] Responsive mobile navigation

#### 1.1 Project Management

```typescript
// New Events
type ProjectEvent =
  | { type: 'project.created', id: string, name: string, description?: string }
  | { type: 'project.updated', id: string, updates: Partial<Project> }
  | { type: 'project.deleted', id: string }

// Schema
projects: {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
}
```

- [ ] Create projects page/list
- [ ] Create new project modal
- [ ] View project details
- [ ] Edit project metadata

#### 1.2 Document System

```typescript
// Events
type DocumentEvent =
  | { type: 'document.created'; id: string; title: string; content: string }
  | { type: 'document.updated'; id: string; updates: Partial<Document> }
  | { type: 'document.deleted'; id: string }
  | { type: 'document.addedToProject'; documentId: string; projectId: string }
  | { type: 'document.removedFromProject'; documentId: string; projectId: string }

// Schema
documents: {
  id: string
  title: string
  content: string // markdown
  createdAt: number
  updatedAt: number
}

documentProjects: {
  documentId: string
  projectId: string
}
```

- [ ] Create document editor (CodeMirror/Monaco)
- [ ] Central documents page (view all docs)
- [ ] Document list view per project
- [ ] Add/remove document to/from projects
- [ ] Search documents (basic SQLite FTS)
- [ ] Markdown preview

#### 1.3 LLM Document Tools

- [ ] `read_document(documentId)` tool
- [ ] `search_documents(query, projectId?)` tool
- [ ] `create_document(title, content, projectIds)` tool
- [ ] `update_document(documentId, updates)` tool
- [ ] @ mention syntax in chat for doc references

### Phase 2: AI Workers System

**Goal**: Replace single LLM chat with persistent worker agents

#### 2.1 Worker Management

```typescript
// Events
type WorkerEvent =
  | { type: 'worker.created', id: string, name: string, systemPrompt: string }
  | { type: 'worker.updated', id: string, updates: Partial<Worker> }
  | { type: 'worker.assignedToProject', workerId: string, projectId: string }
  | { type: 'worker.unassignedFromProject', workerId: string, projectId: string }

// Schema
workers: {
  id: string
  name: string
  avatar?: string  // URL or emoji for now
  systemPrompt: string
  specialization?: string
  createdAt: number
  isActive: boolean
}

workerProjects: {
  workerId: string
  projectId: string
}
```

- [ ] Workers list page
- [ ] Create worker modal (name, specialization, system prompt)
- [ ] Assign worker to projects
- [ ] Worker profile view
- [ ] Random name generator for workers

#### 2.2 Worker Chat System

```typescript
// Replace single chat with worker-specific chats
workerConversations: {
  id: string
  workerId: string
  title: string
  createdAt: number
}

// Messages now tied to worker conversations
chatMessages: {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  // ...existing fields
}
```

- [ ] Chat interface per worker (public DM style)
- [ ] Worker avatar/name in chat
- [ ] Show worker's current projects
- [ ] System prompt customization UI

#### 2.3 Worker Tools

- [ ] `create_worker(name, specialization, systemPrompt)` tool
- [ ] `assign_worker_to_project(workerId, projectId)` tool
- [ ] Tool for workers to see their assigned projects
- [ ] Tool for workers to see other workers

#### 2.4 Node.js Backend Setup

- [ ] Express + TypeScript setup
- [ ] Connect to LiveStore via Node adapter
- [ ] Implement SQLite-based task queue
- [ ] Worker execution service with long-running task support
- [ ] Deploy to Render.com with persistent disk
- [ ] Set up automated backups to Cloudflare R2
- [ ] Health checks and monitoring

### Phase 3: Multi-User Support

**Goal**: Enable team collaboration

#### 3.1 Authentication

```typescript
// Schema
users: {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: number
  lastLogin: number
}

// All existing tables get userId fields
```

- [ ] Login page (email/password)
- [ ] Session management
- [ ] User context in all events
- [ ] User avatars in UI

#### 3.2 User Awareness

- [ ] Show who created/edited documents
- [ ] Show who's chatting with which worker
- [ ] Activity indicators
- [ ] User mentions in chat/comments

#### 3.3 Access Control (Simple)

- [ ] All users see all projects/workers/documents
- [ ] Edit permissions for own content only
- [ ] Admin role for worker/project management

### Phase 4: Polish & Migration

- [ ] Data migration scripts from Claude Projects
- [ ] Production deployment configuration
- [ ] Implement restore functionality from R2 backups
- [ ] Performance optimization
- [ ] Error handling/recovery
- [ ] Set up monitoring and alerting

## Next Steps

1. **Deprecate old demo plan** - Mark work-squared-demo-design.md as archived
2. **Create first PR** - Project management UI (Phase 1.1)
3. **Backend decision** - Prototype Node.js service with LiveStore adapter
4. **Update onboarding** - Modify UI to show projects instead of just boards

## Success Metrics

- [ ] Can create and organize documents in projects
- [ ] Can create specialized AI workers
- [ ] Workers can read project documents and create tasks
- [ ] Multiple users can collaborate
- [ ] System runs reliably for daily use

## Technical Principles

1. **Vertical Slices**: Each PR adds a complete feature
2. **Event-First**: All state changes via events
3. **Progressive Enhancement**: Start simple, add complexity
4. **User-Visible Value**: Every phase improves daily workflow

## Open Questions

1. Worker avatar generation - emoji for now or integrate image generation?
2. Document versioning - needed for phase 1 or defer?
3. Worker memory - should workers remember past conversations?
4. ~~Backup strategy - how often, where to store?~~ ✓ Decided: R2 with 6-hour snapshots

---

This plan provides a clear path from the current demo to a production system for daily use. The phasing allows you to start using documents immediately while building toward the full worker agent vision.
