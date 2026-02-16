# System - Clustering

## WHAT: Definition

The emergent spatial behavior where builders place related hex tiles adjacent to each other, creating meaningful clusters that reflect their mental model of how life areas relate. Builders don't "use" Clustering — it's an emergent behavior the system observes and learns from. Clustering is builder-assigned meaning; the system tracks patterns and offers suggestions but never imposes arrangement.

## WHERE: Scope

- Zones:
  - [[Zone - Life Map]] — clustering occurs on the Life Map's hex grid
- Rooms:
  - (none — clustering is ambient, not room-specific)
- Capabilities:
  - [[Capability - Zoom Navigation]] — zoom out reveals cluster shapes
- Primitives:
  - [[Primitive - Project]] — projects are represented as hex tiles that get clustered
- Implements:
  - [[Standard - Visual Language]] — category color reinforcement per spec
  - [[Standard - Life Categories]] — clusters organize by life category
  - [[Standard - Spatial Interaction Rules]] — clustering reflects builder-assigned meaning
- State:
  - Current tile positions on the hex grid
  - Observed adjacency patterns per builder
  - Cluster shape data at various zoom levels
- Transitions:
  - Builder drags tile -> adjacency relationships update
  - New project created -> system suggests placement ("near your other health work?")
  - Cluster patterns mature over time as builders populate their map
- Processing:
  - System observes clustering patterns over time
  - Suggests placements for new projects — never forces
  - Adjacent same-category tiles may show subtle visual connection
- Related:
  - [[Structure - Hex Grid]] — the spatial substrate where clustering occurs
  - [[Component - Campfire]] — first clusters form around origin
- Rationale:
  - [[Principle - Bidirectional Loop]] — arrangement reflects and shapes understanding
  - [[Strategy - Spatial Visibility]] — spatial proximity carries meaning
  - [[Principle - Visual Recognition]] — "my health stuff is upper-left"
  - [[Principle - Familiarity Over Function]] — builders organize intuitively

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — space carries meaning
- Principle: [[Principle - Visual Recognition]] — spatial memory aids navigation
- Principle: [[Principle - Familiarity Over Function]] — builders organize intuitively
- Driver: Builders naturally group related things together. Clustering makes this explicit and learnable.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-10):** No clustering system exists. Depends on Hex Grid implementation. Projects are currently grouped by fixed category cards, not by builder-driven spatial arrangement.

Emergent from hex grid use. Clustering behavior develops as builders populate their Life Map.

## HOW: Implementation

**Builder behavior:**

- Drag tiles to create adjacency
- Group by category (health projects together)
- Group by relationship (linked projects nearby)
- Leave gaps between clusters (breathing room)

**System learning:**

- Observes clustering patterns over time
- Suggests placements for new projects ("near your other health work?")
- Never forces — suggestions only

**Visual reinforcement:**

- Adjacent same-category tiles may show subtle connection
- Cluster boundaries emerge from empty space
- Zoom out reveals cluster shapes

**No rules:** Builders can organize however they want. Cross-category clusters, single-tile isolation, tight packing or sparse spreading — all valid.
