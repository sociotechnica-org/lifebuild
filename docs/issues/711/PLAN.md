# Plan: Task Queue panel (#711)

## 1. Architecture Decisions

### Decision: Render Task Queue at shell level so it persists across map and overlays

Options considered: mount inside `LifeMap.tsx`; mount inside project overlay content; mount in `NewUiShell.tsx`.  
Chosen approach: mount in `NewUiShell.tsx` as a fixed top-right panel.  
Why: requirement is persistent visibility over both map and overlays, and `NewUiShell` is the shared chrome for room surfaces.  
State boundaries: shell owns panel visibility/collapse chrome; task/project data remains LiveStore-query-driven.

### Decision: Treat #711 as dependent on post-#708 routing behavior

Options considered: implement against current full-page `/projects/:projectId`; implement against overlay route behavior expected after #708.  
Chosen approach: plan against post-#708 behavior while still using the same route target (`/projects/:projectId`).  
Why: issue is explicitly blocked by #708; queue click behavior must align with overlay routing once #708 lands.  
State boundaries: navigation remains URL-driven via `generateRoute.project(projectId)` + `preserveStoreIdInUrl`.

### Decision: Use existing queries and derive queue view client-side

Options considered: add a new shared join query for queue rows; derive from existing `getProjects$`, `getAllTasks$`, and `getHexPositions$`.  
Chosen approach: derive in web client from existing queries.  
Why: no schema/event changes needed; current query set already exposes required data.  
State boundaries: shared package unchanged; web component computes placed project set, grouping, and ordering.

### Decision: Gate panel visibility by placed project count (2+), not by task count

Options considered: show when 2+ placed projects exist; show when 2+ projects with incomplete tasks exist.  
Chosen approach: show when 2+ non-archived projects are currently placed on the map.  
Why: matches the story trigger (“once second project is placed on the map”).  
State boundaries: visibility gate uses `hex_positions` + active project IDs; task rendering remains independent of gate.

### Decision: Reuse the same task-state transition logic as project task list

Options considered: duplicate toggle logic in queue; extract/share a status-cycle helper used by both queue and project task list.  
Chosen approach: share one transition helper/utility and emit the same `v2.TaskStatusChanged` event path.  
Why: prevents behavioral drift; ensures queue toggle updates every surface via the same underlying data/events.  
State boundaries: task status mutation stays in LiveStore events; queue/list components are thin UI wrappers.

### Decision: Persist collapsed state in localStorage with safe access guards

Options considered: session-only React state; persisted localStorage state.  
Chosen approach: localStorage-backed collapsed flag with defensive read/write handling.  
Why: finish line requires collapse state persistence across route changes/reloads.  
State boundaries: only UI preference persisted locally; task/project data remains in LiveStore.

## 2. File Changes

