# Context Briefing: #699 -- Remove the Table

## Task Frame

**Task:** Remove The Table UI (gold/silver/bronze slot bar) from the application. This includes the persistent bottom bar (`TableBar`), slot components (`TableSlot`), table state hooks (`useTableState`), and table-related queries/materializers. Project data (tier categorization as Gold/Silver/Bronze) is preserved -- only the Table UI and its state management are removed.

**Target type:** Overlay

**Task type:** Removal

**Constraints:**
- Preserve project tier data (Gold/Silver/Bronze classification on projects)
- Preserve the three-stream portfolio model in the data layer
- Only remove the UI rendering and its direct state management
- The Sorting Room's ability to assign projects to streams should remain functional in the data layer even if the Table display is removed

**Acceptance criteria:**
- TableBar component no longer renders in the UI shell
- TableSlot components are removed
- useTableState hook is removed
- Table-related LiveStore queries/materializers that exist solely for Table rendering are removed
- LiveStore events for table configuration are preserved (they are part of the event-sourced history)
- No broken imports or dead code remain
- Application builds and all tests pass

## Primary Cards (full content)

### Overlay - The Table

**Type:** Overlay
**Relevance:** This is the card describing the exact feature being removed. It documents all components, standards, and systems that depend on or connect to The Table.

#### WHAT: Definition

A persistent priority spotlight that sits at the top of the Life Map, displaying the builder's Work at Hand across three distinct positions: Gold (expansion), Silver (capacity), and Bronze (operations). The Table remains visible at all zoom levels -- current priorities never disappear from view.

#### WHERE: Ecosystem

- Visibility: All zones -- The Table persists across Zone - Life Map, Zone - Strategy Studio, and Zone - Archives
- Components:
  - Component - Gold Position -- displays single expansion project
  - Component - Silver Position -- displays single capacity project
  - Component - Bronze Position -- displays operational task stack
- Displays:
  - Primitive - Project -- Gold/Silver positions display projects
  - Primitive - Task -- Bronze position displays task stack
- Navigates to:
  - Room - Project Board -- clicking Gold/Silver opens project detail
  - Room - Sorting Room -- where selections are made
- Conforms to:
  - Standard - Three-Stream Portfolio -- three positions map to three streams
  - Standard - Visual Language -- stream color accents, saturation states, glow treatments
  - Standard - Table Slot Behaviors -- empty slot visual treatment follows spec
  - Standard - Dual Presence -- projects appear here AND on hex grid
- Implements:
  - System - Weekly Priority -- displays selected Work at Hand
  - Principle - Visibility Creates Agency -- priorities always visible
  - Principle - Protect Transformation -- structural separation of streams
- Modified by: System - Adaptation -- mid-week changes
- Constraint: Maximum 1 Gold + 1 Silver (SOT 5.1)

#### WHY: Rationale

- Strategy: Strategy - Spatial Visibility -- priority visible at all times
- Strategy: Strategy - Superior Process -- structured weekly commitment
- Principle: Principle - Protect Transformation -- Gold/Silver slots protected from Bronze overflow
- Principle: Principle - Empty Slots Strategic -- empty positions are valid choices
- Driver: Builders need constant awareness of what they've committed to this week. The Table is the answer to "what am I working on right now?"
- Constraints: The Table shows commitment, not progress. It answers "what am I working on?" not "how much is done?" Maximum 1 Gold + 1 Silver is structural, not configurable.

#### WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** The Table exists as `TableBar.tsx` rendered persistently at the bottom of the screen (not the top as described) via `NewUiShell.tsx`. Three `TableSlot` components display Gold, Silver, and Bronze positions. Backed by `tableConfiguration` and `tableBronzeProjects` LiveStore tables with full event support (`table.configurationUpdated`, `table.bronzeProjectAdded`, etc.). Bronze shows top project plus count of additional. No project illustrations or image evolution on slots. Visible across all routes.

#### HOW: Implementation

**Layout:** Three positions arranged left to right: Gold (leftmost), Silver (center), Bronze (rightmost).

**Persistence:** The Table remains visible regardless of zoom level or navigation state on the Life Map.

**Interaction:** Click any position opens relevant Project Board or Bronze stack view. Positions reflect real-time state.

**Visual treatment:** Each position has stream-specific color accent. Active items show enhanced treatment. Empty positions render as calm, intentional states.

**Constraint enforcement:** System blocks adding second Gold or second Silver. Pausing creates opening; promotion can fill it.

---

### Standard - Table Slot Behaviors

**Type:** Standard
**Relevance:** This standard governs the visual and interaction behavior of empty Gold/Silver slots on The Table. It will become orphaned (no conforming overlay) after The Table is removed. Important for understanding what can be safely removed.

#### WHAT: Definition

The specification for visual treatment and interaction behavior of empty Gold and Silver slots on The Table -- distinguishing between "not yet selected" (planning incomplete) and "intentionally empty" (strategic choice), with rules for agent behavior around empty slots.

