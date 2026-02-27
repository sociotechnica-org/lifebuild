# Context Briefing: Issue #708 — Project interface as building overlay

**Assembled by:** Conan the Librarian
**Date:** 2026-02-27
**Classification:** Room (Project Board) | Architecture change

## Constellation

### Seed Cards

| Card                 | Type      | Relevance                                                                                                 |
| -------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| Room - Project Board | Room      | Primary target. Defines the project detail overlay, its contents, and overlay behavior over the Life Map. |
| Primitive - Task     | Primitive | Atomic work unit displayed in the task list within the overlay. Defines task states and lifecycle.        |

### Expanded Constellation (2-hop traversal)

| Card                                 | Type       | Hop | Connection                                                                                                        |
| ------------------------------------ | ---------- | --- | ----------------------------------------------------------------------------------------------------------------- |
| Primitive - Project                  | Primitive  | 1   | Governs Room - Project Board. Defines project properties, lifecycle states, and data model.                       |
| Structure - Kanban Board             | Structure  | 1   | Current task flow interface inside Project Board. Being replaced by task list per #703.                           |
| Agent - Marvin                       | Agent      | 1   | Resident agent for project execution. Auto-selected in Attendant Rail when overlay opens.                         |
| Zone - Life Map                      | Zone       | 1   | Parent zone. Overlay opens over the Life Map; map stays visible but dimmed behind.                                |
| Overlay - The Table                  | Overlay    | 1   | Persistent priority display. Clicking Gold/Silver positions navigates to Project Board. Adjacent overlay pattern. |
| Standard - Project States            | Standard   | 2   | Determines visual treatment and available actions within the Project Board based on lifecycle state.              |
| Standard - Spatial Interaction Rules | Standard   | 2   | Governs hex grid interactions. Clicking a project building on the map is the entry point to this overlay.         |
| Capability - Workspace Navigation    | Capability | 2   | Navigation patterns including deep linking, URL routing, and context preservation.                                |

## Key Design Decisions from Cards

1. **Overlay, not page navigation.** The Project Board is an overlay over the Life Map (Room - Project Board: "it's an overlay, not a navigation event. The Life Map stays visible (dimmed) behind"). The current implementation is a full-page route at `/projects/:projectId` — this issue transforms it into an overlay rendered on top of the map.

2. **Task list replaces kanban.** Per #703 (dependency), the kanban board is being replaced with a simpler task list with state-toggling rows (`todo` -> `doing` -> `in_review` -> `done`). This overlay will consume that new task list component.

3. **Marvin auto-selected.** When the project overlay opens, Marvin should be the active agent in the Attendant Rail (Agent - Marvin: manages tasks, project execution, and is the operational partner for project work).

4. **URL-addressable overlays.** Per #705 (dependency), the overlay routing pattern must support `/projects/:id` as an overlay route, not a full-page route. Browser back closes the overlay. Escape closes the overlay. Deep links work.

5. **Overlay contents.** From Room - Project Board: project name, description, objectives, task list (checkable), progress, history, actions (pause, complete, add task, edit). Issue #708 scopes to: name, description, and task list with add/edit/toggle.

## Codebase Impact Map

### Files to Modify

