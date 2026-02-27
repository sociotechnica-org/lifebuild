# Context Briefing: Issue #719 — Workshop First Visit: Marvin Greets and Guides Unburdening

**Classification:** Journey (Unburdening journey) | New feature (shim)
**Prepared:** 2026-02-27 | Conan the Librarian

---

## Constellation Map

### Seed Cards (primary context)

| Card | Role in This Issue |
|------|-------------------|
| `product/agents/Agent - Marvin.md` | Marvin's identity, voice, boundaries, and operational responsibilities. Defines how Marvin greets, guides project creation, and uses progressive capture. |
| `product/rooms/Room - Drafting Room.md` | The room where project creation happens. Issue #709 renames this to "Workshop" in the map-first UI. Entry points, entity type choice, Stage 1 quick capture. |
| `experience/journeys/Journey - Builder Onboarding.md` | The full onboarding arc from campfire to 72-hour win. Workshop first visit is the "Arrival" phase where the builder meets Marvin and shapes first projects. |
| `product/primitives/Primitive - Project.md` | Project primitive definition. Sketches created during Unburdening will be Stage 1 (Identified) projects with title, description, and category. |

### Expansion Cards (supporting context)

| Card | Relevance |
|------|-----------|
| `product/systems/System - Onboarding.md` | Orchestration system for the first 72 hours. Workshop first visit falls within Day 2-3 window. Marvin appears after Jarvis introduction. |
| `rationale/standards/Standard - Onboarding Sequence.md` | Day-by-day spec. Day 2 emotional target: "I have help." Day 2 introduces Marvin in Drafting Room for second project. Workshop first visit extends this. |
| `rationale/principles/Principle - First 72 Hours.md` | Governing principle. First impressions define the relationship. Workshop visit must create momentum without overwhelming. |
| `rationale/principles/Principle - Earn Don't Interrogate.md` | Marvin captures progressively, never blocks. During Unburdening, Marvin draws out projects through conversation, not forms. Stage 1 capture only (title, description, category). |
| `product/systems/System - Four-Stage Creation.md` | The creation process Marvin manages. Sketches are Stage 1 (Identified) projects. Unburdening should NOT push beyond Stage 1 for any single project. |
| `experience/journeys/Journey - Sanctuary Progression.md` | Broader progression context. Central structure evolves Humble Studio -> Growing Workshop -> The Sanctuary. The "Workshop" naming aligns with this progression. |
| `rationale/principles/Principle - Guide When Helpful.md` | All capabilities always available; active guidance follows demonstrated need. The first-visit greeting is an appropriate proactive guidance moment (First 72 Hours exception). |
| `product/systems/System - Progressive Knowledge Capture.md` | Extraction pipeline. Drafting Room touchpoint extracts per-project requirements, emotional charge, effort estimates. The Unburdening conversation is a capture moment. |
| `experience/aesthetics/Aesthetic - Sanctuary.md` | The Workshop should feel like a warm, purposeful space. Studio Ghibli workshop warmth. "This is home now. Modest, but mine." |
| `experience/aesthetics/Aesthetic - Clarity.md` | Target feeling after Unburdening: "I know what matters. This is doable." Multiple sketches visible = cognitive relief. |
| `rationale/principles/Principle - Familiarity Over Function.md` | Builder classifies work by how it feels, not objective criteria. During Unburdening, Marvin should not pre-classify projects. |
| `product/standards/Standard - Naming Architecture.md` | Builder (not user), Steward (not agent/assistant), Workshop (not Drafting Room in user-facing UI). |

---

## Key Design Decisions for This Issue

### 1. What is the Unburdening?

The Unburdening is a one-time first-visit conversation where Marvin draws out all the projects swirling in the builder's head. The metaphor: the builder arrives at the Workshop carrying the weight of everything they want to do, and Marvin helps them set it all down as sketches. This transforms mental burden into visible, manageable artifacts.

**From Journey - Builder Onboarding:** The Arrival phase target feeling is "This is home now. Modest, but mine." The builder meets Marvin, shapes first projects, and sees them appear as tangible artifacts.

**From Principle - Earn Don't Interrogate:** Marvin captures through conversation, not interrogation. The Unburdening should feel like a colleague asking "What's on your plate?" not a form demanding project specs. Each project captured at Stage 1 only (title, description, category). No objectives, no priority attributes, no task lists during Unburdening.

### 2. What are "project sketches"?

