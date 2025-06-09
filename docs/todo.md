# Work Squared Implementation Todos - Phase 1 & 2 Parallel

## Quick Reference

- **Design Doc**: [work-squared-demo-design.md](./work-squared-demo-design.md)
- **Goal**: Build chat system AND Kanban board in parallel
- **Strategy**: Vertical slices - each issue includes events → UI → tests
- **Approach**: 2 Claude instances working on independent tracks

## Parallelization Strategy

1. **Instance 1**: Owns Chat/LLM system (Phase 1)
2. **Instance 2**: Owns Kanban board system (Phase 2)
3. **Both**: Work on vertical slices independently
4. **Day 3-4**: Integration and polish together

## Shared Setup (Day 0 - Both Instances)

### Priority 0: Cloudflare Deployment (Do First!)

#### Issue #0: Deploy to Cloudflare Pages

**Branch**: `feat/cloudflare-deploy`
**Assignee**: Either instance
**Critical**: This enables PR preview deployments for all subsequent work

Tasks:

- [ ] Connect GitHub repo to Cloudflare Pages
- [ ] Configure build settings:
  - Build command: `pnpm build`
  - Build output directory: `dist`
  - Root directory: `/`
- [ ] Set up environment variables in Cloudflare dashboard:
  - `VITE_LIVESTORE_SYNC_URL` = `https://worksquared.your-subdomain.workers.dev`
- [ ] Configure preview deployments for all PRs
- [ ] Test deployment with current main branch
- [ ] Add deployment URLs to README

Benefits:

- **Every PR gets a unique preview URL** for QA
- **Real environment** for testing WebSocket sync
- **No local setup needed** for reviewers

---

### Issue #0.5: Testing Infrastructure Setup ✅ COMPLETED

**Branch**: `feat/testing-setup`
**Assignee**: Either instance
**Critical**: This enables test-driven development for all subsequent work

**UPDATE**: Switched from Jest to Vitest for better ESM/LiveStore compatibility

Tasks:

- [x] Vitest and React Testing Library setup:
  - [x] Install dependencies: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`
  - [x] Configure `vitest.config.ts` for React/TypeScript/LiveStore
  - [x] Update test scripts in package.json
  - [x] Update `src/test-utils.tsx` for Vitest compatibility
- [ ] Playwright setup (REMOVED - LiveStore compatibility issues):
  - [ ] ~~Install `@playwright/test`~~ (removed due to LiveStore dependency issues)
  - [ ] ~~Create `playwright.config.ts` with Chrome, Firefox configs~~ (removed)
  - [ ] ~~Set up test fixtures for LiveStore initialization~~ (removed)
  - [ ] ~~Add GitHub Actions workflow for E2E tests~~ (removed)
  - [ ] ~~Configure Playwright for visual regression testing~~ (removed)
- [x] Storybook setup:
  - [x] Install `@storybook/react-vite` and dependencies
  - [x] Initialize Storybook with `npx storybook@latest init`
  - [x] Configure for TypeScript and Tailwind CSS
  - [x] Create `.storybook/preview.tsx` with LiveStore decorators
  - [x] Set up component story examples
  - [x] Configure Storybook test runner
  - [ ] Add Chromatic for visual regression (optional - skipped for MVP)
- [x] Testing patterns:
  - [x] Update unit tests for Vitest
  - [x] Update component tests for Vitest + LiveStore
  - [ ] ~~Create example E2E test for basic navigation~~ (removed with Playwright)
  - [x] Create example Storybook story for a component
  - [ ] Create visual regression test example (deferred)
- [x] Documentation:
  - [x] Update CLAUDE.md with all test commands
  - [x] Add testing best practices section
  - [x] Document Storybook patterns for LiveStore components

Files created/modified:

- Removed: `jest.config.mjs` (replaced with vitest.config.ts)
- Created: `vitest.config.ts`
- ~~Created: `playwright.config.ts`~~ (removed)
- Updated: `src/test-utils.tsx` (Vitest compatibility)
- Updated: `tests/unit/example.test.ts`
- Updated: `tests/components/example.test.tsx`
- ~~Created: `tests/e2e/smoke.spec.ts`~~ (removed)
- Created: `.storybook/main.ts`
- Created: `.storybook/preview.tsx`
- Created: `src/stories/example.stories.tsx`
- Created: `.github/workflows/test.yml`
- Created: `.env.example`
- Updated: `package.json`
- Updated: `CLAUDE.md`
- Updated: `README.md`

Success Criteria:

- [x] `pnpm test` runs unit tests with Vitest
- [ ] ~~`pnpm test:e2e` runs Playwright tests~~ (removed)
- [x] `pnpm storybook` launches Storybook dev server on port 6010
- [x] `pnpm test:storybook` runs Storybook tests
- [x] Tests run in CI on every PR (unit tests only)
- [ ] ~~Visual regression tests catch UI changes~~ (deferred without Playwright)
- [x] Test utilities available for all future work

**Notes**:

- **Switched to Vitest**: LiveStore itself uses Vitest, providing better ESM/TypeScript compatibility
- **No mocking needed**: Vitest handles LiveStore packages natively without complex transformations
- Storybook configured to run on port 6010 to avoid conflicts
- All test infrastructure optimized for TDD approach

---

### Shared Interfaces & Setup

#### Issue #S1: Core Types and LLM Service Contract

**Branch**: `feat/core-types`
**Assignee**: Both review together
**Critical**: Defines shared contracts to prevent integration issues

Create shared types and service interfaces that both tracks will use:

```typescript
// src/types/index.ts
export interface BaseEvent {
  id: string;
  timestamp: number;
  userId?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: "anthropic" | "openai";
}

