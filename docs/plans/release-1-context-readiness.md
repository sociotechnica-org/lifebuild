# Release 1: Context Library Readiness Assessment

**Date:** 2026-02-14
**Assessor:** Conan the Librarian
**Question answered:** Does the Context Library contain enough guidance for an AI builder to build each Release 1 item correctly without human intervention?

**Important note:** This assessment evaluates the *Context Library* (`docs/context-library/`), not the release plan (`docs/plans/release-1-the-campfire.md`). The release plan is a separate document with implementation-level decisions that fill many gaps the library alone would leave. Where the release plan provides specifics the library lacks, that is noted.

---

## 1. Hex Grid SVG Renderer

**Readiness: YELLOW**

**Relevant cards:**
- `docs/context-library/product/structures/Structure - Hex Grid.md`
- `docs/context-library/product/components/Component - Hex Tile.md`
- `docs/context-library/rationale/standards/Standard - Visual Language.md`
- `docs/context-library/rationale/standards/Standard - Spatial Interaction Rules.md`
- `docs/context-library/rationale/standards/Standard - Life Categories.md`
- `docs/context-library/rationale/strategies/Strategy - Spatial Visibility.md`
- `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md`

**What the library covers well:**
- Why hexagons (tessellate without privileged axes, six equal neighbors)
- Category color mapping (8 categories, each with a specified color)
- Tile contents (title, category color border, state indicators)
- Tile sizing (all same size)
- Anti-patterns (no auto-arrangement, no snap-to-grid)
- State visual treatments (planning/live/completed saturation levels)
- The sanctuary structure at center concept
- The campfire at edge concept

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Hex grid size / dimensions | UNDOCUMENTED | Library says "infinite canvas." Release plan says "30-40 positions, fixed size." No card specifies the Release 1 constraint. | Builder would implement infinite canvas (wrong scope) |
| Hex coordinate system | UNDOCUMENTED | No specification of offset vs axial vs cube coordinates. Release plan says "offset coordinates (odd-q or even-q)." | Builder must choose coordinate system |
| Sanctuary structure visual design | THIN | Library says "evolving central structure" and "Humble Studio" but provides zero visual spec — no size relative to hexes, no shape, no SVG/CSS guidance. | Builder will invent a sanctuary visual |
| Campfire visual design | THIN | Library says "fire in the wilderness, warm glow" — purely evocative, no implementation spec | Builder will invent a campfire visual |
| SVG vs Canvas vs WebGL | UNDOCUMENTED | Library doesn't address rendering technology. Release plan specifies SVG. | Builder would need to choose rendering approach |
| Category territory layout algorithm | DECISION_NEEDED | Library says "builders place their own projects." Release plan says "initial placement can be algorithmic, 8 category zones radiating from center." These conflict — the release plan explicitly defers drag-to-rearrange but uses algorithmic placement, which the library card's anti-examples would prohibit. This tension needs resolution. | Builder doesn't know whether to auto-place or require manual placement |
| Hex spacing / padding / border width | UNDOCUMENTED | No specification of visual spacing between hexes, border thickness, or padding | Builder will guess visual treatment |
| Responsive behavior | UNDOCUMENTED | Library says nothing about viewport sizing. Release plan says desktop-only, mobile falls back to cards. | Builder might try to make it responsive |

**Bottom line:** The library provides strong conceptual framing for *why* hexagons and *what* they should convey, but is thin on *how* to render them. The release plan (`release-1-the-campfire.md`) fills most implementation gaps (SVG, offset coordinates, fixed grid size). An AI builder with both documents could build this; with only the library, they'd make wrong scope decisions (infinite canvas) and wrong interaction decisions (manual placement from day one).

---

## 2. Agent Architecture Cleanup (Mesa to Jarvis)

**Readiness: GREEN**

**Relevant cards:**
- `docs/context-library/product/agents/Agent - Mesa.md`
- `docs/context-library/product/agents/Agent - Jarvis.md`
- `docs/context-library/product/agents/Agent - Marvin.md`
- `docs/context-library/product/rooms/Room - Council Chamber.md`
- `docs/context-library/product/standards/Standard - Naming Architecture.md`
- `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md`

