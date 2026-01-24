# 038: Task Queue Redesign

## Problem Statement (Issue #387)

When users create a Bronze project with multiple tasks, those tasks get split into separate items in the Bronze queue. Users want them to stay together as one project/to-do list where they can work through tasks cohesively.

**Current behavior**: The Bronze queue is task-centric - it pulls individual tasks from:

- Orphaned tasks (no projectId)
- Bronze-stream projects (backlog or active)
- Active non-tabled projects (any stream, except tabled Gold/Silver)

**Desired behavior**: The Bronze queue should be project-centric, allowing users to:

- See and prioritize Bronze _projects_ (not individual tasks)
- Keep tasks grouped within their parent project
- Manage tactical task execution separately via a "Task Queue"

## Core Insight

The current "Bronze Queue" conflates two distinct concepts:

1. **Project Prioritization** - "Which Bronze projects am I working on?"
2. **Task Execution** - "What specific tasks am I doing this week?"

The fix is to separate these:

- **Bronze Project Queue** → Lives in Sorting Room, manages project prioritization
- **Task Queue** → New concept, manages tactical weekly task execution

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SORTING ROOM                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Gold        │  │ Silver      │  │ Bronze              │ │
│  │ (1 project) │  │ (1 project) │  │ (multiple projects) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  Projects are prioritized and "tabled" here                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      TASK QUEUE                             │
│                                                             │
│  "What am I accomplishing this week?"                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Task 1 (from Project A)                              │  │
│  │ Task 2 (from Project B)                              │  │
│  │ Task 3 (orphan/quick task)                           │  │
│  │ Task 4 (from Project A)                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Tasks from ALL active/tabled projects + orphan tasks      │
└─────────────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Bronze Slot Becomes Multi-Project

Currently: One Gold, one Silver, bronze is task-based
Proposed: One Gold, one Silver, **multiple Bronze projects**

The Bronze section in the Sorting Room becomes a prioritized list of Bronze projects (not tasks).

### 2. New Task Queue Concept

A separate queue for tactical task planning that:

- Contains individual tasks from any tabled/active project
- Allows cross-project task prioritization for the week
- Is managed separately from project prioritization

### 3. Project-Level Task Queue Integration

Within a project view, each task shows:

- Whether it's currently in the Task Queue
- Ability to add/remove from Task Queue
- When creating a task, option to immediately add to Task Queue

### 4. Quick Tasks (Future Consideration)

Consider modeling "Quick Tasks" as minimal Bronze projects rather than orphan tasks:

- Natural prioritization alongside other Bronze projects
- Can expand into full projects with task lists if needed
- Deferred to a later phase to limit scope

## Data Model Changes

### New Table: `taskQueue`

```sql
CREATE TABLE taskQueue (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'removed'
  addedAt TEXT NOT NULL,
  addedBy TEXT,
  removedAt TEXT
);
```

### Modified Table: `tableConfiguration`

```sql
-- Change bronzeProjectId (singular) to support multiple
-- Option A: New table for tabled bronze projects
CREATE TABLE tableBronzeProjects (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  tabledAt TEXT NOT NULL,
  tabledBy TEXT,
  removedAt TEXT
);

-- Option B: JSON array in tableConfiguration
-- bronzeProjectIds: TEXT  -- JSON array of project IDs
```

### Deprecate: `tableBronzeStack`

The existing `tableBronzeStack` table (task-based) will be deprecated and eventually removed.

## UI Changes

### Sorting Room - Bronze Panel

**Before (current)**:

- "TABLED" section shows individual tasks
- "AVAILABLE" section shows eligible tasks
- Quick-add creates orphan tasks

**After (proposed)**:

- "ON TABLE" section shows tabled Bronze projects (list)
- "BACKLOG" section shows Bronze projects in queue
- Each project card shows task count/progress
- Click to expand project and see tasks inline

### Task Queue (New View)

New component accessible from:

- Life Map (as a panel or tab)
- Potentially its own route

Shows:

- Prioritized list of tasks for the week
- Task origin (which project)
- Drag-and-drop reordering
- Quick completion (checkbox)
- "Add task" to quickly add orphan tasks

### Project Detail View

Tasks gain new affordances:

- Badge/icon showing "in queue" status
- "Add to Queue" / "Remove from Queue" action
- When creating task, checkbox "Add to Task Queue"

## Migration Strategy

The migration is handled incrementally across the PRs:

1. **PR1** introduces the new project-based Bronze system while preserving existing `tableBronzeStack` data
2. **PR2** migrates existing `tableBronzeStack` entries to the new `taskQueue` table
3. **PR4** removes the deprecated `tableBronzeStack` after confirming the migration is stable

This approach ensures:

- No data loss during transition
- Users can continue working during the rollout
- Rollback is possible if issues arise

## Proposed PR Breakdown

### PR1: Bronze Queue Becomes Project-Based

**Title**: "Bronze queue shows projects instead of tasks"

This PR transforms the Bronze section of the Sorting Room from task-centric to project-centric.

**User-facing changes:**

- Bronze panel in Sorting Room shows a list of Bronze _projects_ (not individual tasks)
- Multiple Bronze projects can be "tabled" simultaneously
- Each project card shows task count and completion progress
- Drag-and-drop to prioritize and table Bronze projects
- Quick-add creates a new Bronze project (not an orphan task)

**Technical scope:**

