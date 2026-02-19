# Component - Campfire

## WHAT: Definition

A temporary onboarding moment — the place where the builder first meets Jarvis, off to the side of the map. The Campfire is a threshold, not a fixture. Jarvis greets the builder, explains the tradition, and invites them to walk to the sanctuary structure at the center of the map. When the builder accepts, they walk together, and the campfire fades behind them. The builder never goes back.

## WHERE: Ecosystem

- Parent:
  - [[Structure - Hex Grid]] — exists on the grid off to the side, in a corner
- Conforms to:
  - [[Standard - Visual Language]] — warm glow, fire-in-the-wilderness aesthetic
  - [[Standard - Onboarding Sequence]] — Day 1 the walk with Jarvis
- Related:
  - [[Component - Hex Tile]] — sibling component on the hex grid
  - [[Journey - Builder Onboarding]] — the campfire is the first phase of the onboarding journey
  - [[Agent - Jarvis]] — Jarvis greets the builder here
  - [[Principle - Agreement Over Expectation]] — the campfire establishes the designed alliance between builder and LifeBuild

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — the first impression IS the teammate relationship
- Principle: [[Principle - First 72 Hours]] — the campfire seeds the 72-hour win
- Principle: [[Principle - Earn Don't Interrogate]] — Jarvis asks open questions, never interrogates
- Principle: [[Principle - Agreement Over Expectation]] — the campfire follows a Me/You/Us arc, establishing a designed alliance before the walk
- Driver: The campfire is where the social contract is established. The builder meets the stewards. Values are exchanged, not marketed. The builder chooses to walk to the sanctuary — it's not automatic. This makes the sanctuary feel chosen, not assigned.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-12):** No Campfire component exists. Depends on Hex Grid, Jarvis agent, and the onboarding walk mechanic.

**Design decision (2026-02-18):** D5 shaping session identified a posture-based hybrid approach for the campfire conversation, grounded in Motivational Interviewing, Bordin Working Alliance, Co-Active Designed Alliance, and Stages of Change research. The conversation follows a designed posture sequence (Engaging → Focusing → Evoking → Planning) with free-form content within each posture. See [[Principle - Agreement Over Expectation]] for the Me/You/Us framework.

**Design decision (2026-02-18):** D6 resolved — Option B, reflected extraction. The campfire produces a 6-field scorecard (`startingState`, `heavyThing`, `firstProjectSeed`, `allianceAgreement`, `capacitySignals`, `valueSignals`) via Jarvis reflecting back understanding in the Planning phase. Builder confirms/corrects. The reflection IS the scorecard. All downstream agents read this before their first interaction with the builder.

**Design decision (GDD v0.2, 2026-02-13):** The campfire is explicitly temporary — NOT a permanent feature on the map. It exists off to the side, not at the center. The walk from campfire to sanctuary is the onboarding core mechanic. When the builder agrees to walk, the campfire disappears. The builder never returns. The campfire was a threshold, not a home.

## HOW: Implementation

**Visual treatment:**

- Fire in the wilderness, off to the side of the map
- Warm, inviting, small — a clearing in the frontier
- Jarvis is present; other stewards nearby but not yet introduced
- Distinct from the sanctuary structure (which is at the center)

**The sequence:**

The 8 steps operate within a designed posture sequence grounded in Motivational Interviewing (Engaging → Focusing → Evoking → Planning), mapped to a Me → You → Us relational arc per [[Principle - Agreement Over Expectation]]. Conversational moves use OARS (Open questions, Affirmations, Reflective listening, Summaries). Pacing calibrates to the builder's starting state — crisis builders move faster toward Planning, growth builders spend more time in Evoking. Exit criteria are Bordin's Working Alliance components: agreement on goals, agreement on tasks, felt bond.

1. Builder arrives at the campfire
2. **Engaging (Me):** Jarvis introduces himself and his role, explains the tradition — the ways of the sanctuary, what the stewards believe, how they work
3. **Focusing (You):** Jarvis asks open questions: "What brought you here? What's the heaviest thing you're carrying?"
4. **Evoking (You → Us):** The conversation identifies the builder's starting state (crisis, transition, or growth) and draws out the builder's own motivations for change
5. **Planning (Us):** Jarvis invites: "There's a place nearby. Humble but buildable. It takes a builder." — the walk invitation is the culmination of the designed alliance
6. Builder agrees to walk
7. They walk together from campfire to the sanctuary at the center of the map
8. The campfire fades. The sanctuary is home.

**What the walk accomplishes:**

- Establishes the steward relationship (builder experiences Jarvis's counseling style)
- Identifies starting state (crisis, transition, or growth persona)
- Seeds the first project (the "heavy thing" becomes the 72-hour win)

**Persistence:** None. The campfire is gone once the builder walks away. The sanctuary replaces it.

### Examples

- Builder opens LifeBuild for the first time → campfire in a clearing, Jarvis present → warm conversation → builder shares that work stress is overwhelming → Jarvis identifies crisis state → invites the walk → they arrive at the humble studio → Marvin is introduced → first project shaped from the "heavy thing" → campfire fades behind them.

### Anti-Examples

- **Campfire as permanent map feature** — the campfire is a threshold moment. Making it permanent weakens the metaphor. Once crossed, the sanctuary is home.
- **Skipping the campfire and dropping builders into an empty map** — without the values exchange, the builder has no relationship with the stewards and no understanding of why the sanctuary works the way it does.
- **Mesa greeting at the campfire instead of Jarvis** — the first steward relationship must be Jarvis (the counselor). Mesa is the Life Map assistant, not the onboarding guide.
- **Campfire at the center of the map** — the campfire is in the wilderness, off to the side. The sanctuary is at the center. The walk FROM campfire TO sanctuary is the spatial metaphor for choosing to build.
