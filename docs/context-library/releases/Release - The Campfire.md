# Release 1: The Campfire

## "You arrive at a fire in the wilderness. You meet Jarvis. You walk to the sanctuary together. You build your first thing."

---

## GOAL

Enable the magical 72 hours. A new builder arrives at a campfire on the edge of a hex map, meets Jarvis, walks with him to the sanctuary at the center, shapes their first project, places their first hex, and within 72 hours has evidence that this works. The onboarding must feel like entering a world, not completing a tutorial.

### Success Criteria

- [ ] New builder arrives at the campfire within 30 seconds of opening the app
- [ ] Jarvis identifies starting state (crisis/transition/growth) through natural conversation
- [ ] Builder walks from campfire to sanctuary — a spatial transition on the hex map
- [ ] First project is shaped from the conversation and placed as a hex tile on the map
- [ ] First task is completable within the session
- [ ] Builder returns within 48 hours (measured)
- [ ] 72-hour win achieved per starting state:
  - **Crisis:** One draining thing off their plate
  - **Transition:** Life mapped for the first time
  - **Growth:** First system planted and running

---

## CURRENT STATE (February 2026)

### What exists and works

| Feature           | Status             | Details                                                                                             |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| **The Table**     | Functional         | Gold/Silver/Bronze slots, project assignment, bronze stack/projects                                 |
| **Drafting Room** | Functional         | 3-stage project creation (identify, scope, detail). Marvin guides via chat. Route: `/drafting-room` |
| **Sorting Room**  | Functional         | Priority selection across G/S/B streams. Route: `/sorting-room`                                     |
| **Project Room**  | Functional         | Per-project view with kanban tasks and room-based chat. Route: `/projects/:id`                      |
| **Life Map**      | Functional (cards) | 8 category cards displaying projects. NOT a hex grid. Route: `/life-map` (default)                  |
| **AI chat**       | Functional         | Server agentic loop processes chat messages per room. Braintrust LLM routing.                       |
| **Mesa agent**    | Active             | Life Map navigator. Still uses "Director" vocabulary. Generic helper, not a steward.                |
| **Marvin agent**  | Active             | Drafting Room project creation guide. Functional prompts.                                           |
| **Auth**          | Functional         | JWT auth, login/signup pages, Cloudflare auth worker.                                               |
| **LiveStore**     | Functional         | Event-sourced state, OPFS persistence, WebSocket sync, SharedWorker multi-tab.                      |

### What does NOT exist

| Feature                       | Status                                                    |
| ----------------------------- | --------------------------------------------------------- |
| Hex map / spatial canvas      | Nothing built                                             |
| Campfire / onboarding         | No first-run experience at all                            |
| Jarvis agent                  | Not in codebase — no Council Chamber, no prompt, no route |
| Conan agent                   | Not in codebase — no Archives                             |
| Image generation              | Nothing built                                             |
| Sanctuary metaphor in UI      | Nothing — it's a productivity app visually                |
| Starting state identification | No assessment model                                       |
| 72-hour win tracking          | No success signals                                        |

---

## WHY STORY AND MAP SHIP TOGETHER

The campfire-to-sanctuary **walk** is the core onboarding mechanic. You meet Jarvis at a fire in the wilderness. You walk together to the sanctuary at the center of the map. You place your first hex. This spatial metaphor — choosing to leave the campfire and build a home — doesn't work without a map to walk across. Category cards can't carry the metaphor. The walk IS the product.

But the full map vision (zoom levels, frontier, fog of war, image generation, illustration evolution, clustering, drag-to-rearrange) is enormous. Shipping all of that before the campfire would delay the 72-hour magic indefinitely.

**The solution: a Minimum Viable Map.** Just enough hex grid to support the walk, the first hex placement, and ongoing project navigation. Ship the story and the map as one coherent experience. Defer the advanced spatial features and art to later releases.

### What the Minimum Viable Map includes

