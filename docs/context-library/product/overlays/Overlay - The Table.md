# Overlay - The Table

## WHAT: Definition

A persistent priority spotlight that sits at the top of the Life Map, displaying the builder's Work at Hand across three distinct positions: Gold (expansion), Silver (capacity), and Bronze (operations). The Table remains visible at all zoom levels — current priorities never disappear from view.

## WHERE: Ecosystem

- Visibility: All zones — The Table persists across [[Zone - Life Map]], [[Zone - Strategy Studio]], and [[Zone - Archives]]
- Components:
  - [[Component - Gold Position]] — displays single expansion project
  - [[Component - Silver Position]] — displays single capacity project
  - [[Component - Bronze Position]] — displays operational task stack
- Displays:
  - [[Primitive - Project]] — Gold/Silver positions display projects
  - [[Primitive - Task]] — Bronze position displays task stack
- Navigates to:
  - [[Room - Project Board]] — clicking Gold/Silver opens project detail
  - [[Room - Sorting Room]] — where selections are made
- Conforms to:
  - [[Standard - Three-Stream Portfolio]] — three positions map to three streams
  - [[Standard - Visual Language]] — stream color accents, saturation states, glow treatments
  - [[Standard - Table Slot Behaviors]] — empty slot visual treatment follows spec
  - [[Standard - Dual Presence]] — projects appear here AND on hex grid
- Implements:
  - [[System - Weekly Priority]] — displays selected Work at Hand
  - [[Principle - Visibility Creates Agency]] — priorities always visible
  - [[Principle - Protect Transformation]] — structural separation of streams
- Modified by: [[System - Adaptation]] — mid-week changes
- Constraint: Maximum 1 Gold + 1 Silver (SOT 5.1)

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — priority visible at all times
- Strategy: [[Strategy - Superior Process]] — structured weekly commitment
- Principle: [[Principle - Protect Transformation]] — Gold/Silver slots protected from Bronze overflow
- Principle: [[Principle - Empty Slots Strategic]] — empty positions are valid choices
- Driver: Builders need constant awareness of what they've committed to this week. The Table is the answer to "what am I working on right now?"
- Constraints: The Table shows commitment, not progress. It answers "what am I working on?" not "how much is done?" Maximum 1 Gold + 1 Silver is structural, not configurable.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** The Table exists as `TableBar.tsx` rendered persistently at the bottom of the screen (not the top as described) via `NewUiShell.tsx`. Three `TableSlot` components display Gold, Silver, and Bronze positions. Backed by `tableConfiguration` and `tableBronzeProjects` LiveStore tables with full event support (`table.configurationUpdated`, `table.bronzeProjectAdded`, etc.). Bronze shows top project plus count of additional. No project illustrations or image evolution on slots. Visible across all routes.

Core interface element from initial design. The Table's three-position structure is foundational — it embodies the three-stream philosophy in UI.

## HOW: Implementation

**Layout:** Three positions arranged left to right:

- Gold Position (leftmost) — single expansion project
- Silver Position (center) — single capacity project
- Bronze Position (rightmost) — stack of operational tasks

**Persistence:** The Table remains visible regardless of zoom level or navigation state on the Life Map. Builders can always see their current priorities.

**Interaction:**

- Click any position → Opens relevant Project Board or Bronze stack view
- Positions reflect real-time state (progress, completion, changes)

**Visual treatment:**

- Each position has stream-specific color accent
- Active items show enhanced treatment (glow, full saturation)
- Empty positions render as calm, intentional states (not warnings)

**Constraint enforcement:**

- System blocks adding second Gold or second Silver
- Pausing creates opening; promotion can fill it

### Examples

- Builder opens LifeBuild on Monday morning → The Table shows Gold: "Home Renovation" (full saturation, active glow), Silver: "Meal Prep System" (full saturation), Bronze: 5 tasks in Target +3 mode → builder immediately sees the week's commitments without clicking anything.
- Builder completes Gold project mid-week → Gold position transitions from active glow to calm empty state → builder can promote from queue, insert emergency work, or leave intentionally empty for the rest of the week.

### Anti-Examples

- **Hiding The Table when the builder opens a Project Board** — The Table is always visible at all zoom levels. Current priorities never disappear, even when focus narrows to a single project.
- **Showing task-level progress bars as the dominant visual on each position** — The Table answers "what am I working on?" not "how far along am I?" Progress detail belongs on Project Boards, not The Table's priority display.
