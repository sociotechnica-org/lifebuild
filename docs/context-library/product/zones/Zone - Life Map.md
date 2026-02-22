# Zone - Life Map

## WHAT: Definition

The primary — and essentially only — workspace. The map IS the game. A spatial canvas where builders see their entire life organized as a hex grid of projects and systems. The Life Map is where everything happens: viewing priorities, tracking progress, managing the landscape of commitments, and entering the sanctuary structure for strategic conversations with stewards. There is no separate Strategy Studio mode.

## WHERE: Ecosystem

- Rooms:
  - [[Room - Project Board]] — detail overlay for any project
  - [[Room - System Board]] — detail overlay for any system
- Overlays:
  - [[Overlay - The Table]] — persistent priority display
- Adjacent:
  - [[Zone - Strategy Studio]] — planning workspace
  - [[Zone - Archives]] — learning workspace
- Structures:
  - [[Structure - Hex Grid]] — spatial organization canvas
- Capabilities:
  - [[Capability - Zoom Navigation]] — scale traversal
- Agent: [[Agent - Mesa]] — Life Map advisor
- Primitives:
  - [[Primitive - Project]] — projects visible on grid
  - [[Primitive - System]] — systems visible on grid
- Implements: [[Strategy - Spatial Visibility]] — work exists in space
- Implements: [[Standard - Dual Presence]] — Work at Hand appears on both Table and grid
- Implements: [[Principle - Visibility Creates Agency]] — everything visible at once
- Conforms to: [[Standard - Visual Language]] — hex tiles, state indicators, category colors render per spec
- Conforms to: [[Standard - Spatial Interaction Rules]] — builder controls spatial arrangement

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — Life Map is the primary embodiment of spatial thinking
- Principle: [[Principle - Visibility Creates Agency]] — builders see everything, decide what to focus on
- Principle: [[Principle - Visual Recognition]] — spatial memory aids finding and understanding
- Driver: Builders need a home base where all their work is visible and organized. The Life Map is that home.
- Constraints: Life Map is an execution workspace, not a dashboard. It shows spatial reality, not summarized metrics. Every element the builder sees has a spatial position they chose.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** Life Map exists as the default route (`/life-map`) rendering `LifeMap.tsx` with 8 `CategoryCard` components. Mesa agent is active. The Table overlay is implemented. However, the hex grid spatial canvas is not built — projects appear as cards within category containers, not hex tiles on a zoomable spatial canvas. Zoom Navigation, smoke signals, dual presence, and spatial positioning are not implemented.

**Design decision (GDD v0.2, 2026-02-13):** Map-first architecture confirmed. The map is the primary and essentially only UI. The sanctuary structure (Humble Studio → Growing Workshop → The Sanctuary) sits at the center of the hex grid and contains all steward rooms (Council Chamber, Drafting/Sorting/Roster). Strategic and tactical modes merge on the single map — zoom in to enter the sanctuary for planning, zoom out to work the territories. The frontier (grayed-out unclaimed hexes) surrounds the builder's territories. See GDD v0.2 (sources/) for full architecture.

Core workspace from initial design. The Life Map is LifeBuild's primary interface — where builders spend all of their time. GDD v0.2 confirms map-first: everything lives on the map.

## HOW: Implementation

**Layout:**

- [[Overlay - The Table]] (top) — persistent Work at Hand display
- [[Structure - Hex Grid]] (below) — spatial canvas of all projects and systems
- Navigation controls — zoom, pan, search

**What appears here:**

- All projects (any state except Completed)
- All systems (Active or Hibernating)
- Category organization via hex positioning
- Health indicators, state treatments, visual language

**Primary workflows:**

- Review current priorities ([[Overlay - The Table]])
- Browse life landscape ([[Structure - Hex Grid]])
- Dive into specific work ([[Room - Project Board]] overlay)
- Get help (summon Mesa)

**Entry point:** Life Map is the default view when builders open LifeBuild.

### Examples

- Builder opens LifeBuild → Life Map loads at last zoom level and scroll position → [[Overlay - The Table]] shows current priorities → [[Structure - Hex Grid]] shows project landscape → builder orients in under 3 seconds without clicking anything.
- Builder notices a red smoke signal on a system tile at Neighborhood zoom → zooms in to Detail level → reads health warning "meal prep task overdue by 3 days" → clicks tile → [[Room - System Board]] opens as overlay → builder diagnoses the issue while Life Map stays visible behind.

### Anti-Examples

- **Opening to a dashboard or activity feed instead of the spatial Life Map** — Life Map is home base because spatial context orients faster than a list of updates. Builders need to see their landscape, not read about it.
- **Removing completed projects immediately from the grid, leaving visible gaps** — completed projects archive gracefully. Sudden spatial holes would disorient builders who navigate by spatial memory ("my health projects are upper-left").
