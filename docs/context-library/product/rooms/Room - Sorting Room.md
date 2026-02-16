# Room - Sorting Room

## WHAT: Definition

Marvin's prioritization space in the Strategy Studio — where builders make prioritization decisions, select Work at Hand for the week, and review their Priority Queue. The Sorting Room is where the three-stream selection process happens.

## WHERE: Ecosystem

- Zone: [[Zone - Strategy Studio]] — planning workspace
- Agent: [[Agent - Marvin]] — operational partner
- Capabilities:
  - [[Capability - Three-Stream Filtering]] — filtered views
- Populates:
  - [[Overlay - The Table]] — selections populate Table positions (Gold, Silver, Bronze)
- Adjacent:
  - [[Room - Council Chamber]] — strategic conversation
  - [[Room - Drafting Room]] — project creation
  - [[Room - Roster Room]] — delegation management
- Conforms to:
  - [[Standard - Visual Language]] — ranking interface uses stream colors and state treatments
  - [[Standard - Planning Calibration]] — priority rankings as testable predictions
- Implements: [[Strategy - Superior Process]] — structured prioritization
- Uses: [[System - Priority Queue Architecture]] — source of candidates
- Uses: [[Standard - Priority Score]] — ranking logic

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — prioritization deserves its own space
- Principle: [[Principle - Familiarity Over Function]] — sorting metaphor is intuitive
- Principle: [[Principle - Protect Transformation]] — selection process enforces stream constraints
- Driver: Builders need help seeing options and making choices. The Sorting Room presents candidates and guides selection.
- Constraints: Marvin advises on priority, never decides it. The builder's judgment overrides any score. Selection, not optimization.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-12):** Sorting Room exists at `/sorting-room` with Marvin agent active. Three-stream filtering implemented with `GoldSilverPanel.tsx` and `BronzePanel.tsx`. Drag-to-table interaction works via dnd-kit (`SortableProjectCard.tsx`, `TableDropZone.tsx`, `TableConfirmDialog.tsx`). Bronze mode selection is functional. Stream-specific routes at `/sorting-room/:stream` exist.

Core to Strategy Studio design. Sorting Room mechanics refined as priority math evolved.

## HOW: Implementation

**Selection flow:**

1. Gold selection — view expansion candidates, choose one (or confirm empty)
2. Silver selection — view capacity candidates, choose one (or confirm empty)
3. Bronze review — set mode, review what will populate stack

**Marvin's role:**

- Present filtered candidates with priority scores
- Explain rankings and tradeoffs
- Detect patterns ("this keeps slipping")
- Ask calibrating questions

**Filters** (per [[Standard - Three-Stream Portfolio]]):

- Gold filter: Purpose = expansion ("What changes my life?")
- Silver filter: Purpose = capacity ("What creates leverage?")
- Bronze sources: Maintenance projects, system tasks, due-date items

**Manual reordering:**

- Builders can manually reorder projects within each stream
- The score suggests; the builder decides
- Drag-and-drop to adjust position

**Output:** Selections populate [[Overlay - The Table]]. Builder leaves Sorting Room with Work at Hand set.

### Examples

- Marvin shows Gold candidates: "Home Renovation" (priority: 87), "Career Course" (72), "Novel Draft" (65) → builder asks "why is Home Renovation highest?" → Marvin explains: recency boost, upcoming deadline, high momentum score → builder selects Career Course anyway → Marvin: "Career Course it is" → no pushback, no re-ask.
- Builder manually drags "Novel Draft" above "Career Course" in Silver candidates → priority score didn't support this order, but builder has personal context Marvin doesn't → reorder persists → Marvin notes the override for future learning.

### Anti-Examples

- **Marvin refusing to let a builder select a lower-priority project** — the priority score suggests, the builder decides. Manual override is a feature, not a bug. The score informs judgment; it doesn't replace it.
- **Showing all projects in a single unsorted list regardless of stream** — the three-stream filter exists to make selection tractable. A unified list forces the builder to mentally sort by purpose, which is Marvin's job.
