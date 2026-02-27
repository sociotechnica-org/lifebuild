# Release 1: The Campfire

## "You arrive at a fire in the wilderness. You meet Jarvis. You walk to the sanctuary together. You build your first thing."

---

## GOAL

Enable the magical portal. A new builder arrives at an intimate campfire space, answers one question, and the world opens -- a hex map with an illustrated sanctuary at center. Their words materialize as a hex tile. Marvin appears and breaks it down. The builder places their hex. Within 72 hours, they have evidence that this works. The onboarding must feel like crossing a threshold into a world, not completing a tutorial. Illustrated hex tiles with pre-made sprites are available from day one -- the builder's first impression is a living, illustrated map, not a wireframe.

### Success Criteria

- [ ] Builder answers one question and the portal opens within 60 seconds
- [ ] Wow chain delivers 4+ varied surprise beats in the first 5 minutes
- [ ] Builder's words visibly become a hex on the map (the words-to-world transition feels magical)
- [ ] Builder places their first hex on the map -- spatial agency from minute one
- [ ] First project is shaped from the builder's answer and placed as an illustrated hex tile
- [ ] First task is completable within the session
- [ ] Builder returns within 48 hours (measured)
- [ ] 72-hour win achieved per starting state:
  - **Crisis:** One draining thing off their plate
  - **Transition:** Life mapped for the first time
  - **Growth:** First system planted and running

---

## LADDER POSITIONS

| Bet                | Before                        | After                                                       | Key Advancement                                                            |
| ------------------ | ----------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Spatial Visibility | L1 (kanban boards, card view) | L2.3 (hex map, illustrated tiles, sanctuary sprite visible) | Hex map with illustrated sprites from day one; sanctuary visible at center |
| Superior Process   | L3 (Table, G/S/B, Pipeline)   | L3 (holds)                                                  | No new process features -- existing frameworks carry over                  |
| AI as Teammates    | L1 (generic agents)           | L1.5 (Jarvis + Marvin active with defined roles)            | Jarvis opens portal; Marvin appears as wow beat; steward model established |

---

## FEATURES (Minimum Viable)

### Spatial Visibility

| Feature                       | Minimum Viable Implementation                                                                  | Full Vision (deferred)                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Hex grid                      | Fixed-size grid with sanctuary at center, campfire at edge. Projects live as hex tiles.        | Infinite canvas, clustering, spatial analysis      |
| Illustrated hex tiles         | Pre-made sprites from a starter set. Builder's first hex is visually rich, not a bare outline. | AI-generated sprites from project content          |
| Sanctuary structure at center | Visible from day one as the Humble Studio. Clickable -- opens Council Chamber.                 | Evolves through stages as builder grows            |
| Category-colored hex borders  | Visual identity for life domains per life category colors                                      | Territory phases, frontier/expansion metaphor      |
| Hex tiles for projects        | Projects live on the map as tiles, not cards                                                   | State treatments, health indicators, smoke signals |
| Click hex to open project     | Navigation into existing project views                                                         | Overlay-style project detail on the map            |
| First hex placement           | Builder places their first project as a hex tile during onboarding                             | Drag-to-rearrange, spatial clustering              |
| The Table overlay on map      | Priority system still works, now on the spatial canvas                                         | Table integrated with zoom tiers                   |
| Portal transition             | View pans from campfire to sanctuary -- camera movement + campfire fade                        | Rich environmental transitions                     |

### AI as Teammates

