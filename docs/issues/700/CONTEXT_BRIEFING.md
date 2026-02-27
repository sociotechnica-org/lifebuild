# Context Briefing: #700 Remove the Sorting Room

**Assembled by:** Conan the Librarian
**Date:** 2026-02-27
**Target type:** Room
**Task type:** Removal

---

## Task Frame

| Field          | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| **Task**       | Remove the Sorting Room from the UI                                                             |
| **Target**     | Room - Sorting Room (and all contained components)                                              |
| **Task type**  | Removal                                                                                         |
| **Scope**      | GoldSilverPanel, BronzePanel, all sorting components, routes, nav links, room definition        |
| **Constraint** | Three-stream portfolio DATA (gold/silver/bronze classification) is preserved in data layer      |
| **Acceptance** | No sorting-room routes, no sorting-room components rendered, no nav links; data layer untouched |

---

## Primary Cards (full content)

### 1. Room - Sorting Room

**WHAT:** Marvin's prioritization space in the Strategy Studio -- where builders make prioritization decisions, select Work at Hand for the week, and review their Priority Queue. The Sorting Room is where the three-stream selection process happens.

**WHERE:**

- Zone: Zone - Strategy Studio
- Agent: Agent - Marvin
- Capabilities: Capability - Three-Stream Filtering
- Populates: Overlay - The Table (selections populate Table positions)
- Adjacent: Room - Council Chamber, Room - Drafting Room, Room - Roster Room
- Uses: System - Priority Queue Architecture, Standard - Priority Score

**WHY:** Strategy - Superior Process (prioritization deserves its own space). Principle - Familiarity Over Function (sorting metaphor). Principle - Protect Transformation (selection process enforces stream constraints). Marvin advises on priority, never decides it.

**WHEN:** Build phase: MVP. Status: Implemented. Reality note (2026-02-12): Sorting Room exists at `/sorting-room` with Marvin agent active. Three-stream filtering implemented with `GoldSilverPanel.tsx` and `BronzePanel.tsx`. Drag-to-table interaction works via dnd-kit. Bronze mode selection is functional. Stream-specific routes at `/sorting-room/:stream` exist.

**HOW:** Selection flow: Gold selection -> Silver selection -> Bronze review. Marvin presents filtered candidates with priority scores. Manual reordering via drag-and-drop. Output: selections populate The Table.

### 2. Capability - Three-Stream Filtering

**WHAT:** Filtered views in the Sorting Room that separate Priority Queue candidates by stream classification -- Gold (expansion), Silver (capacity), Bronze (operational tasks).

**WHERE:** Room - Sorting Room (where filtering is performed). Uses System - Priority Queue Architecture, Standard - Priority Score. Enables Capability - Weekly Planning.

