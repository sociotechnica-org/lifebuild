# Zone - Strategy Studio

## WHAT: Definition

The planning workspace — a collection of specialized rooms where builders engage in strategic conversations with AI advisors, make prioritization decisions, draft projects, and manage delegation. The Strategy Studio is where thinking happens before execution.

## WHERE: Ecosystem

- Rooms:
  - [[Room - Council Chamber]] — strategic conversation with Jarvis
  - [[Room - Sorting Room]] — priority selection
  - [[Room - Drafting Room]] — project creation
  - [[Room - Roster Room]] — delegation management
- Overlays:
  - [[Overlay - The Table]] — persistent priority display (visible across all zones)
- Adjacent:
  - [[Zone - Life Map]] — execution workspace
  - [[Zone - Archives]] — learning workspace
- Implements: [[Strategy - AI as Teammates]] — advisor conversations happen here
- Agent access: [[Agent - Jarvis]], [[Agent - Marvin]]

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — planning requires conversation partners
- Strategy: [[Strategy - Superior Process]] — planning is distinct from execution
- Principle: [[Principle - Guide When Helpful]] — advisors available when builders seek them
- Driver: Builders need space to think strategically before committing to action. The Strategy Studio provides that space.
- Constraints: Strategy Studio is for thinking, not doing. Execution happens on Life Map. The separation between planning and execution is deliberate and structural.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** The Strategy Studio as a unified zone with a hub view does not exist. However, several of its rooms are implemented as top-level routes: Drafting Room (`/drafting-room`) and Sorting Room (`/sorting-room`). Category agents are defined in `rooms.ts` but have no direct routing. Council Chamber and Roster Room are not implemented. There is no hub navigation collecting these rooms into a single "strategy" zone.

**Design decision (GDD v0.2, 2026-02-13):** The Strategy Studio as a separate zone/mode is dissolved. The map is the primary and essentially only UI. Strategic rooms now live inside the **sanctuary structure** at the center of the hex grid — the builder enters the sanctuary to sit with Jarvis, work with Marvin, or visit Conan's archives. The XCOM dual-mode legacy (strategic base vs. tactical missions) is preserved but merged onto a single map: zoom in to the sanctuary for planning, zoom out for execution. See [[GDD-v0.2]] for full map-first architecture rationale.

Core workspace from initial design. Strategy Studio evolved as advisor architecture developed. GDD v0.2 dissolves the standalone zone — rooms persist inside the evolving sanctuary structure.

## HOW: Implementation

**Room structure:**

- [[Room - Council Chamber]] (1) — Jarvis's space for high-level strategic conversation
- [[Room - Sorting Room]] (1) — Marvin's space for prioritization decisions
- [[Room - Drafting Room]] (1) — Marvin's space for project creation
- [[Room - Roster Room]] (1) — Marvin's space for delegation management

**Navigation:**

- Hub view showing all rooms
- Click to enter any room
- Room context persists (conversation history)

**When to use:**

- Weekly planning sessions
- Priority selection for Work at Hand
- When builders want to think, not just do

### Examples

- Builder enters Strategy Studio → hub view shows: [[Room - Council Chamber]] (Jarvis), [[Room - Sorting Room]] (Marvin), [[Room - Drafting Room]] (Marvin), [[Room - Roster Room]] (Marvin) → all rooms accessible → builder clicks "Sorting Room" → Marvin presents this week's priority candidates.
- Builder hasn't visited Strategy Studio in two weeks → rooms show subtle ambient indicators: "Marvin has priority suggestions ready," "Jarvis noticed a Charter theme shift" → not notifications or badges, just quiet awareness visible when the builder chooses to visit.

### Anti-Examples

- **Strategy Studio sending push notifications: "It's been a week since you planned!"** — the studio is a place to visit, not a demanding presence. Builders come when ready. No nudges, no guilt, no badge counts.
- **Merging planning and execution into one combined view** — Strategy Studio exists precisely because thinking and doing need separate headspace. Collapsing them loses the cognitive benefit of distinct modes.
