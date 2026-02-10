# Principle - Empty Slots Strategic

## WHAT: The Principle

An empty Gold or Silver slot can be a deliberate choice — to recover, catch up, or simplify.

## WHERE: Ecosystem

- Type: Design Principle
- Serves: [[Need - Autonomy]] — permission to choose restraint
- Advances: [[Strategy - Superior Process]]
- Governs: [[Overlay - The Table]] (visual treatment of empty slots), [[Component - Gold Position]], [[Component - Silver Position]]
- Implemented by: [[Standard - Table Slot Behaviors]] — makes intentional emptiness testable
- Agents: [[Agent - Cameron]] (respects empty choices), [[Agent - Jarvis]] (strategic framing)
- Related: [[Principle - Plans Are Hypotheses]], [[Principle - Protect Transformation]]

## WHY: Belief

The Sovereignty Gap book argues that sovereignty requires underlying capacity. Capacity sometimes requires rest. An empty Gold week isn't the absence of progress — it's the investment that makes next week's Gold possible.

Some weeks the wisest plan is maintenance-only. A director recovering from illness, managing a family crisis, or simply depleted from sustained effort shouldn't feel pressured to fill transformation slots. The system frames emptiness as strategic restraint, not incompleteness.

This connects to capacity-first philosophy: you can't transform what you can't sustain. Director Attributes (capacity state) should inform recommendations — when capacity is low, the system might actively recommend an empty slot rather than asking what Gold project to add.

The visual distinction matters: "no Gold selected yet" (planning incomplete) should look different from "Gold intentionally empty" (strategic choice). The former prompts action; the latter communicates intentional restraint.

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-10):** The Table allows empty Gold/Silver slots — directors aren't forced to fill them. However, no visual distinction between "not selected yet" and "intentionally empty." No agent awareness of empty-slot intent. No capacity-based recommendation to leave slots empty.

## HOW: Application

The Table UI should render empty Gold/Silver slots as calm, intentional states — not as warning indicators or empty-state prompts. Agents should check intent and rationale when slots are empty, but accept "I'm taking a lighter week" without pushing.

### What Following This Looks Like
- A director marks their Gold slot as intentionally empty after a demanding two-week sprint. The Table renders the slot with a calm, muted visual — no red borders, no exclamation marks — and Cameron's weekly summary notes "Recovery week: Gold reserved for rest."
- Jarvis notices the director's capacity indicators are low and proactively suggests: "Given the week you've had, an empty Gold slot might be the strongest move." The system actively recommends restraint rather than pushing for more.
- A director returns from vacation and fills only Bronze for the first week back. The system treats this as a valid re-entry strategy, and the weekly review celebrates the smooth transition rather than flagging missing transformation work.

### What Violating This Looks Like
- **Rendering empty slots as warning indicators** — An empty Gold slot styled with red borders or exclamation marks treats emptiness as a problem. "No Gold selected yet" (planning incomplete) and "Gold intentionally empty" (strategic choice) must look different. The latter should be calm, not alarming.
- **Agents pushing to fill empty slots** — Cameron asking "are you sure you don't want a Gold project?" after the director has already indicated intentional rest violates the principle. Agents check intent once, then accept the choice.
- **Measuring weeks with empty slots as underperformance** — If metrics treat empty-slot weeks as failures, the system penalizes recovery. Capacity-first philosophy means rest weeks are investment, not absence.

### Tensions
- With [[Principle - First 72 Hours]] — first 72 hours optimize for wins, not rest; resolution is sequencing (quick wins first, strategic rest later)
- With progress expectations — some directors may need permission to rest; the system provides it

### Test
Does this design treat an empty slot as incomplete, or as a valid choice?
