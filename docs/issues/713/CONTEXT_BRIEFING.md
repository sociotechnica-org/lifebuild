# Context Briefing: Issue #713 -- Onboarding Sequence

**Target:** Journey -- Builder Onboarding (3-beat mechanical onboarding)
**Task type:** New feature
**Assembled:** 2026-02-27

---

## Constellation

### Seed Cards (direct match)

| Card                           | Type      | Relevance                                                                                                                        |
| ------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Journey - Builder Onboarding   | Journey   | Primary journey card. Defines the full arc: campfire stranger to sanctuary resident. Phases map to the 3 beats.                  |
| System - Onboarding            | System    | Orchestration mechanism. State machine: Not Started / Day 1 / Day 2 / Day 3 / Complete. Onboarding phase persistence lives here. |
| Standard - Onboarding Sequence | Standard  | Day-by-day specification. Progressive disclosure rules, emotional targets per day, conformance tests.                            |
| Component - Campfire           | Component | Beat 1 surface. Temporary threshold moment. 8-step sequence within designed posture arc. Fades after walk.                       |

### Hop 1 -- Agents and Rooms

| Card                 | Type  | Relevance                                                                                                                                            |
| -------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent - Jarvis       | Agent | Beat 1 guide. Conducts campfire conversation, identifies starting state, invites the walk. Overlay/drawer UI (D2 resolved). Not yet implemented.     |
| Agent - Marvin       | Agent | Beat 3 guide. Shapes first project from campfire handoff. Partially implemented (Drafting Room active, prompt needs steward voice update).           |
| Room - Drafting Room | Room  | Beat 3 destination. Where Marvin helps shape first project. Implemented at `/drafting-room` with four-stage creation flow.                           |
| Zone - Life Map      | Zone  | Beat 2 canvas. The map IS the reveal. Fog lifts to expose hex grid. Table overlay fades in. Partially implemented (category cards, no hex grid yet). |

### Hop 2 -- Principles and Strategies

| Card                                   | Type      | Relevance                                                                                                                                                                                                  |
| -------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strategy - AI as Teammates             | Strategy  | WHY plank. The builder's first experience IS the teammate relationship. Jarvis at campfire establishes agents as teammates, not tools.                                                                     |
| Strategy - Spatial Visibility          | Strategy  | WHY plank. Beat 2 (Reveal) embodies this -- fog lifting IS spatial visibility materializing. Hex grid prototype exists (2026-02-24).                                                                       |
| Principle - First 72 Hours             | Principle | Governing constraint. Onboarding must create momentum without overwhelm. Day 1 = "I made something." Progressive disclosure rules.                                                                         |
| Principle - Earn Don't Interrogate     | Principle | Governing constraint. No forms, no profile completion before value. Campfire scorecard via reflected extraction, not questionnaire.                                                                        |
| Principle - Agreement Over Expectation | Principle | Campfire structure. Me/You/Us zones. Designed alliance established before the walk. Research-grounded (MI, Bordin, Co-Active, Stages of Change).                                                           |
| Principle - Guide When Helpful         | Principle | Progressive guidance, not progressive disclosure. All capabilities are always findable; active guidance follows demonstrated need. Tension with First 72 Hours (onboarding needs more proactive guidance). |
| Principle - Visibility Creates Agency  | Principle | Beat 2 aesthetic. Fog lifting = work becoming visible. Defaults should show, not hide. The Table fading in = priorities becoming ever-present.                                                             |

### Hop 3 -- Supporting Systems and Aesthetics

| Card                                   | Type       | Relevance                                                                                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Release - The Campfire                 | Release    | R1 release plan. Contains milestones, feature tables, decisions, risks. The 3-beat onboarding IS the R1 core experience.                  |
| Overlay - The Table                    | Overlay    | Beat 2 element. Fades in during reveal. Persistent priority display (Gold/Silver/Bronze). Implemented as `TableBar.tsx`.                  |
| Structure - Hex Grid                   | Structure  | Beat 2 element. Fog lifts to reveal hex grid. Prototyped (2026-02-24). One project per hex (D3 resolved). Manual placement (D1 resolved). |
| System - Progressive Knowledge Capture | System     | Campfire is the first extraction touchpoint. Rubric targets: starting state, heavy thing, values, initial capacity. Not yet implemented.  |
| Aesthetic - Being Known                | Aesthetic  | Target feeling for mature onboarding. "My counselor gets me." Seeds planted at campfire, realized over time.                              |
| Capability - Purpose Assignment        | Capability | Unlocked by Beat 3. First project gets G/S/B classification. Partially implemented (archetype-derived, not subjective question).          |

---

## Beat-to-Card Mapping

### Beat 1: Campfire (Jarvis guides first project creation)

**Primary cards:** Component - Campfire, Agent - Jarvis, Journey - Builder Onboarding (The Meeting + The Walk phases)

**Mechanics:**

