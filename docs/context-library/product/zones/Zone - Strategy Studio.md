# Zone - Strategy Studio

## WHAT: Definition

The planning workspace — a collection of specialized rooms where directors engage in strategic conversations with AI advisors, make prioritization decisions, and shape their approach to life's categories. The Strategy Studio is where thinking happens before execution.

## WHERE: Ecosystem

- Rooms:
  - [[Room - Council Chamber]] — strategic conversation with Jarvis
  - [[Room - Category Studios]] — domain-specific planning (8 rooms)
  - [[Room - Sorting Room]] — priority selection
  - [[Room - Drafting Room]] — project creation
  - [[Room - Roster Room]] — delegation management
- Overlays:
  - [[Overlay - The Table]] — persistent priority display (visible across all zones)
- Adjacent:
  - [[Zone - Life Map]] — execution workspace
  - [[Zone - Archives]] — learning workspace
- Implements: [[Strategy - AI as Teammates]] — advisor conversations happen here
- Agent access: [[Agent - Jarvis]], [[Agent - Cameron]], all Category Advisors

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — planning requires conversation partners
- Strategy: [[Strategy - Superior Process]] — planning is distinct from execution
- Principle: [[Principle - Guide When Helpful]] — advisors available when directors seek them
- Driver: Directors need space to think strategically before committing to action. The Strategy Studio provides that space.
- Constraints: Strategy Studio is for thinking, not doing. Execution happens on Life Map. The separation between planning and execution is deliberate and structural.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** The Strategy Studio as a unified zone with a hub view does not exist. However, several of its rooms are implemented as top-level routes: Drafting Room (`/drafting-room`) and Sorting Room (`/sorting-room`). Category agents are defined in `rooms.ts` but have no direct routing. Council Chamber and Roster Room are not implemented. There is no hub navigation collecting these rooms into a single "strategy" zone.

Core workspace from initial design. Strategy Studio evolved as advisor architecture developed.

## HOW: Implementation

**Room structure:**

- [[Room - Council Chamber]] (1) — Jarvis's space for high-level strategic conversation
- [[Room - Category Studios]] (8) — one per Life Category, each with its advisor
- [[Room - Sorting Room]] (1) — Cameron's space for prioritization decisions
- [[Room - Drafting Room]] (1) — Marvin's space for project creation
- [[Room - Roster Room]] (1) — Devin's space for delegation management

**Navigation:**

- Hub view showing all rooms
- Click to enter any room
- Room context persists (conversation history)

**When to use:**

- Weekly planning sessions
- Category-level strategic reviews
- Priority selection for Work at Hand
- When directors want to think, not just do

### Examples

- Director enters Strategy Studio → hub view shows: [[Room - Council Chamber]] (Jarvis), 8 [[Room - Category Studios]] (each with its advisor), [[Room - Sorting Room]] (Cameron) → all rooms accessible → director clicks "Health Studio" → conversation with Maya continues from their last session.
- Director hasn't visited Strategy Studio in two weeks → rooms show subtle ambient indicators: "Cameron has priority suggestions ready," "Jarvis noticed a Charter theme shift" → not notifications or badges, just quiet awareness visible when the director chooses to visit.

### Anti-Examples

- **Strategy Studio sending push notifications: "It's been a week since you planned!"** — the studio is a place to visit, not a demanding presence. Directors come when ready. No nudges, no guilt, no badge counts.
- **Merging planning and execution into one combined view** — Strategy Studio exists precisely because thinking and doing need separate headspace. Collapsing them loses the cognitive benefit of distinct modes.
