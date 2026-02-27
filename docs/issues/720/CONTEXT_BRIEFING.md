# Context Briefing: Issue #720 — Sanctuary First Visit: Jarvis Guides Visioning and Charter Creation

**Classification:** Journey (Visioning journey) | New feature (shim)
**Assembled:** 2026-02-27 by Conan the Librarian

---

## Constellation

### Seed Cards

| Card                                                     | Role in This Issue                                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product/agents/Agent - Jarvis.md`                       | Jarvis is the agent who facilitates the Visioning conversation, creates the charter, and is implemented as an overlay on the Life Map (D2 decision). His voice, boundaries, and elicitation style define the conversation.                              |
| `product/artifacts/Artifact - The Charter.md`            | The charter is the output artifact — a living strategic document of the builder's values, themes, priorities, and constraints. Initial version created during onboarding. Builder owns it; Jarvis proposes, builder decides. No pre-populated defaults. |
| `experience/journeys/Journey - Sanctuary Progression.md` | The Sanctuary Progression journey frames this first visit as Phase 1 entry. The Visioning creates the charter that anchors all subsequent sanctuary development.                                                                                        |
| `experience/journeys/Journey - Builder Onboarding.md`    | The onboarding journey defines the campfire-to-sanctuary arc. This issue picks up after the campfire walk — the builder has arrived at the sanctuary and now Jarvis guides the Visioning. Day 2 in the onboarding sequence creates the initial charter. |

### Supporting Cards

| Card                                                         | Relevance                                                                                                                                                                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product/rooms/Room - Council Chamber.md`                    | The Council Chamber is Jarvis's home room and where the charter is maintained. D2 decision: R1 implements Jarvis as overlay panel/drawer on the map, not a dedicated route. No `/council-chamber` route in R1.                                  |
| `product/systems/System - Onboarding.md`                     | Defines the state machine: Day 1 (Orientation) -> Day 2 (Foundation, Charter creation) -> Day 3 (Momentum). This issue implements the Day 2 Foundation transition — charter draft created triggers transition to Day 3.                         |
| `rationale/standards/Standard - Onboarding Sequence.md`      | Day 2 spec: Jarvis introduction, Charter conversation (values and current focus captured), emotional target = "I have help."                                                                                                                    |
| `rationale/principles/Principle - Earn Don't Interrogate.md` | Governs how Jarvis acquires knowledge during the Visioning. Explicit conversational elicitation, not forms. Questions feel helpful, not invasive. Test: "Would the builder think 'why are you asking me this?' or 'that's a helpful question'?" |
| `rationale/principles/Principle - First 72 Hours.md`         | Day 2 goals: Jarvis introduction, initial Charter conversation, sense of "I have help." The charter conversation is the centerpiece of Day 2.                                                                                                   |
| `rationale/principles/Principle - Guide When Helpful.md`     | The nudge toward Workshop at conversation end follows this principle — guidance fires because behavior suggests the builder would benefit (hasn't visited Workshop yet), not on a schedule.                                                     |
| `experience/aesthetics/Aesthetic - Sanctuary.md`             | The Sanctuary should feel like "my place." Jarvis is present when the builder enters the sanctuary structure. Warm, not clinical. No guilt language. No notification counts.                                                                    |
| `product/components/Component - Campfire.md`                 | The campfire precedes this issue's scope. The campfire conversation produces a 6-field scorecard (D6 decision). The Visioning conversation in this issue could reference scorecard signals (valueSignals, capacitySignals) if available.        |
| `rationale/strategies/Strategy - AI as Teammates.md`         | Jarvis embodies the primary teammate relationship. Current maturity: Level 1 (operational team, reactive help). The Visioning is Jarvis's first real conversation with the builder.                                                             |
| `experience/loops/Loop - Sanctuary Walk.md`                  | After the charter exists, subsequent Sanctuary visits show the existing charter. The Sanctuary Walk loop describes the steady-state pattern this first visit establishes.                                                                       |
| `product/systems/System - Service Level Progression.md`      | Service level transitions from Level 0 to Level 1 during onboarding. The charter conversation feeds this progression.                                                                                                                           |

---

## Design Constraints from Context

1. **Jarvis voice:** Warm, thoughtful, elicits before offering perspective. Never prescribes. Frames adaptation as leadership, not failure. Asks questions that open up reflection. (Agent - Jarvis)

2. **Charter is builder's words:** No pre-populated defaults. The charter captures the builder's own articulation of what matters. Default values would be "someone else's words in the builder's mouth." (Artifact - The Charter, anti-example)

3. **Overlay, not route:** Jarvis is implemented as an overlay/drawer on the map in R1. No dedicated `/council-chamber` or `/sanctuary` route beyond whatever #710 establishes. (Agent - Jarvis, D2 decision; Room - Council Chamber, D2 decision)

4. **One-time flow:** The Visioning is a first-visit experience. Subsequent visits show the existing charter. The campfire was a threshold — this first Sanctuary visit is also a threshold that transitions to steady state. (Issue spec)

5. **Nudge, not force:** If the builder hasn't visited the Workshop, Jarvis nudges ("Marvin is over at the Workshop..."). This follows Guide When Helpful — guidance fires because behavior suggests benefit, not on a schedule. (Issue spec; Principle - Guide When Helpful)

6. **Shim prompt:** The conversation uses a generic coaching prompt, clearly marked as interim (`// SHIM: replace after P8 prototype`). The real Visioning script comes from prototype P8. (Issue spec)

7. **Earn Don't Interrogate:** The Visioning conversation elicits values through open questions and reflective listening, not through forms or structured fields. (Principle - Earn Don't Interrogate)

