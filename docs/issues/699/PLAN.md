# Plan: Remove the Table (#699)

## 1. Architecture Decisions

### Decision: Derive “active” UI state from project lifecycle instead of table state
Options considered: keep table config/bronze tables and just hide TableBar UI; introduce a new map-only “work at hand” state; use existing `projectLifecycleState.status` + `stream` to drive Sorting Room and Life Map.  
Chosen approach: use lifecycle status + stream.  
Why: removes table state management entirely, keeps tier/stream data intact, and avoids introducing new state surfaces ahead of the map WIP story.  
State boundaries: LiveStore = `projects.projectLifecycleState`; React = derived lists via `useMemo`; URL state = Sorting Room expanded stream + category filter remain URL-driven.

### Decision: Remove table materializers and queries while preserving table events
Options considered: delete table tables + materializers; keep table tables but remove materializers + query exports.  
Chosen approach: keep tables, remove materializers + query exports.  
Why: meets the requirement while minimizing LiveStore schema churn; historical table data stays in DB but is no longer used or updated.  
State boundaries: LiveStore keeps table events in `events.ts` but no materialization; React uses no table queries/hooks; URL state unchanged.

### Decision: Sorting Room UI pivots from “On Table” to Active/Backlog lists
Options considered: keep a single “primary” project per stream (derived from active list) to mimic the table; remove the “On Table” section and show Active/Backlog lists with simple actions.  
Chosen approach: remove the “On Table” section and show Active/Backlog lists.  
Why: eliminates table/slot language and state coupling while still supporting stream sorting and activation without WIP limits.  
State boundaries: LiveStore updates via `projectLifecycleUpdated` only; React lists derived from `getProjects$` + `getAllTasks$`.

## 2. File Changes

| Action | File | Description |
| ------ | ---- | ----------- |
| delete | packages/web/src/components/layout/TableBar.tsx | Remove TableBar component. |
| delete | packages/web/src/components/layout/TableBar.test.tsx | Remove tests for TableBar. |
| delete | packages/web/src/components/layout/TableSlot.tsx | Remove slot UI. |
| delete | packages/web/src/hooks/useTableState.ts | Remove table state hook. |
| modify | packages/web/src/components/layout/NewUiShell.tsx | Drop TableBar import/render; update layout comments. |
| modify | packages/web/src/components/sorting-room/SortingRoom.tsx | Remove table state usage; compute active/backlog by lifecycle status; update actions to use `projectLifecycleUpdated` only; update summary text and analytics events to remove “table” naming. |
| modify | packages/web/src/components/sorting-room/GoldSilverPanel.tsx | Remove table drop zone + confirm dialog; render Active/Backlog lists; update action labels (“Activate”, “Move to Backlog”). |
| modify | packages/web/src/components/sorting-room/SortableProjectCard.tsx | Rename props/actions to remove “table”; support bronze stream color if reused. |
| delete | packages/web/src/components/sorting-room/TableDropZone.tsx | Remove unused table drop zone. |
| delete | packages/web/src/components/sorting-room/TableConfirmDialog.tsx | Remove table-specific dialog. |
| modify | packages/web/src/components/sorting-room/BronzePanel.tsx | Refactor to Active/Backlog bronze lists driven by lifecycle status; remove tabled project entry logic and DnD between table/backlog. |
| modify | packages/web/src/components/sorting-room/SortingRoom.stories.tsx | Seed via lifecycle status; remove table config/bronze table entries; update copy. |
| modify | packages/web/src/components/sorting-room/BronzePanel.stories.tsx | Update to new props and lifecycle-based data; remove table queries. |
| modify | packages/web/src/components/life-map/LifeMap.tsx | Remove table queries; derive active projects from lifecycle status; update comments and category card inputs. |
| modify | packages/web/src/components/life-map/CategoryCard.tsx | Remove “dual presence/table” language; drop ongoing section if unused. |
| modify | packages/web/src/components/life-map/LifeMap.stories.tsx | Remove table event seeding; use lifecycle status to set active projects. |
| modify | packages/web/src/components/project-room/ProjectHeader.tsx | Remove table config usage + “On Table” badge; drop clearGold/clearSilver calls. |
| modify | packages/web/src/components/project-room/ProjectHeader.test.tsx | Remove hook mock + adjust expectations. |
| modify | packages/web/src/components/projects/ProjectCard.tsx | Remove slot labeling for active state. |
| modify | packages/web/src/components/projects/ProjectCard.stories.tsx | Update active story copy; remove slot usage. |
| modify | packages/shared/src/types/planning.ts | Update `describeProjectLifecycleState` to remove slot references. |
| modify | packages/shared/src/livestore/queries.ts | Remove table-related query exports. |
| modify | packages/shared/src/livestore/schema.ts | Remove table materializer handlers for `table.*` events; keep table tables defined. |
| delete | packages/shared/src/table-state.ts | Remove table state helper. |
| delete | packages/shared/tests/table-state.test.ts | Remove table-state tests. |
| modify | packages/shared/src/index.ts | Remove `table-state` export. |
| delete | packages/server/src/tools/table.ts | Remove table tools implementation. |
| modify | packages/server/src/tools/schemas.ts | Remove table tool definitions. |
| modify | packages/server/src/tools/index.ts | Remove table tool imports + switch cases. |
| modify | packages/server/src/tools/types.ts | Remove table-related types and union entries. |
| modify | packages/web/e2e/workflow.spec.ts | Update Sorting Room steps to new “Activate” flow; remove table dialog assertions. |
| modify | packages/web/e2e/life-map-placement.spec.ts | Remove “Activate to Table” helper/steps. |