| Feature                     | Minimum Viable Implementation                                                           | Full Vision (deferred)                                  |
| --------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Jarvis at the campfire      | One question in compression phase. Guides portal crossing. Present during the reveal.   | Deep knowledge persistence, Charter-aware conversations |
| Jarvis after onboarding     | Accessible via overlay/drawer from the map. References prior context on return visits.  | Full Council Chamber with strategic depth               |
| Marvin in Drafting Room     | Prompt updated to Builder vocabulary, steward voice. Shapes first project from handoff. | Charter-aware project shaping                           |
| Campfire-to-Marvin handoff  | Campfire output (`heavyThing`) feeds Marvin. Marvin appears on map with work done.      | Full knowledge framework with 7 domains                 |
| Builder context persistence | Starting state, conversation summary, and first project seed are stored and accessible. | Versioned builder profile across all agents             |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- Arrive at a campfire, answer one question, and cross the portal -- a compression-release threshold that feels like entering a world
- Watch their words become a hex on the map -- the words-to-world transition
- See an illustrated map with sprite-decorated tiles from the first session
- Shape their first project with Marvin who appears already working on the problem
- Place their first hex tile on the map -- claiming territory
- Complete their first task within the session
- Come back the next day and find the map, the hex, and Jarvis remembering

**After this release, the builder CANNOT:**

- Plant systems (Silver projects just complete, nothing takes root)
- Browse an expanded sprite gallery or choose custom sprites per project
- See territory phases or sanctuary evolution
- Have Jarvis reference a Charter (does not exist yet)
- Run structured sessions with Agenda templates
- See health signals on the map (no smoke signals)
- Delegate any work to AI attendants
- Run structured expedition cycles (work is still ad-hoc)

**Bottleneck:** Everything is still projects. No systems, no rhythm, no delegation. The map is beautiful and the AI is warm, but the product is still a project management tool with a compelling onboarding experience.

**Who falls in love here:** People who need to feel held during a life transition. Builders who respond to warmth and spatial metaphor. "I typed one thing at the campfire, and now it's a hex on my map with a team working on it."

**Viable scale:** ~1-5 projects

---

## AFFECTED LIBRARY CARDS

| Card                                      | How It's Affected                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| [[Structure - Hex Grid]]                  | Partially activated -- fixed grid, illustrated tiles, no zoom tiers                  |
| [[Component - Hex Tile]]                  | Activated with category colors and illustrated sprites                               |
| [[Component - Campfire]]                  | Rewritten -- compression phase with one question, not MI conversation                |
| [[Agent - Jarvis]]                        | Activated -- portal guide at campfire, one question, overlay after                   |
| [[Agent - Marvin]]                        | Entrance redesigned as wow beat -- appears with work done, not introductions         |
| [[Agent - Mesa]]                          | Reserve status confirmed -- removed from active routing                              |
| [[System - Onboarding]]                   | Rewritten -- state machine reoriented around portal + wow chain                      |
| [[Standard - Onboarding Sequence]]        | Rewritten -- 5-minute portal + 3-day deepening replaces 3-day progressive disclosure |
| [[Standard - Spatial Interaction Rules]]  | Upheld from R1 -- manual placement from day one                                      |
| [[Room - Council Chamber]]                | Jarvis accessible via overlay (not dedicated route in R1)                            |
| [[Principle - Action Before Explanation]] | NEW -- comprehension follows action, never the other way around                      |
| [[Principle - Compression and Release]]   | NEW -- the portal pattern: compression, crossing, release                            |
| [[Principle - The WOW Chain]]             | NEW -- varied surprise sequence prevents deflation after the reveal                  |
| [[Journey - Builder Onboarding]]          | Rewritten -- MI posture phases replaced by wow chain choreography                    |

---

## DECISIONS NEEDED

### Quick Calls (15-minute decisions)

#### D1: Algorithmic hex placement OK for Release 1?

> **Resolved 2026-02-17:** Manual -- builder places from day one. Algorithmic placement rejected. Standard - Spatial Interaction Rules upheld from R1. New work: hex placement UX (tap/drag to place), placement validation UI, existing project migration strategy.

#### D2: Jarvis UI -- route or overlay?

> **Resolved 2026-02-17:** Overlay -- panel/drawer accessible from the map. Route-based Council Chamber deferred.

#### D3: One project per hex?

> **Resolved 2026-02-17:** One project per hex. Sanctuary is a 3-tile exception. Simpler data model, hex position is a unique constraint.

#### D4: What happens to category room agents?

> **Resolved 2026-02-17:** Remove entirely for R1. Category agents are vestigial -- Jarvis and Marvin handle everything.

