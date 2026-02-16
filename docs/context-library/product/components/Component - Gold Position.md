# Component - Gold Position

## WHAT: Definition

The leftmost position on The Table, displaying a single expansion project — work that changes the builder's life. The Gold position represents the builder's transformational focus for the week.

## WHERE: Ecosystem

- Parent:
  - [[Overlay - The Table]] — leftmost position on the persistent priority overlay
- Conforms to:
  - [[Standard - Three-Stream Portfolio]] — Gold stream slot constraints
  - [[Standard - Visual Language]] — deep amber/gold color accent
  - [[Standard - Dual Presence]] — Gold project appears on Life Map and Table
  - [[Standard - Table Slot Behaviors]] — empty Gold visual treatment per spec
- Related:
  - [[Component - Silver Position]] — sibling position on The Table
  - [[Component - Bronze Position]] — sibling position on The Table

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — structural protection for transformation
- Principle: [[Principle - Protect Transformation]] — Gold slot cannot be invaded by Bronze
- Decision: One Gold maximum because two transformations compete for attention and neither advances. The limit forces commitment.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Gold Position exists as a `TableSlot` component in `TableBar.tsx`. Single Gold constraint is enforced. No project illustrations or evolution stages shown — displays project title and basic info. Selection happens via Sorting Room drag-to-table interaction.

Core to Table structure. The single-Gold constraint is foundational to the protection philosophy.

## HOW: Implementation

**Display contents:**

- Project title
- Project illustration (current evolution stage)
- Progress indicator
- Category color accent on border
- Deep amber/gold stream accent

**States:**

- **Occupied:** Shows selected Gold project with full treatment
- **Empty (intentional):** Calm visual state indicating strategic choice
- **Empty (unselected):** During planning, prompts selection

**Interactions:**

- Click → Opens [[Room - Project Board]] overlay
- Project completion → Slot opens, Marvin offers to promote next candidate
- Mid-week pause → Project returns to Priority Queue top, slot opens

**Why often empty:** High-commitment weeks, low-capacity periods, or intentional recovery weeks may have no Gold. The system respects this as strategic restraint.