| Feature                       | Why it's needed                                                             |
| ----------------------------- | --------------------------------------------------------------------------- |
| Hex grid renderer (SVG)       | The canvas. Without it, no spatial metaphor.                                |
| Sanctuary structure at center | The destination of the walk. Home.                                          |
| Campfire off to the side      | The starting point. Temporary.                                              |
| Category-colored hex borders  | Visual identity for life domains                                            |
| Hex tiles for projects        | Projects live on the map as tiles, not cards                                |
| Click hex → project detail    | Navigation into existing project views                                      |
| First hex placement           | The moment the builder claims their first piece of territory                |
| The Table overlay on map      | Priority system still works, now on the spatial canvas                      |
| Walk animation                | The transition from campfire to sanctuary — camera movement + campfire fade |

### What the Minimum Viable Map does NOT include

| Feature                                | Why deferred                                                          |
| -------------------------------------- | --------------------------------------------------------------------- |
| Semantic zoom (Horizon/Working/Detail) | Adds complexity without changing onboarding                           |
| Infinite pan/scroll                    | Small map is fine for early builders                                  |
| Drag-to-rearrange hexes                | Builder agency matters, but not before they have 5+ projects          |
| Frontier / grayed-out hexes            | Expansion metaphor needs more projects first                          |
| Image generation on tiles              | Art makes the map beautiful, not functional                           |
| Clustering / spatial analysis          | Needs many projects to be meaningful                                  |
| Sanctuary structure evolution          | Stays as Humble Studio; grows later                                   |
| Complex state treatments               | Hibernating, overgrowth, dormancy — all need mature project lifecycle |

---

## HOW WE BUILD THIS

### Philosophy

The bottleneck is decisions, not engineering. AI builds fast. Humans decide, author stories, and test feel. The plan is organized around clearing human decisions as quickly as possible, then letting AI build everything that's unblocked.

### Four modes of work

| Mode          | What it means                                                                                       | Who                           |
| ------------- | --------------------------------------------------------------------------------------------------- | ----------------------------- |
| **MAKE**      | AI builds it. Library + plan provide enough guidance. No human decision needed.                     | AI                            |
| **DECIDE**    | A human call is needed before AI can build correctly. The plan surfaces the question and routes it. | Danvers or Jess               |
| **PROTOTYPE** | Iterative cycles where humans and AI trade drafts. Feel-testing, prompt iteration, story shaping.   | Danvers + AI (Jess as backup) |
| **PATCH**     | Library cards need Release 1 reality notes so AI doesn't overbuild from the full-vision specs.      | AI (with Danvers approval)    |

### Team

- **Danvers** (Product Owner) — owns all product decisions, story authoring, campfire experience design, prompt voice, feel-testing. Primary on all DECIDE and PROTOTYPE work.
- **Jess** (CTO) — owns backend architecture decisions (context persistence, event schemas), oversees complex engineering. Prompt work when Danvers is in story mode.
- **AI** — builds everything that isn't blocked by a decision. Runs in parallel on all unblocked tracks. Drafts prompts and stories for human refinement. Assembles context constellations before building.

### Velocity principle

Every DECIDE item has a clear question, a recommended answer, and a list of what it unblocks. Danvers and Jess don't need to research — they need to call it. Quick decisions first, then the ones that need thought.

---

## DECISION QUEUE

Ordered by unlock value. Decisions at the top unblock the most AI building.

### Quick Calls (15-minute decisions)

These are yes/no or A/B/C choices. Make them once, AI builds immediately after.

#### D1: Algorithmic hex placement OK for Release 1?

> **Resolved 2026-02-17:** Manual — builder places from day one. Algorithmic placement rejected. Standard - Spatial Interaction Rules upheld from R1. New work: hex placement UX (tap/drag to place), placement validation UI, existing project migration strategy. Eliminated: #612 (Spatial Interaction Rules override patch).

**The tension:** The library (`Standard - Spatial Interaction Rules`) says "builder places their own projects, system never assigns locations." Release 1 needs projects on the map before drag-to-rearrange exists. The proposal: algorithmic initial placement (8 category zones radiating from center), with builder-driven rearrangement coming in Release 2.

