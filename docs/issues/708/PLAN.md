# Plan: Project interface as building overlay (#708)

## 1. Architecture Decisions

### Decision: Render `/projects/:projectId` as a route-driven overlay on top of the Life Map

Options considered: keep `ProjectDetailPage` as a standalone page route; open a local-state modal from `LifeMap`; use a URL-addressable overlay route.  
Chosen approach: keep URL routing (`/projects/:projectId`) but render it through the building overlay layer with the map still mounted underneath.  
Why: satisfies deep linking, browser back behavior, and the map-first overlay model from #705 while preserving existing navigation links (`generateRoute.project`).  
State boundaries: routing determines open/closed overlay state; map state stays in `LifeMap`/`HexMap` and should persist while overlay content changes.

### Decision: Refactor project UI into overlay content, not a page shell

Options considered: keep `ProjectDetailPage` wrapping `RoomLayout`/`NewUiShell`; create a content-only project surface rendered inside `BuildingOverlay`.  
Chosen approach: convert project detail rendering into overlay content and mount it via a route wrapper.  
Why: avoids nested shells, duplicate headers, and conflicting close behaviors; aligns with reusable overlay frame from #705.

### Decision: Consume the task list surface from #703 as the primary task UI in overlay

Options considered: keep legacy `ProjectKanban`; introduce a new overlay-specific task list; reuse the #703 task list component.  
Chosen approach: render the #703 task list component in project overlay and keep existing task mutation/event flows.  
Why: #708 explicitly composes #705 (overlay) + #703 (task list) into one experience.

### Decision: Centralize overlay close semantics (button, Escape, back) in overlay route/frame

Options considered: keep close logic inside `ProjectHeader`; split close behavior between header and overlay frame.  
Chosen approach: overlay route/frame owns close behavior and fallback navigation for deep links; project header focuses on project metadata/actions.  
Why: consistent close handling across building overlays and fewer route edge cases.

### Decision: Auto-select Marvin when project overlay opens via route-aware attendant state