### Decisions That Need Thought

#### D5: Campfire story structure -- how scripted vs how improv?

> **Shaping (2026-02-18):** Designed posture sequence + free-form content. Grounded in MI (Engaging -> Focusing -> Evoking -> Planning), Bordin Working Alliance (exit criteria: goals, tasks, bond), Co-Active Designed Alliance (co-created agreement), and Stages of Change (pacing calibrated to starting state). Maps to Me -> You -> Us relational knowledge exchange per [[Principle - Agreement Over Expectation]]. Not yet fully resolved -- needs prompt prototyping to validate.

**This is Decision Zero. It's upstream of the entire campfire experience.**

The shaping session (2026-02-18) identified four approaches:

| Approach                              | What it means                                                                                                          | Pros                                                                   | Cons                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Scripted with branches**            | Jarvis follows a designed conversation tree with branching paths for different builder types.                          | Predictable quality, testable, consistent onboarding.                  | Feels robotic if branches are too rigid.                     |
| **Free-form with guardrails**         | Jarvis has goals but converses naturally. The model handles the flow.                                                  | Feels genuinely conversational. Handles any builder naturally.         | Quality varies. Hard to ensure all assessment goals are hit. |
| **Hybrid**                            | Key moments are scripted. The conversation between those moments is free-form with guardrails.                         | Best of both -- reliability at key moments, authenticity in between.   | More complex to implement.                                   |
| **Designed posture sequence** _(new)_ | Intentional posture sequence (Engaging -> Focusing -> Evoking -> Planning) with free-form content within each posture. | Grounded in research. Modular and testable. Flexible within structure. | Needs prompt prototyping to validate feel.                   |

**Current direction:** Designed posture sequence.

**Resolved (2026-02-26):** Portal-first approach supersedes posture sequence. The campfire is a 60-second compression phase with one question, not a multi-phase MI conversation. The question -- "What's something you've been meaning to deal with?" -- seeds the first project. All downstream understanding comes from the builder's actions in the world, not from conversational extraction. MI research (Bordin, Co-Active, Stages of Change) remains valuable for Jarvis's post-onboarding conversations. Source: Power of the Portal.

**Unblocks:** Campfire prompt design, campfire UI architecture, assessment mechanics, walk trigger, Marvin handoff format.

#### D6: How does Jarvis assess crisis / transition / growth?

> **Resolved 2026-02-18:** Reflected extraction. The campfire produces a 6-field scorecard: `startingState`, `heavyThing`, `firstProjectSeed`, `allianceAgreement`, `capacitySignals`, `valueSignals`. Jarvis reflects back understanding in the Planning phase; builder confirms/corrects. The reflection IS the scorecard. Matches [[Principle - Agreement Over Expectation]].

> **Updated (2026-02-26):** 6-field scorecard simplified to one field: `heavyThing`. Starting state inference, capacity signals, and value signals are derived from the builder's actions in the world (wow chain beats, hex placement patterns, task completion) rather than conversational extraction. The reflected-extraction model remains relevant for post-onboarding Charter conversations.

#### D8: Image generation art direction

**Context:** Release 2 feature, but experimentation benefits from an early start. Brand standards exist. Old image evolution prompts may exist.

**Not blocking Release 1.** But every week of prompt experimentation now is a week saved in Release 2.

---

## MILESTONES

**Milestone 1: "The Grid"**
Hex grid renders with sanctuary at center, campfire at edge. Jarvis responds in Council Chamber. Projects appear as illustrated hex tiles. Clicking a hex opens the project. The Table overlay works on the map.

**Milestone 2: "The Portal"**
Campfire compression phase produces the gasp. One question -> portal -> wow chain fires. Builder's words become a hex. Marvin appears with work. Builder places hex. The first 5 minutes land.

**Milestone 3: "The Full Flow"**
Full flow end-to-end: campfire -> one question -> portal -> wow chain -> first hex placed -> first task complete. Internal team walks through.

**Milestone 4: "The Return"**
Builder comes back. Map is there. Hex is there. Jarvis remembers. Table shows progress. Does it feel like coming home?