| File                                                         | Impact     | Notes                                                                                                                                                                                                                           |
| ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/src/Root.tsx`                                  | **High**   | Currently renders `ProjectDetailPage` as a standalone route at `ROUTES.PROJECT`. Must change to render the project overlay within the Life Map layout, or adopt the overlay routing pattern from #705.                          |
| `packages/web/src/components/projects/ProjectDetailPage.tsx` | **High**   | Currently a full-page component using `RoomLayout` + `NewUiShell`. Must be refactored into an overlay component that renders over the map. Core logic (project query, task query, room definition, chat lifecycle) is reusable. |
| `packages/web/src/components/project-room/ProjectKanban.tsx` | **High**   | Will be replaced by the new task list component from #703. The overlay will render the task list instead of the kanban.                                                                                                         |
| `packages/web/src/components/project-room/ProjectHeader.tsx` | **Medium** | Header displaying project name and metadata. May need adaptation for overlay context (close button, compact layout).                                                                                                            |
| `packages/web/src/constants/routes.ts`                       | **Medium** | `ROUTES.PROJECT` (`/projects/:projectId`) remains as a route but its rendering changes from full-page to overlay-over-map. May need to align with overlay routing pattern from #705.                                            |
| `packages/web/src/components/hex-map/HexGrid.tsx`            | **Medium** | Click handler on project buildings must trigger overlay open with project ID. Currently navigates to project detail page.                                                                                                       |
| `packages/web/src/components/hex-map/HexMap.tsx`             | **Medium** | May need to host overlay rendering or pass overlay state down.                                                                                                                                                                  |
| `packages/web/src/components/life-map/LifeMap.tsx`           | **Medium** | May need to integrate overlay rendering within the Life Map view.                                                                                                                                                               |
| `packages/web/src/components/layout/RoomLayout.tsx`          | **Low**    | Currently wraps ProjectDetailPage with chat panel. Overlay version may use RoomLayout differently or need a variant for overlay context.                                                                                        |
| `packages/web/src/components/layout/TableBar.tsx`            | **Low**    | Table slots navigate to Project Board. Click handlers may need updating to open overlay instead of navigating to full page.                                                                                                     |
| `packages/web/src/hooks/useProjectChatLifecycle.ts`          | **Low**    | Manages chat lifecycle for project rooms. Should work with overlay pattern but may need lifecycle adjustments for overlay open/close.                                                                                           |

### Files from Dependencies (#703, #705)

| File                                  | Dependency | Notes                                                                                                       |
| ------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| New task list component (from #703)   | #703       | Replaces ProjectKanban. State-toggling task rows. Must exist before #708 can integrate it.                  |
| Overlay component/pattern (from #705) | #705       | Reusable overlay frame with close button, Escape handling, dimmed backdrop. Must exist before #708 uses it. |

### LiveStore / Shared Layer

| File                             | Impact   | Notes                                                                                                                 |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/queries.ts` | **None** | `getProjectById$` and `getProjectTasks$` queries already exist and are sufficient.                                    |
| `packages/shared/src/events.ts`  | **None** | Task events (`taskCreated`, `taskStatusUpdated`, `taskDeleted`) already exist.                                        |
| `packages/shared/src/schema.ts`  | **None** | `projects` and `tasks` tables already exist with required fields.                                                     |
| `packages/shared/src/rooms.ts`   | **Low**  | `createProjectRoomDefinition` already exists. May need to wire Marvin as the default agent for project overlay rooms. |

## Dependency Chain

```
#704 (Map as base layer)
  └── #705 (Building overlay pattern and routing)
        └── #708 (Project interface as building overlay) ← THIS ISSUE
#703 (Task list replaces kanban)
        └── #708 (Project interface as building overlay) ← THIS ISSUE
```

Both #703 and #705 must land before #708 can begin. The overlay pattern from #705 provides the reusable frame; the task list from #703 provides the content component.

## Provenance

All cards read in full before inclusion. No fabrication. Sources directory skipped per protocol.

- Room - Project Board: `docs/context-library/product/rooms/Room - Project Board.md`
- Primitive - Task: `docs/context-library/product/primitives/Primitive - Task.md`
- Primitive - Project: `docs/context-library/product/primitives/Primitive - Project.md`
- Structure - Kanban Board: `docs/context-library/product/structures/Structure - Kanban Board.md`
- Agent - Marvin: `docs/context-library/product/agents/Agent - Marvin.md`
- Zone - Life Map: `docs/context-library/product/zones/Zone - Life Map.md`
- Overlay - The Table: `docs/context-library/product/overlays/Overlay - The Table.md`
- Standard - Project States: `docs/context-library/rationale/standards/Standard - Project States.md`
- Standard - Spatial Interaction Rules: `docs/context-library/rationale/standards/Standard - Spatial Interaction Rules.md`
- Capability - Workspace Navigation: `docs/context-library/product/capabilities/Capability - Workspace Navigation.md`
