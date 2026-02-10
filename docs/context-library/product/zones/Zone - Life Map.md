# Zone - Life Map

## WHAT: Definition

The primary execution workspace — a spatial canvas where directors see their entire life organized as a hex grid of projects and systems. The Life Map is where work happens: viewing priorities, tracking progress, and managing the landscape of commitments.

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
- Conforms to: [[Standard - Spatial Interaction Rules]] — director controls spatial arrangement

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — Life Map is the primary embodiment of spatial thinking
- Principle: [[Principle - Visibility Creates Agency]] — directors see everything, decide what to focus on
- Principle: [[Principle - Visual Recognition]] — spatial memory aids finding and understanding
- Driver: Directors need a home base where all their work is visible and organized. The Life Map is that home.
- Constraints: Life Map is an execution workspace, not a dashboard. It shows spatial reality, not summarized metrics. Every element the director sees has a spatial position they chose.

## WHEN: Timeline

Core workspace from initial design. The Life Map is LifeBuild's primary interface — where directors spend most of their time.

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

**Entry point:** Life Map is the default view when directors open LifeBuild.

### Examples

- Director opens LifeBuild → Life Map loads at last zoom level and scroll position → [[Overlay - The Table]] shows current priorities → [[Structure - Hex Grid]] shows project landscape → director orients in under 3 seconds without clicking anything.
- Director notices a red smoke signal on a system tile at Neighborhood zoom → zooms in to Detail level → reads health warning "cycle completion 45%" → clicks tile → [[Room - System Board]] opens as overlay → director diagnoses the issue while Life Map stays visible behind.

### Anti-Examples

- **Opening to a dashboard or activity feed instead of the spatial Life Map** — Life Map is home base because spatial context orients faster than a list of updates. Directors need to see their landscape, not read about it.
- **Removing completed projects immediately from the grid, leaving visible gaps** — completed projects archive gracefully. Sudden spatial holes would disorient directors who navigate by spatial memory ("my health projects are upper-left").
