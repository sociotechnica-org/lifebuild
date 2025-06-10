# Work Squared Demo - Technical Design Document

## Executive Summary

Work Squared is a demo application showcasing an AI-powered consultancy workflow automation system. Built on LiveStore's event-sourcing architecture, it demonstrates how LLMs can interact with real-world tools (Kanban boards, document editors) through an event-driven interface.

**Demo Goal**: 5-minute showcase of AI automating consultancy workflow from contract closure to iteration zero planning.

## Core Architecture

### Event-Driven Foundation

All system interactions flow through LiveStore's event stream:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI/Chat   │────▶│  Event Store │◀────│  LLM Agent  │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
              ┌─────▼────┐    ┌─────▼─────┐
              │  Kanban  │    │ Obsidian  │
              │ Adapter  │    │    MCP    │
              └──────────┘    └───────────┘
```

### Key Principles

1. **Event-First**: Every action is an event (chat messages, task creation, document edits)
2. **Minimal Viable Implementation**: Use LiveStore patterns, skip non-essential features
3. **Agent-Friendly**: Clear event schemas, comprehensive test coverage, Playwright for E2E testing

## Technical Components

### 1. Event Schema

Core event types using LiveStore's event sourcing:

```typescript
// src/livestore/events.ts
type WorkSquaredEvent =
  | ChatMessageEvent
  | TaskEvent
  | DocumentEvent
  | WorkflowEvent
  | AgentActionEvent;

interface ChatMessageEvent {
  type: "chat.message";
  role: "user" | "assistant" | "system";
  content: string;
  modelId?: string;
  metadata?: Record<string, any>;
}

interface TaskEvent {
  type: "task.created" | "task.updated" | "task.moved";
  taskId: string;
  boardId: string;
  column?: string;
  title?: string;
  description?: string;
}

interface DocumentEvent {
  type: "document.created" | "document.updated";
  documentId: string;
  path: string;
  content?: string;
  diff?: string;
}

interface WorkflowEvent {
  type: "workflow.started" | "workflow.step" | "workflow.completed";
  workflowId: string;
  name: string;
  step?: string;
  status?: "pending" | "running" | "completed" | "failed";
}

interface AgentActionEvent {
  type: "agent.action";
  action: string;
  tool: "kanban" | "obsidian" | "chat";
  parameters: Record<string, any>;
  result?: any;
}
```

### 2. LiveStore Tables

Materialized views from events:

```typescript
// src/livestore/schema.ts
const schema = {
  tables: {
    chatMessages: {
      id: "string",
      role: "string",
      content: "string",
      modelId: "string?",
      timestamp: "number",
      metadata: "json?",
    },
    tasks: {
      id: "string",
      boardId: "string",
      column: "string",
      title: "string",
      description: "string?",
      position: "number",
      updatedAt: "number",
    },
    documents: {
      id: "string",
      path: "string",
      content: "string",
      lastModified: "number",
    },
    workflows: {
      id: "string",
      name: "string",
      currentStep: "string?",
      status: "string",
      startedAt: "number",
      completedAt: "number?",
    },
    agentActions: {
      id: "string",
      workflowId: "string?",
      action: "string",
      tool: "string",
      parameters: "json",
      result: "json?",
      timestamp: "number",
    },
  },
};
```

### 3. LLM Integration

**Approach**: LLM runs as a service that subscribes to events and can emit new events.

```typescript
// src/services/llm-agent.ts
interface LLMAgent {
  // Subscribe to relevant events
  subscribeToEvents(store: LiveStore): void;

  // Process incoming events and decide on actions
  processEvent(event: WorkSquaredEvent): Promise<void>;

  // Execute actions through tools
  executeAction(action: AgentAction): Promise<void>;
}

// Tool interfaces for LLM
interface KanbanTool {
  createTask(boardId: string, task: TaskInput): Promise<Task>;
  moveTask(taskId: string, column: string): Promise<void>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
}

interface ObsidianTool {
  createDocument(path: string, content: string): Promise<void>;
  updateDocument(path: string, content: string): Promise<void>;
  appendToDocument(path: string, content: string): Promise<void>;
}
```

### 4. Chat Interface

React component subscribing to LiveStore queries:

```typescript
// src/components/ChatInterface.tsx
function ChatInterface() {
  const messages = useQuery(store, queries.getChatMessages);
  const dispatch = useDispatch(store);

  const sendMessage = (content: string) => {
    dispatch({
      type: "chat.message",
      role: "user",
      content,
    });
  };

  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} />
      <ModelPicker />
    </div>
  );
}
```

### 5. External Integrations

#### Kanban Integration Decision: Internal Implementation

**Recommendation**: Build internal Kanban for MVP

**Rationale**:
- Faster to implement (no API auth, rate limits, network latency)
- Full control over event emission and UI updates
- Can mock Trello-like appearance for demo authenticity
- LiveStore already handles state management perfectly
- Aligns with "do the thing that's easier" principle

**Implementation**:
```typescript
// Internal Kanban with LiveStore
interface KanbanBoard {
  id: string
  name: string
  columns: Column[]
}

