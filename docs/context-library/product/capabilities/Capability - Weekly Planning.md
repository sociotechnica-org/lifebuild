# Capability - Weekly Planning

## WHAT: Definition

The structured beginning-of-week ritual where builders select their Work at Hand for the upcoming week — choosing Gold and Silver projects from candidates, setting Bronze mode, and confirming their weekly commitment. Weekly Planning happens in the Sorting Room with Marvin.

## WHERE: Ecosystem

- Room(s):
  - [[Room - Sorting Room]] — where planning happens
- Uses:
  - [[System - Priority Queue Architecture]] — source of candidates
  - [[Capability - Three-Stream Filtering]] — filtered views
  - [[Overlay - The Table]] — result of planning
  - [[System - Weekly Priority]] — creates Work at Hand
- Enables:
  - [[Capability - Week-in-Review]] — bookends the week
- Conforms to:
  - [[Standard - Table Slot Behaviors]] — slot selection includes intentional-empty option

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — weekly commitment deserves attention
- Principle: [[Principle - Protect Transformation]] — selection enforces stream constraints
- Principle: [[Principle - Empty Slots Strategic]] — intentional emptiness is valid choice
- Driver: Builders need a moment to decide what matters this week. Weekly Planning creates that moment.
- Constraints: Weekly Planning is a builder decision, not an optimization routine. Marvin presents and respects, never pushes. Intentional emptiness is always available.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** The selection mechanics exist — builders can select Gold/Silver projects and set Bronze mode in the Sorting Room with Marvin's assistance. However, there is no formal weekly cadence or ritual structure. Selection is ad-hoc (builders visit the Sorting Room when they want), not a scheduled weekly planning session. No reminders, no Jarvis coordination, no combined review+planning flow.

Core rhythm feature. Weekly Planning establishes the week's focus.

## HOW: Implementation

**Typical flow:**

1. Marvin presents Gold candidates (expansion projects)
2. Builder selects one Gold or confirms intentional empty
3. Marvin presents Silver candidates (capacity projects)
4. Builder selects one Silver or confirms intentional empty
5. Marvin reviews Bronze sources and current mode
6. Builder adjusts mode if needed
7. Work at Hand confirmed → The Table populated

**Marvin's support:**

- Shows priority scores with explanations
- Surfaces patterns ("this has slipped three weeks")
- Asks calibrating questions ("is this still the right priority?")
- Never pushes — presents and respects builder choice

**Timing flexibility:**

- Default: Friday afternoon or Sunday evening
- Configurable to builder preference
- Jarvis may remind if planning is overdue

**Duration:** Typically 10-20 minutes. Can be faster once patterns establish.

### Examples

- Marvin shows three Gold candidates: "Home Renovation" (priority: 87), "Career Course" (72), "Novel Draft" (65) → builder asks "why is Home Renovation highest?" → Marvin explains recency and momentum factors → builder selects Career Course instead → Marvin accepts without pushback → moves to Silver selection.
- Marvin presents Gold candidates → builder says "I need a rest week" → confirms intentional-empty for Gold → Marvin: "Got it — lighter week" → moves to Silver → builder selects one Silver project → Bronze set to Minimal → a lighter week is planned without friction.

### Anti-Examples

- **Auto-selecting the highest priority score project without builder choice** — the score suggests, the builder decides. Planning is a decision ritual, not an optimization algorithm.
- **Blocking planning completion until both Gold and Silver slots are filled** — intentional emptiness is a valid outcome of planning. The ritual completes when the builder says it's complete, not when all positions are occupied.