**Question for Danvers:** Is it OK for Release 1 to auto-place projects by category zone, knowing we add drag-to-rearrange later? Or must the builder choose position from day one (even without a polished placement UI)?

**Recommended answer:** Algorithmic placement is fine. The first hex is placed manually (during onboarding). Existing/subsequent projects get auto-placed by category. Drag comes in Release 2.

**Unblocks:** Hex grid layout, map-project integration, first hex placement, existing project migration.

---

#### D2: Jarvis UI — route or overlay?

> **Resolved 2026-02-17:** Overlay — panel/drawer accessible from the map. Route-based Council Chamber deferred. New work: overlay/drawer component for Jarvis. Eliminated: no `/council-chamber` route needed in R1.

**Question for Danvers:** After the campfire is gone, where does Jarvis live? Options:

1. **Route** — `/council-chamber` as a dedicated page (like Drafting Room, Sorting Room)
2. **Overlay** — panel/drawer accessible from the map
3. **Both** — route for deep conversations, overlay for quick access

**Recommended answer:** Route-based for Release 1. Simplest to build on existing `RoomLayout` pattern. Council Chamber as a permanent route gives Jarvis a home. Overlay in Release 2.

**Unblocks:** Agent architecture wiring, route definitions, post-campfire Jarvis location.

---

#### D3: One project per hex?

> **Resolved 2026-02-17:** One project per hex. Sanctuary is a 3-tile exception. Simpler data model, hex position is a unique constraint. New work: hex uniqueness validation, sanctuary 3-tile exception logic.

**Question for Jess:** Can two projects occupy the same hex position? Or is each hex exclusive?

**Recommended answer:** One project per hex. Hex position is a unique constraint. Simpler data model, cleaner map rendering.

**Unblocks:** LiveStore event schema design, map-project binding, hex placement validation.

---

#### D4: What happens to category room agents?

> **Resolved 2026-02-17:** Remove entirely for R1. Category agents are vestigial — Jarvis and Marvin handle everything. Eliminated: category agent maintenance and prompt updates.

**Context:** 8 category-specific agents exist in `rooms.ts` (Maya, Grace, Brooks, etc.) that aren't part of the steward model. They're per-category chat agents from an earlier design.

**Question for Danvers:** Keep, remove, or update? They aren't Jarvis/Marvin/Conan.

**Recommended answer:** Remove. They're vestigial. Jarvis and Marvin handle everything they did.

**Unblocks:** Agent architecture cleanup scope.

---

### Decisions That Need Thought

These require Danvers to sit with the question. They're the real blockers to the campfire experience.

#### D5: Campfire story structure — how scripted vs how improv?

**This is Decision Zero. It's upstream of the entire campfire experience.**

The campfire conversation could be:

| Approach                      | What it means                                                                                                                                                                   | Pros                                                                                            | Cons                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Scripted with branches**    | Jarvis follows a designed conversation tree. 8-step sequence from the library, with branching paths for different builder types. Builder responses trigger specific next steps. | Predictable quality, testable, consistent onboarding. Story beats land reliably.                | Feels robotic if branches are too rigid. Harder to handle truly unexpected responses.           |
| **Free-form with guardrails** | Jarvis has a system prompt with goals (identify starting state, surface the heavy thing, invite the walk) but converses naturally. LLM handles the flow.                        | Feels genuinely conversational. Handles any builder naturally. More like "meeting a counselor." | Quality varies by conversation. Hard to ensure all assessment goals are hit. Testing is harder. |
| **Hybrid**                    | Key moments are scripted (greeting, tradition explanation, walk invitation). The conversation between those moments is free-form with guardrails.                               | Best of both — reliability at key moments, authenticity in between.                             | More complex to implement. Need to define which moments are fixed vs fluid.                     |

**Question for Danvers:** Which approach? This determines:

- Whether the campfire is a chat UI (free-form) or a guided sequence UI (scripted) or both (hybrid)
- How the Jarvis campfire prompt is structured
- How assessment happens (embedded in natural conversation vs. structured extraction)
- How the walk is triggered (conversational cue vs. button after specific step)
- How the handoff to Marvin is structured (extracted data vs. conversation summary)