interface Column {
  id: string
  name: string
  position: number
}

// Events emitted by both UI and LLM tools
type KanbanEvent = 
  | { type: 'board.created', board: KanbanBoard }
  | { type: 'task.created', boardId: string, task: Task }
  | { type: 'task.moved', taskId: string, fromColumn: string, toColumn: string }
  | { type: 'task.updated', taskId: string, updates: Partial<Task> }
```

**Visual Design**: Trello-style columns with drag-and-drop for authenticity

**Future Path**: If needed, add Trello MCP adapter in Phase 2.5 that translates internal events to Trello API calls

#### Obsidian Integration Decision: MCP with REST API

**Recommendation**: Use Obsidian MCP via REST API (with internal fallback)

**Rationale**:
- Shows real integration capability (WorkSquared as integration layer)
- Obsidian REST API already exists and is stable
- Documents persist outside WorkSquared (authentic for consultancy demo)
- Supports the narrative of "execution happens in other applications"

**Architecture**:
```
WorkSquared → MCP Client → Tailscale → Obsidian REST API
     ↓
Event Stream ← Document Events
```

**Implementation Plan**:
1. Set up Obsidian with REST API plugin on Tailscale network
2. Implement MCP server wrapping Obsidian REST endpoints
3. Create document preview component in UI
4. Emit events for all document operations

**MCP Tools**:
```typescript
interface ObsidianMCPTools {
  'obsidian_read_file': {
    input: { path: string }
    output: { content: string, metadata: object }
  }
  'obsidian_write_file': {
    input: { path: string, content: string }
    output: { success: boolean, path: string }
  }
  'obsidian_list_files': {
    input: { folder?: string }
    output: { files: Array<{path: string, modified: number}> }
  }
  'obsidian_search': {
    input: { query: string }
    output: { results: Array<{path: string, matches: string[]}> }
  }
}
```

**Event Integration**:
```typescript
// MCP tool calls emit events
mcpClient.on('tool_called', (tool, params, result) => {
  if (tool.startsWith('obsidian_')) {
    dispatch({
      type: 'document.updated',
      documentId: params.path,
      path: params.path,
      content: result.content,
      tool: 'obsidian',
      action: tool
    })
  }
})
```

**Fallback Strategy**:
- If Obsidian/Tailscale setup is too complex for demo deadline
- Use internal markdown editor with same event interface
- Store documents in LiveStore
- UI remains identical (document preview component)

#### UI Considerations from Your Dialogue

**Activity Log vs Chat Separation**:
- Implement Factory.ai-style split view
- Left: Chat interface for LLM interaction
- Right: Activity log showing event stream
- Visual indicators for tool calls and async operations

**Model Picker Integration**:
- Simple dropdown in chat interface
- Store selected model in LiveStore uiState
- Pass modelId with chat events

## Demo Workflow Implementation

### Consultancy Iteration Zero Workflow

```typescript
const iterationZeroWorkflow = {
  name: "Iteration Zero Planning",
  steps: [
    {
      id: "analyze-contract",
      action: "Read and analyze the contract details",
      tool: "chat",
    },
    {
      id: "create-charter",
      action: "Create project charter document",
      tool: "obsidian",
      template: "templates/project-charter.md",
    },
    {
      id: "setup-board",
      action: "Create Kanban board with initial structure",
      tool: "kanban",
      columns: ["Backlog", "In Progress", "Review", "Done"],
    },
    {
      id: "create-stories",
      action: "Generate initial user stories",
      tool: "kanban",
      estimatedCount: 8 - 12,
    },
    {
      id: "technical-setup",
      action: "Document technical architecture",
      tool: "obsidian",
      template: "templates/technical-design.md",
    },
    {
      id: "schedule-kickoff",
      action: "Create kickoff meeting agenda",
      tool: "obsidian",
    },
  ],
};
```

## Implementation Phases

### Phase 1: Event-Driven LLM Chat

**Core Implementation:**
- [ ] LiveStore event schema for chat messages and agent actions
- [ ] Chat interface with Factory.ai-style split view (chat + activity log)
- [ ] LLM integration with streaming responses
- [ ] Model picker dropdown in chat UI
- [ ] Event emission for all chat interactions
- [ ] Basic WebSocket sync setup

**Testing:**
- [ ] Unit tests: Event emission and materialization for chat messages
- [ ] Unit tests: Model picker state management
- [ ] Integration tests: LLM service event processing
- [ ] Playwright setup and first E2E test: Send message, receive response
- [ ] Playwright test: Model switching functionality

**Definition of Done:**
- Can chat with LLM and see responses
- All interactions visible in activity log
- Can switch between different models
- Tests pass with >80% coverage

### Phase 2: Kanban Tool

**Core Implementation:**
- [ ] LiveStore schema for boards, columns, and tasks
- [ ] Trello-style Kanban UI component with drag-and-drop
- [ ] LLM tool interface for Kanban operations (create, move, update tasks)
- [ ] Event emission for all Kanban interactions
- [ ] Real-time UI updates from events

**Testing:**
- [ ] Unit tests: Task CRUD operations and event emission
- [ ] Unit tests: Drag-and-drop state management
- [ ] Integration tests: LLM Kanban tool execution
- [ ] Playwright tests: Create task via UI, move task, update task
- [ ] Playwright tests: LLM creates and manipulates tasks
- [ ] Test fixture: Pre-populated board for consistent testing

**Definition of Done:**
- Kanban board displays and updates in real-time
- LLM can create, move, and update tasks via tools
- Drag-and-drop works smoothly
- All Kanban actions appear in activity log

### Phase 3: Obsidian Tool

**Core Implementation:**
- [ ] Document event schema and LiveStore tables
- [ ] Obsidian REST API setup with Tailscale
- [ ] MCP server implementation for Obsidian
- [ ] Document preview component in UI
- [ ] Fallback internal markdown editor
- [ ] LLM tool interface for document operations

**Testing:**
- [ ] Unit tests: Document event emission and materialization
- [ ] Unit tests: Markdown editor functionality (fallback)
- [ ] Integration tests: MCP client to Obsidian communication
- [ ] Integration tests: LLM document tool execution
- [ ] Playwright tests: Document creation and editing flow
- [ ] Playwright tests: Preview updates when documents change
- [ ] Mock Obsidian API for CI/CD pipeline

**Definition of Done:**
- LLM can create/edit documents in Obsidian
- Document previews appear in UI
- Fallback editor works if Obsidian unavailable
- All document operations in activity log

### Phase 4: Story-telling + UI Polish

**Core Implementation:**
- [ ] Iteration Zero workflow engine
- [ ] Workflow visualization in activity log
- [ ] Demo consultancy scenario setup
- [ ] UI polish: transitions, loading states, styling
- [ ] Error handling and recovery flows
- [ ] Performance optimizations for demo

**Testing:**
- [ ] Unit tests: Workflow state machine logic
- [ ] Integration tests: Complete workflow execution
- [ ] Playwright test: Full Iteration Zero workflow (5-minute demo)
- [ ] Playwright test: Error scenarios and recovery
- [ ] Performance tests: Ensure smooth demo experience
- [ ] Rehearsal mode: Deterministic demo for reliability

**Definition of Done:**
- Complete 5-minute demo runs smoothly
- Iteration Zero workflow executes end-to-end
- UI polished and professional
- Demo is reliable and repeatable
- All edge cases handled gracefully


## Shortcuts for MVP

1. **Authentication**: Skip - single user demo
2. **Persistence**: Use LiveStore's OPFS adapter only
3. **Real Trello**: Internal Kanban first
4. **Complex LLM Logic**: Hardcode demo-specific responses
5. **Multi-tenant**: Single workspace only
6. **Advanced UI**: Minimal styling, focus on functionality

## Success Criteria

1. **5-minute demo** showcases complete workflow
2. **All interactions** visible in event stream
3. **LLM successfully** creates documents and tasks
4. **Async agents** can extend functionality
5. **Test coverage** enables confident changes

## Technical Risks & Mitigations

| Risk                                | Mitigation                                     |
| ----------------------------------- | ---------------------------------------------- |
| MCP/Obsidian integration complexity | Build internal markdown editor as fallback     |
| LLM response latency                | Pre-cache demo responses, show loading states  |
| Event ordering issues               | Use LiveStore's built-in conflict resolution   |
| Demo reliability                    | Comprehensive Playwright tests, rehearsal mode |

## Next Steps

1. Review and approve design
2. Set up LiveStore schema
3. Implement basic chat + event stream
4. Add LLM integration
5. Build tool adapters
6. Create demo workflow