Options considered: local project-page chat selection only; route-aware attendant selection in global rail controller.  
Chosen approach: when pathname matches `/projects/:projectId`, set active attendant to Marvin (using attendant controller introduced by #707 or equivalent).  
Why: ensures deterministic behavior for all project entry paths (map click, table click, deep link).

## 2. File Changes

| Action | File                                                                                    | Description                                                                                                                                                        |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| modify | `packages/web/src/Root.tsx`                                                             | Convert project route handling from standalone page render to map+overlay route composition so `LifeMap` remains mounted when `/projects/:projectId` is active.    |
| create | `packages/web/src/components/projects/ProjectOverlayRoute.tsx`                          | New route wrapper that reads `projectId`, renders `BuildingOverlay`, handles close/back fallback, and mounts project content.                                      |
| modify | `packages/web/src/components/projects/ProjectDetailPage.tsx`                            | Refactor into overlay-safe content (remove `RoomLayout`/`NewUiShell` ownership); keep project/task queries, task modal wiring, and chat lifecycle hooks.           |
| modify | `packages/web/src/components/project-room/ProjectHeader.tsx`                            | Ensure overlay header shows project name + description, and remove/trim route-close behavior now owned by overlay frame.                                           |
| modify | `packages/web/src/components/life-map/LifeMap.tsx`                                      | Keep all project entry points (tile click, list click, panel open) routing to `generateRoute.project(projectId)` and normalize through one helper for consistency. |
| modify | `packages/web/src/components/hex-map/HexMap.tsx`                                        | Resolve Escape-key precedence so overlay Escape-close is not raced by map placement Escape handlers when overlay is open.                                          |
| modify | `packages/web/src/components/layout/BuildingOverlay.tsx` _(from #705)_                  | Ensure close button, Escape, and backdrop close integrate cleanly with project overlay route behavior (including deep-link fallback).                              |
| modify | `packages/web/src/constants/routes.ts`                                                  | Keep `PROJECT` path stable; add/confirm project-route matcher utility used by attendant auto-selection logic.                                                      |
| modify | `packages/web/src/components/layout/AttendantRailProvider.tsx` _(from #707 if present)_ | Add/adjust route effect to auto-select Marvin whenever project overlay route is active.                                                                            |
| modify | `packages/web/src/components/projects/ProjectDetailPage.stories.tsx`                    | Update Storybook coverage from standalone page framing to overlay-context rendering and task-list terminology.                                                     |
| create | `packages/web/src/components/projects/ProjectOverlayRoute.test.tsx`                     | Unit/integration tests for route-open, close button, Escape, and back-navigation behavior.                                                                         |
| modify | `packages/web/src/components/project-room/ProjectHeader.test.tsx`                       | Update assertions for description rendering and overlay-owned close behavior.                                                                                      |
| modify | `packages/web/e2e/workflow.spec.ts` _(or add focused `project-overlay.spec.ts`)_        | Add/adjust E2E flow: open project from map, verify overlay content, task list interactions, Escape/back close, and project switching.                              |

## 3. Data Model Changes

No schema/event/query migration is planned.

- Queries reused: `getProjectById$`, `getProjectTasks$`, `getHexPositions$`.
- Events reused for tasks: existing `taskCreatedV2`, `taskUpdated`, `taskStatusChanged`, `taskAttributesUpdated`, `taskArchived` paths.
- Room/chat lifecycle: continue using existing project room definition and `useProjectChatLifecycle`; attendant selection is UI/controller state only.

## 4. Component Hierarchy

Current (project as standalone page route):

```text
Route /projects/:projectId
  ProjectDetailPage
    RoomLayout(project room)
      NewUiShell
        ProjectHeader
        ProjectKanban (pre-#703) / TaskList (post-#703)
        TaskDetailModal
```

Target (project as map overlay route):

```text
Route group (map always mounted)
  RoomLayout(LIFE_MAP_ROOM)
    NewUiShell
      LifeMap
      when pathname matches /projects/:projectId:
        BuildingOverlay
          ProjectOverlayRoute
            Project detail content
              ProjectHeader (name + description)
              TaskList (#703)
              TaskDetailModal
```

Attendant behavior:

```text
pathname /projects/:projectId -> activeAttendant = marvin
overlay closes -> attendant remains per global rail rules (no special reset in #708)
```

## 5. PR Breakdown

Single PR (after #703 and #705 are merged) success criteria:

1. Clicking a project building opens `/projects/:projectId` as an overlay over the map (not a standalone page transition).
2. Overlay displays project name, description, and task list (from #703).
3. Users can add, edit, and toggle task states inside the overlay.
4. Overlay closes via close button, Escape, and browser back, including deep-link fallback behavior.
5. Switching between different project buildings updates overlay content correctly by ID.
6. Marvin is auto-selected in the Attendant Rail when the project overlay opens.
7. Build, lint, unit tests, and E2E are green.

## 6. Test Plan

Unit/integration:

- `ProjectOverlayRoute.test.tsx`
  - direct navigation to `/projects/:id` renders overlay on top of map shell.
  - close button closes overlay route (history back when possible, life-map fallback when not).
  - Escape closes overlay route.
- `ProjectDetailPage`/task-list integration tests
  - renders project name + description.
  - task rows are interactive (toggle state cycle, open/edit task, add task).
- `HexMap` Escape precedence test
  - overlay-open Escape closes overlay first and does not trigger unintended placement cancellation side effects.
- attendant route test (provider-level)
  - entering `/projects/:id` sets active attendant to Marvin.

E2E (Playwright):

- map click on placed project opens project overlay and URL updates to `/projects/:id`.
- overlay close button, Escape key, and browser back each close overlay and return to map-only view.
- open Project A then Project B from map; verify overlay swaps to B without full app remount behavior.
- deep-link to `/projects/:id` starts with overlay open and map visible behind.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`

## 7. Risks and Mitigations

| Risk                                                               | Impact                                | Mitigation                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| #703/#705 final file names differ from current assumptions         | Merge friction and plan drift         | Rebase on merged dependency branches first; map this plan’s logical changes onto actual landed paths before coding.               |
| Escape listeners conflict between overlay and map placement mode   | Wrong behavior on Escape; flaky tests | Give overlay Escape handling precedence and guard map Escape handler when event is already handled.                               |
| Deep-link close behavior can strand users or navigate unexpectedly | Poor navigation UX                    | Implement deterministic close fallback: history back when valid, else navigate to life-map route with `storeId` preserved.        |
| Overlay layering conflicts with task modal/dropdowns               | Inaccessible UI elements              | Define z-index contract (`BuildingOverlay` below modal/dialog layers) and test modal interactions inside overlay.                 |
| Marvin auto-select dependency not yet landed in branch             | Missing finish-line behavior          | Add a narrow integration point in this PR (route effect/hook) and wire to attendant provider once available; keep tests explicit. |

## 8. What's Out of Scope

- Marvin chat response behavior/content changes.
- Task Queue panel work.
- Project deletion/archival/settings expansion beyond existing controls.
- New task model, schema, or event redesign.
- Animated overlay transitions beyond what #705 already provides.
