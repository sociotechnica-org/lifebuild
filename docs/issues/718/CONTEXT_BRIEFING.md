# Context Briefing: Issue #718

## Campfire conversation: Jarvis guides first project creation

**Assembled by:** Conan the Librarian
**Date:** 2026-02-27
**Classification:** Journey (Builder Onboarding) | New feature (shim)

---

## Constellation

### Seed Cards

| Card | Type | Relevance |
|------|------|-----------|
| Journey - Builder Onboarding | Journey | Primary journey this issue implements (Beat 1) |
| Component - Campfire | Component | The spatial context where the conversation occurs |
| Agent - Jarvis | Agent | The agent conducting the campfire conversation |
| System - Onboarding | System | The state machine orchestrating the onboarding flow |

### Expansion Cards (Journey Profile)

| Card | Type | Why Included |
|------|------|--------------|
| Release - The Map-first UI | Release | Defines the 5-beat onboarding sequence this issue implements Beat 1 of |
| Release - The Campfire | Release | Full vision for Campfire release; milestones, features, success criteria |
| Standard - Onboarding Sequence | Standard | Day-by-day specification; progressive disclosure rules |
| Principle - First 72 Hours | Principle | Governing principle for onboarding design |
| Principle - Earn Don't Interrogate | Principle | Governs how Jarvis acquires knowledge during conversation |
| Principle - Agreement Over Expectation | Principle | Me/You/Us framework for the campfire conversation arc |
| Strategy - AI as Teammates | Strategy | Strategic bet; first impression IS the teammate relationship |
| Aesthetic - Being Known | Aesthetic | Target feeling: "my counselor gets me" |

### Codebase Impact Cards

| Card | Type | Why Included |
|------|------|--------------|
| CONVENTIONS.md | Reference | Room-scoped agents pattern, event sourcing conventions, CHORUS_TAG |
| `packages/shared/src/rooms.ts` | Code | Room/worker definitions; no Jarvis room exists yet |
| `packages/web/src/components/room-chat/` | Code | Existing chat UI infrastructure (RoomChatPanel, RoomChatInput, RoomChatMessageList) |
| `packages/web/src/hooks/useRoomChat.ts` | Code | Chat hook: message sending, conversation management |
| `packages/web/src/hooks/useRoomAgent.ts` | Code | Agent provisioning hook: creates workers on demand |
| `packages/server/src/services/event-processor.ts` | Code | Server-side message processing and AI round-trip |
| `packages/server/src/services/pi/prompts.ts` | Code | System prompt construction; shim prompt goes here |
| `packages/server/src/services/pi/tools.ts` | Code | Tool wiring; agents use `create_project` and `create_task` tools |
| `packages/server/src/tools/projects.ts` | Code | Project creation tool implementation |
| `packages/server/src/tools/tasks.ts` | Code | Task creation tool implementation |
| `packages/shared/src/livestore/events.ts` | Code | `v2.ProjectCreated`, `v2.TaskCreated` events |

---

## Issue Summary

Jarvis meets the builder at the campfire, welcomes them, learns about their first project, and creates it with starter tasks. This is Beat 1 of the onboarding sequence defined in the Map-first UI release. The conversation drives through Jarvis's AI backend (not hardcoded), uses a shim prompt (interim, clearly marked), and triggers the transition to Beat 2 (the Reveal). The chat UI appears in a temporary position because the Attendant Rail is hidden during Beat 1.

**Blocked by:** #713 (Onboarding sequence -- the mechanical beat structure, fog-of-war, state persistence).

---

## Design Intent

### What the Campfire Conversation Must Accomplish

From **Journey - Builder Onboarding**, the campfire establishes three things simultaneously:

1. **The relationship** -- builder trusts Jarvis (target feeling: "I'm intrigued. These people are different.")
2. **The starting state** -- crisis / transition / growth identification
3. **The first project** -- the "heavy thing" becomes the 72-hour win

### Conversational Posture Sequence

From **Component - Campfire** and **Principle - Agreement Over Expectation**, the full vision follows an MI posture sequence mapped to a relational arc:

| Phase | MI Posture | Relational Zone | What Happens |
|-------|-----------|-----------------|--------------|
| 1 | Engaging | Me (LifeBuild shares) | Jarvis introduces himself, explains the tradition |
| 2 | Focusing | You (builder shares) | "What brought you here? What's the heaviest thing?" |
| 3 | Evoking | You to Us | Identify starting state, draw out builder's motivations |
| 4 | Planning | Us (agreement) | Invite the walk; reflect back understanding |

**SHIM NOTE:** Issue #718 explicitly states this is an interim experience. The real scripted conversation will be shaped via prototype P6 and refined in a follow-up. The goal is to wire up the mechanics end-to-end: chat UI -> AI conversation -> project creation -> Beat 2 trigger.

