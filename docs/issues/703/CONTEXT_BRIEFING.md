# Context Briefing: Issue #703 - Remove Kanban, Replace with Task List

**Assembled by:** Conan the Librarian
**Date:** 2026-02-27
**Classification:** Structure replacement (Kanban Board -> Task List)
**Target type:** Structure
**Task type:** Replacement

---

## Constellation

### Primary Cards

| Card | Type | Relevance |
|------|------|-----------|
| Structure - Kanban Board | Structure | **Target being replaced.** Defines the 4-column drag-and-drop task flow interface within Project Board. |
| Primitive - Task | Primitive | **Core data model preserved.** Tasks have statuses (`todo`, `doing`, `in_review`, `done`), positions, and belong to projects. The task list must display these same primitives. |
| Room - Project Board | Room | **Parent room.** The Kanban Board is the sole Structure inside the Project Board. Replacement must integrate at the same attachment point. |
| Standard - Project States | Standard | **Conformance requirement.** Live projects have kanban boards; this standard references kanban explicitly. The replacement must still convey task execution status within project lifecycle. |

### Supporting Cards

| Card | Type | Relevance |
|------|------|-----------|
| Strategy - Spatial Visibility | Strategy | The Kanban Board implements this strategy. The Spatial Visibility maturity ladder places Kanban at Level 1 ("Minimally Viable"). A task list is arguably still Level 1. The card explicitly says "Not mandatory: Simple projects may skip Kanban and use checklist view instead." This provides direct product rationale for the replacement. |

---

## Key Design Decisions from Context Library

1. **Checklist view is an acknowledged alternative.** The Kanban Board card (line 79) states: "Not mandatory: Simple projects may skip Kanban and use checklist view instead." The replacement aligns with an already-anticipated alternative presentation.

2. **Four task statuses, not three.** The original card described 3 columns (To Do, In Progress, Done), but implementation added `in_review` for agent workflows. The current codebase uses 4 statuses: `todo`, `doing`, `in_review`, `done`. The new task list state indicator must cycle through all four: `[ ]` todo, `[i]` in progress, `[r]` review, `[x]` done.

3. **Same underlying event model.** Task status changes are driven by `taskStatusChanged` events (in `packages/shared/src/livestore/events.ts`). The task list replaces drag-and-drop with click-to-cycle but commits the same events.

4. **Position field still relevant.** Tasks have a `position` field used for ordering within columns. In the task list, this field determines display order. The complex reordering logic (`taskReordering.ts`) for drag-and-drop between columns can be removed or greatly simplified.

---

## Codebase Impact Map

### Files to DELETE (remove entirely)

| File | Reason |
|------|--------|
| `packages/web/src/components/project-room/ProjectKanban.tsx` | Kanban board component with DndContext, drag handlers, column rendering. Replace with new TaskList component. |
| `packages/web/src/components/project-room/ProjectKanbanColumn.tsx` | Individual column component with droppable zones, inline add-task form. Column concept eliminated. |
| `packages/web/src/components/project-room/taskReordering.ts` | Drag-and-drop position calculation logic (`calculateStatusTaskReorder`, `calculateStatusDropTarget`, normalization). Not needed for click-to-cycle. |
| `packages/web/src/components/project-room/ProjectKanban.stories.tsx` | Storybook stories for the kanban board. Replace with TaskList stories. |

### Files to MODIFY (update references)