#### WHERE: Ecosystem

- Conforming overlay: Overlay - The Table -- renders empty slot visual states
- Conforming capabilities: Capability - Weekly Planning -- slot selection includes intentional-empty option
- Conforming components: Component - Gold Position, Component - Silver Position
- Implements: Principle - Empty Slots Strategic

#### WHEN: Timeline

**Implementation status:** Partial
**Reality note (2026-02-10):** Gold/Silver/Bronze slots on The Table are implemented with empty and filled states. However, no visual distinction between "not yet selected" and "intentionally empty." No agent awareness of empty-slot intent.

---

### Component - Gold Position

**Type:** Component
**Relevance:** Direct child component of The Table that will be removed. Documents the `TableSlot` component specialization for Gold.

#### WHAT: Definition

The leftmost position on The Table, displaying a single expansion project.

#### WHERE: Ecosystem

- Parent: Overlay - The Table
- Conforms to: Standard - Three-Stream Portfolio, Standard - Visual Language, Standard - Dual Presence, Standard - Table Slot Behaviors
- Related: Component - Silver Position, Component - Bronze Position

#### WHEN: Timeline

**Implementation status:** Implemented
**Reality note (2026-02-10):** Gold Position exists as a `TableSlot` component in `TableBar.tsx`. Single Gold constraint is enforced. Selection happens via Sorting Room drag-to-table interaction.

---

### Component - Silver Position

**Type:** Component
**Relevance:** Direct child component of The Table that will be removed.

#### WHAT: Definition

The center position on The Table, displaying a single capacity-building project.

#### WHERE: Ecosystem

- Parent: Overlay - The Table
- Conforms to: Standard - Three-Stream Portfolio, Standard - Visual Language, Standard - Table Slot Behaviors
- Related: Component - Gold Position, Component - Bronze Position

#### WHEN: Timeline

**Implementation status:** Implemented
**Reality note (2026-02-10):** Silver Position exists as a `TableSlot` component in `TableBar.tsx`. Single Silver constraint is enforced.

---

### Component - Bronze Position

**Type:** Component
**Relevance:** Direct child component of The Table that will be removed.

#### WHAT: Definition

The rightmost position on The Table, displaying a stack of operational tasks.

#### WHERE: Ecosystem

- Parent: Overlay - The Table
- Conforms to: Standard - Three-Stream Portfolio, Standard - Visual Language, Standard - Bronze Mode Behaviors
- Related: Component - Gold Position, Component - Silver Position, System - Bronze Operations, System - Bronze Stack

#### WHEN: Timeline

**Implementation status:** Implemented
**Reality note (2026-02-10):** Bronze Position exists as a `TableSlot` component in `TableBar.tsx` rendering the top bronze project plus a count of additional queued projects. Backed by `tableBronzeProjects` table.

## Supporting Cards (summaries)

| Card | Type | Key Insight |
| --- | --- | --- |
| Zone - Life Map | Zone | The Table is listed as an overlay in the Life Map zone. Life Map renders `TableBar` via `NewUiShell.tsx`. Removing The Table changes the Life Map's layout. |
| Zone - Strategy Studio | Zone | The Table is listed as a persistent overlay visible across this zone. Not implemented as a separate zone -- rooms are standalone routes. |
| Zone - Archives | Zone | The Table is listed as a persistent overlay. Archives zone is not implemented. No removal impact. |
| Standard - Three-Stream Portfolio | Standard | Defines Gold/Silver/Bronze classification. The Table enforces slot constraints (1G, 1S). The standard itself is preserved -- only The Table's enforcement UI is removed. |
| Standard - Visual Language | Standard | Defines stream color accents applied to Table positions. After removal, stream colors still apply elsewhere (Sorting Room, project cards). |
| Standard - Dual Presence | Standard | Projects appear on both The Table and hex grid. With The Table removed, dual presence becomes single presence (grid only). Standard is partially orphaned. |
| System - Weekly Priority | System | The Table is the display surface for weekly commitment. After removal, weekly priority data still exists but has no persistent visibility surface. |
| System - Capacity Economy | System | References WIP limits on The Table (1G, 1S) as inflation control. Not implemented. Removal has no runtime impact. |
| Principle - Visibility Creates Agency | Principle | The Table embodies "priorities always visible." Removing it reduces persistent visibility of weekly commitment. |
| Principle - Protect Transformation | Principle | The Table enforces structural separation of streams. Removal eliminates the visible enforcement surface. Data-layer enforcement (1G, 1S max) can persist. |
| Principle - Empty Slots Strategic | Principle | Governs empty slot behavior on The Table. Becomes less relevant UI-wise after removal, but the principle still applies to data model. |
| Room - Sorting Room | Room | Populates The Table via drag-to-table interaction. After Table removal, Sorting Room still assigns projects to streams -- the `TableDropZone` and `TableConfirmDialog` components in the Sorting Room will need removal or refactoring. |