### Scorecard Output (D6 Resolution)

The full campfire vision produces a 6-field scorecard via reflected extraction:
- `startingState` -- crisis / transition / growth
- `heavyThing` -- what's weighing on the builder
- `firstProjectSeed` -- name and shape of the first project
- `allianceAgreement` -- what we'll do together
- `capacitySignals` -- how much bandwidth the builder has
- `valueSignals` -- what matters to the builder

**SHIM NOTE:** The shim implementation likely captures only `firstProjectSeed` (project name + description + sample tasks). Full scorecard extraction is post-P6.

---

## Governing Principles

### Principle - First 72 Hours
> The first 72 hours define the relationship. Get this right and builders understand what LifeBuild is; get it wrong and they never return.

Day 1 emotional target: **"I made something."** Only Campfire, Life Map basics, and project creation should be available. The Table, Sorting Room, and full agent capabilities must be hidden.

### Principle - Earn Don't Interrogate
> Knowledge acquisition must never block progress, must feel helpful rather than invasive.

Jarvis asks open questions in context, never demands information before providing value. The campfire IS the first moment of value (the builder feels heard).

### Principle - Agreement Over Expectation
> Before working together, both parties establish what they bring, what they need, and how they'll collaborate.

The Me/You/Us framework: Jarvis shares who he is before asking the builder to share anything. Trust is offered before it is requested.

### Jarvis Voice (from Agent - Jarvis)
> Warm and thoughtful, the advisor who knows the builder deeply and earns trust through genuine curiosity rather than interrogation. He frames adaptation as leadership, not failure. Jarvis elicits the builder's own thinking before offering perspective.

**Boundaries:** Jarvis does NOT make decisions for the builder, does NOT execute tasks directly, does NOT compute priority scores. He elicits and recommends, never prescribes.

---

## Codebase Reality

### What Exists

1. **Chat UI infrastructure** -- `RoomChatPanel`, `RoomChatInput`, `RoomChatMessageList` in `packages/web/src/components/room-chat/` provide a working chat panel with message rendering, scroll-to-bottom, read-only mode, and status messages.

2. **Room-scoped agent pattern** -- `useRoomChat` hook manages conversations per room. `useRoomAgent` provisions workers (agents) on demand. Both expect a `StaticRoomDefinition`.

3. **Server-side AI round-trip** -- `EventProcessor` in `packages/server/src/services/event-processor.ts` listens for `chatMessageSent` events, routes to the correct worker, processes through the AI model (pi-coding-agent), and commits assistant responses back as events.

4. **Agent tools** -- Agents already have `create_project` and `create_task` tools available via `packages/server/src/tools/`. These emit `v2.ProjectCreated` and `v2.TaskCreated` LiveStore events.

5. **System prompt construction** -- `buildSystemPrompt` in `packages/server/src/services/pi/prompts.ts` constructs prompts from room/worker definitions. Current prompts are generic consultancy language (legacy).

### What Does NOT Exist

1. **No Jarvis agent definition** -- No Jarvis entry in `packages/shared/src/rooms.ts`. No campfire room definition. These need to be created.

2. **No onboarding state machine** -- No beat tracking, no onboarding phase persistence. Blocked by #713 which builds the mechanical sequence.

3. **No campfire UI** -- No campfire component, no temporary chat position, no Attendant Rail hide/show logic.

4. **No shim prompt** -- The Jarvis campfire prompt needs to be written (marked as interim).

5. **No Beat 2 trigger** -- No mechanism to detect "project created during onboarding" and trigger the Reveal transition.

### Key Implementation Patterns

From `CONVENTIONS.md`:
- **Room = Screen + Agent** -- Every navigable screen has a paired AI agent via `RoomLayout`. The campfire needs a room definition even if temporary.
- **Event sourcing** -- All state changes are events. Project creation during campfire uses existing `v2.ProjectCreated` and `v2.TaskCreated` events.
- **CHORUS_TAG for navigation** -- Agents emit `<CHORUS_TAG path="type:id">text</CHORUS_TAG>` for navigation. Relevant if Jarvis needs to link to the newly created project.
- **Room IDs** -- Static rooms use `kebab-case` (e.g., `campfire` or `campfire-onboarding`).

---

## Architecture Decisions Relevant to This Issue

### Chat UI Position During Beat 1
The Attendant Rail is hidden during Beat 1 (from Release - The Map-first UI, Beat 1 spec). The chat must appear in "a temporary position" -- same physical location as where the Attendant Rail will appear, leaving space for the rail's future reveal. This means the chat panel renders independently of the Attendant Rail component during onboarding.

