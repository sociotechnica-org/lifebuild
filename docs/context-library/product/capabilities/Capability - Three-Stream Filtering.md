# Capability - Three-Stream Filtering

## WHAT: Definition

The filtered views in the Sorting Room that separate Priority Queue candidates by their stream classification — Gold filter shows expansion projects, Silver filter shows capacity projects, Bronze sources shows operational tasks. Three-Stream Filtering makes selection manageable.

## WHERE: Ecosystem

- Room(s):
  - [[Room - Sorting Room]] — where filtering is performed
- Uses:
  - [[System - Priority Queue Architecture]] — source of candidates
  - [[Standard - Priority Score]] — rankings within filters
- Enables:
  - [[Capability - Weekly Planning]] — filtering supports project selection
- Conforms to:
  - [[Standard - Three-Stream Portfolio]] — stream separation in UI
  - [[Standard - Visual Language]] — filtered views render stream-specific color treatments

## WHY: Rationale

- System: [[Standard - Three-Stream Portfolio]] — streams need separate views
- Principle: [[Principle - Protect Transformation]] — can't accidentally put Bronze in Gold slot
- Driver: Showing all candidates together would be overwhelming. Filtering by stream makes selection tractable.
- Constraints: Filters enforce stream boundaries by design, not convention. Cross-selection is structurally prevented. Only one filter active at a time during selection.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Three-stream filtering exists in the Sorting Room via `GoldSilverPanel.tsx` and `BronzePanel.tsx`. Projects are separated by stream. Cameron agent assists with prioritization context. Drag-to-table interaction populates The Table positions. Priority score-based ranking is functional. Stream boundaries enforced in the UI.

Core to Sorting Room design. Filters embody the three-stream philosophy in interaction.

## HOW: Implementation

**Gold Filter:**

- Shows projects with Purpose = "Moving forward"
- Sorted by priority score (importance-weighted)
- Cameron presents top candidates with context

**Silver Filter:**

- Shows projects with Purpose = "Building leverage"
- Sorted by priority score (leverage-weighted)
- Cameron presents top candidates with context

**Bronze Sources:**

- Not a single filter — shows source breakdown
- Quick Task projects (Purpose = Maintenance)
- System-generated tasks
- Due-date driven items
- Critical Responses

**Filter behavior:**

- Only one filter active at a time
- Selection from filter places item on The Table
- Cannot cross-select (Gold filter → Gold position only)

**Empty filters:** If Gold filter is empty, Cameron notes it and asks about new project creation or pausing existing work.

### Examples

- Director activates Gold filter in Sorting Room → only expansion projects appear: "Home Renovation," "Career Course," "Novel Draft" → ranked by importance-weighted priority score → Cameron explains the top candidate → director selects one for the Gold position.
- Gold filter shows zero candidates → Cameron: "No expansion projects in your queue right now. Want to create one in the Drafting Room, or take a lighter week with Gold intentionally empty?" → director chooses intentional-empty → valid outcome.

### Anti-Examples

- **Allowing a Bronze maintenance project to appear in the Gold filter** — streams don't mix. A project categorized as operational maintenance cannot be selected for the Gold (expansion) position regardless of its priority score.
- **Showing all projects in a single ranked list with colored stream tags** — filtering exists to reduce cognitive load during selection. A unified list with tags forces the director to mentally filter, which is the system's job.