**What the library covers well:**
- Mesa's role and why it's being superseded (reserve status explicitly noted)
- Jarvis's full identity, responsibilities, voice, boundaries, examples, anti-examples
- Marvin's full identity (already implemented)
- Council Chamber room definition with clear purpose
- Naming architecture (Builder/Steward/Attendant hierarchy)
- The three-steward roster (Jarvis, Marvin, Conan) is clearly defined
- Reality notes identify exactly what exists in `rooms.ts` and what doesn't

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Jarvis UI presence pattern | DECISION_NEEDED | Library says Council Chamber is Jarvis's home. Release plan identifies 3 options (route, overlay, both) and recommends route. Library doesn't specify. | Builder needs to know if Council Chamber is a route or overlay |
| Cameron → Marvin in Sorting Room | UNDOCUMENTED | The existing `rooms.ts` has "Cameron" as the Sorting Room agent. Library says this should be Marvin. The cleanup scope is clear from reading both, but the library doesn't explicitly call out Cameron as stale. | Minor — builder can infer from library that Marvin owns Sorting Room |
| Category room agents (Maya, Grace, Brooks, etc.) | UNDOCUMENTED | 8 category-specific agents exist in `rooms.ts` that are not mentioned in any library card. Their fate in the cleanup is unspecified. | Builder doesn't know whether to keep, remove, or update these agents |

**Bottom line:** The library is thick enough. Agent identities, roles, voice, and boundaries are fully specified. Mesa's reserve status is explicit. Jarvis's card has implementation-grade detail. An AI builder can wire Jarvis into `rooms.ts`, add the Council Chamber route, and clean up Mesa references with high confidence. The one decision needed (route vs overlay) is a UI pattern choice the release plan addresses.

---

## 3. LiveStore Events for Hex Placement

**Readiness: YELLOW**

**Relevant cards:**
- `docs/context-library/product/primitives/Primitive - Project.md`
- `docs/context-library/product/structures/Structure - Hex Grid.md`
- `docs/context-library/rationale/standards/Standard - Spatial Interaction Rules.md`
- `docs/context-library/rationale/standards/Standard - Dual Presence.md`

**What the library covers well:**
- Projects live on hex tiles (clear from multiple cards)
- Spatial position carries builder-assigned meaning
- Position persists exactly as builder left it
- Projects require a Life Category
- Dual presence (hex tile + Table) is one object, two views

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Event schema for hex placement | UNDOCUMENTED | No library card specifies the event name, payload shape, or coordinate format. Release plan specifies `project.hexPlaced { projectId, q, r }`. | Builder must design event schema from scratch |
| Coordinate system (q, r) | UNDOCUMENTED | Library never mentions coordinate systems. Release plan specifies offset coordinates. | Builder must choose coordinate representation |
| Migration strategy for existing projects | UNDOCUMENTED | Library doesn't address how existing projects (no hex positions) get positions. Release plan says "algorithmic placement by category." | Builder doesn't know how to handle existing data |
| Materializer design | UNDOCUMENTED | No card specifies how hex coordinates integrate into the project table/materializer. The library's HOW sections don't go to schema level. | Builder must design the materializer update |
| Hex position uniqueness constraint | DECISION_NEEDED | Can two projects occupy the same hex? Library is silent. Release plan doesn't specify. | Builder must decide on uniqueness constraints |

**Bottom line:** The library provides the *why* (spatial position matters, builder controls placement) but none of the *how* for the data layer. The release plan fills the gap with `project.hexPlaced { projectId, q, r }` but doesn't fully specify the materializer or constraints. An AI builder with both documents could design a reasonable schema, but would need to make assumptions about uniqueness and migration details.

---

## 4. First-Run Detection Logic

**Readiness: YELLOW**

**Relevant cards:**
- `docs/context-library/product/systems/System - Onboarding.md`
- `docs/context-library/product/components/Component - Campfire.md`
- `docs/context-library/rationale/standards/Standard - Onboarding Sequence.md`
- `docs/context-library/rationale/principles/Principle - First 72 Hours.md`
- `docs/context-library/experience/journeys/Journey - Builder Onboarding.md`

