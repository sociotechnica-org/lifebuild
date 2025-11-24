# Project Execution Rooms – Project Board & Bronze Stack

## Overview

This plan focuses on the execution altitude described in the source doc: the Project Board overlay, Kanban behavior, Bronze stack interactions, pause/complete flows, and integration with workers. It ensures Directors can actually work on projects once The Table is populated.

## Goals

1. Build Project Board overlay UI with Kanban columns (To Do, In Progress, Done), progress ring, worker panel, and Bronze stack controls.
2. Support dual entry points (Life Map card, Table slot) and maintain context when closing or switching projects.
3. Implement task drag/drop, status updates, completion rules, and Bronze auto-pull behavior.
4. Provide pause/resume actions that interact with Priority Queue (paused projects jump to top) and completion that moves project to Decoration stage.
5. Integrate “Assign Tasks to Worker” action that opens Roster Room and reflects worker status updates.

## Non-Goals

- Planning Queue / Sorting interactions.
- Worker creation flows (covered by Roster Room plan).
- Advanced analytics or automation beyond MVP scope.

## Current State

- `ProjectDetailPage` is read-only; no Kanban or execution controls exist in the new UI.
- Task drag/drop and Bronze management still tied to legacy components.

## Technical Implementation Plan

1. **Overlay Infrastructure**
   - Create `ProjectBoardOverlay` rendered via portal when a project is opened from Life Map/Table.
   - Provide breadcrumb header (Table slot or category) plus actions: Close (esc), Pause, Complete, Edit Worker.
   - Use the shared `UrushiVisual` and `ProgressRing` components in the header to reflect lifecycle state.
2. **Kanban Implementation**
   - Use LiveStore mutation events to update task status when dragging between columns (`task.status` field).
   - Provide optional 3-task focus indicator in In Progress column (non-blocking).
   - Display progress ring reflecting Done / total tasks.
3. **Bronze Stack Integration**
   - For Bronze tasks currently on Table, show stack on right rail with ability to mark done or “pull next” per Bronze mode.

   - Auto-pull logic must use the shared `getNextBronzeTasks` helper so behavior matches Sorting Room selections, the singleton `table_configuration`, and existing `table_bronze_stack` entries.
   - Mutations run through `useTableState`/shared schema utilities—never add `storeId` params or alternate queues, since the LiveStore instance already scopes the singleton table.
   - When a task completes, emit `bronze_task_removed` (and optionally `bronze_task_completed`) events so the stack updates atomically before auto-pull fills the gap.
   - Provide indicators when stack falls below 3 tasks and surface Bronze mode context inline.

4. **Worker Panel**
   - Show assigned worker’s synopsis summary, status (Available/Working/Awaiting Review), and quick chat link.
   - “Assign Tasks to Worker” button triggers Roster Room deep-link (Stage 2/3) for adjustments.
5. **Pause/Complete Logic**
   - Pause: confirm dialog, set `ProjectLifecycleState` to the `paused` variant, record reason, return to Life Map and update Priority Queue (project to top of stream).
   - Complete: support both automatic completion when all tasks are Done and manual “Confirm Completion” even if tasks remain (per `mvp-source-of-truth-doc.md:1231-1245`); in both cases set `completedAt`, update Urushi stage to Decoration, remove from Table and queues.
6. **Task Details**
   - Inline task edit drawer for description, assignees, due dates, CODAD type.
   - Comments panel referencing existing comment queries.
7. **Storybook/Test Coverage**
   - Stories for Gold project w/ worker, Silver project paused, Bronze-only tasks, Bronze stack empty warning.
   - Tests covering drag/drop events, bronze auto-pull logic, pause/resume transitions.

## Data & Schema Impact

- Tasks: ensure `status`, `position`, `codadType`, `assignedWorkerId` fields exposed via LiveStore.
- Projects: add `pausedReason`, `completedAt`, `decorationMetadata` for Urushi stage.
- Bronze stack operations consume `table_bronze_stack` events to remove/append entries rather than editing arrays.

## Testing & QA

- Unit tests for Bronze stack reducer and auto-pull logic (including integration with the singleton `table_configuration` record).
- Integration tests simulating drag/drop and verifying LiveStore updates.
- Manual QA: open from Table vs category, pause/resume cycle, worker chat link, Urushi stage transitions.

## Source References

- `mvp-source-of-truth-doc.md:265-360` – Execution altitude description covering Project Board layout, Kanban columns, and worker controls surfaced within the overlay.
- `mvp-source-of-truth-doc.md:705-751` – Table + Bronze behavior dictating how Work-at-Hand projects and Bronze tasks should appear simultaneously on the Life Map and in the overlay.
- `mvp-source-of-truth-doc.md:810-840` – Execution model for working from The Table, completing Bronze tasks, and delegating via “Assign Tasks to Worker,” which this plan must support.

## Room Chat Context

- Feed Devin/Cameron with `{ projectId, slot, taskCounts, workerStatus }` whenever the Project Board is open so the assistant can reference current column counts or worker handoffs (“You have 2 tasks in progress; shall we focus on clearing them before pulling new Bronze work?”).

## Dependencies & Follow-ups

- Relies on Life Map/Table plan for entry points and Table state.
- Sorting Room plan feeds Bronze stack sources; Roster Room plan provides worker data.
- Future work: multi-project concurrency UI, animation polish.

## Proposed PR Breakdown

1. **PR1 – Project Board Overlay & Kanban**  
   _Title:_ “Project Board: Work on tasks with Kanban overlay”  
   _Scope:_ Implement the overlay shell, header with `UrushiVisual`/progress ring, and Kanban drag-and-drop columns per `mvp-source-of-truth-doc.md:260-360`.

2. **PR2 – Pause/Complete & Slot Updates**  
   _Title:_ “Project Board: Complete or pause projects”  
   _Scope:_ Add pause/complete actions that update lifecycle state, remove projects from Table, and push paused work back to Priority Queue per `mvp-source-of-truth-doc.md:1192-1238`.

3. **PR3 – Worker Panel & Bronze Auto-Pull**  
   _Title:_ “Project Board: Workers and Bronze task management”  
   _Scope:_ Integrate worker panel + “Assign tasks” link, render Bronze stack side rail, and handle auto-pull/removal events per `mvp-source-of-truth-doc.md:705-751` and `810-840`.