// src/types/chat.ts
export interface ChatMessageEvent extends BaseEvent {
  type: "chat.message";
  role: "user" | "assistant" | "system";
  content: string;
  modelId?: string;
  metadata?: {
    streaming?: boolean;
    toolCalls?: ToolCall[];
    error?: string;
    tokenUsage?: TokenUsage;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  result?: any;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// src/types/kanban.ts
export interface TaskEvent extends BaseEvent {
  type: "task.created" | "task.updated" | "task.moved" | "task.deleted";
  taskId: string;
  boardId: string;
  data: Partial<Task>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  column: string;
  position: number;
}

// src/services/llm/types.ts - LLM Service Contract
export interface ILLMService {
  // Core chat functionality
  sendMessage(params: SendMessageParams): Promise<ChatResponse>;
  streamMessage(params: SendMessageParams): AsyncGenerator<StreamChunk>;

  // Tool handling
  registerTool(tool: ToolDefinition): void;
  executeTool(toolCall: ToolCall): Promise<ToolResult>;

  // Model management
  listModels(): Model[];
  getCurrentModel(): Model;
  setModel(modelId: string): void;
}

export interface SendMessageParams {
  content: string;
  modelId?: string;
  systemPrompt?: string;
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  modelId: string;
}

export interface StreamChunk {
  type: "content" | "tool_call" | "error" | "done";
  content?: string;
  toolCall?: ToolCall;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

// src/tools/types.ts - Tool System Types
export interface ITool {
  definition: ToolDefinition;
  execute(parameters: any): Promise<any>;
}

export interface IToolRegistry {
  register(tool: ITool): void;
  get(name: string): ITool | undefined;
  list(): ToolDefinition[];
  execute(toolCall: ToolCall): Promise<ToolResult>;
}
```

Additional setup:

- [ ] Create mock implementation of ILLMService for testing
- [ ] Create mock tool registry
- [ ] Define available models constant
- [ ] Create LiveStore event types for tool executions

Benefits:

- Both tracks use same LLM interface
- Tool system is extensible
- Clear separation between LLM provider and app logic
- Easy to mock for testing

---

## Track A: Chat System (Instance 1)

### Issue #A1: Basic Chat Message Flow

**Branch**: `feat/chat-messages`
**Deliverable**: Users can send messages and see them appear

Tasks:

- [ ] LiveStore setup:
  - [ ] Add ChatMessageEvent to `src/livestore/events.ts`
  - [ ] Add chatMessages table to schema
  - [ ] Create getChatMessages query
  - [ ] Unit tests for materialization
- [ ] UI Components:
  - [ ] Create `src/components/chat/ChatContainer.tsx` (main layout)
  - [ ] Create `src/components/chat/ChatMessages.tsx` (message list)
  - [ ] Create `src/components/chat/ChatMessage.tsx` (individual message)
  - [ ] Create `src/components/chat/ChatInput.tsx` (input field)
  - [ ] Add to MainSection with split view
- [ ] Integration:
  - [ ] Wire ChatInput to dispatch events
  - [ ] Connect ChatMessages to LiveStore query
  - [ ] Add mock assistant responses for now
- [ ] Tests:
  - [ ] Unit tests for components
  - [ ] E2E test: Send message and see it appear

PR must include:

- Screenshot of working chat
- All tests passing
- Preview deployment URL

### Issue #A2: LLM Integration with Streaming

**Branch**: `feat/llm-integration`
**Deliverable**: Real LLM responses with streaming

Tasks:

- [ ] Service implementation:
  - [ ] Create `src/services/llm/llm-service.ts`
  - [ ] Add Anthropic SDK integration
  - [ ] Implement streaming response handler
  - [ ] Create mock service for tests
- [ ] Event updates:
  - [ ] Add streaming metadata to ChatMessageEvent
  - [ ] Handle partial content updates
  - [ ] Add error event types
- [ ] UI updates:
  - [ ] Show typing indicator during streaming
  - [ ] Update message progressively
  - [ ] Handle error states gracefully
- [ ] Configuration:
  - [ ] Add VITE_ANTHROPIC_API_KEY to env
  - [ ] Update `.env.example`
  - [ ] Add API key to Cloudflare deployment
- [ ] Tests:
  - [ ] Unit tests with mock LLM
  - [ ] E2E test: Full conversation flow

### Issue #A3: Model Picker and Chat Polish

**Branch**: `feat/model-picker`
**Deliverable**: Can switch between models, polished chat UX

Tasks:

- [ ] Model selection:
  - [ ] Create `src/components/chat/ModelPicker.tsx`
  - [ ] Add model state to LiveStore
  - [ ] Wire up model switching
  - [ ] Show current model in chat
- [ ] Chat improvements:
  - [ ] Add message timestamps
  - [ ] Implement message retry on error
  - [ ] Add copy button to messages
  - [ ] Markdown rendering for responses
- [ ] Activity tracking:
  - [ ] Add model change events
  - [ ] Track token usage (if available)
- [ ] Tests:
  - [ ] Test model switching
  - [ ] Test markdown rendering
  - [ ] E2E: Switch model mid-conversation

### Issue #A4: Chat Activity Components

**Branch**: `feat/chat-activity`
**Deliverable**: Chat-specific activity item components

Tasks:

- [ ] Create chat activity components:
  - [ ] `src/components/activity/ChatActivityItem.tsx`
  - [ ] Message sent/received indicators
  - [ ] Model change notifications
  - [ ] Error state displays
- [ ] Event formatting:
  - [ ] Human-readable event descriptions
  - [ ] Timestamp formatting
  - [ ] User vs assistant distinction
- [ ] Visual design:
  - [ ] Icon system for different events
  - [ ] Color coding for event types
  - [ ] Compact vs expanded views
- [ ] Tests:
  - [ ] Component renders all event types
  - [ ] Formatting works correctly

Note: This creates the chat-specific components only. The main ActivityPanel will be created in Issue #I2 during integration phase.

---

## Track B: Kanban System (Instance 2)

### Issue #B1: Basic Kanban Board

**Branch**: `feat/kanban-board`
**Deliverable**: Working Kanban board with drag-and-drop

Tasks:

- [ ] LiveStore setup:
  - [ ] Add Task events to `src/livestore/events.ts`
  - [ ] Add boards, columns, tasks tables to schema
  - [ ] Create board queries (getTasks, getColumns)
  - [ ] Unit tests for materialization
- [ ] UI Components:
  - [ ] Create `src/components/kanban/KanbanBoard.tsx`
  - [ ] Create `src/components/kanban/KanbanColumn.tsx`
  - [ ] Create `src/components/kanban/TaskCard.tsx`
  - [ ] Implement drag-and-drop (react-beautiful-dnd or similar)
  - [ ] Add to MainSection (below or beside chat)
- [ ] Initial data:
  - [ ] Create default board with columns
  - [ ] Seed with example tasks
- [ ] Tests:
  - [ ] Unit tests for components
  - [ ] E2E test: Drag task between columns

PR must include:

- Screenshot/GIF of drag-and-drop
- All tests passing
- Preview deployment URL

### Issue #B2: Task CRUD Operations

**Branch**: `feat/task-crud`
**Deliverable**: Can create, edit, delete tasks

Tasks:

- [ ] Create task:
  - [ ] Add "+" button to columns
  - [ ] Create `src/components/kanban/TaskModal.tsx`
  - [ ] Quick-add with just title
  - [ ] Full form for description
- [ ] Edit task:
  - [ ] Click task to open modal
  - [ ] Edit title and description
  - [ ] Show created/updated timestamps
- [ ] Delete task:
  - [ ] Add delete button (with confirmation)
  - [ ] Soft delete (archive) vs hard delete
- [ ] Events for all operations:
  - [ ] Emit appropriate events
  - [ ] Update UI optimistically
  - [ ] Handle conflicts gracefully
- [ ] Tests:
  - [ ] CRUD operations work correctly
  - [ ] Events are emitted properly
  - [ ] UI updates in real-time

### Issue #B3: LLM Kanban Tools

**Branch**: `feat/kanban-tools`
**Deliverable**: LLM can manipulate Kanban board

Tasks:

- [ ] Tool definitions:
  - [ ] Create `src/tools/kanban-tools.ts`
  - [ ] Define tool schemas for LLM
  - [ ] Implement tool handlers
- [ ] Available tools:
  - [ ] createTask(title, description, column)
  - [ ] moveTask(taskId, toColumn)
  - [ ] updateTask(taskId, updates)
  - [ ] listTasks(column?)
- [ ] Integration with chat:
  - [ ] Parse tool calls from LLM responses
  - [ ] Execute tools and emit events
  - [ ] Show tool usage in chat UI
- [ ] Tests:
  - [ ] Tools execute correctly
  - [ ] Board updates from tool calls
  - [ ] Error handling for invalid operations

### Issue #B4: Kanban Activity Components

**Branch**: `feat/kanban-activity`
**Deliverable**: Kanban-specific activity item components

Tasks:

- [ ] Create kanban activity components:
  - [ ] `src/components/activity/KanbanActivityItem.tsx`
  - [ ] Task lifecycle indicators (created/moved/updated/deleted)
  - [ ] Visual column indicators
  - [ ] Link to affected tasks
- [ ] Event formatting:
  - [ ] "Task 'X' created in Backlog"
  - [ ] "Task 'Y' moved to In Progress"
  - [ ] "Task 'Z' updated by AI"
  - [ ] Highlight AI vs manual actions
- [ ] Visual design:
  - [ ] Column color coding
  - [ ] Task preview in activity
  - [ ] Animated state transitions
- [ ] Tests:
  - [ ] Component renders all event types
  - [ ] Links navigate correctly

Note: This creates the kanban-specific components only. The main ActivityPanel will be created in Issue #I2 during integration phase.

---

## Integration Phase (Both Instances)

### Issue #I1: Connect Chat to Kanban Tools

**Branch**: `feat/chat-kanban-integration`
**Assignee**: Both collaborate

Tasks:

- [ ] Register Kanban tools with LLM
- [ ] Update system prompt
- [ ] Test tool execution from chat
- [ ] Update activity log to show connections
- [ ] Demo script for tool usage

### Issue #I2: Unified Activity Panel

**Branch**: `feat/unified-activity`
**Assignee**: Either instance
**Dependencies**: A4 and B4 must be completed

Tasks:

- [ ] Create main activity panel:
  - [ ] `src/components/activity/ActivityPanel.tsx` (main container)
  - [ ] Query all events from LiveStore
  - [ ] Route events to appropriate item components (ChatActivityItem or KanbanActivityItem)
  - [ ] Implement infinite scroll for performance
- [ ] Filtering system:
  - [ ] Filter by event type (chat/kanban/all)
  - [ ] Filter by time range
  - [ ] Search within activity
  - [ ] Save filter preferences
- [ ] Activity features:
  - [ ] Export activity log as JSON/CSV
  - [ ] Jump to related content (message/task)
  - [ ] Activity statistics summary
- [ ] Tests:
  - [ ] Both chat and kanban events appear
  - [ ] Filtering works correctly
  - [ ] Performance with 1000+ events

### Issue #I3: Demo Polish & Workflow

**Branch**: `feat/demo-polish`
**Assignee**: Both collaborate

Tasks:

- [ ] Create demo reset button
- [ ] Add sample conversation starters
- [ ] Polish all UI transitions
- [ ] Create demo video script
- [ ] Final bug fixes

---

## Execution Sequence

### Phase 0: Setup (Both Instances)

1. Issue #0 - Cloudflare deployment
2. Issue #0.5 - Testing infrastructure ✅ COMPLETED
3. Issue #S1 - Shared interfaces and LLM service contract

### Phase 1: Core Features (Parallel)

- **Instance 1**: A1 → A2 (Chat foundation → LLM integration)
- **Instance 2**: B1 → B2 (Kanban board → CRUD operations)

### Phase 2: Enhancement (Parallel)

- **Instance 1**: A3 → A4 (Model picker → Activity log)
- **Instance 2**: B3 → B4 (LLM tools → Activity log)

### Phase 3: Integration (Both)

- I1 → I2 → I3 (Connect systems → Unified experience → Demo polish)

## Success Metrics

- [ ] Can have a conversation with AI
- [ ] Can manipulate Kanban board manually
- [ ] AI can create and move tasks via chat
- [ ] All events visible in activity log
- [ ] Multi-tab sync works perfectly
- [ ] 5-minute demo runs smoothly
- [ ] Zero merge conflicts lasted > 1 hour

## Coordination Guidelines

1. **Daily Syncs**: 15-min check-in on patterns/blockers
2. **Shared Patterns**: Document in CLAUDE.md as discovered
3. **PR Reviews**: Each instance reviews the other's PRs
4. **Integration Testing**: Test preview URLs across features
5. **Conflict Resolution**: Latest PR resolves conflicts

## Notes

- Each PR should be deployable and demoable
- Keep commits focused: `feat(chat): add streaming support`
- Update preview URL in PR description
- Screenshot/GIF for all UI changes
- Run `pnpm test` before pushing
