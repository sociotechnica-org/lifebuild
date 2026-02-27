# Plan: Remove Kanban, Replace with Task List (#703)

## 1. Architecture Decisions

### Decision: Replace the project-room Kanban surface with a flat task-list surface

Options considered: keep 4 status sections without drag-and-drop, render a grouped-by-status list, or render a single flat list.  
Chosen approach: render a single task list (rows) in project view, with state controls on each row.  
Why: this matches the finish line ("task list as rows"), removes drag-and-drop complexity, and aligns the UI pattern with upcoming Task Queue work.  
State boundaries: LiveStore task/events stay status-based (`todo`, `doing`, `in_review`, `done`); React presentation changes from column layout to row list.

### Decision: Use click-to-cycle status transitions backed by existing `taskStatusChanged` events

Options considered: introduce a new "cycle status" event, mutate local UI state only, or commit existing status-change events.  
Chosen approach: clicking the state indicator cycles `todo -> doing -> in_review -> done -> todo` and commits `events.taskStatusChanged`.  
Why: preserves event model/history and keeps downstream consumers unchanged.  
State boundaries: no schema/event additions; only interaction model changes in project-room components.

### Decision: Keep inline task creation in the list and default new tasks to `todo`

Options considered: modal-only creation, inline creation at top, or inline creation at bottom.  
Chosen approach: inline add row at the bottom of the task list; new tasks are created as `todo` via `events.taskCreatedV2`.  
Why: preserves quick-capture flow currently provided in Kanban while fitting list UX.

### Decision: Remove task-specific drag-and-drop infrastructure, retain `@dnd-kit` for sorting room

Options considered: remove `@dnd-kit` entirely, or remove only project-room drag/drop usage.  
Chosen approach: delete project-room DnD components/utilities only.  
Why: sorting-room flows still rely on `@dnd-kit`, so dependency removal is out of scope and unnecessary risk.

### Decision: Align user-facing/server wording from "Kanban columns" to "task states"

Options considered: defer terminology cleanup, or update touched surfaces in same PR.  
Chosen approach: update schema descriptions/prompts/README copy that currently implies column-based task management.  
Why: avoids product-language drift immediately after replacing the UI paradigm.

## 2. File Changes

| Action | File                                                                 | Description                                                                                                                           |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| delete | packages/web/src/components/project-room/ProjectKanban.tsx           | Remove Kanban container (`DndContext`, drag handlers, status columns).                                                                |
| delete | packages/web/src/components/project-room/ProjectKanbanColumn.tsx     | Remove column component and column-specific add-task UI.                                                                              |
| delete | packages/web/src/components/project-room/taskReordering.ts           | Remove drag/drop reorder math for column insertion.                                                                                   |
| delete | packages/web/src/components/project-room/ProjectKanban.stories.tsx   | Remove Kanban Storybook stories.                                                                                                      |
| create | packages/web/src/components/project-room/TaskList.tsx                | New project-room list component with row rendering, state-cycle handler, and inline add-task form.                                    |
| create | packages/web/src/components/project-room/TaskList.stories.tsx        | Storybook scenarios for empty/default/many-task list states.                                                                          |
| modify | packages/web/src/components/projects/ProjectDetailPage.tsx           | Swap `ProjectKanban` import/render for `TaskList`; keep task modal wiring intact.                                                     |
| modify | packages/web/src/components/project-room/SimpleTaskCard.tsx          | Remove DnD hooks/overlay behavior; render task as list row with clickable state indicator (`[ ]/[i]/[r]/[x]`) and modal click target. |
| modify | packages/web/src/components/project-room/SimpleTaskCard.stories.tsx  | Remove `DndContext` wrapper and update stories to list-row behavior + state indicator affordance.                                     |
| modify | packages/web/src/components/projects/ProjectDetailPage.stories.tsx   | Update docs text from Kanban/drag-drop language to task-list language.                                                                |
| modify | packages/web/tests/unit/kanban.test.ts                               | Rewrite assertions away from column concepts and toward status-based task-list behavior expectations.                                 |
| create | packages/web/src/components/project-room/TaskList.test.tsx           | Add focused unit tests for status cycling, event commits, ordering, and inline task creation.                                         |
| modify | packages/web/e2e/workflow.spec.ts                                    | Replace project-view column assertions with task-list row/state-indicator assertions; verify click-to-cycle behavior.                 |
| modify | packages/shared/src/constants.ts                                     | Remove/retire Kanban-column-specific constants and keep canonical task-status ordering metadata for list rendering/dropdowns.         |
| modify | packages/shared/src/livestore/schema.ts                              | Update stale comments that reference default Kanban columns in migration notes.                                                       |
| modify | packages/server/src/tools/schemas.ts                                 | Update `create_project` tool description to task-state wording (no "default Kanban columns").                                         |
| modify | packages/server/src/services/pi/tool-formatters/project-formatter.ts | Replace "default columns created" output with task-state-oriented wording.                                                            |
| modify | packages/server/src/tools/schema-formatter-alignment.test.ts         | Extend schema/formatter assertions to ensure project-tool text no longer references Kanban columns.                                   |
| modify | packages/server/src/services/pi/prompts.ts                           | Replace "Kanban methodology" phrasing with task-list/status workflow phrasing.                                                        |
| modify | packages/shared/src/settings.ts                                      | Replace default system prompt wording that references Kanban methodology.                                                             |
| modify | packages/web/src/components/layout/NewUiShell.tsx                    | Update stale comments mentioning Kanban-specific full-height/no-scroll usage.                                                         |
| modify | packages/web/src/components/README.md                                | Update `project-room/` description from Kanban board to task list.                                                                    |
| modify | packages/web/README.md                                               | Update feature/docs analytics wording tied to Kanban-specific interactions.                                                           |

