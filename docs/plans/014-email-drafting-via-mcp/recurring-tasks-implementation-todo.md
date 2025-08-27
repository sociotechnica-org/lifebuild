# Recurring Tasks Implementation TODO

## Overview

Implement a minimal recurring task system with simple interval-based scheduling, customizable prompts, and server-side execution. This will enable background agents to run tasks on a schedule.

Each phase delivers working, QA-able software with a complete vertical slice through all layers.

## Phase 1: Basic Recurring Task Creation & Display ✅

**Goal**: Users can create recurring tasks with intervals and view them in a list

### Backend

- [x] Add to `packages/shared/src/schema.ts`:
  - `recurring_tasks` table (id, name, description, prompt, intervalHours, lastExecutedAt, nextExecutionAt, enabled, projectId, createdAt, updatedAt)
  - `recurring_task.create` event and materializer
  - Calculate `nextExecutionAt` on creation
- [x] Add to `packages/shared/src/events.ts`:
  - `recurring_task.create` event definition
- [x] Add to `packages/shared/src/queries.ts`:
  - `getRecurringTasks(db): RecurringTask[]`
  - `getRecurringTaskById(db, id): RecurringTask | null`
- [x] Create `packages/shared/src/utils/scheduling.ts`:
  - `calculateNextExecution(now: number, intervalHours: number): number`

### Frontend

- [x] Create `packages/web/src/components/recurring-tasks/RecurringTasksList.tsx`
  - Display list of tasks (name, interval, next execution)
  - Include empty state
- [x] Create `packages/web/src/components/recurring-tasks/RecurringTaskForm.tsx`
  - Name and description fields
  - Prompt textarea
  - Interval selector (hours)
  - Submit button
- [x] Create `packages/web/src/hooks/useRecurringTasks.ts`
  - Subscribe to recurring tasks query
  - Provide create operation
- [x] Add "Recurring Tasks" to task board as new lane
  - Show list of recurring tasks
  - Add task button opens form

### Tests

- [x] Unit test: recurring_task.create event and materializer
- [x] Unit test: calculateNextExecution
- [x] Component test: RecurringTaskForm submission
- [x] E2E test: Create recurring task and see it in list

**QA Scenario**: User navigates to task board, sees recurring tasks lane, creates a task with name, prompt, and 4-hour interval, sees it appear with calculated next execution time.

**Deliverable**: ✅ PR #137 - feat: Add Phase 1 recurring tasks functionality

---

## Phase 2: Task Editing, Deletion & Enable/Disable ✅

**Goal**: Users can edit, delete, and enable/disable recurring tasks

### Backend

- [x] Add to `packages/shared/src/events.ts`:
  - `recurring_task.update` event
  - `recurring_task.delete` event
  - `recurring_task.enable` event
  - `recurring_task.disable` event
- [x] Add materializers for update/delete/enable/disable
  - Recalculate `nextExecutionAt` on update/enable
  - Set `nextExecutionAt` to null on disable

### Frontend

- [x] Create `packages/web/src/components/recurring-tasks/RecurringTaskCard.tsx`
  - Display task details
  - Edit, delete, enable/disable buttons
  - Show enabled/disabled state visually
- [x] Create `packages/web/src/components/recurring-tasks/EditRecurringTaskModal.tsx`
  - Modal for editing task details
  - Pre-fill current values
- [x] Update useRecurringTasks hook:
  - Add update, delete, enable, disable operations
  - Handle optimistic updates
- [x] Update RecurringTasksList:
  - Use RecurringTaskCard for each item
  - Show disabled tasks differently (grayed out)

### Tests

- [x] Unit test: update/delete/enable/disable events and materializers
- [x] Component test: Edit task flow
- [x] Component test: Enable/disable toggle
- [x] E2E test: Edit task and see updates
- [x] E2E test: Disable task and see visual change

**QA Scenario**: User can edit a task's name, prompt, or interval, disable it (grays out, no next execution shown), re-enable it (next execution recalculated), and delete it.

**Deliverable**: ✅ PR #140 - feat: Implement Phase 2 recurring tasks - edit, delete, enable/disable

---

## Phase 3: Manual Execution & Basic History ✅

