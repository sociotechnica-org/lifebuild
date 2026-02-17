# Component - Hex Tile

## WHAT: Definition

An individual hexagonal tile on the grid representing a single project or system. Each tile displays identifying information (title, image, category) plus state indicators (progress, health, Work at Hand status).

## WHERE: Ecosystem

- Parent:
  - [[Structure - Hex Grid]] — lives on the hex grid as a spatial unit
- Conforms to:
  - [[Standard - Visual Language]] — colors, indicators, treatments
  - [[Standard - Image Evolution]] — project illustrations show on tiles
  - [[Standard - Dual Presence]] — Work at Hand tiles get special treatment
  - [[Standard - Project States]] — tile visual treatment follows state transitions
  - [[Standard - Smoke Signal Thresholds]] — signal displays follow threshold spec
- Related:
  - [[Component - Campfire]] — sibling component on the hex grid

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — tiles are the atomic spatial unit
- Principle: [[Principle - Visual Recognition]] — consistent tile format aids scanning
- Driver: Builders need to recognize work at a glance. Tiles provide consistent, scannable representation.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-17):** No hex tiles exist. Projects are rendered as `ProjectCard` components within `CategoryCard` containers. Hex Tile depends on Hex Grid, which is the top R1 priority. Key decisions: builder manually places tiles (no auto-placement), each tile represents exactly one project (1:1 binding).

Core to Hex Grid design. Tile visual treatment evolves as the design system matures.

### History

> **2026-02-17 — D3: One project per hex?**
> Decided: One project per hex. Each tile represents exactly one project — 1:1 binding between hex position and project. Simplifies tile rendering and interaction model.

> **2026-02-17 — D1: Algorithmic hex placement OK for Release 1?**
> Decided: Manual placement. R1 hex tiles support tap/drag placement by the builder. No algorithmic positioning. Tiles are placed where the builder chooses.

## HOW: Implementation

**Tile contents:**

- Project illustration
- Title (truncated if long)
- Category color border
- Progress indicator (for projects)
- Health indicator (for systems)

**State treatments:**

- Planning: Sketch/pencil style, lower saturation
- Live: Full color, active
- Work at Hand: Enhanced glow, stream accent
- Completed: Greyed, archived indicator
- Hibernating (systems): Dimmed, sleep indicator

**Interactions:**

- Click → opens [[Room - Project Board]] overlay
- Drag → repositions on grid
- Long press → quick actions menu

**Size:** All tiles same size. No "bigger = more important" — that's what The Table is for.