- Builder opens app for first time. Campfire appears at edge of hex grid.
- Jarvis conducts designed posture conversation: Engaging (Me) -> Focusing (You) -> Evoking (You->Us) -> Planning (Us).
- Conversation produces 6-field scorecard via reflected extraction: `startingState`, `heavyThing`, `firstProjectSeed`, `allianceAgreement`, `capacitySignals`, `valueSignals`.
- Jarvis invites the walk: "There's a place nearby. Humble but buildable."
- Builder agrees. Camera pans from campfire to sanctuary center. Campfire fades permanently.

**Design decisions resolved:**

- D5: Designed posture sequence (not scripted branches, not free-form).
- D6: Reflected extraction for scorecard (Jarvis reflects, builder confirms).
- D2: Jarvis as overlay/drawer on map (not dedicated route).

**Design decisions open:**

- D5 needs prompt prototyping to validate feel.
- Campfire UI architecture not yet designed.

### Beat 2: Reveal (fog lifts, map reveals, Attendant Rail fades in)

**Primary cards:** Zone - Life Map, Structure - Hex Grid, Overlay - The Table, Strategy - Spatial Visibility, Principle - Visibility Creates Agency

**Mechanics:**

- After the walk animation completes, the fog/frontier lifts.
- Hex grid becomes visible. Sanctuary structure at center (Humble Studio).
- The Table (Attendant Rail) fades in -- persistent priority overlay.
- Progressive disclosure: only Life Map basics and project creation are available. Sorting Room, full agent capabilities remain hidden.

**Key constraint from Standard - Onboarding Sequence:**

- Day 1 scope: Campfire + Life Map + project creation ONLY.
- Never show on Day 1: The Table, Sorting Room, full agent capabilities.

**NOTE -- Tension identified:** The task description says "Attendant Rail fades in" during Beat 2, but Standard - Onboarding Sequence explicitly says The Table should NOT appear on Day 1 ("Never show on Day 1: The Table, Sorting Room, full agent capabilities"). This needs resolution. Options:

1. The Table fades in as empty/dormant (visible but inactive until Day 3).
2. The Table fades in after first project is placed (end of Beat 3, not Beat 2).
3. Revise the Standard to allow Table visibility on Day 1 since the builder will have a project by end of session.

### Beat 3: First Project (user clicks project building, Marvin helps)

**Primary cards:** Agent - Marvin, Room - Drafting Room, Capability - Purpose Assignment, Journey - Builder Onboarding (The Arrival phase)

**Mechanics:**

- Builder arrives at sanctuary (Humble Studio). Marvin is introduced.
- Marvin receives campfire scorecard context: "Jarvis told me about [the heavy thing]. Let's make it a project."
- Builder shapes first project through Drafting Room flow (Stage 1 minimum, ideally through Stage 3).
- First hex tile placed on the map. Territory claimed.
- First task should be completable within the session.

**Handoff data:** Campfire output (startingState, heavyThing, firstProjectSeed) feeds Marvin's context. This handoff format is specified in Release - The Campfire feature table.

---

## Onboarding State Persistence

### Current State: Nothing exists

No onboarding events, no onboarding phase tracking, no progressive disclosure state in the codebase. The events.ts and schema.ts files contain zero onboarding-related definitions.

### Required State Model (from System - Onboarding)

```
Onboarding phase: Not Started | Day 1: Orientation | Day 2: Foundation | Day 3: Momentum | Complete | Paused
Milestones achieved: Set<campfire_conversation | charter_draft | first_project | first_map_exploration>
Service level: 0 (pre-onboarding) -> 1 (active)
```

### Implementation Requirements

**Events needed** (in `packages/shared/src/livestore/events.ts`):

- `onboarding.started` -- builder opens app for first time, campfire appears
- `onboarding.campfireCompleted` -- campfire conversation finished, scorecard produced
- `onboarding.walkCompleted` -- camera pan finished, fog lifted, builder at sanctuary
- `onboarding.firstProjectCreated` -- first project placed on hex grid
- `onboarding.phaseAdvanced` -- phase transition (Day 1 -> Day 2 -> Day 3 -> Complete)
- `onboarding.paused` / `onboarding.resumed` -- builder disengages/returns

**Schema needed** (in `packages/shared/src/livestore/schema.ts`):

- `onboardingState` table -- materializes current phase, milestones, scorecard data
- `campfireScorecard` table -- stores the 6-field scorecard for downstream agent consumption

**Web components needed** (in `packages/web/src/`):

- Campfire component (new) -- conversation UI at map edge
- Fog/reveal overlay (new) -- visual treatment over hex grid that lifts
- Walk animation integration with CameraRig (extend existing `packages/web/src/components/hex-map/CameraRig.tsx`)
- Onboarding gate logic -- check onboarding phase to control progressive disclosure

---

## Codebase Impact

### Files to create

- `packages/web/src/components/onboarding/` -- new directory for Campfire, Fog, Walk components
- Onboarding events and schema additions to existing shared files