**WHY:** Streams need separate views. Principle - Protect Transformation (can't accidentally put Bronze in Gold slot). Filters enforce stream boundaries by design.

**WHEN:** Build phase: MVP. Status: Implemented. Reality note (2026-02-10): Exists via `GoldSilverPanel.tsx` and `BronzePanel.tsx`. Projects separated by stream. Drag-to-table interaction populates The Table positions.

**HOW:** Gold filter shows Purpose = "Moving forward" projects. Silver filter shows Purpose = "Building leverage" projects. Bronze sources shows maintenance, system-generated, due-date items. Only one filter active at a time. Cannot cross-select.

### 3. Zone - Strategy Studio (parent zone)

**WHAT:** The planning workspace -- collection of specialized rooms where builders engage in strategic conversations with AI advisors, make prioritization decisions, draft projects, and manage delegation.

**WHERE:** Rooms: Council Chamber, Sorting Room, Drafting Room, Roster Room. Overlays: The Table. Adjacent: Zone - Life Map, Zone - Archives.

**WHEN:** Build phase: Post-MVP. Status: Partial. Reality note (2026-02-10): The Strategy Studio as a unified zone does not exist. Rooms are implemented as top-level routes: Drafting Room (`/drafting-room`) and Sorting Room (`/sorting-room`). **Design decision (GDD v0.2, 2026-02-13):** Strategy Studio as a separate zone is dissolved. The map is the primary UI. Strategic rooms now live inside the sanctuary structure at the center of the hex grid.

### 4. Agent - Marvin

**WHAT:** The builder's Manager -- steward who makes things real. Bridges strategy into action. Operates across three rooms: Drafting Room (project creation), Sorting Room (priority selection), Roster Room (delegation).

**WHERE:** Home: Room - Drafting Room, Room - Sorting Room, Room - Roster Room. Manages: Three-Stream Filtering, Priority Score, Purpose Assignment, Four-Stage Creation.

**WHEN:** Build phase: MVP. Status: Partial. Reality note (2026-02-12): Marvin is fully active in the Drafting Room and Sorting Room with routable UIs, agent definitions in `rooms.ts`.

**Impact of removal:** Marvin loses the Sorting Room as one of his three homes. His prioritization responsibilities (presenting Priority Queue, showing priority scores, guiding Bronze mode selection) lose their dedicated UI space. Marvin's Drafting Room role is unaffected.

### 5. Overlay - The Table

**WHAT:** Persistent priority spotlight displaying Work at Hand across Gold, Silver, Bronze positions. Visible at all zoom levels.

**WHERE:** Components: Gold Position, Silver Position, Bronze Position. Navigates to: Room - Project Board (clicking Gold/Silver), Room - Sorting Room (where selections are made).

**WHEN:** Build phase: MVP. Status: Implemented. Reality note (2026-02-10): Exists as `TableBar.tsx` rendered persistently at the bottom via `NewUiShell.tsx`.

**Impact of removal:** The Table currently navigates to the Sorting Room for selections. With Sorting Room removed, the "where selections are made" pathway is broken. NOTE: Issue #699 removes The Table itself, so if both #699 and #700 land, this is moot. If #700 lands first, The Table loses its selection source.

---

## Supporting Cards (summary table)

| Card                                 | Type       | Relevance                                                                                                           |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Standard - Three-Stream Portfolio    | Standard   | Defines gold/silver/bronze classification. DATA PRESERVED -- only UI removed. Sorting Room is listed as conforming. |
| Component - Gold Position            | Component  | Child of The Table. Selection via Sorting Room mentioned in WHEN.                                                   |
| Component - Silver Position          | Component  | Child of The Table. Selection via Sorting Room mentioned in WHEN.                                                   |
| Component - Bronze Position          | Component  | Child of The Table. Bronze mode selection via `BronzePanel.tsx` in Sorting Room.                                    |
| Capability - Weekly Planning         | Capability | Weekly planning "happens in the Sorting Room with Marvin." Loses its primary location.                              |
| Room - Drafting Room                 | Room       | Adjacent room. Stage3Form navigates to Sorting Room on completion. Needs redirect target change.                    |
| Standard - Priority Score            | Standard   | Used by Sorting Room for ranking. Standard itself unaffected by UI removal.                                         |
| System - Priority Queue Architecture | System     | Source of candidates for Sorting Room. System unaffected, just loses its UI consumer.                               |

---

## Relationship Map

```
Zone - Strategy Studio
  |
  +-- Room - Sorting Room  <-- REMOVING THIS
  |     |
  |     +-- Capability - Three-Stream Filtering  <-- REMOVING UI
  |     +-- Agent - Marvin (resident)  <-- loses this home
  |     +-- GoldSilverPanel.tsx  <-- DELETE
  |     +-- BronzePanel.tsx  <-- DELETE
  |     +-- SortableProjectCard.tsx  <-- DELETE
  |     +-- TableDropZone.tsx  <-- DELETE
  |     +-- TableConfirmDialog.tsx  <-- DELETE
  |     +-- SortingRoom.tsx  <-- DELETE
  |     +-- SortingRoom.stories.tsx  <-- DELETE
  |     +-- BronzePanel.stories.tsx  <-- DELETE
  |     |
  |     +-- populates --> Overlay - The Table
  |     +-- uses --> System - Priority Queue Architecture
  |     +-- uses --> Standard - Priority Score
  |
  +-- Room - Drafting Room (adjacent, Stage3Form navigates here)
  +-- Room - Council Chamber (adjacent, not implemented)
  +-- Room - Roster Room (adjacent, not implemented)
```

---

## Codebase Impact Map

### Files to DELETE (8 files)

| File                                                               | Description                             |
| ------------------------------------------------------------------ | --------------------------------------- |
| `packages/web/src/components/sorting-room/SortingRoom.tsx`         | Main Sorting Room component             |
| `packages/web/src/components/sorting-room/GoldSilverPanel.tsx`     | Gold/Silver stream panel                |
| `packages/web/src/components/sorting-room/BronzePanel.tsx`         | Bronze stream panel                     |
| `packages/web/src/components/sorting-room/SortableProjectCard.tsx` | Drag-sortable project card              |
| `packages/web/src/components/sorting-room/TableDropZone.tsx`       | Drop zone for Table interaction         |
| `packages/web/src/components/sorting-room/TableConfirmDialog.tsx`  | Confirmation dialog for Table placement |
| `packages/web/src/components/sorting-room/SortingRoom.stories.tsx` | Storybook stories                       |
| `packages/web/src/components/sorting-room/BronzePanel.stories.tsx` | Storybook stories                       |

### Files to MODIFY (8 files)

| File                                                         | Change                                                                                                                                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/src/Root.tsx`                                  | Remove `SortingRoom` import (line 35), remove `SORTING_ROOM` import from shared/rooms (line 36), remove both `<Route>` blocks for `ROUTES.SORTING_ROOM` and `ROUTES.SORTING_ROOM_STREAM` (lines 459-478) |
| `packages/web/src/constants/routes.ts`                       | Remove `SORTING_ROOM` and `SORTING_ROOM_STREAM` from `ROUTES` (lines 10-11), remove `sortingRoom` from `generateRoute` (lines 32-33)                                                                     |
| `packages/web/src/components/layout/NewUiShell.tsx`          | Remove "Sorting Room" nav link (lines 143-152)                                                                                                                                                           |
| `packages/web/src/components/drafting-room/Stage3Form.tsx`   | Change `handleContinue` navigation from `generateRoute.sortingRoom(stream)` to another destination (line 330) -- likely `generateRoute.lifeMap()`                                                        |
| `packages/web/src/components/drafting-room/DraftingRoom.tsx` | Check and remove any Sorting Room references                                                                                                                                                             |
| `packages/web/src/hooks/useNavigationContext.ts`             | Remove sorting-room pathname check (line 30)                                                                                                                                                             |
| `packages/web/src/components/life-map/LifeMap.tsx`           | Remove comments referencing SortingRoom (lines 235, 452-453)                                                                                                                                             |
| `packages/web/src/components/life-map/CategoryCard.tsx`      | Remove/change link to sorting room with category filter (line 144)                                                                                                                                       |
| `packages/shared/src/rooms.ts`                               | Remove `SORTING_ROOM` definition (line 247+), `SORTING_ROOM_PROMPT` (line 195+), and the `getRoomDefinition` case for `'sorting-room'` (line 445)                                                        |
| `packages/web/README.md`                                     | Remove sorting_room analytics event docs (lines 224, 241-246)                                                                                                                                            |
| `packages/web/src/components/README.md`                      | Remove `sorting-room/` directory listing (line 10)                                                                                                                                                       |

### Files to CHECK (data layer -- should NOT be modified)

| File                                    | Reason                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/shared/src/types/planning.ts` | Contains `LifecycleStream = 'gold' \| 'silver' \| 'bronze'` -- PRESERVE         |
| `packages/shared/src/events.ts`         | May contain table/stream events -- PRESERVE                                     |
| `packages/shared/src/schema.ts`         | May contain tableConfiguration/tableBronzeProjects materializers -- PRESERVE    |
| `packages/shared/src/queries.ts`        | May contain sorting-related queries -- PRESERVE (queries may be used elsewhere) |

### E2E Tests

No e2e tests directly reference sorting-room routes. However, `packages/web/e2e/workflow.spec.ts` should be checked for indirect references to sorting room navigation flows.

### Server

| File                                   | Status                                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `packages/server/src/tools/schemas.ts` | References sorting. Check if tool definitions reference sorting room. |
| `packages/server/src/tools/index.ts`   | References sorting. Check if tool definitions reference sorting room. |
| `packages/server/src/tools/table.ts`   | References sorting. Check if tool definitions reference sorting room. |

---

## Gap Manifest

| Dimension | Gap                                                                          | Searched | Found                                                           |
| --------- | ---------------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| WHERE     | What replaces Sorting Room as the selection pathway for Weekly Planning?     | Yes      | Not found -- no card describes an alternative selection UI      |
| WHERE     | Where does Stage3Form navigate after Sorting Room removal?                   | Yes      | Not found -- needs design decision                              |
| HOW       | How do builders select Gold/Silver/Bronze Work at Hand without Sorting Room? | Yes      | Not found -- no alternative UI documented                       |
| WHEN      | Coordination with #699 (Remove the Table) -- which lands first?              | Yes      | Partial -- both target MVP removal but no sequencing documented |
| WHEN      | Context library card updates after removal                                   | Yes      | Not found -- cards still reference Sorting Room as implemented  |

---

## WHEN Section Divergences

| Card                                | WHEN Says                                                                | Reality                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Room - Sorting Room                 | "Build phase: MVP, Implementation status: Implemented"                   | Being removed in #700. Card needs update to reflect removal.                                                |
| Capability - Three-Stream Filtering | "Build phase: MVP, Implementation status: Implemented"                   | UI implementation being removed. Capability still conceptually valid but has no UI home. Card needs update. |
| Capability - Weekly Planning        | "Selection mechanics exist in the Sorting Room"                          | Selection mechanics being removed. Weekly Planning loses its implementation location. Card needs update.    |
| Agent - Marvin                      | "Marvin is fully active in... Sorting Room"                              | Sorting Room being removed. Marvin loses one of his three homes. Card needs update.                         |
| Zone - Strategy Studio              | "Sorting Room (`/sorting-room`) implemented as top-level route"          | Route being removed. Card needs update.                                                                     |
| Overlay - The Table                 | "Room - Sorting Room -- where selections are made"                       | Selection source being removed. Card needs update. But also #699 may remove The Table itself.               |
| Component - Gold Position           | "Selection happens via Sorting Room drag-to-table interaction"           | Selection pathway being removed. Card needs update.                                                         |
| Component - Silver Position         | "Selection via Sorting Room"                                             | Selection pathway being removed. Card needs update.                                                         |
| Component - Bronze Position         | "Bronze mode selection functional in Sorting Room via `BronzePanel.tsx`" | Being removed. Card needs update.                                                                           |
| Standard - Three-Stream Portfolio   | "Three-stream filtering works in the Sorting Room"                       | Filtering UI being removed. Standard itself (data classification) preserved. Card needs update.             |
| Room - Drafting Room                | "Stage 4 (Prioritizing) happens in the Sorting Room"                     | Stage 4 destination being removed. Card needs update.                                                       |

**Total cards requiring WHEN updates after removal: 11**

---

## Notes for Implementation

1. **Data layer is untouched.** The `LifecycleStream`, `tableConfiguration`, `tableBronzeProjects`, priority score calculations, and all events/materializers remain. Only the UI layer is removed.

2. **Stage3Form redirect is the key UX decision.** After completing Stage 3 (drafting tasks), the current flow sends builders to the Sorting Room with the matching stream open. A new destination must be chosen -- likely `/life-map` or `/projects`.

3. **CategoryCard link removal.** The Life Map's CategoryCard currently links to the Sorting Room filtered by category. This link needs to be removed or redirected.

4. **Coordination with #699 (Remove the Table).** The Table and Sorting Room are tightly coupled -- Sorting Room populates The Table. If both are being removed, the order matters less. If only Sorting Room is removed first, The Table loses its selection pathway.

5. **Room definition cleanup.** The `SORTING_ROOM` constant and `SORTING_ROOM_PROMPT` in `packages/shared/src/rooms.ts` should be removed along with the `getRoomDefinition` case.

6. **Server tools.** Check `packages/server/src/tools/schemas.ts` and `packages/server/src/tools/index.ts` for any tool definitions that reference sorting room concepts or route to sorting room URLs.