Sketches are Stage 1 (Identified) projects created via `projectCreated` events. They have:
- Title (from builder's description)
- Description (brief, from conversation)
- Life Category (one of eight)
- `projectLifecycleState.stage = 1`, `status = 'planning'`

They are NOT a new primitive. They use the existing Project primitive at its earliest lifecycle state. The term "sketch" is the user-facing name for a Stage 1 project within the Workshop.

### 3. Workshop vs. Drafting Room naming

Issue #709 establishes the Workshop as the map-first UI name for what the codebase currently calls the Drafting Room. The route will be `/workshop` (per #709). The context library cards still reference "Drafting Room" as the room concept. In code, the transition is in progress:
- Current route: `/drafting-room` (in `routes.ts`)
- Future route: `/workshop` (per #709)
- Room definition: `DRAFTING_ROOM` in `packages/shared/src/rooms.ts`
- Agent: Marvin, defined as `drafting-room-marvin` worker

### 4. Sanctuary nudge

From the issue: "if the builder hasn't visited the Sanctuary yet, Marvin nudges them." This maps to the Journey - Builder Onboarding flow where the Council Chamber (Jarvis's space, renamed Sanctuary in map-first UI) is the strategic conversation space. The nudge is Marvin saying something like "You might want to visit Jarvis at the Sanctuary to think about the bigger picture" -- connecting operational (Workshop/Marvin) to strategic (Sanctuary/Jarvis).

### 5. One-time flow detection

The Unburdening triggers only on first Workshop visit after onboarding. This requires:
- A flag or state tracking whether the builder has completed (or dismissed) the Unburdening
- Likely a LiveStore event (e.g., `workshopUnburdeningCompleted`) or a builder metadata field
- Subsequent visits show the normal Workshop view (Planning Queue with stage columns)

### 6. Shim prompt scope

The issue explicitly states this is an interim shim prompt. The real Unburdening script will be shaped via prototype P7. The shim should:
- Be clearly marked in code (`// SHIM: replace after P7 prototype`)
- Use Marvin's existing voice (precise, energetic, pro-social)
- Guide a multi-project capture conversation
- Create `projectCreated` events for each project described
- NOT attempt the full Four-Stage Creation flow for any project
- End with the Sanctuary nudge if applicable

---

## Codebase Impact

### Files likely modified

| File | Change |
|------|--------|
| `packages/shared/src/rooms.ts` | Add Workshop room definition or modify `DRAFTING_ROOM` with Unburdening shim prompt. May need a separate `WORKSHOP_UNBURDENING_PROMPT` constant. |
| `packages/web/src/constants/routes.ts` | Add `/workshop` route if not done by #709. |
| `packages/web/src/components/drafting-room/DraftingRoom.tsx` | Add first-visit detection and Unburdening conversation UI (or this may be a new Workshop component per #709). |
| `packages/shared/src/livestore/events.ts` | Potentially add `workshopUnburdeningCompleted` event for one-time flow tracking. |
| `packages/shared/src/schema.ts` | Materializer for the unburdening-completed flag if using LiveStore events. |

### Files likely read (dependencies)

| File | Why |
|------|-----|
| `packages/shared/src/rooms.ts` | Marvin's current prompt, room definition pattern, CHORUS_TAG navigation format. |
| `packages/web/src/components/drafting-room/DraftingRoom.tsx` | Current Drafting Room implementation, project creation flow, stage column rendering. |
| `packages/shared/src/livestore/events.ts` | `projectCreated` event schema for creating sketches. |
| `packages/web/src/Root.tsx` | Route registration pattern. |

### Architectural notes

- The conversation must round-trip through the AI backend. The existing room/worker pattern in `rooms.ts` handles this -- Marvin's prompt is injected into the room definition and the chat infrastructure handles the rest.
- Project creation during conversation requires Marvin's prompt to include tool-use instructions (creating projects via LiveStore events). The current `DRAFTING_ROOM_PROMPT` includes CHORUS_TAG navigation patterns but relies on the stage forms for actual project creation. The Unburdening shim may need the agent to create projects directly through the conversation, which would require server-side tool definitions.
- The "sketches visible within the Workshop overlay" requirement means the UI needs to show created projects inline, likely as a simple list/card view within the conversation or alongside it.

---

## Marvin's Voice (from Agent - Marvin card)

> Marvin is precise, energetic, and pro-social -- the master tactician who genuinely enjoys turning chaos into structure. He speaks in building and organizing language -- "Let's frame this out. What does done look like for you?"

For the Unburdening greeting, Marvin should:
- Welcome warmly but get to work quickly (he is a doer, not a philosopher)
- Ask what projects are on the builder's mind
- For each project mentioned, capture title + brief description + category
- Keep momentum: "Got it. What else?" not "Tell me more about this one"
- Signal when the builder seems done: "Feels like we've got the big ones down. Anything else hiding?"
- End with visible results: "Here's what we captured" + Sanctuary nudge if needed

---

## Provenance

| Card | Path | Read in Full |
|------|------|-------------|
| Agent - Marvin | `docs/context-library/product/agents/Agent - Marvin.md` | Yes |
| Room - Drafting Room | `docs/context-library/product/rooms/Room - Drafting Room.md` | Yes |
| Journey - Builder Onboarding | `docs/context-library/experience/journeys/Journey - Builder Onboarding.md` | Yes |
| Primitive - Project | `docs/context-library/product/primitives/Primitive - Project.md` | Yes |
| System - Onboarding | `docs/context-library/product/systems/System - Onboarding.md` | Yes |
| Standard - Onboarding Sequence | `docs/context-library/rationale/standards/Standard - Onboarding Sequence.md` | Yes |
| Principle - First 72 Hours | `docs/context-library/rationale/principles/Principle - First 72 Hours.md` | Yes |
| Principle - Earn Don't Interrogate | `docs/context-library/rationale/principles/Principle - Earn Don't Interrogate.md` | Yes |
| System - Four-Stage Creation | `docs/context-library/product/systems/System - Four-Stage Creation.md` | Yes |
| Journey - Sanctuary Progression | `docs/context-library/experience/journeys/Journey - Sanctuary Progression.md` | Yes |
| Principle - Guide When Helpful | `docs/context-library/rationale/principles/Principle - Guide When Helpful.md` | Yes |
| System - Progressive Knowledge Capture | `docs/context-library/product/systems/System - Progressive Knowledge Capture.md` | Yes |
| Aesthetic - Sanctuary | `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md` | Yes |
| Aesthetic - Clarity | `docs/context-library/experience/aesthetics/Aesthetic - Clarity.md` | Yes |
| Principle - Familiarity Over Function | `docs/context-library/rationale/principles/Principle - Familiarity Over Function.md` | Yes |
| Standard - Naming Architecture | `docs/context-library/product/standards/Standard - Naming Architecture.md` | Yes |

Codebase files examined: `packages/shared/src/rooms.ts`, `packages/web/src/components/drafting-room/DraftingRoom.tsx`, `packages/web/src/constants/routes.ts`, `packages/shared/src/livestore/events.ts` (grep).