**No recommended answer.** This is a product vision call. The library cards lean toward free-form ("elicitation over interrogation," "not a tutorial, a conversation") but the 8-step sequence suggests structure.

**Unblocks:** Campfire prompt design, campfire UI architecture, assessment mechanics, walk trigger, Marvin handoff format. _Almost everything in the campfire experience._

---

#### D6: How does Jarvis assess crisis / transition / growth?

**Depends on D5.** If scripted, the assessment can be a structured rubric applied at a specific step. If free-form, it needs to be inferred by the LLM from the conversation.

**Options:**

1. **LLM inference** — Jarvis's prompt includes the three states and their signals. The LLM classifies based on what the builder shares. Simple but less reliable.
2. **Structured rubric** — After the conversation, a separate LLM call analyzes the transcript against a rubric and outputs `{ startingState, heavyThing, firstProjectSeed }`. More reliable but more complex.
3. **Builder choice (masked)** — Jarvis asks a question like "What feels most true right now — that things are on fire, that you're between chapters, or that you're ready to build?" Direct but breaks the "not a quiz" principle.

**Question for Danvers:** Which approach? Or a combination?

**Recommended answer:** LLM inference for Release 1 (simplest, matches the "natural conversation" principle). Add a structured rubric as a validation pass in Release 2 if classification accuracy is a problem.

**Unblocks:** Assessment model, campfire prompt design, builder context schema.

---

#### D7: Where does builder context live?

> **Retired 2026-02-17:** This decision card was a technical architecture question ("which storage mechanism?"), not a product-feel decision. Technical architecture questions belong in MAKE — agents resolve them during implementation using the existing LiveStore patterns. The HOW dimension in the library is about how things should work for the builder, not how to build them technically. Removed as a blocker from dependent issues.

**Context:** After the campfire, Jarvis needs to remember: starting state, what the builder shared, the first project seed, conversation summary. On return visits, Jarvis references this. The question is the storage mechanism.

**Options:**

1. **LiveStore events** — `builder.contextUpdated { startingState, conversationSummary, ... }`. Consistent with existing architecture. Syncs across devices. But the schema must be designed.
2. **Separate builder profile** — A new data model alongside projects. More structured but more infrastructure.
3. **Conversation history** — Just keep the raw chat history and have Jarvis re-read it on return. Simplest but least structured. LLM must re-extract context each time.

**Question for Jess (architecture) + Danvers (what to store):**

- Jess: Which storage mechanism fits the existing LiveStore architecture best?
- Danvers: What's the minimum to persist? Starting state + conversation summary + first project seed? Or more?

**Recommended answer:** LiveStore events. A single `builder.onboardingCompleted { startingState, conversationSummary, firstProjectSeed, heavyThing }` event. Consistent with existing event-sourced architecture. Add more structured context events in Release 2 as the Knowledge Framework matures.

**Unblocks:** Builder context persistence, campfire-to-Marvin handoff, return experience, first-run detection flag.

---

### Decisions That Can Wait (Release 2 Frontloading)

#### D8: Image generation art direction

**Context:** Release 2 feature, but experimentation benefits from an early start. Plan to use Gemini. Brand standards exist (lifebuild.me follows them). Old image evolution prompts may exist (Jess checking).

**Question for Danvers:** When you're ready, define:

- Style targets (what should generated tile art look like?)
- Reference images or mood boards
- Whether the five-stage evolution (Sketch → Clean Pencils → Inked → Colored → Finished) is still the plan or if the approach has changed

**Not blocking Release 1.** But every week of prompt experimentation now is a week saved in Release 2.

---

## BUILD TRACKS

### MAKE — AI builds now, no decisions needed

These can start immediately. AI assembles a context constellation from the library + release plan, then builds.