## 3. Data Model Changes

No data-model migration is planned.

- Events: continue using `taskCreatedV2` and `taskStatusChanged`; no new event types.
- Schema/materializers: no table/schema changes in `packages/shared/src/livestore/schema.ts`.
- Queries: `getProjectTasks$` remains the source for project task rows.
- Compatibility: existing task records (`status`, `position`, `attributes`) render in new UI without backfill.

Behavioral note:

- Status indicator clicks still commit `taskStatusChanged` with an explicit `toStatus` and calculated target position, preserving current event-sourced behavior.

## 4. Component Hierarchy

Removed:

```text
ProjectDetailPage
  ProjectKanban
    DndContext
      ProjectKanbanColumn (todo/doing/in_review/done)
        SimpleTaskCard (draggable/droppable)
```

New:

```text
ProjectDetailPage
  TaskList
    SimpleTaskCard (list row)
      state indicator button: [ ]/[i]/[r]/[x] (cycles status)
      task title/deadline area (opens TaskDetailModal)
    InlineAddTaskForm (bottom of list)
  TaskDetailModal (unchanged integration)
```

## 5. PR Breakdown

Single PR success criteria:

1. Project view no longer renders Kanban columns or any task drag-and-drop behavior.
2. Task rows render in a list with a clickable state indicator cycling all four statuses.
3. Inline add-task works from task list and preserves existing task creation event flow.
4. Existing tasks/events are preserved and continue to materialize correctly.
5. Kanban-specific project-room components/utilities/stories are removed.
6. Build passes, tests pass, and project view has no runtime errors.

## 6. Test Plan

Unit/integration (web):

- `TaskList.test.tsx`:
  - renders tasks as rows in deterministic order.
  - clicking state indicator cycles `todo -> doing -> in_review -> done -> todo`.
  - each click commits `v2.TaskStatusChanged` with expected `toStatus`/position values.
  - inline add commits `v2.TaskCreated` with `status: 'todo'`.
- `kanban.test.ts` rewrite:
  - remove stale column-centric assertions.
  - keep/adjust event/query assertions to reflect status-based task model.
- `SimpleTaskCard` behavior checks:
  - indicator click does not unintentionally trigger row-open modal click path.

E2E (Playwright):

- Update project-view segment in `workflow.spec.ts`:
  - assert task list is visible (not column headers).
  - click state indicator and verify status advances.
  - confirm task remains editable through task detail modal flow.

Server tests:

- Update `schema-formatter-alignment.test.ts` assertions so `create_project` schema/formatter output does not mention "Kanban columns".

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`

## 7. Risks and Mitigations

| Risk                                                        | Impact                                         | Mitigation                                                                                                    |
| ----------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Indicator click also triggers row click/modal open          | Frustrating UX and flaky tests                 | Stop event propagation on indicator control; add explicit unit coverage.                                      |
| Position assignment during status cycling causes collisions | Unstable ordering by status-dependent surfaces | Reuse existing "append to target status" position strategy and test it.                                       |
| Hidden imports/references to removed Kanban files remain    | Build/type errors                              | Run repo-wide `rg` for `ProjectKanban`, `ProjectKanbanColumn`, and `taskReordering` before merge.             |
| Terminology cleanup is incomplete                           | Mixed "Kanban" vs "task list" product language | Include targeted copy sweep in web/shared/server files listed above.                                          |
| Loss of drag reordering surprises users                     | Perceived behavior regression                  | Keep scope explicit in release notes/PR description; reordering is intentionally out of scope for this issue. |

## 8. What's Out of Scope

- Cross-project task aggregation (Task Queue story).
- Task dependencies, subtasks, or richer workflow modeling.
- Task sorting/filtering controls inside project view.
- Marvin integration changes in project view.
- Any changes to sorting-room drag-and-drop behavior.
