# Room - Sorting Room

## WHAT: Definition

Cameron's dedicated space in the Strategy Studio — where directors make prioritization decisions, select Work at Hand for the week, and review their Priority Queue. The Sorting Room is where the three-stream selection process happens.

## WHERE: Ecosystem

- Zone: [[Zone - Strategy Studio]] — planning workspace
- Agent: [[Agent - Cameron]] — priority coordinator
- Capabilities:
  - [[Capability - Three-Stream Filtering]] — filtered views
- Populates:
  - [[Overlay - The Table]] — selections populate Table positions (Gold, Silver, Bronze)
- Adjacent:
  - [[Room - Council Chamber]] — strategic conversation
  - [[Room - Category Studios]] — domain-specific planning
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
- Driver: Directors need help seeing options and making choices. The Sorting Room presents candidates and guides selection.
- Constraints: Cameron advises on priority, never decides it. The director's judgment overrides any score. Selection, not optimization.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Sorting Room exists at `/sorting-room` with Cameron agent active. Three-stream filtering implemented with `GoldSilverPanel.tsx` and `BronzePanel.tsx`. Drag-to-table interaction works via dnd-kit (`SortableProjectCard.tsx`, `TableDropZone.tsx`, `TableConfirmDialog.tsx`). Bronze mode selection is functional. Stream-specific routes at `/sorting-room/:stream` exist.

Core to Strategy Studio design. Sorting Room mechanics refined as priority math evolved.

## HOW: Implementation

**Selection flow:**

1. Gold selection — view expansion candidates, choose one (or confirm empty)
2. Silver selection — view capacity candidates, choose one (or confirm empty)
3. Bronze review — set mode, review what will populate stack

**Cameron's role:**

- Present filtered candidates with priority scores
- Explain rankings and tradeoffs
- Detect patterns ("this keeps slipping")
- Ask calibrating questions

**Filters** (per [[Standard - Three-Stream Portfolio]]):

- Gold filter: Purpose = expansion ("What changes my life?")
- Silver filter: Purpose = capacity ("What creates leverage?")
- Bronze sources: Maintenance projects, system tasks, due-date items

**Manual reordering:**

- Directors can manually reorder projects within each stream
- The score suggests; the director decides
- Drag-and-drop to adjust position

**Output:** Selections populate [[Overlay - The Table]]. Director leaves Sorting Room with Work at Hand set.

### Examples

- Cameron shows Gold candidates: "Home Renovation" (priority: 87), "Career Course" (72), "Novel Draft" (65) → director asks "why is Home Renovation highest?" → Cameron explains: recency boost, upcoming deadline, high momentum score → director selects Career Course anyway → Cameron: "Career Course it is" → no pushback, no re-ask.
- Director manually drags "Novel Draft" above "Career Course" in Silver candidates → priority score didn't support this order, but director has personal context Cameron doesn't → reorder persists → Cameron notes the override for future learning.

### Anti-Examples

- **Cameron refusing to let a director select a lower-priority project** — the priority score suggests, the director decides. Manual override is a feature, not a bug. The score informs judgment; it doesn't replace it.
- **Showing all projects in a single unsorted list regardless of stream** — the three-stream filter exists to make selection tractable. A unified list forces the director to mentally sort by purpose, which is Cameron's job.