| Track                    | What AI builds                                                                                                | Context readiness                                   | Notes                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Hex grid geometry**    | SVG hex renderer, offset coordinate system, hex math utilities, viewport sizing                               | YELLOW — needs library patches first (see below)    | The math is solved. SVG is straightforward. This is the longest pole — start first. |
| **Agent cleanup**        | Remove category agents from `rooms.ts`, define Jarvis overlay, remove Cameron/Devin, update Marvin vocabulary | GREEN — D2 + D4 resolved                            | D2: Jarvis as overlay (not route). D4: category agents removed. Fully unblocked.    |
| **LiveStore hex events** | `project.hexPlaced` event definition, materializer for hex coordinates, schema migration                      | GREEN — D3 resolved                                 | D3: one project per hex, unique constraint. Full schema design can proceed.         |
| **Hex placement UX**     | Tap/drag to place hex tiles, placement validation UI, existing project migration                              | GREEN — D1 resolved                                 | D1: manual placement from day one. New track from D1 scope changes.                 |
| **First-run detection**  | Routing guard: no projects + no onboarding flag → campfire; else → map                                        | YELLOW — release plan fills gaps                    | D7 retired (technical architecture, not a DECIDE item). Detection logic is simple.  |
| **Naming audit**         | Inventory all user-facing strings with stale vocabulary (Director, Mesa, agent)                               | GREEN — library is thick on naming                  | Audit scope only. Actual rename waits until campfire UI is built.                   |
| **Marvin prompt update** | Rewrite Marvin's prompt with Builder vocabulary, steward voice, per Agent - Marvin card                       | YELLOW — no prompt exists, but voice spec is strong | AI drafts, Danvers or Jess reviews. Low risk — Marvin's role is well-defined.       |

### BLOCKED — waiting on specific decisions

| Track                            | Blocked by                             | What AI builds after                                                               | Notes                                                                             |
| -------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Sanctuary + campfire visuals** | D5 (story structure, partially)        | SVG elements for Humble Studio and campfire, visual treatment, glow/warmth effects | AI can build placeholder visuals now, refine after story structure is decided     |
| **Campfire UI architecture**     | D5 (story structure)                   | Chat-based, guided-sequence, or hybrid campfire UI component                       | This is the big one. Can't design the UI without knowing the interaction model.   |
| **Jarvis campfire prompt**       | D5 (story structure) + D6 (assessment) | System prompt for the campfire conversation                                        | Drafts possible now; final version needs story structure and assessment approach  |
| **Campfire-to-Marvin handoff**   | D5 + D6                                | Data extraction from conversation, format for Marvin's context injection           | D7 retired — storage mechanism is a MAKE decision, not DECIDE. Still needs D5+D6. |
| **Walk animation**               | D5 (what triggers the walk)            | Viewport pan, campfire fade, arrival rendering                                     | The animation itself is simple. The trigger mechanism depends on story structure. |
| **Return experience**            | Campfire must work first               | Return greeting, context-aware Jarvis, progress acknowledgment                     | Late-stage — depends on everything else. D7 retired (technical, not DECIDE).      |

### PROTOTYPE — iterative human + AI cycles

These aren't "build once and ship." They need multiple drafts, feel-testing, and refinement.

| Track                 | Who drives                     | How it works                                                                                                                                                                                                    | Can start when                                         |
| --------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Campfire story**    | Danvers authors, AI assists    | Danvers writes the story beats, dialogue arc, and emotional progression. AI helps draft specific dialogue, test branching, iterate. Multiple drafts. Feel-test with real conversations.                         | After D5 (story structure)                             |
| **Jarvis voice**      | Danvers preferred, Jess backup | AI drafts prompt from Agent - Jarvis card. Human tests against the agentic loop. Does it feel warm? Curious? Like a counselor? Iterate. Multiple rounds.                                                        | After D5 + D6. Draft possible now.                     |
| **Walk feel-test**    | AI builds, Danvers tests       | AI implements the viewport pan + campfire fade. Danvers tests: does it feel like a journey? Too fast? Too slow? Adjust timing, easing, fade curve.                                                              | After hex grid renders + D5                            |
| **Image gen prompts** | Danvers or Jess                | Experiment with Gemini + brand standards. Test styles. Find what "content-depicting diorama" looks like in generated art. Battle-harden prompts. If old image evolution prompts surface, use as starting point. | Now — doesn't block Release 1 but frontloads Release 2 |