**What the library covers well:**
- "Builder opens LifeBuild for the first time" is a clear trigger
- Campfire is temporary and disappears after walk
- Onboarding phases: Not Started -> Day 1 -> Day 2 -> Day 3 -> Complete
- Progressive disclosure rules (what's visible when)
- The campfire only appears for builders who haven't completed onboarding

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| First-run detection criteria | THIN | Library says "first time" but doesn't specify the technical signal. Release plan says "no projects, no campfire-completed flag." Library's onboarding system card says "onboarding phase" state but doesn't specify storage mechanism. | Builder doesn't know what to check |
| Campfire-completed flag persistence | UNDOCUMENTED | Where is this stored? LiveStore event? localStorage? A project attribute? Release plan says "onboardingCompleted flag persisted" but doesn't specify where. | Builder must choose persistence mechanism |
| Redirect routing mechanics | UNDOCUMENTED | How does the app route to campfire vs map? Is it a React guard? A route redirect? The library describes the conceptual flow but not the routing pattern. | Builder must design the routing logic |
| Graceful skip path | THIN | Release plan mentions "builder who wants to skip the story -> let them, graceful exit to Drafting Room." Library campfire card doesn't mention a skip path. | Builder doesn't know if skip is supported or how |

**Bottom line:** The library clearly establishes *what* first-run detection should accomplish (campfire for new builders, map for returning builders) but provides no implementation-level detail on *how* to detect, flag, or route. The release plan adds specifics (no projects + no flag = campfire) but still leaves storage mechanism undecided. An AI builder would build a reasonable detection system, but might choose the wrong persistence layer.

---

## 5. Builder Context Persistence

**Readiness: RED**

**Relevant cards:**
- `docs/context-library/experience/journeys/Journey - Builder Onboarding.md`
- `docs/context-library/product/agents/Agent - Jarvis.md`
- `docs/context-library/rationale/standards/Standard - Knowledge Framework.md`
- `docs/context-library/rationale/standards/Standard - Service Levels.md`
- `docs/context-library/experience/aesthetics/Aesthetic - Being Known.md`
- `docs/context-library/rationale/principles/Principle - Earn Don't Interrogate.md`

**What the library covers well:**
- Jarvis should remember past conversations (conceptually)
- Knowledge Framework defines 7 domains for builder knowledge
- Starting state (crisis/transition/growth) should be identified and stored
- Service Levels describe progressive knowledge depth
- Being Known aesthetic describes what good memory feels like
- Return greeting should reference prior context ("Last time you mentioned...")

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| What specifically to persist | THIN | Library lists 7 knowledge domains but doesn't specify the minimum viable subset for Release 1. Release plan says "starting state, campfire conversation summary, first project context." Library doesn't narrow to this scope. | Builder would either persist too much or too little |
| Storage mechanism | DECISION_NEEDED | Where does builder context live? LiveStore events? A separate builder profile table? A JSON blob? The Knowledge Framework card says "not started" with no storage spec. | Builder cannot implement persistence without this |
| Conversation summary format | UNDOCUMENTED | How is the campfire conversation summarized for Jarvis to reference later? LLM-generated summary? Key-value extraction? Raw transcript? No card addresses this. | Builder must invent the summarization approach |
| How Jarvis accesses persisted context | UNDOCUMENTED | Is it injected into the system prompt? Retrieved on demand? Part of the conversation history? Library says "conversation continuity — history preserved" but doesn't specify the mechanism. | Builder must design the context injection pattern |
| What "the heavy thing" data structure looks like | UNDOCUMENTED | The campfire conversation surfaces "the heavy thing" that becomes the first project. How is this structured data extracted from a natural conversation? | Builder must design the extraction pattern |

**Bottom line:** The library is aspirational about builder knowledge persistence but provides no implementation guidance. The Knowledge Framework is a future vision (7 domains, 6 service levels) — not a buildable spec for Release 1's modest needs (store starting state + conversation summary). The release plan identifies *what* to persist but not *how*. An AI builder would build the wrong thing — either a full knowledge framework (overbuilt) or an ad-hoc hack (underbuilt). A human needs to decide the storage mechanism and minimum viable schema.

---

## 6. Map-Project Binding

**Readiness: YELLOW**

**Relevant cards:**
- `docs/context-library/product/structures/Structure - Hex Grid.md`
- `docs/context-library/product/components/Component - Hex Tile.md`
- `docs/context-library/product/primitives/Primitive - Project.md`
- `docs/context-library/rationale/standards/Standard - Dual Presence.md`
- `docs/context-library/rationale/standards/Standard - Spatial Interaction Rules.md`
- `docs/context-library/rationale/standards/Standard - Life Categories.md`
- `docs/context-library/rationale/standards/Standard - Project States.md`

**What the library covers well:**
- Projects live on hex tiles (one project per tile, implied)
- Click hex -> opens Project Board overlay
- Category color borders on tiles
- State visual treatments (saturation levels for planning/live/completed)
- Tile contents (title, category color, progress indicator, state)
- Dual presence architecture (same object, two views)
- Categories determine spatial grouping

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Category territory layout | DECISION_NEEDED | Library says builders place their own projects and system never assigns locations. Release plan says "8 category zones radiating from center" with algorithmic initial placement. This is a deliberate Release 1 shortcut that contradicts the library principle. No card documents this compromise. | Builder follows library and requires manual placement (wrong for Release 1) |
| Hex-to-project data binding | UNDOCUMENTED | No card specifies how a project's hex position is stored, queried, or rendered. | Builder must design the binding layer |
| Migration for existing projects | UNDOCUMENTED | Existing projects have categories but no hex positions. Library doesn't address migration. Release plan says "algorithmic placement by category." | Builder doesn't know how to place existing projects |
| What happens when a hex is empty | THIN | Library mentions "empty hexes between clusters create breathing room." In Release 1 with a fixed grid, what do empty hexes look like? | Builder must design empty hex appearance |
| Click behavior specifics | THIN | Library says "Click -> opens Project Board overlay." Is this a route change (`/projects/:id`) or a real overlay on the map? Release plan says either. | Builder must choose interaction pattern |

**Bottom line:** The library covers the *what* of map-project relationships well (projects are tiles, categories determine grouping, dual presence). But the Release 1 compromise (algorithmic placement instead of builder-driven placement) is documented only in the release plan, and it contradicts library principles. An AI builder following only the library would build the wrong interaction model. With both documents, they can build it correctly but would need guidance on the territory layout algorithm.

---

## 7. Campfire Conversation (Onboarding Experience)

**Readiness: YELLOW**

**Relevant cards:**
- `docs/context-library/product/components/Component - Campfire.md`
- `docs/context-library/experience/journeys/Journey - Builder Onboarding.md`
- `docs/context-library/product/agents/Agent - Jarvis.md`
- `docs/context-library/product/systems/System - Onboarding.md`
- `docs/context-library/rationale/standards/Standard - Onboarding Sequence.md`
- `docs/context-library/rationale/principles/Principle - First 72 Hours.md`
- `docs/context-library/rationale/principles/Principle - Earn Don't Interrogate.md`
- `docs/context-library/experience/aesthetics/Aesthetic - Being Known.md`
- `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md`
- `docs/context-library/GDD-v0.2.md` (The Cultivation narrative)

**What the library covers well:**
- The 8-step campfire sequence (Campfire card)
- Jarvis's voice, boundaries, examples, anti-examples
- Starting state definitions (crisis/transition/growth)
- 10 persona archetypes mapping to 3 starting states (GDD)
- The "heavy thing" concept — what the first project seeds from
- Failure modes (overwhelming, robotic, forced self-disclosure)
- Anti-examples (skipping campfire, Mesa instead of Jarvis)
- Conversation branching concepts (release plan adds 4 branch types)
- 72-hour win definitions per starting state
- Elicitation philosophy (Earn Don't Interrogate)

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Actual prompt text for Jarvis campfire | UNDOCUMENTED | Library specifies voice and behavior but no actual system prompt. The PROMPT section says "not yet created." Release plan calls for this as a P4 deliverable. | Cannot build the conversation without a prompt |
| Assessment framework mechanics | DECISION_NEEDED | How does Jarvis determine crisis vs transition vs growth? Through conversational inference? Through explicit questions? Through a structured rubric the LLM applies? The library says "natural conversation, not quiz" but doesn't specify the mechanism. | Builder must design the assessment approach |
| Conversation structure (turns, length) | UNDOCUMENTED | How long is the campfire conversation? 5 turns? 20 turns? Is there a time target? Library doesn't specify. | Builder will guess conversation length |
| Handoff data format | UNDOCUMENTED | What data passes from the campfire conversation to Marvin for first project creation? How is "the heavy thing" structured as input to the Drafting Room? | Builder must design the handoff mechanism |
| Skip path design | THIN | Release plan mentions "builder who wants to skip -> graceful exit to Drafting Room." Library's campfire anti-examples say "skipping the campfire and dropping builders into an empty map" is wrong. These somewhat conflict. | Builder doesn't know how to handle skip |
| The Cultivation narrative text | THIN | GDD has the full narrative ("There is a tradition, older than anyone can trace..."). Should Jarvis actually speak this? Paraphrase it? How much of the lore goes into the conversation? | Builder must decide how much narrative to include |

**Bottom line:** The library provides strong conceptual and experiential guidance for the campfire conversation. Voice, philosophy, starting states, failure modes, and the 8-step sequence are all documented. But the *implementation* gap is significant: no actual prompt exists, no assessment rubric, no handoff format. An AI builder could write a reasonable Jarvis campfire prompt from the library cards, but would need to make assumptions about assessment mechanics, conversation length, and handoff structure. The prompt design (P4) is correctly identified as a dedicated project in the release plan.

---

## 8. Walk Animation (Campfire to Sanctuary Transition)

**Readiness: YELLOW**

**Relevant cards:**
- `docs/context-library/product/components/Component - Campfire.md`
- `docs/context-library/experience/journeys/Journey - Builder Onboarding.md`
- `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md`

**What the library covers well:**
- The walk is from campfire (edge) to sanctuary (center)
- The campfire fades when the builder walks away
- The campfire is permanent — once crossed, no going back
- The sanctuary is the destination (Humble Studio)
- "When the builder agrees, they walk together from the campfire to the studio"

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Animation duration | UNDOCUMENTED | How long does the walk take? Release plan says "a few seconds." Library says nothing. | Builder must guess timing |
| Animation technique | UNDOCUMENTED | Is this a camera pan? A path animation? A crossfade? Release plan says "camera/viewport pans from campfire at the edge to the sanctuary structure at the center." | Builder must choose animation approach |
| What triggers the walk | THIN | Library says "builder agrees to walk." Release plan says Jarvis issues an invitation and builder agrees. But mechanically — is it a button click? A chat response? An automatic trigger after a certain conversation state? | Builder must design the trigger mechanism |
| What happens during the walk | UNDOCUMENTED | Does the chat stay open? Does text appear? Is it silent? Does Jarvis speak during the walk? Library is completely silent on the walk's moment-to-moment experience. | Builder must design the walk's content |
| Campfire fade animation | UNDOCUMENTED | "The campfire fades" — how? Opacity transition? Shrink? Dissolve? Over what duration? | Builder must design the fade |
| Arrival moment | THIN | Library says "the builder sees the Humble Studio." Release plan adds "Marvin appears." But what exactly happens visually on arrival? Does the chat switch from Jarvis to Marvin? Does a new panel open? | Builder must design the arrival experience |

**Bottom line:** The library establishes the narrative arc of the walk (campfire -> sanctuary, temporary -> permanent, choosing to build) but provides zero implementation detail about the animation itself. This is expected — animation specs require visual design, timing, and technical decisions that conceptual cards don't typically contain. The release plan provides slightly more ("viewport pan, few seconds, campfire fades") but still leaves the builder designing the animation. An AI builder would produce something functional but unpolished. The emotional weight comes from the conversation that precedes the walk, so getting the animation "good enough" may be sufficient.

---

## 9. Image Generation Pipeline

**Readiness: RED**

**Relevant cards:**
- `docs/context-library/rationale/standards/Standard - Image Evolution.md`
- `docs/context-library/rationale/standards/Standard - Visual Language.md`
- `docs/context-library/product/components/Component - Hex Tile.md`

**What the library covers well:**
- Five illustration stages (Sketch -> Clean Pencils -> Inked -> Colored -> Finished)
- Content-depicting diorama-style illustrations (not abstract)
- Recognition function ("kitchen renovation shows kitchen elements")
- Stage-to-state mapping (which project states trigger which art stage)
- Anti-patterns (abstract patterns, wrong stage progression)

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Image generation technology | DECISION_NEEDED | Library doesn't mention any specific generation technology. Release plan says "Gemini-based." No API specs, model selection, or pipeline architecture. | Cannot begin experimentation without technology choice |
| Art style / aesthetic direction | DECISION_NEEDED | Library says "content-depicting diorama-style" and "Studio Ghibli workshop warmth" (GDD). But no reference images, no style transfer targets, no prompt templates. | AI builder cannot write generation prompts without art direction |
| Prompt patterns for generation | UNDOCUMENTED | How do you generate a "sketch of kitchen elements" vs a "colored kitchen diorama"? No prompt engineering guidance exists. | Builder must invent the prompt pipeline |
| Image dimensions / format | UNDOCUMENTED | What size? What format? How do images render inside hex tiles? PNG? SVG? What resolution? | Builder must decide all image pipeline details |
| Storage / caching | UNDOCUMENTED | Where are generated images stored? R2? Inline? Cached? Generated on demand or pre-generated? | Builder must design the storage layer |
| Cost / rate limiting | UNDOCUMENTED | Image generation has API costs. How many images per project? Per session? | Builder must design cost controls |

**Bottom line:** The library describes *what* the images should look like (five stages, content-depicting, recognizable) but has zero guidance on *how* to generate them. This is correctly deferred to Release 2+ in the release plan. An AI builder cannot meaningfully start this without decisions on technology, art direction, and prompt patterns. Experimentation is possible but would be unguided.

---

## 10. Steward Prompts (Jarvis voice, Marvin update)

**Readiness: YELLOW**

**Relevant cards:**
- `docs/context-library/product/agents/Agent - Jarvis.md`
- `docs/context-library/product/agents/Agent - Marvin.md`
- `docs/context-library/product/agents/Agent - Mesa.md`
- `docs/context-library/product/standards/Standard - Naming Architecture.md`
- `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md`
- `docs/context-library/rationale/principles/Principle - Earn Don't Interrogate.md`
- `docs/context-library/experience/aesthetics/Aesthetic - Being Known.md`
- `docs/context-library/experience/aesthetics/Aesthetic - Stewardship.md`
- `docs/context-library/GDD-v0.2.md` (Team Principles section)

**What the library covers well:**
- Jarvis voice: "warm and thoughtful, asks questions that open up reflection, quiet confidence"
- Jarvis boundaries: never prescribes, elicits and recommends, frames adaptation as leadership not failure
- Jarvis examples and anti-examples (4 total, implementation-grade)
- Marvin voice: "precise, energetic, pro-social, building and organizing language"
- Marvin boundaries: recommends never overrides, asks once if unusual then respects
- Marvin examples and anti-examples (6 total, implementation-grade)
- Naming hierarchy (Builder/Steward/Attendant with usage guidelines)
- Team principles (serve don't direct, curiosity over judgment, humility)
- Existing Marvin prompt in `rooms.ts` to compare against

**Gaps:**

| Gap | Type | What's Missing | What It Blocks |
|-----|------|---------------|----------------|
| Actual prompt text | UNDOCUMENTED | Both agent cards say "Prompt - [Name] - not yet created." Voice and behavior are described but not translated into system prompts. | Builder must write prompts from the voice/behavior descriptions |
| Prompt testing methodology | UNDOCUMENTED | Release plan calls for a "prompt testing harness." No card describes how to test whether a prompt produces the right voice. | Builder must design the testing approach |
| Context injection pattern | UNDOCUMENTED | What context does each prompt receive? Library lists "context required" (Charter, Agenda, history) but these artifacts don't exist yet. What's the minimum context for Release 1? | Builder must decide what context to inject |
| Tone calibration between agents | THIN | Library describes each agent's voice independently. No card addresses how Jarvis-warm and Marvin-energetic should feel as a coherent team. | Builder might create tonally inconsistent agents |
| Sanctuary vocabulary reference | THIN | The naming architecture specifies Builder/Steward/Attendant. But the full sanctuary vocabulary (territory, frontier, tending, etc.) is scattered across many cards with no consolidated reference. | Builder must grep across cards to assemble vocabulary |

**Bottom line:** The library is strong on voice specification — Jarvis and Marvin each have detailed voice descriptions, boundaries, examples, and anti-examples. An AI builder with good prompt engineering skills could write solid prompts from these cards. The gap is that no actual prompts exist, so this is a *writing* task, not a *lookup* task. The bigger risk is that the builder writes prompts that sound right individually but feel inconsistent as a team. The release plan correctly identifies this as a dedicated project (P4).

---

## SUMMARY: Decision Backlog

Every DECISION_NEEDED gap, sorted by how much build work it unblocks.

| # | Decision | Build Items Blocked | Priority |
|---|----------|-------------------|----------|
| 1 | **Builder context persistence mechanism** — Where does starting state, conversation summary, and first project context get stored? LiveStore events? Separate builder profile? JSON blob in existing project schema? | P5 (Builder Context Persistence), P6 (Campfire — needs to know where to write), P8 (Return Experience — needs to know where to read) | CRITICAL — blocks 3 projects |
| 2 | **Category territory layout algorithm** — How are 8 category zones arranged around the center? What specific hex positions map to which categories? Release plan says "algorithmic, radiating from center" but the library says "builder places, system never assigns." This Release 1 compromise needs explicit specification. | P1 (Hex Grid), P5 (Map-Project Integration), P6 (Campfire — first hex placement) | CRITICAL — blocks 3 projects |
| 3 | **Assessment framework mechanics** — How does Jarvis determine crisis/transition/growth? Conversational inference with structured rubric? LLM classification? Explicit builder choice masked as conversation? | P3 (Builder Assessment Model), P4 (Campfire Prompt), P6 (Campfire conversation) | HIGH — blocks 3 projects |
| 4 | **Jarvis UI presence pattern** — Is Council Chamber a route (`/council-chamber`), an overlay/drawer on the map, or both? | P2 (Agent Architecture), P6 (Campfire — where does Jarvis live after campfire is gone?) | MEDIUM — blocks 2 projects |
| 5 | **Hex position uniqueness constraint** — Can two projects occupy the same hex position? Or is each hex exclusive to one project? | P3 (LiveStore Events), P5 (Map-Project Integration) | MEDIUM — blocks 2 projects |
| 6 | **Category room agents fate** — 8 category-specific agents (Maya, Grace, Brooks, etc.) exist in `rooms.ts`. Keep, remove, or update them? They aren't part of the steward model. | P2 (Agent Architecture Cleanup) | LOW — blocks 1 project |
| 7 | **Image generation technology and art direction** — Gemini? Style references? Prompt patterns? | P9 (Image Generation — Release 2) | LOW (Release 2) — but experimentation could start if decided |

### UNDOCUMENTED Items Needing Documentation (not decisions, just capture)

These are items where someone likely knows the answer but it hasn't been written down:

1. **Campfire-completed flag storage mechanism** (LiveStore event? localStorage?)
2. **Conversation-to-context summarization approach** (LLM summary? key-value extraction?)
3. **Campfire-to-Marvin handoff data format** (what data passes between agents?)
4. **Hex coordinate system** (offset odd-q specified in release plan but not in library)
5. **Walk animation timing and technique** (viewport pan, ~3 seconds per release plan)
6. **Sanctuary structure visual spec** (no design exists for the Humble Studio visual)
7. **Campfire visual spec** (no design exists for the campfire element)
8. **Prompt testing harness design** (how to test steward prompts before wiring them in)

### Cards That Need Release 1-Specific Updates

The following library cards describe the *full vision* but don't acknowledge the Release 1 scope constraints. An AI builder reading these cards would overbuild:

1. **Structure - Hex Grid** — says "infinite canvas" when Release 1 is fixed 30-40 positions
2. **Standard - Spatial Interaction Rules** — says "builders place their own projects" when Release 1 uses algorithmic placement
3. **System - Onboarding** — describes Day 1/2/3 sequence when Release 1 collapses this to a single campfire conversation
4. **Standard - Onboarding Sequence** — describes Mesa at campfire when Release 1 uses Jarvis

These cards should either get reality notes acknowledging the Release 1 scope, or a "Release 1 subset" section that clarifies what's in scope now vs later.