| Action | File                                                              | Description                                                                                                                                  |
| ------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| create | packages/web/src/components/layout/TaskQueuePanel.tsx             | New fixed, collapsible Task Queue panel; queries projects/tasks/hex positions; groups tasks by project; renders navigation + status toggles. |
| create | packages/web/src/components/layout/TaskQueuePanel.test.tsx        | Unit tests for visibility gating, grouping, collapse persistence, navigation, and status toggling behavior.                                  |
| create | packages/web/src/components/layout/TaskQueuePanel.stories.tsx     | Storybook stories seeded with real LiveStore events (projects, tasks, hex placement) for expanded/collapsed/hidden states.                   |
| modify | packages/web/src/components/layout/NewUiShell.tsx                 | Mount `TaskQueuePanel` as a persistent top-right fixed layer; coordinate position with existing chat/open shell controls.                    |
| create | packages/web/src/components/project-room/taskStatusCycle.ts       | Shared task status cycle metadata/transition helper (todo -> doing -> in_review -> done -> todo) and display token mapping.                  |
| modify | packages/web/src/components/project-room/TaskList.tsx (post-#703) | Switch project task-list toggle to consume shared status-cycle helper so queue and project list remain identical.                            |
| modify | packages/web/src/components/README.md                             | Add Task Queue panel entry under layout components.                                                                                          |
| create | packages/web/e2e/task-queue-panel.spec.ts                         | Critical path E2E: queue appears after second placed project, task click navigates to project route, toggle syncs with project task view.    |

## 3. Data Model Changes

No event, schema, or materializer changes are planned.

- Events reused: `v2.TaskStatusChanged` (existing).
- Queries reused: `getProjects$`, `getAllTasks$`, `getHexPositions$` (existing).
- Migrations/backfills: none.

## 4. Component Hierarchy

Updated shell layering:

```text
RoomLayout
  NewUiShell
    Header (nav, feedback, chat toggle, user menu)
    TaskQueuePanel (fixed top-right, persistent)
      QueueToggle
      QueueBody (expanded)
        ProjectGroup*
          TaskQueueItem*
    Main content (LifeMap / overlay content from #708)
    TableBar (until #699 lands on target branch)
```

TaskQueuePanel internal data flow:

```text
useQuery(getProjects$)
useQuery(getAllTasks$)
useQuery(getHexPositions$)
  -> placedProjectIds (entityType='project')
  -> visibleProjects (placed + non-archived)
  -> groupedTasksByProject (ordered by project name, task position)
  -> render when visibleProjects.length >= 2
```

## 5. PR Breakdown

Single PR success criteria:

1. Task Queue panel is rendered from shell and remains visible across map/overlay routes.
2. Panel is hidden until 2+ projects are placed on the map.
3. Tasks render grouped by project and show the same 4-state toggle semantics as project task list.
4. Clicking a task navigates to `/projects/:projectId` with store ID preserved.
5. Toggling task state updates LiveStore and is reflected in project task surfaces.
6. Collapse/expand state persists across navigation/reload.
7. Storybook story, unit tests, and one E2E path are added/updated.

## 6. Test Plan

Unit (`TaskQueuePanel.test.tsx`):

- Hidden when only 0-1 projects are placed.
- Visible when 2+ projects are placed.
- Groups tasks under correct project names and stable ordering.
- Task click calls navigation with `preserveStoreIdInUrl(generateRoute.project(id))`.
- Status toggle commits expected `taskStatusChanged` transition and does not trigger row navigation.
- Collapsed state persists via localStorage key and restores on remount.

Integration:

- `NewUiShell` integration assertion that panel mounts once and remains independent of room route content.

Storybook:

- Expanded panel with 2+ placed projects and mixed task statuses.
- Collapsed state story.
- Hidden-state story (single placed project).
- All stories seeded via real LiveStore events (`projectCreated`, `taskCreatedV2`, `hexPositionPlaced`).

E2E (`task-queue-panel.spec.ts`):

- Seed two projects with tasks and place both on map.
- Verify queue appears in top-right.
- Click a queued task and assert navigation to its project route.
- Toggle queued task status and verify changed state in the project task surface.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`

## 7. Risks and Mitigations

| Risk                                                                                | Impact                                  | Mitigation                                                                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| #708/#703 file structure differs from current branch (overlay + task-list refactor) | Plan drift or merge conflicts           | Implement #711 on top of the branch where #708 is merged; keep status-cycle helper extraction minimal and localized.     |
| Panel overlaps chat panel or overlay controls                                       | Reduced usability in dense top-right UI | Add responsive width and conditional right offset when chat is open; validate at mobile + desktop breakpoints.           |
| LocalStorage access failures (SSR/private mode/tests)                               | Collapse persistence crashes            | Wrap storage reads/writes in guards/try-catch; default to expanded on failure.                                           |
| Global queries over-fetch for large workspaces                                      | UI re-render cost                       | Memoize grouping/filters and perform cheap set-based joins; defer new shared query unless profiling shows pain.          |
| Ambiguity on whether to show completed tasks                                        | UX inconsistency                        | Initial implementation uses all non-archived tasks; document in PR and adjust in follow-up if product direction changes. |

## 8. What's Out of Scope

- In-panel filtering, sorting controls, and smart prioritization.
- Task dependency/subtask features.
- Drag-and-drop reordering in the queue.
- Backend schema/query redesign solely for queue aggregation.
- Reworking project overlay architecture beyond #708 dependency.