- Add `tableBronzeProjects` table schema
- Add events: `bronzeProjectTabled`, `bronzeProjectRemoved`, `bronzeProjectsReordered`
- Add materializers and queries
- Update `BronzePanel.tsx` to render projects instead of tasks
- Update `useTableState` hook to manage bronze projects
- Update Life Map table rendering for multi-bronze
- Storybook stories for new Bronze panel

**Data handling:**

- New installs start fresh with project-based bronze
- Existing `tableBronzeStack` data preserved (will be migrated in PR2)

---

### PR2: Task Queue Side Panel

**Title**: "Add Task Queue side panel to Life Map"

This PR introduces the Task Queue as a side panel on the Life Map, migrating the current task-based Bronze queue behavior to this new location.

**User-facing changes:**

- New collapsible side panel on Life Map showing the Task Queue
- Task Queue contains individual tasks for tactical weekly planning
- Tasks from all active/tabled projects are eligible
- Drag-and-drop task reordering
- Quick-add for orphan tasks (tasks not attached to any project)
- Checkbox to mark tasks complete directly from queue
- Each task shows its parent project name

**Technical scope:**

- Add `taskQueue` table schema
- Add events: `taskQueued`, `taskDequeued`, `taskQueueReordered`
- Add materializers and queries
- Create `TaskQueuePanel.tsx` component
- Add `useTaskQueue` hook
- Integrate panel into Life Map layout
- Migration: copy existing `tableBronzeStack` entries to `taskQueue`
- Storybook stories

---

### PR3: Project View Queue Integration

**Title**: "Show task queue status in project views"

This PR connects the Task Queue to project detail views, allowing users to manage queue membership from within a project.

**User-facing changes:**

- Tasks in project views show a badge/icon if they're in the Task Queue
- "Add to Queue" / "Remove from Queue" action on task cards
- When creating a new task, option to immediately add it to the Task Queue
- Consistent visual language between Task Queue panel and project views

**Technical scope:**

- Add `isTaskQueued$(taskId)` reactive query
- Update task card components to show queue status
- Add queue actions to task context menu / action buttons
- Update task creation form with "Add to Queue" checkbox
- Update relevant Storybook stories

---

### PR4: Cleanup Deprecated Bronze Stack

**Title**: "Remove deprecated tableBronzeStack"

This PR removes the old task-based bronze stack after the new system is stable.

**Scope:**

- Remove `tableBronzeStack` table schema
- Remove related events and materializers
- Remove old BronzePanel task-based code paths
- Update any remaining references
- Verify no data loss (migration already complete from PR2)

## Open Questions

1. **Quick Tasks**: Should we convert orphan tasks to minimal Bronze projects?
   - Pro: Natural prioritization alongside other Bronze projects, can expand into full projects
   - Con: More complexity, orphan tasks are simpler for quick one-offs
   - Recommendation: Defer to a future PR, keep orphan tasks for now

2. **Task Queue Scope**: Should the Task Queue include tasks from Gold/Silver projects?
   - Recommendation: Yes, all active/tabled projects contribute eligible tasks

3. **Weekly Reset**: Should the Task Queue auto-clear weekly?
   - Recommendation: No, let users manage manually (incomplete tasks roll over)

4. **Maximum Bronze Projects**: Should there be a limit on tabled Bronze projects?
   - Recommendation: Soft guidance (e.g., "You have 8 Bronze projects tabled, consider focusing") but no hard limit

5. **Task Queue Panel Behavior**: Collapsible or always visible?
   - Recommendation: Collapsible, remembers user's last state

## Success Criteria

**PR1 - Bronze Project Queue:**

- [ ] Bronze section in Sorting Room shows projects, not individual tasks
- [ ] Multiple Bronze projects can be tabled simultaneously
- [ ] Projects display task count and progress
- [ ] Issue #387 resolved: project tasks stay grouped

**PR2 - Task Queue:**

- [ ] Task Queue side panel visible on Life Map
- [ ] Tasks from all active projects can be queued
- [ ] Existing bronze stack data migrated to task queue
- [ ] Orphan tasks can be created via quick-add

**PR3 - Project Integration:**

- [ ] Tasks show "in queue" status in project views
- [ ] Users can add/remove tasks from queue within project view

**PR4 - Cleanup:**

- [ ] Old tableBronzeStack removed
- [ ] No regressions in functionality

## References

- Issue #387: https://github.com/sociotechnica-org/work-squared/issues/387
- Current Sorting Room: `packages/web/src/components/new/sorting-room/`
- Current Bronze Stack: `tableBronzeStack` in schema.ts
- Whiteboard diagrams: See attachments

## Appendix: Current vs. Proposed Mental Model

### Current Mental Model

```
Bronze Queue = Tasks I should do soon
- Task A (orphan)
- Task B (from Project X)
- Task C (from Project Y)
- Task D (from Project X)
```

Tasks from the same project are scattered. Hard to "work on Project X" because its tasks are mixed with everything else.

### Proposed Mental Model

```
Bronze Project Queue = Projects I'm working on
- Project X (3 tasks)
- Project Y (2 tasks)
- Quick Task Z (standalone)

Task Queue = What I'm doing this week
- Task B (from Project X)
- Task C (from Project Y)
- Task A (orphan)
```

Projects stay coherent. Task Queue is for tactical "this week" planning across all projects.
