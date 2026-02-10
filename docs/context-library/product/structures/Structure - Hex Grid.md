# Structure - Hex Grid

## WHAT: Definition

The spatial organization canvas that fills most of the Life Map — a tessellated field of hexagonal tiles where each tile represents a project or system. Directors arrange tiles spatially by category and relationship, creating a visual map of their life's work.

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
  - [[Standard - Spatial Interaction Rules]] — director-driven placement, no auto-organization
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
- Constraints: Hex Grid is a thinking tool, not a filing system. Spatial arrangement carries meaning that only the director assigns. The system observes but never imposes organization.

## WHEN: Timeline

Core to Life Map design. The hex grid is the foundational spatial metaphor for LifeBuild.

## HOW: Implementation

**Grid behavior:**

- Infinite canvas (extends as needed)
- Directors drag tiles to arrange
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

**Arrangement freedom:** No forced grid positions. Directors place tiles wherever makes sense to them. The system learns from arrangement over time.

### Examples

- Director drags "Learn Piano" hex next to "Music Production" hex → tiles cluster together → spatial proximity now means "these relate" without tags, folders, or metadata — the grid itself carries the relationship.
- New director places first project near Campfire → drags second project one hex away → a category cluster begins to form → over weeks, the landscape fills with clusters that mirror how the director thinks about their life.

### Anti-Examples

- **Auto-arranging hex tiles into a neat category grid** — spatial arrangement must reflect the director's thinking, not the system's optimization. Even if auto-sort would look cleaner, it would destroy the cognitive value of director-driven placement.
- **Snap-to-grid behavior that forces tiles into rigid positions** — directors must be able to place tiles anywhere on the infinite canvas. Forcing alignment removes the expressive freedom that makes spatial arrangement meaningful.