| File | Change Required |
|------|----------------|
| `packages/web/src/components/projects/ProjectDetailPage.tsx` | **Primary integration point.** Replace `<ProjectKanban>` import and usage (lines 12, 139-143) with new `<TaskList>` component. |
| `packages/web/src/components/project-room/SimpleTaskCard.tsx` | **Significant rework.** Currently uses `useDraggable` + `useDroppable` from `@dnd-kit/core`. Remove all drag-and-drop logic. Add clickable state indicator that cycles through statuses. May rename to `TaskListItem`. |
| `packages/web/src/components/project-room/SimpleTaskCard.stories.tsx` | **Update.** Remove `DndContext` wrapper. Update stories to show state cycling behavior. |
| `packages/web/tests/unit/kanban.test.ts` | **Rewrite.** Remove column-related assertions. Update to test task list rendering and status cycling. |
| `packages/web/e2e/workflow.spec.ts` | **Update E2E test (lines 201-254).** Currently checks for "Todo", "Doing", "In Review", "Done" column headers and uses modal status dropdown to change status. Must be updated to use click-to-cycle interaction instead. |
| `packages/shared/src/constants.ts` | **Evaluate.** `STATUS_COLUMNS` and `StatusColumn` type may be simplified or removed. `TASK_STATUSES` array is still needed. `DEFAULT_KANBAN_COLUMNS` (already deprecated) can be removed. |
| `packages/web/src/components/project-room/TaskDetailModal.tsx` | **Minor.** Uses `STATUS_COLUMNS` (line 5, 446) for a status dropdown. This dropdown may remain or change. |
| `packages/web/src/components/layout/NewUiShell.tsx` | **Check.** References kanban in some capacity; verify and update. |
| `packages/web/src/components/README.md` | **Update** any kanban references in component documentation. |
| `packages/web/README.md` | **Update** any kanban references. |
| `packages/server/src/tools/schemas.ts` | **Minor.** Line 116 mentions "Kanban columns" in the `create_project` tool description. Update wording. |
| `packages/server/src/services/pi/tool-formatters/project-formatter.ts` | **Minor.** Imports `DEFAULT_KANBAN_COLUMNS` (line 2) and uses it to format column names (line 32). Update to reference task statuses instead. |
| `packages/server/src/services/pi/prompts.ts` | **Minor.** References "Kanban methodology" (line 7). Update wording. |
| `packages/web/src/components/drafting-room/Stage3Form.tsx` | **Check.** References task reordering; verify no breakage. |
| `packages/web/src/components/sorting-room/*.tsx` | **No change needed.** These use `@dnd-kit` for project sorting (Gold/Silver/Bronze panels), not task kanban. DnD in sorting room is unaffected. |
| `packages/shared/src/settings.ts` | **Check.** May reference kanban in settings definitions. |

### Files to CREATE

| File | Purpose |
|------|---------|
| `packages/web/src/components/project-room/TaskList.tsx` | New task list component. Renders tasks as a flat list with clickable state indicators cycling `[ ]` -> `[i]` -> `[r]` -> `[x]`. Includes inline add-task. |
| `packages/web/src/components/project-room/TaskList.stories.tsx` | Storybook stories for the new task list. |

### Dependencies

| Package | Impact |
|---------|--------|
| `@dnd-kit/core` | **Evaluate removal from web package.** Used by kanban (`ProjectKanban`, `SimpleTaskCard`) and sorting room (`SortableProjectCard`, `GoldSilverPanel`, `BronzePanel`, `TableDropZone`). Since sorting room still uses it, the dependency stays. However, it can be removed from task-related components. |

---

## Gaps and Open Questions

1. **Inline add-task location.** Currently, adding tasks is only in the To Do column. In a task list, the add-task button presumably goes at the bottom of the list (and new tasks default to `todo` status). Confirm desired behavior.

2. **Task grouping.** Should the task list group tasks by status (sections: To Do, Doing, In Review, Done) or show a flat list sorted by position? The issue says "task list" which suggests flat, but grouping may improve scannability.

3. **Reordering in list.** With no drag-and-drop columns, can users still reorder tasks within the list? If so, `position` field and some reordering logic may be retained. If not, tasks could sort by status then creation date.

4. **Context library update.** The `Structure - Kanban Board` card will need to be updated or replaced with a `Structure - Task List` card after implementation. The `Room - Project Board` card references the Kanban Board as its sole Structure and will need updating. The `Primitive - Task` card references kanban boards throughout its HOW section.

5. **State indicator visual design.** The issue specifies `[ ]`, `[i]`, `[r]`, `[x]` as text representations. The actual UI treatment (icons, colors, checkbox-like affordance) needs design consideration aligned with `Standard - Visual Language`.

---

## Context Library Cards Referenced (Full List)

- `docs/context-library/product/structures/Structure - Kanban Board.md`
- `docs/context-library/product/primitives/Primitive - Task.md`
- `docs/context-library/product/rooms/Room - Project Board.md`
- `docs/context-library/rationale/standards/Standard - Project States.md`
- `docs/context-library/rationale/strategies/Strategy - Spatial Visibility.md`