### Files to modify

- `packages/shared/src/livestore/events.ts` -- add onboarding events
- `packages/shared/src/livestore/schema.ts` -- add onboarding tables
- `packages/web/src/components/hex-map/HexMap.tsx` -- integrate campfire position, fog overlay, walk trigger
- `packages/web/src/components/hex-map/CameraRig.tsx` -- walk animation (pan from edge to center)
- `packages/web/src/components/layout/NewUiShell.tsx` -- onboarding-aware shell (hide/show Table based on phase)
- `packages/web/src/components/layout/TableBar.tsx` -- fade-in animation when unlocked
- `packages/web/src/components/life-map/LifeMap.tsx` -- onboarding entry point logic
- `packages/web/src/constants/routes.ts` -- possibly new campfire route or state

### Existing infrastructure to leverage

- Hex grid components exist: `HexGrid.tsx`, `HexCell.tsx`, `HexTile.tsx`, `CameraRig.tsx`, `PlacementContext.tsx`
- Table overlay exists: `TableBar.tsx`, `TableSlot.tsx`
- Drafting Room exists: `Stage1Form.tsx`, `Stage2Form.tsx`, `Stage3Form.tsx`, `StageWizard.tsx`
- Marvin agent is active with prompts and personality
- Hex grid prototype proves camera movement and illustrated tiles are feasible

### What does NOT exist

- Jarvis agent (no prompt, no UI, no overlay)
- Campfire component
- Fog/frontier visual treatment
- Walk animation
- Onboarding state machine
- Campfire scorecard data model
- Campfire-to-Marvin handoff mechanism
- Progressive disclosure gating

---

## Open Questions for Implementation

1. **Table timing tension:** Standard says "never show Table on Day 1" but task says "Attendant Rail fades in" during Beat 2 (which is Day 1). Which takes precedence?

2. **Jarvis implementation scope:** Does Beat 1 require the full MI posture sequence, or a simplified version for the mechanical MVP? The designed posture approach needs prompt prototyping (D5 not fully resolved).

3. **Fog visual treatment:** Is the fog a CSS overlay that transitions to transparent, a canvas effect on the hex grid, or a distinct visual layer? No design spec exists yet.

4. **Scorecard persistence:** Should the 6-field campfire scorecard be an event payload (immutable) or a mutable record that downstream agents can annotate?

5. **Progressive disclosure mechanism:** Should gating be route-based (redirect away from locked features), component-based (render nothing), or visual (show locked/grayed states)?

---

## Provenance

All cards read in full before inclusion. No fabrication. Cards from `sources/` excluded per protocol.

| Card                                   | Path                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Journey - Builder Onboarding           | `docs/context-library/experience/journeys/Journey - Builder Onboarding.md`            |
| System - Onboarding                    | `docs/context-library/product/systems/System - Onboarding.md`                         |
| Standard - Onboarding Sequence         | `docs/context-library/rationale/standards/Standard - Onboarding Sequence.md`          |
| Component - Campfire                   | `docs/context-library/product/components/Component - Campfire.md`                     |
| Agent - Jarvis                         | `docs/context-library/product/agents/Agent - Jarvis.md`                               |
| Agent - Marvin                         | `docs/context-library/product/agents/Agent - Marvin.md`                               |
| Room - Drafting Room                   | `docs/context-library/product/rooms/Room - Drafting Room.md`                          |
| Zone - Life Map                        | `docs/context-library/product/zones/Zone - Life Map.md`                               |
| Strategy - AI as Teammates             | `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md`             |
| Strategy - Spatial Visibility          | `docs/context-library/rationale/strategies/Strategy - Spatial Visibility.md`          |
| Principle - First 72 Hours             | `docs/context-library/rationale/principles/Principle - First 72 Hours.md`             |
| Principle - Earn Don't Interrogate     | `docs/context-library/rationale/principles/Principle - Earn Don't Interrogate.md`     |
| Principle - Agreement Over Expectation | `docs/context-library/rationale/principles/Principle - Agreement Over Expectation.md` |
| Principle - Guide When Helpful         | `docs/context-library/rationale/principles/Principle - Guide When Helpful.md`         |
| Principle - Visibility Creates Agency  | `docs/context-library/rationale/principles/Principle - Visibility Creates Agency.md`  |
| Release - The Campfire                 | `docs/context-library/releases/Release - The Campfire.md`                             |
| Overlay - The Table                    | `docs/context-library/product/overlays/Overlay - The Table.md`                        |
| Structure - Hex Grid                   | `docs/context-library/product/structures/Structure - Hex Grid.md`                     |
| System - Progressive Knowledge Capture | `docs/context-library/product/systems/System - Progressive Knowledge Capture.md`      |
| Aesthetic - Being Known                | `docs/context-library/experience/aesthetics/Aesthetic - Being Known.md`               |
| Capability - Purpose Assignment        | `docs/context-library/product/capabilities/Capability - Purpose Assignment.md`        |
