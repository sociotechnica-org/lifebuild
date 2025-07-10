# Phase 2 AI Workers System - User Stories

> Purpose: Build a persistent AI workers system that replaces the single LLM chat with specialized worker agents that can be assigned to projects and have access to project-specific context.

This phase transforms Work Squared from a single-chat system into a multi-agent platform where persistent AI workers collaborate with users through specialized conversations and project assignments.

---

## ✅ Story 1 – Create a new Worker

**User story**: _As a user, I want to create a new Worker with a name, role description, and system prompt so I can have specialized AI assistants for different types of work._

**Context**: This establishes the foundation for the worker system, replacing the single LLM chat with persistent, specialized agents.

**Status**: ✅ **COMPLETED** - [PR #60](https://github.com/sociotechnica-org/work-squared/pull/60)

### Tasks

- [x] Events: Define `worker.created` event with `{ id, name, roleDescription?, systemPrompt, avatar?, createdAt }`
- [x] Schema: Add `workers` table with fields: `id, name, roleDescription?, systemPrompt, avatar?, createdAt, isActive`
- [x] UI: Create Workers page accessible from main navigation
- [x] UI: Add "Create Worker" button that opens a modal with form fields:
  - Name (required, with auto-generation)
  - Role description (optional, e.g., "Frontend Developer", "Project Manager")
  - System prompt (required, with helpful defaults/templates)
  - Avatar (optional, emoji input)
- [x] Logic: Generate random worker names if user leaves name blank
- [x] Query: Create `getWorkers$` query to fetch all active workers
- [x] Tests: Worker creation flow, form validation, event emission
- [x] DoD: Users can create workers that appear in the workers list

### Implementation Summary

**Components Created:**

- `WorkersPage` - Main page with worker cards and creation modal
- `WorkerCard` - Individual worker display with Chat/Edit buttons (placeholders)
- `CreateWorkerModal` - Form for creating new workers with validation
- `workerNames.ts` - Utility for random name generation and system prompt templates

**Database Changes:**

- Added `workers` table with full LiveStore integration
- Added `workerCreated` event with proper materialization
- Added `getWorkers$` query for active workers

**Features:**

- Auto-generated worker names (e.g., "Helpful Assistant", "Smart Coordinator")
- System prompt templates (General Assistant, Code Review, Project Planner, etc.)
- Form validation for required fields
- Navigation integration with /workers route
- Full test coverage (unit, component, integration tests)

### Implementation Notes

- **Tool Access**: For now, workers have access to all existing tools (create_task, list_projects, etc.)
- **Name Generation**: Use a simple random name generator (e.g., "Assistant Alpha", "Helper Beta")
- **System Prompt Templates**: Provide common templates like "Code Review Assistant", "Project Planner", "Documentation Writer"

---

## ✅ Story 2 – Select model for Worker conversation

**User story**: _As a user, I want to select which AI model will be used by the Worker while chatting with it so I can choose the best model for the task at hand._

**Dependencies**: Story 1 (need worker creation)

**Status**: ✅ **COMPLETED** - Full model selection system implemented

### Tasks

- [x] Schema: Add `conversationModel` field to worker conversations
- [x] UI: Add model selector dropdown in chat interface near the message input
- [x] UI: Display current model selection in chat header
- [x] Models: Support these Braintrust model strings:
  - `claude-sonnet-4-20250514` (Claude 4 Sonnet)
  - `gpt-4o` (GPT-4o)
  - `claude-opus-4-20250514` (Claude 4 Opus)
  - `o3` (OpenAI O3)
- [x] Logic: Default to `claude-3-5-sonnet-latest` for new conversations
- [x] Logic: Model selection persists per conversation (not global worker setting)
- [x] Backend: Update worker API to use selected model instead of hardcoded `gpt-4o`
- [x] Tests: Model selection persistence, API integration with different models
- [x] DoD: Users can select and switch models during worker conversations

### Implementation Summary

**Components Created:**

- `ModelSelector` - Dropdown component for model selection with provider information
- Model selection integrated into chat interface header
- Per-conversation model persistence with LiveStore events

**Database Changes:**

- Added `model` field to `conversations` table with default `claude-3-5-sonnet-latest`
- Added `modelId` field to `chatMessages` table for tracking model-generated responses
- Added `conversationModelUpdated` event with proper materialization

**Features:**

- Model selection dropdown prominently displayed in chat interface
- Per-conversation model persistence (not global worker setting)
- Real-time model switching with immediate backend integration
- Support for 4 major AI models with proper fallback handling
- Visual feedback showing current model selection

### Implementation Notes

- **Per-Conversation Setting**: Model selection is tied to specific conversations, not workers globally
- **Model Fallback**: If selected model fails, fall back to `claude-3-5-sonnet-latest`
- **UI Placement**: Model selector should be prominent but not intrusive in chat interface

---

## ✅ Story 3 – Edit Worker system prompt

**User story**: _As a user, I want to edit the system prompt for a Worker so I can refine their behavior and specialization over time._

**Dependencies**: Story 1 (need worker creation)

**Status**: ✅ **COMPLETED** - [PR #66](https://github.com/sociotechnica-org/work-squared/pull/66)

### Tasks

- [x] Event: Define `worker.updated` event with `{ id, updates: Partial<Worker> }`
- [x] UI: Add "Edit Worker" button/link in worker profile view
- [x] UI: Create edit worker modal with form fields:
  - Name (editable)
  - Role description (editable)
  - System prompt (editable, large textarea)
  - Avatar (editable)
- [x] Logic: System prompt changes take effect in new conversations
- [x] Logic: Existing conversations retain their original system prompt
- [x] Validation: Ensure system prompt is not empty
- [x] Tests: System prompt editing, conversation isolation, validation
- [x] DoD: Users can edit worker details and see changes reflected in new conversations

### Implementation Notes

- **Conversation Isolation**: Existing conversations keep their original system prompt to maintain consistency
- **Prompt Versioning**: Consider storing prompt version with conversations for future debugging
- **Rich Editing**: Use a textarea with syntax highlighting for system prompts

---

## ✅ Story 4 – View list of all Workers

**User story**: _As a user, I want to see a list of all the workers in my Work Squared so I can manage and access my AI assistants._

**Dependencies**: Story 1 (need worker creation)

**Status**: ✅ **PARTIALLY COMPLETED** - Basic functionality implemented in Story 1

### Tasks

- [x] UI: Create Workers page with card-based layout
- [x] UI: Each worker card shows:
  - Name and avatar
  - Role description
  - ~~Last active timestamp~~ (shows creation date for now)
  - ~~Number of assigned projects~~ (not implemented yet - needs Story 5)
  - Quick actions (Chat, Edit, Archive) - **placeholder buttons only**
- [ ] UI: Add search/filter functionality for workers
- [ ] Logic: Show workers ordered by last activity
- [ ] Query: Create `getWorkerSummary$` query with project counts and activity
- [x] Tests: Worker list display, ~~search functionality~~, card interactions
- [x] DoD: Users can view all workers in an organized, ~~searchable~~ list

### Implementation Notes

**What's Working:**

- Workers page accessible from main navigation
- Card-based layout showing worker info
- Basic worker display with name, avatar, role, creation date, and status
- Chat/Edit buttons (placeholder - functionality in Stories 3 & 6)

**Still Needed:**

- Search/filter functionality
- Activity tracking and last active timestamps
- Project assignment counts (depends on Story 5)
- Actual functionality for Chat/Edit buttons

### Implementation Notes

- **Worker Status**: Show visual indicators for active/inactive workers
- **Quick Actions**: Provide easy access to common worker operations
- **Activity Tracking**: Track when workers were last used in conversations

---

## ✅ Story 5 – Assign Worker to projects

**User story**: _As a user, I want to assign a worker to one or more projects so they can have context about specific work areas._

**Dependencies**: Story 4 (need worker list), Phase 1 project system

**Status**: ✅ **COMPLETED** - [PR #68](https://github.com/sociotechnica-org/work-squared/pull/68)

### Tasks

- [x] Schema: Add `workerProjects` junction table with `workerId, projectId`
- [x] Event: Define `worker.assignedToProject` and `worker.unassignedFromProject` events
- [x] UI: Add "Assign to Projects" button in worker profile/edit modal
- [x] UI: Create project assignment modal with:
  - Searchable list of all projects
  - Checkboxes for current assignments
  - Save/cancel actions
- [x] UI: Show assigned projects in worker cards and profile
- [x] UI: Show assigned workers in project views
- [x] Query: Create `getWorkerProjects$` and `getProjectWorkers$` queries
- [x] Tests: Project assignment flow, many-to-many relationship handling
- [x] DoD: Workers can be assigned to multiple projects and projects can have multiple workers

### Implementation Notes

- **Many-to-Many Relationship**: Workers can be assigned to multiple projects, projects can have multiple workers
- **Visual Indicators**: Show project assignments prominently in both worker and project views
- **Bulk Operations**: Allow assigning/unassigning multiple projects at once

---

## ✅ Story 2B – Worker-tied model selection

**User story**: _As a user, I want to select a default AI model when creating a Worker so that each worker has a consistent model choice that reflects their specialization._

**Dependencies**: Story 1 (need worker creation), Story 2 (need model selection system)

**Status**: ✅ **COMPLETED** - [PR #72](https://github.com/sociotechnica-org/work-squared/pull/72)

### Tasks

- [x] Schema: Add `defaultModel` field to `workers` table
- [x] Event: Update `worker.created` event to include `defaultModel`
- [x] UI: Add model selector dropdown in CreateWorkerModal
- [x] UI: Add model selector dropdown in EditWorkerModal
- [x] UI: Display worker's default model in worker cards and profile
- [x] Logic: New conversations with this worker start with their default model
- [x] Logic: Users can still change model per conversation (Story 2 functionality preserved)
- [x] Logic: Default to `claude-3-5-sonnet-latest` if no model specified
- [x] Validation: Ensure selected model is from supported list
- [x] Tests: Worker creation with model selection, model display, conversation defaults
- [x] DoD: Workers can be created with default models, and new conversations use that model

### Implementation Summary

**Database Changes:**
- Added `defaultModel` field to `workers` table with proper materialization
- Updated `workerCreated` event to include `defaultModel` parameter
- Modified worker queries to include default model information

**UI Components:**
- Enhanced `CreateWorkerModal` and `EditWorkerModal` with model selection
- Updated `WorkerCard` to display worker's default model
- Added model display in worker profile views

**Logic Implementation:**
- New worker conversations automatically use worker's default model
- Existing model-per-conversation functionality preserved
- Fallback to `claude-3-5-sonnet-latest` for legacy workers

### Implementation Notes

- **Worker Specialization**: Different workers can have different default models suited to their role
- **Conversation Override**: Users can still change models per conversation (Story 2 remains functional)
- **Model Consistency**: Each worker's conversations start with their specialized model
- **Backward Compatibility**: Existing workers without default models use `claude-3-5-sonnet-latest`

---

## ✅ Story 6 – Worker chat system

**User story**: _As a user, I want to chat with individual workers in dedicated conversations so I can have specialized interactions with each AI assistant._

**Dependencies**: Story 1 (need worker creation), Story 2 (need model selection)

**Status**: ✅ **COMPLETED** - [PR #72](https://github.com/sociotechnica-org/work-squared/pull/72)

### Tasks

- [x] UI: Show worker avatar, name, and role in chat header
- [x] UI: Remove the model selector from the chat interface (it's now a worker setting)
- [x] Logic: Each worker can have multiple separate conversation histories
- [x] Logic: Include worker's system prompt in their conversations
- [x] Backend: Update chat API to handle worker-specific conversations
- [x] Tests: Worker conversation isolation, message threading, system prompt application
- [x] DoD: Each worker has dedicated chat interface with proper context and history

### Implementation Summary

**UI Enhancements:**
- Chat header now displays worker avatar, name, role description, and default model when in worker conversation
- Removed ModelSelector component from chat interface - workers use their default model
- Added URL parameter-based navigation for bookmarkable worker conversations
- Enhanced conversation selector to handle both general and worker-specific chats

**Database Changes:**
- Added `workerId` field to `conversations` table to link conversations to specific workers
- Added `getWorkerById$` query for worker lookup in chat interface
- Updated conversation creation to include worker context

**Backend Integration:**
- Modified chat API (`functions/_worker.ts`) to handle `workerContext` parameter
- Added conditional system prompt logic: worker's custom prompt vs default assistant prompt
- Integrated worker profile information (name, role, system prompt) into API requests

**Navigation & State Management:**
- Implemented URL parameter handling for `workerId` and `conversationId`
- Added `WorkerCard` chat button functionality to create and navigate to worker conversations
- Enhanced conversation switching with proper URL updates for bookmarkable state

**Testing:**
- Fixed `WorkerCard` tests to include `BrowserRouter` context for navigation hooks
- Added proper test coverage for worker conversation functionality
- Resolved React hooks dependency issues identified by automated code review

### Implementation Notes

- **Conversation Isolation**: Each worker maintains completely separate conversation history
- **Context Switching**: Users can easily switch between different worker conversations using URL parameters
- **Public DM Style**: Conversations are visible to all users but specific to each worker
- **Backward Compatibility**: Non-worker conversations continue to work with default system prompt

---

## Story 7 – Worker tools for project access

**User story**: _As a user, I want workers to have access to documents and tasks from their assigned projects when chatting with them so they can provide contextual assistance._

**Dependencies**: Story 5 (need project assignments), Story 6 (need worker chat)

### Tasks

- [ ] Tool: Create `list_assigned_projects` tool for workers to see their projects
- [ ] Tool: Create `get_project_documents` tool to access project-specific documents
- [ ] Tool: Create `get_project_tasks` tool to access project-specific tasks
- [ ] Tool: Update existing document tools to respect project assignments:
  - `search_documents` - filter by worker's assigned projects
  - `read_document` - verify document is in assigned project
- [ ] Logic: Workers can only access documents/tasks from assigned projects
- [ ] Logic: Unassigned workers have access to all documents/tasks (backward compatibility)
- [ ] Backend: Update tool implementations to check worker-project assignments
- [ ] Tests: Project-scoped tool access, permission validation, context filtering
- [ ] DoD: Workers can access and work with content from their assigned projects

### Implementation Notes

- **Permission Model**: Workers can only access content from projects they're assigned to
- **Tool Evolution**: Existing tools are enhanced rather than replaced
- **Backward Compatibility**: Unassigned workers maintain full access like current system

---

## Story 8 – Worker management tools

**User story**: _As a user, I want workers to be able to see information about other workers and collaborate on project assignments so the system can coordinate multi-agent workflows._

**Dependencies**: Story 5 (need project assignments), Story 7 (need worker tools)

### Tasks

- [ ] Tool: Create `list_workers` tool to see all active workers
- [ ] Tool: Create `get_worker_info` tool to get details about specific workers
- [ ] Tool: Create `suggest_worker_assignment` tool for workers to recommend project assignments
- [ ] Logic: Workers can see other workers' specializations and current assignments
- [ ] Logic: Workers can suggest collaboration opportunities
- [ ] Backend: Implement worker-to-worker information sharing
- [ ] Tests: Inter-worker communication, assignment suggestions, collaboration workflows
- [ ] DoD: Workers can discover and coordinate with other workers in the system

### Implementation Notes

- **Worker Discovery**: Workers can learn about other workers' capabilities
- **Collaboration Hints**: Workers can suggest when other specialists might be helpful
- **Future-Proofing**: Lays groundwork for worker-to-worker communication

---

## Story 9 – Node.js backend setup for workers

**User story**: _As a system administrator, I want a Node.js backend that can handle long-running worker tasks so workers can perform complex operations without Cloudflare Worker timeouts._

**Dependencies**: All frontend worker stories (1-8)

### Tasks

- [ ] Setup: Create Node.js Express TypeScript project structure
- [ ] Setup: Install LiveStore Node.js adapter for database access
- [ ] Setup: Configure connection to existing LiveStore SQLite database
- [ ] Queue: Implement SQLite-based task queue using LiveStore tables
- [ ] Queue: Create job types for worker task execution
- [ ] API: Create long-running worker execution service
- [ ] API: Implement job status tracking and progress updates
- [ ] Deploy: Set up Render.com deployment with persistent disk
- [ ] Deploy: Configure automated backups to Cloudflare R2
- [ ] Monitor: Add health checks and basic monitoring
- [ ] Tests: Queue operations, job execution, deployment verification
- [ ] DoD: Node.js backend can execute long-running worker tasks with proper monitoring

### Implementation Notes

- **Architecture**: Node.js service connects to existing LiveStore database
- **Queue System**: SQLite-based queue avoids additional infrastructure
- **Deployment**: Render.com provides persistent disk for reliable job execution
- **Monitoring**: Basic health checks and logging for production readiness

---

## ⏳ Deferred to Phase 3

### Story 10 – Worker memory and conversation history

**Reason**: Complex feature requiring careful design of what workers should remember across conversations. Better suited for Phase 3 when core worker functionality is stable.

### Story 11 – Worker scheduling and automation

**Reason**: Advanced feature requiring cron-like scheduling infrastructure. Phase 3 can focus on automated worker behaviors.

### Story 12 – Advanced worker permissions and tool restrictions

**Reason**: Current "all tools" approach is sufficient for Phase 2. Granular permissions can be added in Phase 3.

---

## Technical Implementation Notes

### Database Schema Changes

```typescript
// Workers table
workers: {
  id: string
  name: string
  roleDescription?: string
  systemPrompt: string
  avatar?: string
  createdAt: number
  isActive: boolean
}

// Worker-Project assignments (many-to-many)
workerProjects: {
  workerId: string
  projectId: string
}

// Worker conversations (replaces single chat)
workerConversations: {
  id: string
  workerId: string
  title: string
  model: string
  createdAt: number
}

// Updated chat messages
chatMessages: {
  id: string
  conversationId: string  // Changed from global chat
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  // ... existing fields
}
```

### Event System Updates

```typescript
// Worker events
type WorkerEvent =
  | {
      type: 'worker.created'
      id: string
      name: string
      roleDescription?: string
      systemPrompt: string
    }
  | { type: 'worker.updated'; id: string; updates: Partial<Worker> }
  | { type: 'worker.assignedToProject'; workerId: string; projectId: string }
  | { type: 'worker.unassignedFromProject'; workerId: string; projectId: string }

// Conversation events
type ConversationEvent =
  | {
      type: 'workerConversation.created'
      id: string
      workerId: string
      title: string
      model: string
    }
  | { type: 'workerConversation.updated'; id: string; updates: Partial<WorkerConversation> }
```

### New Tool Definitions

```typescript
// Worker-specific tools
const workerTools = [
  {
    name: 'list_assigned_projects',
    description: 'Get list of projects assigned to this worker',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_project_documents',
    description: 'Get documents for a specific assigned project',
    parameters: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },
  {
    name: 'get_project_tasks',
    description: 'Get tasks for a specific assigned project',
    parameters: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },
  {
    name: 'list_workers',
    description: 'Get list of all active workers',
    parameters: { type: 'object', properties: {}, required: [] },
  },
]
```

### Model Configuration

```typescript
// Supported models for worker conversations
const supportedModels = [
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'o3', name: 'OpenAI O3', provider: 'openai' },
]
```

### Migration Strategy

1. **Gradual Transition**: Keep existing chat working while building worker system
2. **Data Migration**: Convert existing chat history to default worker conversation
3. **Progressive Enhancement**: Add worker features without breaking existing functionality
4. **Backend Integration**: Node.js backend handles complex operations while CF Workers handle real-time sync

---

## Implementation Guidelines

1. **Event-Driven Architecture**: All worker operations flow through LiveStore events
2. **Conversation Isolation**: Each worker maintains separate, persistent conversation history
3. **Project-Scoped Access**: Workers can only access content from assigned projects
4. **Progressive Enhancement**: Build on existing chat and project systems
5. **Tool Evolution**: Enhance existing tools rather than replacing them

## Success Metrics

- [x] **Workers can be created with custom system prompts and specializations** ✅ Story 1 Complete
- [ ] Workers can be assigned to multiple projects with appropriate access controls
- [ ] Each worker maintains separate conversation history with model selection
- [ ] Workers can access and work with project-specific documents and tasks
- [ ] Node.js backend supports long-running worker operations
- [ ] System supports multiple concurrent worker conversations

This foundation transforms Work Squared from a single-assistant system into a multi-agent platform while maintaining the existing project and document management capabilities.