---

## Codebase Impact Assessment

### Existing Infrastructure

| File                                            | Current State                                                                                                                                          | Impact                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/rooms.ts`                  | Defines `StaticRoomDefinition`, existing rooms (Mesa, Marvin/Drafting, Cameron/Sorting, category agents, project agents). No Jarvis or Sanctuary room. | **Add** a Sanctuary/Jarvis room definition with shim prompt. Pattern: follow `DRAFTING_ROOM` or `LIFE_MAP_ROOM` structure. |
| `packages/web/src/hooks/useRoomAgent.ts`        | Auto-provisions worker when room opens if worker doesn't exist. Syncs worker config from room definition.                                              | **No change needed** — existing hook handles Jarvis worker creation automatically when Sanctuary room opens.               |
| `packages/web/src/hooks/useRoomChat.ts`         | Manages room chat conversations.                                                                                                                       | **No change needed** — reuse for Jarvis chat in Sanctuary overlay.                                                         |
| `packages/web/src/hooks/useRoomConversation.ts` | Manages room conversation lifecycle.                                                                                                                   | **No change needed** — reuse for Sanctuary conversation.                                                                   |
| `packages/shared/src/livestore/events.ts`       | Has `conversationCreated`, `conversationCreatedV2`, chat message events. No charter-specific events.                                                   | **Add** charter creation event (e.g., `charterCreated`). May need a `sanctuaryFirstVisitCompleted` flag event.             |
| `packages/shared/src/livestore/schema.ts`       | Has conversations and chatMessages tables. No charter table.                                                                                           | **Add** charter table/materializer. Add first-visit-completed flag (could be a user preferences field or dedicated table). |
| `packages/shared/src/livestore/queries.ts`      | Has conversation queries. No charter queries.                                                                                                          | **Add** charter query (get current charter for user). Add first-visit status query.                                        |

### New Components Needed

| Component                 | Purpose                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Sanctuary overlay content | Shows Jarvis chat on first visit, shows charter on subsequent visits. Blocked by #710 (Sanctuary overlay shell). |
| Charter display           | Renders the charter content within the Sanctuary overlay after creation.                                         |
| First-visit detection     | Logic to determine if this is the first Sanctuary visit (no charter exists yet).                                 |
| Workshop nudge            | Post-conversation message from Jarvis nudging toward Workshop if not yet visited.                                |

### Blocker

**Issue #710 (Sanctuary overlay shell)** must land first. It establishes:

- Sanctuary building click -> overlay at `/sanctuary`
- Jarvis auto-selected in Attendant Rail
- Standard building overlay frame from S7
- Jarvis's chat is functional with generic prompt

This issue (#720) then adds:

- First-visit detection and Visioning conversation flow
- Charter creation from conversation
- Charter display on subsequent visits
- Workshop nudge logic

---

## Key Questions for Implementation

1. **Charter data model:** What schema does the charter use? The context library says it contains values, themes, priorities, constraints, and commitments. For the shim, a single text blob (Jarvis's summary) may suffice, with structured fields deferred to post-P8.

2. **First-visit detection:** How to detect first visit? Options: (a) check if charter exists (no charter = first visit), (b) explicit `sanctuaryFirstVisitCompleted` flag event. Option (a) is simpler and sufficient for shim.

3. **Workshop visit tracking:** How to know if the builder has visited the Workshop? Need a mechanism to track room visits (may already exist via conversation history, or may need a lightweight visit-tracking event).

4. **Conversation-to-charter extraction:** How does the Visioning conversation produce a charter? Options: (a) Jarvis summarizes at end and creates charter via tool call, (b) builder manually confirms charter text, (c) Jarvis reflects understanding and builder confirms (mirrors D6 campfire scorecard pattern). For shim, option (a) is simplest.

---

## Provenance

| Card                                                         | Read | Included | Reason                             |
| ------------------------------------------------------------ | ---- | -------- | ---------------------------------- |
| `product/agents/Agent - Jarvis.md`                           | Full | Yes      | Primary agent for this feature     |
| `product/artifacts/Artifact - The Charter.md`                | Full | Yes      | Output artifact                    |
| `experience/journeys/Journey - Sanctuary Progression.md`     | Full | Yes      | Journey context                    |
| `experience/journeys/Journey - Builder Onboarding.md`        | Full | Yes      | Onboarding arc context             |
| `product/rooms/Room - Council Chamber.md`                    | Full | Yes      | Jarvis's room, D2 overlay decision |
| `product/systems/System - Onboarding.md`                     | Full | Yes      | State machine for onboarding       |
| `rationale/standards/Standard - Onboarding Sequence.md`      | Full | Yes      | Day 2 spec                         |
| `rationale/principles/Principle - Earn Don't Interrogate.md` | Full | Yes      | Governs conversation style         |
| `rationale/principles/Principle - First 72 Hours.md`         | Full | Yes      | Day 2 emotional target             |
| `rationale/principles/Principle - Guide When Helpful.md`     | Full | Yes      | Workshop nudge pattern             |
| `experience/aesthetics/Aesthetic - Sanctuary.md`             | Full | Yes      | Sanctuary feeling                  |
| `product/components/Component - Campfire.md`                 | Full | Yes      | Precursor context                  |
| `rationale/strategies/Strategy - AI as Teammates.md`         | Full | Yes      | Teammate relationship framing      |
| `experience/loops/Loop - Sanctuary Walk.md`                  | Full | Yes      | Steady-state context               |
| `product/systems/System - Service Level Progression.md`      | Full | Yes      | Level transition context           |
| `packages/shared/src/rooms.ts`                               | Full | Yes      | Codebase — room definitions        |
| `packages/web/src/hooks/useRoomAgent.ts`                     | Full | Yes      | Codebase — worker provisioning     |
| `packages/shared/src/livestore/events.ts`                    | Grep | Yes      | Codebase — event patterns          |
| `packages/shared/src/livestore/schema.ts`                    | Grep | Yes      | Codebase — table patterns          |
| `packages/shared/src/livestore/queries.ts`                   | Grep | Yes      | Codebase — query patterns          |
