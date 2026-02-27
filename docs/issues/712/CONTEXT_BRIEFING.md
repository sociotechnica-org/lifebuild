# Context Briefing: Issue #712 — Project Placement Flow

**Classification:** Capability (project placement is a user-initiated action/workflow)
**Task type:** New feature
**Prepared:** 2026-02-27 by Conan the Librarian

---

## Constellation Map

```
Strategy - Spatial Visibility
    |
    +-- Principle - Bidirectional Loop
    |       |
    |       +-- Standard - Spatial Interaction Rules  <-- governs placement behavior
    |
    +-- Zone - Life Map  <-- where placement happens
            |
            +-- Structure - Hex Grid  <-- spatial substrate
            |       |
            |       +-- Component - Hex Tile  <-- placed result
            |
            +-- Primitive - Project  <-- entity being placed
```

---

## Seed Cards (read in full)

### 1. Standard - Spatial Interaction Rules

**Card path:** `docs/context-library/rationale/standards/Standard - Spatial Interaction Rules.md`

The governing specification for this feature. Key rules:

- **Placement:** "Builders place their own projects. System does not assign locations."
- **Interaction:** "Single drag-and-drop action" (issue #712 simplifies to click-to-place, which satisfies the "single action" requirement)
- **Suggested locations:** Prohibited -- no auto-place
- **"Optimize layout":** Prohibited -- no system rearrangement
- **Persistence:** "Spatial arrangement persists exactly as builder left it."

**Decision D1 (2026-02-17):** Manual placement from R1 day one. No algorithmic initial placement. R1 needs placement UX (tap/drag to place) and placement validation UI.

**Conformance test relevant to #712:** "Create a new project and place it on the hex grid -- verify no suggested location, auto-place, or 'optimal position' prompt appears. The builder must freely choose the hex."

### 2. Structure - Hex Grid

**Card path:** `docs/context-library/product/structures/Structure - Hex Grid.md`

The spatial canvas for placement. Key facts:

- One project per hex (D3 decision, 2026-02-17). Hex position is a unique constraint.
- Reserved hexes exist (Campfire at center). The `placementRules.ts` file reserves `(0,0)`, `(0,-1)`, `(1,-1)`.
- Grid radius currently 3 (37 cells). Infinite canvas is the design goal.
- Builder arranges tiles spatially by category and relationship.
- Empty hexes between clusters create breathing room.

**Reality note (2026-02-24):** A working prototype demonstrates hex grid with illustrated tiles, camera-based navigation, sprite placement, and pathfinding.

### 3. Primitive - Project

**Card path:** `docs/context-library/product/primitives/Primitive - Project.md`

The entity being placed. Key facts:

- Projects gain a hex coordinate property on placement (`hexPosition.placed` event with `{projectId, q, r}`).
- Hex position is a unique constraint -- no two projects share a hex.
- Project lifecycle states affect visual treatment on the tile (Planning: sketch style, Live: full color, Work at Hand: highlighted).

### 4. Component - Hex Tile

**Card path:** `docs/context-library/product/components/Component - Hex Tile.md`

The visual result of placement. Key interactions:

- Click -> opens Project Board overlay
- Drag -> repositions on grid (out of scope for #712)
- Long press -> quick actions menu (out of scope for #712)
- All tiles same size.

---

## Expanded Context (per Capability retrieval profile)

### Room: Workshop (source of placement)

Issue #709 (blocker) establishes the Workshop overlay at `/workshop`. The placement flow initiates from here. The Workshop is the map-first equivalent of the Drafting Room -- where builders draft projects with Marvin.

### Zone: Life Map

**Card path:** `docs/context-library/product/zones/Zone - Life Map.md`

- The primary workspace. The map IS the game.
- Default route: `/life-map` rendering `LifeMap.tsx`.
- Hex Grid is the spatial organization canvas within the Life Map.
- Entry point for all spatial interaction.

### Strategy: Spatial Visibility

**Card path:** `docs/context-library/rationale/strategies/Strategy - Spatial Visibility.md`

- Strategic Plank 1. Work represented spatially, visually, traversably.
- Current maturity: Level 1-2 (hexmap with flat illustrations in development).
- Placement is a core enabler: without placement, the spatial bet cannot function.

### Principle: Bidirectional Loop

**Card path:** `docs/context-library/rationale/principles/Principle - Bidirectional Loop.md`

- "External representation and internal understanding strengthen each other through iteration."
- "Builders who place, observe, reorganize, and re-observe develop progressively clearer self-understanding."
- Justifies the critical design decision: builders place their own projects.
- Placement reveals how the builder actually thinks about their life.

---

## Codebase Impact Analysis

### Already implemented (significant prior work exists)

| File | Role |
|------|------|
| `packages/web/src/components/hex-map/PlacementContext.tsx` | React context managing placement state (`isPlacing`, `startPlacement`, `clearPlacement`, `placementProjectId`) |
| `packages/web/src/components/hex-map/HexGrid.tsx` | Grid component with full placement mode: `placeable`/`blocked`/`targeted` visual states, hover tracking, click-to-place handler, placement label tooltip |
| `packages/web/src/components/hex-map/HexMap.tsx` | Orchestrator: Escape key handler, pointer-missed cancel, first-placement prompt, `PlacementProvider` wrapping |
| `packages/web/src/components/hex-map/UnplacedPanel.tsx` | Side panel listing unplaced projects, placement mode indicator, cancel button |
| `packages/web/src/components/hex-map/hexPositionCommands.ts` | Domain commands: `placeProjectOnHex()`, `removeProjectFromHex()` with conflict validation |
| `packages/web/src/components/hex-map/placementRules.ts` | Reserved hex coords `(0,0)`, `(0,-1)`, `(1,-1)` |
| `packages/web/src/components/life-map/LifeMap.tsx` | Integration: `handlePlaceProjectOnMap` wiring, hex position queries, tile building, view mode toggle |
| `packages/shared/src/livestore/events.ts` | `hexPosition.placed` and `hexPosition.removed` synced events |
| `packages/shared/src/livestore/schema.ts` | `hex_positions` table with unique indexes on `(hexQ, hexR)` and `(entityType, entityId)` |
| `packages/shared/src/livestore/queries.ts` | `getHexPositions$` and `getUnplacedProjects$` queries |
| `packages/web/e2e/life-map-placement.spec.ts` | E2E test: full place-and-remove flow via unplaced tray |

### What issue #712 adds (gap analysis)

The existing implementation supports placement from the **Unplaced Panel** (side tray on the Life Map). Issue #712 requires placement initiated from the **Workshop overlay**:

1. **Workshop -> placement mode transition:** When builder initiates placement from Workshop, the overlay must close and the map must enter placement mode with the selected project. This transition does not exist yet.
2. **Cursor/highlight on valid hex cells:** Already implemented in `HexGrid.tsx` (the `placeable`, `blocked`, `targeted` visual states).
3. **Click empty hex places the project:** Already implemented in `HexGrid.tsx` `handlePlacementClick`.
4. **Escape cancels:** Already implemented in `HexMap.tsx` keydown handler.
5. **Invalid cells visually indicated:** Already implemented (`blocked` state in `HexGrid.tsx`).
6. **Project building/statue appears on the chosen hex:** `HexTile` component renders placed tiles. The "building/statue" visual depends on how #709 and the prototype shape buildings.

**Primary engineering task:** Wire the Workshop overlay to call `startPlacement(projectId)` on the `PlacementContext`, close the overlay, and let the existing placement flow handle the rest. The PlacementContext and all grid-side mechanics already exist.

---

## Design Constraints from Context Library

1. **No suggested locations.** The placement flow must not hint at "good" positions. (Standard - Spatial Interaction Rules)
2. **No confirmation dialog.** Place is a single action. (Standard - Spatial Interaction Rules)
3. **Builder chooses freely.** All empty, unreserved hexes are valid targets. (Standard - Spatial Interaction Rules, Principle - Bidirectional Loop)
4. **Escape cancels cleanly.** Returns to Workshop state without side effects. (Issue spec)
5. **One project per hex.** Occupied hexes are blocked. (Structure - Hex Grid, D3 decision)
6. **Reserved hexes are blocked.** `(0,0)`, `(0,-1)`, `(1,-1)` for landmarks. (placementRules.ts)
7. **TEMP DECISION: Simple click-to-place.** No flourish or fanfare. Enhanced after P2 prototype.

---

## Provenance

| Card | Path | Read in full |
|------|------|:---:|
| Standard - Spatial Interaction Rules | `docs/context-library/rationale/standards/Standard - Spatial Interaction Rules.md` | Yes |
| Structure - Hex Grid | `docs/context-library/product/structures/Structure - Hex Grid.md` | Yes |
| Primitive - Project | `docs/context-library/product/primitives/Primitive - Project.md` | Yes |
| Component - Hex Tile | `docs/context-library/product/components/Component - Hex Tile.md` | Yes |
| Zone - Life Map | `docs/context-library/product/zones/Zone - Life Map.md` | Yes |
| Strategy - Spatial Visibility | `docs/context-library/rationale/strategies/Strategy - Spatial Visibility.md` | Yes |
| Principle - Bidirectional Loop | `docs/context-library/rationale/principles/Principle - Bidirectional Loop.md` | Yes |
| System - Four-Stage Creation | `docs/context-library/product/systems/System - Four-Stage Creation.md` | Yes |

No cards from `sources/` were included. No content was fabricated.
