# Sorting Room – Queue Management & Table Configuration

## Overview

The Sorting Room enables Directors to manage the three priority streams (Gold, Silver, Bronze) through drag-and-drop reordering and quick-action buttons. Changes update The Table immediately in real-time. This is a continuous management interface, not a one-time activation ceremony.

## Goals

1. Implement Sorting Room route with tab-style interface for Gold, Silver, and Bronze streams.
2. Enable drag-and-drop reordering within queues and between table/queue states.
3. Provide quick-action buttons for fast bulk operations without drag-and-drop.
4. Support Bronze mode configuration (Minimal, Target +X, Maximal).
5. Update Table Bar in real-time as changes are made.

## Non-Goals

- Editing project details (handled in Project Rooms)
- Staffing AI workers (Roster Room)
- Creating new projects (Drafting Room)
- Formal "activation" ceremony - changes are immediate

## Current State

- No Sorting Room route exists in `components/new`
- Navigation link exists in `NewUiShell.tsx` but is disabled (opacity: 0.5)
- `tableConfiguration` and `tableBronzeStack` tables exist and are functional
- `useTableState()` hook provides table state management
- Existing events: `tableGoldAssigned`, `tableSilverAssigned`, `bronzeTaskAdded`, `bronzeTaskRemoved`, `bronzeStackReordered`

## Design Summary

### Layout

Tab-style interface with Gold, Silver, Bronze as tabs:

- **Collapsed state**: Each tab shows summary card with tabled item name and queue/available count
- **Expanded state**: Only one tab expanded at a time; takes full width
- **Table Bar**: Fixed at bottom, shows current tabled items across all three streams

### Gold/Silver Tabs (Projects)

Show Stage 4 projects (`status: 'backlog'`, `stage: 4`) filtered by stream (`gold`/`silver`):

- **"On Table" slot**: Shows currently tabled project (from `tableConfiguration.goldProjectId`/`silverProjectId`)
- **Queue list**: Remaining projects ordered by `queuePosition`
- **Interactions**:
  - Drag project to table slot → replaces current (old moves to queue position 1)
  - Drag within queue → reorder priorities
  - "Activate to Table" button on queue items
  - "Release to Queue" button on tabled item
- **Empty slot option**: Allow intentionally leaving Gold or Silver empty

### Bronze Tab (Tasks)

Show tasks from all `active` projects (where `projectLifecycleState.status === 'active'`):

- **"Tabled" section**: Items in `tableBronzeStack` (status: 'active'), ordered by position
- **"Available" section**: Remaining tasks NOT in bronze stack - a filterable/sortable pool, not a fixed queue
- **Interactions**:
  - Drag from available → tabled (appends to end)
  - Drag from tabled → available (removes from stack)
  - Drag within tabled → reorder
  - "Add to Table" button on available items (appends to end)
  - "Remove from Table" button on tabled items
- **Bronze mode picker**: Minimal / Target +X / Maximal (updates `tableConfiguration.bronzeMode`)
- **Validation warning**: Show inline warning if fewer than 3 tasks tabled

## Technical Implementation

### 1. Route and Component Structure

```
packages/web/src/
├── constants/routes.ts          # Add NEW_SORTING_ROOM route
├── components/new/
│   ├── layout/NewUiShell.tsx    # Enable nav link
│   └── sorting-room/
│       ├── SortingRoom.tsx      # Main container with tab state
│       ├── StreamTab.tsx        # Tab header + collapsed summary
│       ├── GoldSilverPanel.tsx  # Expanded view for Gold/Silver
│       ├── BronzePanel.tsx      # Expanded view for Bronze
│       ├── TableDropZone.tsx    # Drop target for "on table" slot
│       ├── ProjectCard.tsx      # Draggable project card
│       ├── TaskCard.tsx         # Draggable task card
│       ├── BronzeModePicker.tsx # Minimal/Target/Maximal selector
│       └── sorting-room.css     # Styles
```

### 2. Data Queries

**Gold/Silver Projects**:

```typescript
// Filter projects: status = 'backlog', stage = 4, stream = 'gold'/'silver'
const goldProjects = allProjects
  .filter(p => {
    const lifecycle = resolveLifecycleState(p.projectLifecycleState)
    return lifecycle.status === 'backlog' && lifecycle.stage === 4 && lifecycle.stream === 'gold'
  })
  .sort((a, b) => (a.queuePosition ?? 999) - (b.queuePosition ?? 999))
```

**Bronze Tasks**:

```typescript
// Get all tasks from active projects (not tabled yet)
const activeProjectIds = allProjects
  .filter(p => resolveLifecycleState(p.projectLifecycleState).status === 'active')
  .map(p => p.id)

const allBronzeTasks = allTasks.filter(
  t => activeProjectIds.includes(t.projectId) && t.archivedAt === null && t.status !== 'done' // Exclude completed tasks
)

const tabledTaskIds = new Set(activeBronzeStack.map(e => e.taskId))
const availableTasks = allBronzeTasks.filter(t => !tabledTaskIds.has(t.id))
```

**Table Configuration**:

- Use existing `useTableState()` hook for configuration and bronze stack
- `getTableConfiguration$` for `goldProjectId`, `silverProjectId`, `bronzeMode`
- `getActiveBronzeStack$` for tabled bronze tasks

### 3. Event Emissions

**Gold/Silver Table Assignment**:

```typescript
// Assign to table
store.commit(events.tableGoldAssigned({ projectId, updatedAt: new Date() }))

// Update lifecycle of new tabled project
store.commit(
  events.projectLifecycleUpdated({
    projectId,
    lifecycleState: { ...lifecycle, slot: 'gold' },
    updatedAt: new Date(),
  })
)

// If swapping, update old tabled project
store.commit(
  events.projectLifecycleUpdated({
    projectId: oldProjectId,
    lifecycleState: { ...oldLifecycle, slot: null, queuePosition: 0 },
    updatedAt: new Date(),
  })
)
```

**Gold/Silver Queue Reorder**:

```typescript
// Update queuePosition for affected projects
reorderedProjects.forEach((project, index) => {
  store.commit(
    events.projectLifecycleUpdated({
      projectId: project.id,
      lifecycleState: { ...lifecycle, queuePosition: index },
      updatedAt: new Date(),
    })
  )
})
```

**Bronze Stack Operations**:

```typescript
// Add to table (use existing events)
store.commit(
  events.bronzeTaskAdded({
    id: generateId(),
    taskId,
    position: nextPosition,
    insertedAt: new Date(),
    insertedBy: actorId,
  })
)

// Remove from table
store.commit(
  events.bronzeTaskRemoved({
    id: stackEntryId,
    removedAt: new Date(),
  })
)

// Reorder tabled items
store.commit(
  events.bronzeStackReordered({
    ordering: newOrdering.map((entry, i) => ({ id: entry.id, position: i })),
    updatedAt: new Date(),
  })
)
```

### 4. Drag and Drop

Use `@dnd-kit` (already in codebase):

- `DndContext` at SortingRoom level
- `SortableContext` for queue lists
- `useDroppable` for table drop zones
- `useDraggable` / `useSortable` for cards

### 5. Table Bar Integration

The existing `TableBar` and `TableSlot` components need to be wired up:

- Query `goldProjectId`/`silverProjectId` and fetch project names
- Query `activeBronzeStack` and show top task + count
- Already positioned at bottom via `NewUiShell`

## Key Files Reference

- [packages/web/src/components/new/drafting-room/DraftingRoom.tsx](packages/web/src/components/new/drafting-room/DraftingRoom.tsx) - `deriveTier()`, lifecycle state patterns
- [packages/shared/src/types/planning.ts](packages/shared/src/types/planning.ts) - `ProjectLifecycleState` with `queuePosition`, `stream`, `slot`
- [packages/shared/src/livestore/schema.ts](packages/shared/src/livestore/schema.ts) - `tableConfiguration`, `tableBronzeStack` tables
- [packages/web/src/hooks/useTableState.ts](packages/web/src/hooks/useTableState.ts) - Table state management hook
- [packages/shared/src/table-state.ts](packages/shared/src/table-state.ts) - `getNextBronzeTasks()` helper
- [packages/web/src/utils/statusTaskReordering.ts](packages/web/src/utils/statusTaskReordering.ts) - Drag-drop reorder patterns

## Simplifications for MVP

Per requirements, initially skip:

- Tags (quick win, low focus, maintenance, etc.)
- Duration/time estimates on cards
- Bronze tier label on task cards (redundant - they're in Bronze tab)
- Category badges on project cards
- Progress bars on project cards

## Storybook Stories

Create stories in `SortingRoom.stories.tsx`:

- **Default**: All tabs collapsed, showing summaries
- **GoldExpanded**: Gold tab open with projects in queue
- **SilverExpanded**: Silver tab open with projects
- **BronzeExpanded**: Bronze tab open with tabled and available tasks
- **EmptyGold**: Gold queue empty, showing "intentionally empty" option
- **BronzeMinimum**: Warning state with fewer than 3 tasks tabled
- **BronzeModes**: Each bronze mode selected (Minimal/Target/Maximal)

## Testing

- Unit tests for queue position calculation logic
- Unit tests for bronze stack add/remove/reorder
- Component tests for drag-drop interactions
- Integration test: reorder queue → verify lifecycle events emitted
- Integration test: assign to table → verify table configuration updated

## Room Chat Context (Future)

When Cameron AI assistant is integrated, provide context:

```typescript
{
  goldSelected: projectName | null,
  silverSelected: projectName | null,
  bronzeMode: 'minimal' | 'target' | 'maximal',
  bronzeTabledCount: number,
  bronzeAvailableCount: number,
  validation: { bronzeMinimumMet: boolean }
}
```

## PR Breakdown

### PR1 - Core Sorting Room UI

- Add `/new/sorting-room` route
- Enable navigation link in `NewUiShell`
- Build tab-style layout with collapsed summaries
- Display queue data (read-only initially)
- Wire up Table Bar to show real data

### PR2 - Gold/Silver Drag and Drop

- Implement drag-and-drop for Gold/Silver panels
- Table drop zone with swap logic
- Queue reordering
- Emit `projectLifecycleUpdated` events for queue position changes
- Quick-action buttons (Activate to Table / Release to Queue)

### PR3 - Bronze Task Management

- Implement Bronze panel with tabled/available sections
- Drag between sections (add/remove from stack)
- Reorder within tabled section
- Quick-action buttons (Add to Table / Remove)
- Use existing bronze stack events

### PR4 - Bronze Mode Configuration

- Add BronzeModePicker component
- Emit `bronzeModeUpdated` events
- Show validation warning for <3 tasks
- Target +X input for target mode

## Dependencies

- Requires projects with `status: 'backlog'`, `stage: 4`, and `stream` set (from Drafting Room)
- Requires tasks associated with `active` projects
- Table Bar already exists in `NewUiShell`

## Follow-ups (Post-MVP)

- Filtering/sorting controls for available tasks (by project, priority, due date)
- Batch operations (select multiple, add all to table)
- Undo for accidental removals
- History log of table changes
- Cameron AI chat integration in room