### Shim Prompt Strategy
The shim prompt should:
- Be clearly marked in code (`// SHIM: replace after P6 prototype`)
- Follow Jarvis's voice characteristics (warm, curious, eliciting)
- Guide the builder to name a project and describe what it's about
- Use `create_project` and `create_task` tools to create 3-5 sample tasks
- NOT attempt the full MI posture sequence or scorecard extraction (that's P6 work)

### Beat 2 Trigger Mechanism
When Jarvis creates a project via the `create_project` tool during the campfire conversation, this event must be detectable by the onboarding state machine (from #713) to trigger the transition to Beat 2. The detection could be:
- A query watching for projects created during onboarding phase
- An explicit onboarding event emitted alongside project creation
- A state check in the onboarding orchestrator after each tool execution

---

## Anti-Patterns to Avoid

From **Journey - Builder Onboarding**:
- **Jarvis overwhelms** -- too much philosophy, not enough doing. The walk should feel like a conversation, not a lecture.
- **No tangible output** -- if the builder leaves onboarding with nothing on the map, the 72-hour clock is already losing.
- **The stewards feel robotic** -- the onboarding is a values exchange, not a tutorial. If Jarvis sounds like a chatbot, the whole conceit fails.
- **Forced self-disclosure** -- Jarvis asks open questions but never pushes. If the builder doesn't want to share, Jarvis pivots gracefully.

From **Component - Campfire**:
- **Skipping the campfire** -- dropping builders into an empty map without the values exchange.

From **Principle - Earn Don't Interrogate**:
- **Blocking progress until profile is complete** -- knowledge acquisition must never block progress.

From **Aesthetic - Being Known** (anti-patterns for the shim to be aware of):
- **Generic advice that could apply to anyone** -- even the shim should feel somewhat personalized.
- **Robotic or formulaic tone** -- stewards must sound like people, not chatbots with context injection.

---

## Dependencies and Sequencing

```
#707 (Hex map base layer)
#708 (Building overlays)     --> #713 (Onboarding sequence) --> #718 (THIS: Campfire conversation)
#709 (Fog-of-war)
#710 (Attendant sprites)
```

Issue #718 specifically requires from #713:
- Onboarding state persistence (beat tracking)
- Beat 1 UI state (fog-of-war active, Attendant Rail hidden, campfire visible)
- Beat 2 transition trigger mechanism

---

## Files Likely Touched

| File | Change |
|------|--------|
| `packages/shared/src/rooms.ts` | Add Jarvis campfire room definition with shim prompt |
| `packages/server/src/services/pi/prompts.ts` | Add campfire-specific prompt construction (or use room definition prompt) |
| `packages/web/src/components/` (new) | Campfire chat UI component in temporary position |
| `packages/web/src/hooks/` (new or modified) | Hook to manage campfire conversation lifecycle |
| `packages/shared/src/livestore/events.ts` | Potentially: onboarding beat transition event |
| `packages/shared/src/livestore/schema.ts` | Potentially: onboarding state materializer |
| `packages/web/src/components/hex-map/` | Integration point: campfire on map, Beat 2 trigger |

---

## Provenance

All cards read in full before inclusion. No content fabricated. Sources directory excluded per protocol.

| Card | Path | Read |
|------|------|------|
| Agent - Jarvis | `docs/context-library/product/agents/Agent - Jarvis.md` | Full |
| Component - Campfire | `docs/context-library/product/components/Component - Campfire.md` | Full |
| Journey - Builder Onboarding | `docs/context-library/experience/journeys/Journey - Builder Onboarding.md` | Full |
| System - Onboarding | `docs/context-library/product/systems/System - Onboarding.md` | Full |
| Standard - Onboarding Sequence | `docs/context-library/rationale/standards/Standard - Onboarding Sequence.md` | Full |
| Principle - First 72 Hours | `docs/context-library/rationale/principles/Principle - First 72 Hours.md` | Full |
| Principle - Earn Don't Interrogate | `docs/context-library/rationale/principles/Principle - Earn Don't Interrogate.md` | Full |
| Principle - Agreement Over Expectation | `docs/context-library/rationale/principles/Principle - Agreement Over Expectation.md` | Full |
| Strategy - AI as Teammates | `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md` | Full |
| Aesthetic - Being Known | `docs/context-library/experience/aesthetics/Aesthetic - Being Known.md` | Full |
| Release - The Map-first UI | `docs/context-library/releases/Release - The Map-first UI.md` | Full |
| Release - The Campfire | `docs/context-library/releases/Release - The Campfire.md` | Full |
| CONVENTIONS.md | `docs/context-library/CONVENTIONS.md` | Full |