## 3. Data Model Changes

Events: no new events; keep all `table.*` event definitions in `packages/shared/src/livestore/events.ts`.  
Materializers to remove: `table.configuration_initialized`, `table.gold_assigned`, `table.gold_cleared`, `table.silver_assigned`, `table.silver_cleared`, `table.bronze_mode_updated`, `table.bronze_task_added`, `table.bronze_task_removed`, `table.bronze_stack_reordered`, `table.bronze_project_tabled`, `table.bronze_project_removed`, `table.bronze_projects_reordered`.  
Queries to remove: `getTableConfiguration$`, `getTableBronzeStack$`, `getActiveBronzeStack$`, `getTableBronzeProjects$`, `getTabledBronzeProjects$`, `isBronzeProjectTabled$`.  
Migration notes: no schema drop; table tables remain defined to avoid migration risk. Table data becomes legacy/unused.

## 4. Component Hierarchy

Removed:

```
NewUiShell
  TableBar
    TableSlot (gold/silver/bronze)
SortingRoom
  TableDropZone
  TableConfirmDialog
```

Remaining (updated):

```
NewUiShell
  header
  main
    room content
SortingRoom
  Stream summary cards (Active/Backlog counts)
  GoldSilverPanel (Active/Backlog lists)
    SortableProjectCard
  BronzePanel (Active/Backlog lists + quick add)
LifeMap
  CategoryCard
    Active projects list (status=active)
    Planning/Backlog links
```

## 5. PR Breakdown

Single PR success criteria:
1. TableBar/Slot/UI removed; `NewUiShell` no longer renders TableBar.
2. All UI text and components no longer reference Table/slots.
3. `useTableState` hook removed; no table queries/materializers used.
4. Sorting Room + Life Map operate on lifecycle status only.
5. Build + existing tests pass (with updated stories/e2e).

## 6. Test Plan

Unit tests: update `packages/web/src/components/project-room/ProjectHeader.test.tsx` to remove table mocks; add or update tests around lifecycle label changes if needed.  
E2E Playwright: update `packages/web/e2e/workflow.spec.ts` to replace “Activate to Table” steps with “Activate”/“Move to Active” and verify active list behavior; update `packages/web/e2e/life-map-placement.spec.ts` to remove activation step and verify placement still works.  
Storybook: update `SortingRoom.stories.tsx`, `BronzePanel.stories.tsx`, `LifeMap.stories.tsx`, `ProjectCard.stories.tsx` to seed via lifecycle status only.

## 7. Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Legacy table data becomes stale after removing materializers | Confusing if future code relies on old table tables | Keep table tables defined; ensure no code reads them; add note in PR description. |
| Sorting Room behavior changes (multiple active projects) | Users may end up with many active items | Keep UI counts clear; consider adding soft guidance copy (out of scope for this PR). |
| Life Map highlight semantics change | Active glow may disappear or expand | Decide explicit rule (active = highlight or not) and verify visually in Storybook. |
| Removing table tools impacts agent flows | Some LLM actions may fail | Remove tool schema + handlers together; update any tool tests if they exist. |

## 8. What’s Out of Scope

- Re-introducing WIP limits via map slots.
- Removing gold/silver/bronze tier computation in `projectLifecycleState`.
- Removing the Sorting Room route itself.
- Updating LLM room prompts or context-library cards that still mention the Table (follow-up task).