---

## LIBRARY PATCHES

Some Context Library cards describe the full vision without acknowledging Release 1's intentional constraints. An AI builder reading these cards alone will overbuild. Each needs a Release 1 reality note.

| Card                             | Problem                      | Patch needed                                                                                                     | Status                                               |
| -------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `Structure - Hex Grid`           | Says "infinite canvas"       | Add reality note: "Release 1 uses a fixed ~30-40 position SVG grid. Infinite canvas deferred to Release 2."      | WHEN updated with D1+D3 History entries (2026-02-17) |
| `System - Onboarding`            | Describes Day 1/2/3 sequence | Add reality note: "Release 1 collapses to a single campfire conversation + walk. Multi-day sequencing deferred." | Pending                                              |
| `Standard - Onboarding Sequence` | References Mesa at campfire  | Update: Jarvis conducts onboarding, not Mesa. Mesa is reserve status.                                            | Pending                                              |

**Eliminated patch:** `Standard - Spatial Interaction Rules` — D1 resolved: manual placement from day one. The Standard is upheld as-is in R1. No override patch needed. (#612 closed.)

**These patches should be applied before AI starts building**, so context constellations assembled from the library give correct guidance.

---

## CONTEXT CONSTELLATIONS

For each MAKE track, a context constellation should be assembled before AI starts building. The constellation includes relevant library cards + release plan specs + any patches applied above.

| Build track          | Constellation cards                                                                                                                                    | Library sufficient?      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Hex grid geometry    | Structure - Hex Grid, Component - Hex Tile, Standard - Life Categories (for colors), Strategy - Spatial Visibility + this release plan (MVMap section) | Yes, after patches       |
| Agent cleanup        | Agent - Jarvis, Agent - Marvin, Agent - Mesa, Room - Council Chamber, Standard - Naming Architecture                                                   | Yes — strongest coverage |
| LiveStore hex events | Primitive - Project, Structure - Hex Grid, Standard - Dual Presence + this release plan (event schema)                                                 | Yes, with release plan   |
| First-run detection  | System - Onboarding, Component - Campfire, Standard - Onboarding Sequence, Journey - Builder Onboarding + this release plan                            | Yes, after patches       |
| Marvin prompt        | Agent - Marvin, Standard - Naming Architecture, Strategy - AI as Teammates, Principle - Earn Don't Interrogate                                         | Yes — strong voice spec  |

---

## SEQUENCING: HOW THIS FLOWS

No week estimates. Instead: a dependency chain showing what unlocks what.

```
IMMEDIATE (AI starts now)
├── MAKE: Hex grid geometry (longest pole — start first)
├── MAKE: Agent cleanup (partial — Mesa removal, Jarvis definition)
├── MAKE: LiveStore hex event scaffolding
├── MAKE: Naming audit (scope only)
├── MAKE: Marvin prompt draft
├── PATCH: 4 library cards get R1 reality notes
└── PROTOTYPE: Image gen experimentation (Release 2 frontload)

QUICK CALLS RESOLVED (D1-D4, 2026-02-17)
├── MAKE: Hex placement UX — tap/drag to place (D1: manual placement)
├── MAKE: Agent cleanup complete (D2: Jarvis overlay, D4: category agents removed)
├── MAKE: LiveStore hex event schema finalized (D3: one per hex, unique constraint)
└── MAKE: Map-project binding + hex click navigation

AFTER D5 (campfire story structure — the big one)
├── PROTOTYPE: Campfire story drafting begins
├── MAKE: Campfire UI architecture
├── PROTOTYPE: Jarvis campfire prompt drafting
└── MAKE: Walk trigger mechanism

AFTER D6 (assessment mechanics — flows from D5)
├── MAKE: Assessment framework in prompt
├── MAKE: Starting state extraction logic
└── PROTOTYPE: Jarvis voice iteration

AFTER D5+D6 (campfire experience resolved)
├── MAKE: Builder context LiveStore events + materializer (D7 retired — technical, resolved at MAKE)
├── MAKE: First-run detection flag wiring (D7 retired — technical, resolved at MAKE)
├── MAKE: Campfire-to-Marvin handoff
└── MAKE: Return experience (context injection, greeting)

AFTER CAMPFIRE WORKS END-TO-END
├── MAKE: Naming & copy pass (all vocabulary finalized)
├── PROTOTYPE: Walk animation feel-testing
├── PROTOTYPE: Full flow testing — campfire → walk → first project → first hex
└── Alpha testing with real people
```

---

## MILESTONES

**Milestone 1: "The Grid"**
Hex grid renders with sanctuary at center, campfire at edge. Jarvis responds in Council Chamber. Projects appear as hex tiles. Clicking a hex opens the project. The Table overlay works on the map.

**Milestone 2: "The Conversation"**
Jarvis campfire prompt produces emotionally resonant conversations. Assessment identifies starting state. Builder context persists. Handoff to Marvin carries the right data.

**Milestone 3: "The Walk"**
Full flow end-to-end: arrive at campfire → talk to Jarvis → walk to sanctuary → shape first project → place first hex → complete first task. Internal team walks through.

**Milestone 4: "The Return"**
Builder comes back. Map is there. Hex is there. Jarvis remembers. Table shows progress. Does it feel like coming home?

**Milestone 5: "The 72 Hours"**
Alpha testers. Real people. Full cycle. Measure: does the 72-hour win land?

---

## WHAT'S EXPLICITLY DEFERRED

### Deferred Map Features (Release 2)

| Feature                                | Why Deferred                                           |
| -------------------------------------- | ------------------------------------------------------ |
| Semantic zoom (Horizon/Working/Detail) | One zoom level is fine for early builders              |
| Infinite pan/scroll                    | Small fixed grid is sufficient for first months        |
| Drag-to-rearrange hexes                | Builder agency matters, but not before 5+ projects     |
| Frontier / grayed-out hexes            | Expansion metaphor needs more projects                 |
| Sanctuary structure evolution          | Humble Studio → Growing Workshop → Sanctuary is earned |
| Clustering / spatial analysis          | Needs many projects to surface patterns                |
| Smoke signals / health indicators      | Needs system primitives and recurring tasks            |

### Deferred Product Features (Release 2+)

| Feature                     | Why Deferred                                                  |
| --------------------------- | ------------------------------------------------------------- |
| Image generation on tiles   | Art makes the map beautiful, not functional                   |
| Image evolution stages      | Requires image pipeline                                       |
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

1. **Arrive at the campfire.** A fire in the wilderness, at the edge of a hex map. Jarvis is there. A warm, genuine conversation about who you are and what you need. Not a tutorial. Not a form. A conversation.

2. **Walk to the sanctuary.** Jarvis says: "There's a place nearby." You agree. The view pans across the hex grid. The campfire fades behind you. You arrive at the Humble Studio — small, warm, yours.

3. **Meet Marvin.** He's ready to work. "Jarvis told me about [the heavy thing]. Let's make it a project."

4. **Shape your first project.** Based on what Jarvis heard. Marvin helps plan it. Tasks get defined.

5. **Place your first hex.** Your project becomes a tile on the map. Category-colored. Named. Your first claimed territory.

6. **Do your first task.** Something real. Something that moves the needle on the thing that's been weighing on you.

7. **Come back tomorrow.** The map is there. Your hex is there. Jarvis remembers. The Table shows your progress. You're building something.

8. **Within 72 hours:** Point to something real. "That thing I told Jarvis about? It's being handled." Point to something on the map. "That's mine. I built that."

---

## RISKS

| Risk                                          | Mitigation                                                                                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D5 (story structure) takes too long to decide | AI builds everything else in parallel. Hex grid, agents, events, map integration — all unblocked. The campfire experience is the last thing assembled, not the first. |
| Hex grid takes longer than expected           | SVG keeps it simple. Scope to fixed grid. If needed, ship a very small grid (15-20 hexes).                                                                            |
| Campfire conversation doesn't feel magical    | Prototype track. Draft, test, iterate. The prompt is the soul — it can be revised independently of the UI.                                                            |
| Walk animation feels awkward                  | Keep it simple. Viewport pan, 2-3 seconds. The emotion comes from the conversation, not the animation.                                                                |
| Map feels empty for new builders              | Empty space is potential, not absence — but only if the aesthetic communicates that. Sanctuary at center + first hex is enough.                                       |
| Library cards mislead AI builder              | Apply patches first. Context constellations include release plan alongside library cards.                                                                             |

---

## BUILD REFERENCE

Detailed specs for each build item, referenced by AI builders during implementation.

### Hex Grid Foundation

**SVG hex grid renderer.** Fixed-size grid, roughly 30-40 hex positions. Offset coordinates (odd-q or even-q). SVG for simplicity, debuggability, and CSS integration.

**Sanctuary structure at center.** Distinct visual element — the Humble Studio. Warm, small, recognizable as "home." Clickable — opens Council Chamber.

**Campfire at the edge.** Only rendered for builders who haven't completed onboarding. Warm glow, fire aesthetic. Corner or edge of the grid.

**Builder-driven placement.** Builder places hex tiles manually via tap/drag (per D1 — algorithmic placement rejected). Category-colored borders per `Standard - Life Categories`. No auto-placement or suggested positions.

**Hex tile rendering.** Each occupied hex displays: project title (truncated), category color border, simple state indicator (planning/active/completed). All tiles same size per `Component - Hex Tile`.

**The Table overlay.** Existing Table component renders on top of the map view.

**Navigation.** Map becomes default route. Clicking hex opens `/projects/:id`. Nav to Drafting Room and Sorting Room still accessible.

**Responsive.** Desktop-first. Mobile falls back to existing card view.

### Agent Architecture Cleanup

Remove category room agents (Maya, Grace, Brooks, etc.) from `rooms.ts` and all references (per D4). Define Jarvis as overlay/drawer component accessible from the map (per D2 — no dedicated route). Remove Cameron/Devin references. Update Marvin's prompt to Builder vocabulary. Update room definitions to steward naming.

### LiveStore Hex Events

New event: `project.hexPlaced { projectId, q, r }`. One project per hex (per D3) — hex position is a unique constraint. Materializer updates project records with hex coordinates. Migration: existing projects need manual placement by builder (per D1 — no algorithmic placement).

### Builder Context Persistence

LiveStore event: `builder.onboardingCompleted { startingState, conversationSummary, firstProjectSeed, heavyThing }`. Materializer creates builder context record. Jarvis prompt receives this context on return visits. (D7 retired — storage mechanism is a technical decision resolved at MAKE, not a human DECIDE item. LiveStore events recommended in the original D7 framing and consistent with existing architecture.)

### First-Run Detection

Routing guard checks: does builder have `onboardingCompleted` event? If no → campfire view. If yes → map view. Campfire route inaccessible after onboarding.

### Map-Project Integration

Hex-project binding via `project.hexPlaced` events. Click hex → navigate to `/projects/:id`. Map replaces category cards as default route. New project creation → hex placement step after Drafting Room. Empty state: sanctuary + empty grid.

### The Campfire & Walk

**Campfire view.** Visually distinct — warm, fire-in-the-wilderness. Jarvis chat active with campfire prompt. First-run only.

**Conversation flow.** Per D5 (story structure). Branching for: eager builders, overwhelmed builders, skeptical builders, skip-the-story builders.

**Walk.** Viewport pans from campfire to sanctuary. Campfire fades. Arrival at Humble Studio. Marvin greets.

**Handoff.** Campfire output (starting state, heavy thing, first project seed) feeds Drafting Room. Builder shapes first project with Marvin. Places first hex.

### Return Experience

Jarvis greeting references prior context. Map shows builder's hex. Table shows project status. Progress acknowledged. First evidence of 72-hour win.