**Milestone 5: "The 72 Hours"**
Alpha testers. Real people. Full cycle. Measure: does the 72-hour win land?

---

## WHAT'S EXPLICITLY DEFERRED

### Deferred Map Features (Release 2+)

| Feature                                | Why Deferred                                                   |
| -------------------------------------- | -------------------------------------------------------------- |
| Semantic zoom (Horizon/Working/Detail) | One zoom level is fine for early builders                      |
| Infinite pan/scroll                    | Small fixed grid is sufficient for first months                |
| Drag-to-rearrange hexes                | Builder agency matters, but not before 5+ projects             |
| Frontier / grayed-out hexes            | Expansion metaphor needs more projects first                   |
| Image generation on tiles              | Art makes the map beautiful, not functional                    |
| Clustering / spatial analysis          | Needs many projects to be meaningful                           |
| Sanctuary structure evolution          | Humble Studio -> Growing Workshop -> Sanctuary is earned       |
| Complex state treatments               | Hibernating, overgrowth, dormancy -- all need mature lifecycle |
| Expanded sprite gallery                | Starter set is enough for R1; full gallery comes in R2         |

### Deferred Product Features (Release 2+)

| Feature                     | Why Deferred                                                  |
| --------------------------- | ------------------------------------------------------------- |
| The Charter                 | Jarvis needs more interaction history before proposing one    |
| Agenda templates            | Need strategic depth infrastructure first                     |
| Conan / Archives            | Nothing to archive yet                                        |
| Expeditions / Core Loop     | Micro loop must work first                                    |
| Seasons                     | Need multiple expedition cycles                               |
| Felt Experience slider      | Requires data collection infrastructure                       |
| Overgrowth                  | Requires mature system primitives                             |
| Capacity Economy (explicit) | Stewards reason implicitly first                              |
| Attendants                  | No delegation system yet                                      |
| System planting             | Silver projects don't yet become planted systems              |
| Four Verbs (explicit)       | Builders naturally do all four; explicit classification later |

---

## WHAT RELEASE 1 DELIVERS

The complete experience, start to finish:

1. **The Campfire (compression).** An intimate space. Jarvis is there. One question: "What's something you've been meaning to deal with?" You type an answer. ~15 seconds.

2. **The Portal (release).** The view expands. A hex map reveals -- open sky, terrain, sanctuary at center. You gasp. There's a world here.

3. **Words become world.** Your answer materializes as a hex on the map. Your words are becoming territory. This is not a form. This is creation.

4. **Meet Marvin.** He appears on the map, already working on your problem. "Here are three things you could do -- which feels right?" You watch a teammate act, not introduce himself.

5. **Place your hex.** You choose where it goes on the map. Category-colored. Illustrated. Your first claimed territory.

6. **Something moves.** An attendant picks up the first task. "I'll look into that." The team works even when you're not here.

7. **Come back tomorrow.** The map is there. Your hex is there. Jarvis remembers. The Table shows your progress. You're building something.

8. **Within 72 hours:** Point to something real. "That thing I typed at the campfire? It's being handled." Point to the map. "That's mine. I built that."

---

## RISKS

| Risk                                          | Mitigation                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D5 (story structure) takes too long to decide | Build everything else in parallel. Hex grid, agents, events, map integration -- all unblocked. The campfire experience is the last thing assembled.      |
| Campfire conversation doesn't feel magical    | Prototype track. Draft, test, iterate. The prompt is the soul -- it can be revised independently of the UI.                                              |
| Portal transition feels awkward               | Camera movement is proven feasible. Easing curve tuning is a few hours, not a design problem. The emotion comes from the compression, not the animation. |
| Map feels empty for new builders              | Empty space is potential, not absence -- but only if the aesthetic communicates that. Sanctuary at center + first illustrated hex is enough.             |
| Sprite style doesn't match product identity   | Review existing sprites and visual aesthetic before committing to the approach. Style should be validated early.                                         |

---

## WHEN: Timeline

- Status: planned
