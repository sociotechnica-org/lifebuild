# Structure - Hex Grid

## WHAT: Definition

The spatial organization canvas that fills most of the Life Map — a tessellated field of hexagonal tiles where each tile represents a project or system. Builders arrange tiles spatially by category and relationship, creating a visual map of their life's work.

## WHERE: Ecosystem

- Zone: [[Zone - Life Map]] — the Hex Grid exists directly in Life Map (not in a Room)
- Contains:
  - [[Component - Hex Tile]] — individual project/system representations
  - [[Component - Campfire]] — origin hex at grid center
- Displays:
  - [[Primitive - Project]] — project tiles
  - [[Primitive - System]] — system tiles
- Conforms to:
  - [[Standard - Visual Language]] — colors, states, indicators
  - [[Standard - Spatial Interaction Rules]] — builder-driven placement, no auto-organization
- Implements:
  - [[Strategy - Spatial Visibility]] — work has spatial position
  - [[Principle - Bidirectional Loop]] — arrangement reflects and shapes understanding
  - [[Principle - Visual Recognition]] — spatial memory for navigation
- Uses: [[Capability - Zoom Navigation]] — scale changes what's visible

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — hexagons are the spatial unit
- Principle: [[Principle - Visual Recognition]] — "my health stuff is upper-left" becomes automatic
- Principle: [[Principle - Familiarity Over Function]] — spatial metaphor feels natural
- Decision: Hexagons (not squares) because they tessellate without privileged axes. Every hex has six equal neighbors — no "up is better than sideways" bias.
- Constraints: Hex Grid is a thinking tool, not a filing system. Spatial arrangement carries meaning that only the builder assigns. The system observes but never imposes organization.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Prototyped
**Reality note (2026-02-17):** No hex grid exists in the main product. The Life Map currently renders category cards in a flat layout. Hex grid is the top priority for R1.
**Reality note (2026-02-24):** A working prototype demonstrates the hex grid with illustrated tiles, camera-based navigation, sprite placement, and pathfinding. The visual approach is proven -- warm parchment texture, draggable sprites, smooth camera movement. Integration into the main product is an engineering task, not a design question. One engineering decision remains before integration begins.

Core to Life Map design. The hex grid is the foundational spatial metaphor for LifeBuild.

### History

> **2026-02-17 — D3: One project per hex?**
> Decided: One project per hex. Sanctuary is a 3-tile exception. Simplifies data model — hex position is a unique constraint on projects. Sanctuary gets special treatment as a multi-tile structure.

> **2026-02-17 — D1: Algorithmic hex placement OK for Release 1?**
> Decided: Manual — builder places from day one. No algorithmic category zone layout. Builders choose hex positions from R1 launch. This means the grid needs placement UX (tap/drag) and placement validation, but no auto-placement algorithm.

> **2026-02-24 -- Hex grid prototype exists**
> A working prototype demonstrates the hex grid with illustrated tiles, camera-based navigation, and builder-driven placement. All core visual and interaction questions are resolved. One engineering decision remains before integration into the main product begins.

## HOW: Implementation

**Grid behavior:**

- Infinite canvas (extends as needed)
- Builders drag tiles to arrange
- Adjacent tiles form visual clusters (categories)
- Empty hexes between clusters create breathing room

**Tile types:**

- Project tiles — bounded work with finish lines
- System tiles — continuous infrastructure

**Visual treatments:**

- Category colors on tile borders
- Stream accents for Work at Hand
- State treatments (Planning: sketch style, Live: full color, etc.)
- Health indicators for systems

**Zoom interaction:**

- Zoomed out: see entire landscape, tiles as icons
- Zoomed in: see detail, tile contents readable
- Semantic zoom: detail increases with magnification

**Arrangement freedom:** No forced grid positions. Builders place tiles wherever makes sense to them. The system learns from arrangement over time.

### Examples

- Builder drags "Learn Piano" hex next to "Music Production" hex → tiles cluster together → spatial proximity now means "these relate" without tags, folders, or metadata — the grid itself carries the relationship.
- New builder places first project near Campfire → drags second project one hex away → a category cluster begins to form → over weeks, the landscape fills with clusters that mirror how the builder thinks about their life.

### Anti-Examples

- **Auto-arranging hex tiles into a neat category grid** — spatial arrangement must reflect the builder's thinking, not the system's optimization. Even if auto-sort would look cleaner, it would destroy the cognitive value of builder-driven placement.
- **Snap-to-grid behavior that forces tiles into rigid positions** — builders must be able to place tiles anywhere on the infinite canvas. Forcing alignment removes the expressive freedom that makes spatial arrangement meaningful.