## Relationship Map

- **Overlay - The Table** contains Component - Gold Position, Component - Silver Position, Component - Bronze Position (all removed together)
- **Overlay - The Table** conforms-to Standard - Table Slot Behaviors (standard becomes orphaned)
- **Overlay - The Table** conforms-to Standard - Dual Presence (standard partially orphaned -- no Table half)
- **Overlay - The Table** conforms-to Standard - Three-Stream Portfolio (standard preserved -- Sorting Room still conforms)
- **Overlay - The Table** conforms-to Standard - Visual Language (standard preserved -- other UI still conforms)
- **Room - Sorting Room** populates Overlay - The Table (drag-to-table interaction needs removal/refactoring)
- **System - Weekly Priority** displayed-on Overlay - The Table (system preserved, display surface removed)
- **Zone - Life Map** contains Overlay - The Table (zone layout changes)
- **NewUiShell.tsx** renders TableBar.tsx (shell layout changes)

## Codebase Impact Map

Files confirmed to reference Table components (from grep):

| File | Impact |
| --- | --- |
| `packages/web/src/components/layout/TableBar.tsx` | **Remove entirely** -- main Table component |
| `packages/web/src/components/layout/TableBar.test.tsx` | **Remove entirely** -- tests for removed component |
| `packages/web/src/components/layout/TableSlot.tsx` | **Remove entirely** -- slot sub-component |
| `packages/web/src/hooks/useTableState.ts` | **Remove entirely** -- Table state hook |
| `packages/web/src/components/layout/NewUiShell.tsx` | **Edit** -- remove TableBar import and rendering |
| `packages/web/src/components/life-map/LifeMap.tsx` | **Edit** -- remove any Table references |
| `packages/web/src/components/life-map/LifeMap.stories.tsx` | **Edit** -- remove Table references from stories |
| `packages/shared/src/livestore/schema.ts` | **Review** -- `tableConfiguration` and `tableBronzeProjects` tables. Preserve schema (event history), but materializer-only views may be removable. |
| `packages/shared/src/livestore/events.ts` | **Preserve** -- `table.configurationUpdated`, `table.bronzeProjectAdded` etc. are part of event-sourced history. Do not remove events. |
| `packages/shared/src/livestore/queries.ts` | **Review** -- remove queries used solely by Table UI |
| `packages/web/src/components/sorting-room/BronzePanel.tsx` | **Review** -- may reference Table drop zones |
| `packages/web/src/components/sorting-room/SortingRoom.stories.tsx` | **Review** -- may reference Table in stories |
| `packages/web/src/components/project-room/ProjectHeader.tsx` | **Review** -- may reference Table state |

## Gap Manifest

| Dimension | Topic | Searched | Found | Recommendation |
| --- | --- | --- | --- | --- |
| HOW | Sorting Room drag-to-table removal plan | Yes | No | The Sorting Room uses `TableDropZone.tsx` and `TableConfirmDialog.tsx` for drag-to-table. These are not in the main file list but are referenced in the Room - Sorting Room reality note. Search for and remove these components. |
| HOW | What replaces The Table's "persistent priority visibility" | Yes | No | Issue says remove only. No replacement specified. If a replacement is planned, it should be a separate issue. |
| WHERE | Full list of Storybook stories referencing Table | Yes | Partial | Found `LifeMap.stories.tsx` and `SortingRoom.stories.tsx`. Grep for `Table` across all `.stories.tsx` files before removal. |
| WHEN | Library card updates after Table removal | Yes | No | Multiple cards reference The Table. After removal, cards should be updated: Overlay - The Table WHEN section should note removal; Zone - Life Map should remove Table from overlays list; etc. Recommend a follow-up library maintenance task. |

## WHEN Section Divergences

The following vision-vs-reality divergences from WHEN sections affect this task:

1. **Overlay - The Table WHEN:** Card says Table is "at the top of the Life Map." Reality note says it renders "at the bottom of the screen." The actual position is bottom (persistent bar in `NewUiShell.tsx`). This affects where to look for layout changes.

2. **Standard - Dual Presence WHEN:** Says "Partial" implementation. The spatial half (hex tile) doesn't exist. Removing The Table eliminates the only implemented half of dual presence. This is acceptable since the hex grid will introduce its own priority visibility when built.

3. **System - Weekly Priority WHEN:** Says "no weekly cadence -- no week validity, no Friday-to-Friday cycles." Selections are ad-hoc. This means Table removal has less weekly-rhythm impact than the design implies -- there is no weekly cycle to break.

4. **Standard - Table Slot Behaviors WHEN:** Says "Partial" -- no distinction between "not yet selected" and "intentionally empty." The unimplemented parts of this standard become moot after Table removal.