**Goal**: Users can manually trigger tasks and see execution history

### Backend

- [x] Add to `packages/shared/src/schema.ts`:
  - `task_executions` table (id, recurringTaskId, startedAt, completedAt, status, output, createdTaskIds)
- [x] Add to `packages/shared/src/events.ts`:
  - `recurring_task.execute` event (manual trigger)
  - `task_execution.start` event
  - `task_execution.complete` event
  - `task_execution.fail` event
- [x] Add execution materializers:
  - Create execution record on start
  - Update task's lastExecutedAt
  - Calculate next execution
- [x] Add to `packages/shared/src/queries.ts`:
  - `getTaskExecutions(db, taskId): TaskExecution[]`
  - `getLatestExecution(db, taskId): TaskExecution | null`

### Frontend

- [x] Add manual trigger button to RecurringTaskCard
  - Show loading state during execution
  - Disabled if already running
- [x] Create `packages/web/src/components/recurring-tasks/ExecutionHistory.tsx`
  - Show last 5 executions inline in card
  - Status badges (success/failed/running)
  - Execution timestamp
- [x] Update useRecurringTasks hook:
  - Add manual trigger operation
  - Subscribe to execution history
- [x] Create mock execution handler (simulates completion):
  - Waits 2 seconds
  - Marks as complete with mock output

### Tests

- [x] Unit test: execution events and materializers
- [x] Component test: Manual trigger button
- [x] Component test: Execution history display
- [x] E2E test: Trigger task manually and see history

**QA Scenario**: User clicks "Run Now" on a task, sees it enter running state, completes after a few seconds, and execution appears in history with timestamp.

**Deliverable**: ✅ PR #141 - feat: Implement Phase 3 recurring tasks execution functionality

---

## Phase 4: Server-Side Execution (Basic)

**Goal**: Server checks for due tasks and executes them with mock handler

### Backend (Server)

- [ ] Create `packages/server/src/services/recurring-tasks.ts`:
  - `checkAndExecuteTasks(storeId): Promise<void>`
  - `executeTask(task, storeId): Promise<void>`
- [ ] Implement execution checker:
  - Check every 5 minutes (configurable)
  - Find tasks where nextExecutionAt < now
  - Execute if not already running
  - Mock execution (wait 2 seconds, mark complete)
- [ ] Create `packages/server/src/services/scheduler.ts`:
  - Start interval timer on server startup
  - Check all configured stores
- [ ] Emit execution events to store:
  - task_execution.start when beginning
  - task_execution.complete when done
  - Update lastExecutedAt and nextExecutionAt

### Frontend

- [ ] Update ExecutionHistory to show server-triggered executions
- [ ] Add "Automatic" vs "Manual" badge to executions
- [ ] Show countdown to next execution
- [ ] Auto-refresh execution list

### Tests

- [ ] Unit test: checkAndExecuteTasks logic
- [ ] Unit test: execution window detection
- [ ] Integration test: Server executes due task
- [ ] E2E test: Wait for scheduled execution and verify

**QA Scenario**: User creates a task with 1-minute interval (for testing), waits, and sees it automatically execute when due, with execution appearing in history.

**Deliverable**: PR with basic server-side execution

---

## Phase 4.5: DEPENDENCY - Multi-Store & Agentic Loop Migration

**CRITICAL**: Before Phase 5, the following must be completed:

1. **Multi-Store Server Support** (`docs/plans/007-multiplayer/multi-store-server-support.md`)
   - At minimum, Phase 1: Manual Multi-Store Support must be complete
   - Server must handle multiple stores via environment variables
   - Store isolation must be verified

2. **Server-Side Agentic Loop** (`docs/plans/014-email-drafting-via-mcp/server-agentic-loop-implementation-todo.md`)
   - At minimum, Phases 1-3 must be complete
   - Server-side agentic loop must be functional
   - Tools must be migrated to server
   - Client-server communication must work

**Why this ordering is critical**:

- Without multi-store support, moving agentic loop to server breaks production
- Without server-side agentic loop, recurring tasks can't execute LLM prompts
- These are foundational infrastructure changes that enable Phase 5

**Alternative if dependencies aren't ready**:

- Continue with mock executions only
- Defer LLM integration until infrastructure is ready
- Focus on UI and scheduling features

---

## Phase 5: LLM Integration for Executions

**Goal**: Server executes tasks using actual LLM with custom prompts

**Prerequisites**:

- ✅ Multi-store server support is deployed
- ✅ Server-side agentic loop is working in production

### Backend (Server)

- [ ] Move agentic loop to server:
  - Port relevant code from `packages/web/src/components/chat/ChatInterface`
  - Create `packages/server/src/services/agentic-loop.ts`
- [ ] Update executeTask to use LLM:
  - Pass task prompt to LLM
  - Include project context if projectId set
  - Handle tool calls (create_task, etc.)
  - Store LLM response in execution output
- [ ] Error handling:
  - Catch LLM errors
  - Mark execution as failed
  - Store error in output
  - Retry with backoff (max 3 attempts)
- [ ] Track created artifacts:
  - If LLM creates tasks, store IDs
  - Link to execution record

### Frontend

- [ ] Create `packages/web/src/components/recurring-tasks/ExecutionDetailModal.tsx`
  - Show full LLM output
  - Display created tasks with links
  - Show error details if failed
- [ ] Update ExecutionHistory:
  - Click execution to see details
  - Show created task count

### Tests

- [ ] Unit test: LLM prompt formatting
- [ ] Integration test: LLM execution with mock
- [ ] E2E test: Task execution creates real tasks

**QA Scenario**: User creates a task with prompt "Create a task called 'Test Task'", triggers it, sees execution complete, and finds the created task on the board.

**Deliverable**: PR with LLM integration for executions

---

## Phase 6: Advanced Features & Monitoring

**Goal**: Add execution monitoring, better scheduling, and project associations

### Backend

- [ ] Enhanced scheduling:
  - Support day intervals (not just hours)
  - Execution windows to prevent drift
  - Skip missed executions option
- [ ] Project context:
  - Pass project data to LLM when projectId set
  - Include project contacts for email tasks
  - Access project documents
- [ ] Execution metrics:
  - Track execution duration
  - Count success/failure rates
  - Monitor token usage

### Frontend

- [ ] Improve RecurringTaskForm:
  - Project selector dropdown
  - Interval in hours or days
  - Advanced options (skip missed, etc.)
- [ ] Create execution statistics view:
  - Success rate chart
  - Average duration
  - Recent failures
- [ ] Add to admin dashboard:
  - All recurring tasks across stores
  - Execution metrics
  - Failed task alerts

### Tests

- [ ] Test project context in prompts
- [ ] Test day-based intervals
- [ ] Test execution window logic
- [ ] Test metrics collection

**QA Scenario**: User creates project-associated task, executes it, and LLM has access to project context. Admin can see execution metrics in dashboard.

**Deliverable**: PR with advanced features and monitoring

---

## Design Decisions

To keep scope minimal:

- **Simple intervals only**: Hours or days, no complex cron expressions
- **No timezone handling initially**: Use server timezone
- **Skip missed executions**: If server was down, don't catch up
- **Single execution**: Skip if already running rather than queue
- **Fixed timeout**: 5 minutes max execution time
- **3 retry attempts**: With exponential backoff
- **Basic prompts**: No templates or variables initially
- **Project context only**: Executions access only associated project
- **Task board integration**: Lane in existing board rather than new nav
- **Inline history**: Show last 5 executions in card
- **Truncated output**: Show first 500 chars in UI

## Success Criteria

- [ ] Tasks can be created with simple intervals (hours/days)
- [ ] Tasks show in recurring tasks lane on task board
- [ ] Manual trigger works immediately
- [ ] Server executes tasks on schedule
- [ ] LLM integration works with custom prompts
- [ ] Execution history is visible
- [ ] Failed executions are retried
- [ ] Multiple stores are supported

## Technical Notes

- Use task board for UI rather than separate page
- Start with mock executions before LLM integration
- Reuse existing agentic loop code from frontend
- Keep execution windows generous (5 minutes) to avoid misses
- Store limited history (last 20 executions per task)
- Use existing event system for real-time updates
