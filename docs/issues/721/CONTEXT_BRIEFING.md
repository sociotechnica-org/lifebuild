# Context Briefing

## Task Frame

**Task:** Wire up Marvin's chat auto-open on first project overlay open (onboarding Beat 3). Marvin greets the builder, acknowledges the specific project, observes user edits, and can create tasks on behalf. Shim prompt (interim). One-time auto-open; subsequent visits Marvin available but not auto-opened.
**Target type:** Journey (Builder Onboarding, first-project experience)
**Task type:** New feature (shim)
**Blocked by:** #708
**Constraints:**
- This is an interim shim. The real scripted first-project experience will be shaped via prototype later.
- Marvin auto-opens only on the builder's FIRST project overlay open. Subsequent opens keep Marvin available but not auto-opened.
- Marvin can CREATE tasks but NOT edit existing tasks.
- Marvin does NOT proactively suggest tasks without user action.
- The shim prompt must be clearly marked in code as interim (`// SHIM: replace after prototype`).
- The app must build and all tests pass.

**Acceptance criteria:**
1. First project overlay open triggers Marvin's chat auto-open
2. Marvin greets builder and acknowledges the specific project by name
3. Marvin can see the project's current tasks and offers to help refine them
4. When builder adds or edits tasks, Marvin observes and responds
5. Marvin can create tasks on the builder's behalf when asked
6. On subsequent project opens, Marvin is available but does not auto-open or re-deliver greeting
7. Conversation round-trips through AI backend with shim prompt including project context
8. Shim prompt clearly marked as interim in code

## Primary Cards (full content)

### Agent - Marvin

**Type:** Agent
**Relevance:** Marvin is the agent who greets the builder in the project overlay. His voice, boundaries, and operational domain define how this feature behaves. The shim prompt must stay within Marvin's character even in interim form.

# Agent - Marvin

## WHAT: Identity

The builder's Manager -- a steward who makes things real. When the builder decides something needs doing, Marvin helps plan it, scope it, break it into pieces that can actually get done. He bridges strategy into action: he drafts projects, prioritizes the work, and manages delegation. He operates across three rooms in the sanctuary structure, owning the entire operational cycle from idea capture through prioritization to team assignment. He's the master craftsman -- he doesn't decide what to build, but everything gets built well because he's managing the work.

## WHERE: Presence

- Home: Room - Drafting Room, Room - Sorting Room, Room - Roster Room
- Manages: System - Four-Stage Creation, Capability - Purpose Assignment, Capability - Three-Stream Filtering, Standard - Priority Score, Primitive - Task
- Coordinates with: Agent - Jarvis, Agent - Conan
- Implements: Principle - Earn Don't Interrogate, Principle - Familiarity Over Function

## WHY: Rationale

- Strategy: Strategy - Superior Process
- Principle: Principle - Earn Don't Interrogate -- captures progressively, never blocks
- Driver: Builders need an operational partner who can take strategic intent and turn it into organized, prioritized, delegated action.

## WHEN: Timeline

Build phase: MVP. Implementation status: Partial.
Reality note (2026-02-12): Marvin is fully active in the Drafting Room and Sorting Room with routable UIs, agent definitions in `rooms.ts`, prompts, and personalities. Guides four-stage project creation, task generation, and priority selection across Gold/Silver/Bronze streams.

## HOW: Behavior

**Voice:** Precise, energetic, and pro-social. The master tactician who genuinely enjoys turning chaos into structure. "Let's frame this out. What does done look like for you?" He is detail-oriented but never micromanaging; he respects the builder's autonomy above all. The math informs, the structure supports, but the builder decides.

**Boundaries:**
- Does NOT: Provide strategic life counsel or facilitate reflection sessions (Jarvis's domain)
- Does NOT: Maintain the Archives or manage historical data (Conan's domain)
- Does NOT: Override the builder's selections -- asks once if unusual, then respects the call

**Stage guidance (project creation):**
- Stage 1: Capture basics (title, description, category)
- Stage 2: Define scope (purpose, objectives, priority attributes)
- Stage 3: Draft tasks
- Stage 4: Place in Priority Queue

**Anti-Examples:**
- Builder asks "But is this really what I should be focusing on?" -- Marvin does NOT start facilitating strategic reflection. He notes the question, suggests a Council Chamber session, and pauses.
- Builder selects a low-scoring task as Gold -- Marvin does NOT say "That's a bad choice." He recommends, never overrides.

---

### Journey - Builder Onboarding

**Type:** Journey
**Relevance:** This issue implements part of the onboarding journey's "Arrival" and "First Project" phases. The journey defines the emotional targets, progression, and the moment Marvin is introduced.

# Journey - Builder Onboarding

## WHAT: The Arc

From campfire stranger to sanctuary resident -- the builder meets Jarvis at a fire in the wilderness, walks to the humble studio, meets Marvin, places their first hex, and achieves a meaningful win within 72 hours.

## WHERE: Ecosystem

- Spans: Component - Campfire, Zone - Life Map, Room - Council Chamber, Room - Drafting Room
- Agents: Agent - Jarvis (guides the walk), Agent - Marvin (shapes the first project)
- Systems: System - Onboarding, Standard - Onboarding Sequence
- Unlocks: Capability - Purpose Assignment, Overlay - The Table

## WHY: Purpose

- Strategy: Strategy - AI as Teammates -- the builder's first experience IS the teammate relationship
- Principle: Principle - First 72 Hours -- real progress within 72 hours or the builder is lost
- Principle: Principle - Earn Don't Interrogate -- Jarvis/Marvin elicit, never interrogate
- Driver: Must establish three things simultaneously: the relationship (builder trusts stewards), the starting state, and the first project.

## HOW: Progression

| Phase         | Entry Condition                  | Activities                                                                           | Target Feeling                               |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| The Meeting   | Builder opens app for first time | Jarvis introduces himself                                                            | "I'm intrigued."                             |
| The Walk      | Builder accepts invitation       | Jarvis asks "What's the heaviest thing you're carrying?" Surface starting state      | "Someone actually listened."                 |
| The Arrival   | Reach the studio                 | Meet Marvin; establish what we'll do together                                        | "This is home now."                          |
| First Project | Project shaped                   | Place first hex; begin executing first tasks                                         | "I did something real."                      |
| 72-Hour Win   | First tasks underway             | Achieve starting-state-appropriate win                                               | "This actually works."                       |

**Success Signals:**
- Builder returns to the app within 48 hours of first visit
- First project has at least one completed task within 72 hours
- Builder voluntarily engages with Marvin on task shaping (not just Jarvis)

**Failure Modes:**
- Jarvis overwhelms with philosophy, not enough doing
- No tangible output -- builder leaves with nothing on the map
- Stewards feel robotic -- onboarding is a values exchange, not a tutorial
- Forced self-disclosure

---

### System - Onboarding

**Type:** System
**Relevance:** This system orchestrates the first-project flow. Issue #721 implements a piece of it (the Marvin greeting and auto-open on Beat 3).

# System - Onboarding

## WHAT: Definition

The mechanism that implements the First 72 Hours principle -- guiding new builders through their initial experience, establishing the spatial metaphor, introducing the agent team, and creating early momentum.

## WHERE: Scope

- Implements: Principle - First 72 Hours
- Entry point: Component - Campfire
- Agents: Agent - Jarvis (first contact), Agent - Marvin (first projects)
- Creates: Artifact - The Charter

## WHY: Rationale

- Strategy: Strategy - AI as Teammates -- agents introduce themselves as teammates, not tools
- Principle: Principle - Earn Don't Interrogate -- progressive disclosure, not upfront forms

## WHEN: Timeline

Build phase: Post-MVP. Implementation status: Not started.
Reality note (2026-02-10): No onboarding system exists. New users land directly on the Life Map with no guided introduction.

## HOW: Mechanics

| From               | Trigger                                    | To                 | Side Effects                                                 |
| ------------------ | ------------------------------------------ | ------------------ | ------------------------------------------------------------ |
| Not Started        | Builder opens LifeBuild for the first time | Day 1: Orientation | Jarvis greets at Campfire                                    |
| Day 2: Foundation  | Charter draft created                      | Day 3: Momentum    | Marvin available for first project capture                   |
| Day 3: Momentum    | Builder created first project              | Complete           | Service Level transitions 0 to 1; full agent team available  |

Key design constraints: Progressive disclosure over three days. Circumstance-responsive, not fixed-sequence. Measure success by life improvement, not feature adoption. Warm, patient, encouraging tone throughout.

---

### Room - Drafting Room

**Type:** Room
**Relevance:** The Drafting Room is Marvin's home and where project creation/editing occurs. The project overlay uses its room definition pattern. The existing prompt, chat panel, and CHORUS_TAG navigation are implemented here.

# Room - Drafting Room

## WHAT: Definition

Marvin's dedicated space -- where builders create new projects and systems, guided through structured creation flows.

## WHERE: Ecosystem

- Zone: Zone - Strategy Studio
- Agent: Agent - Marvin
- Implements: System - Four-Stage Creation, Principle - Earn Don't Interrogate

## WHEN: Timeline

Build phase: MVP. Implementation status: Implemented.
Reality note (2026-02-10): Drafting Room exists at `/drafting-room` with Marvin agent active. Stages 1-3 have dedicated forms plus StageWizard. CHORUS_TAG navigation between stages implemented.

## HOW: Implementation

Entity type choice on first screen (Project or System) is upstream of Marvin conversation. Quick capture (Stage 1 only) is always available.

---

## Supporting Cards (summaries)

| Card | Type | Key Insight |
| --- | --- | --- |
| Principle - Earn Don't Interrogate | Principle | Knowledge acquisition must never block progress. Capture during natural workflows. Marvin should observe and earn knowledge, not demand upfront forms. Five elicitation strategies: explicit structured, explicit conversational, embedded extraction, behavioral inference, integration sourcing. |
| Principle - First 72 Hours | Principle | The first 72 hours define the relationship. Day 1: "I made something." Day 2: "I have help." Day 3: "I know what to do each week." Progressive disclosure -- features unlock as relevant. |
| Strategy - AI as Teammates | Strategy | Agents with defined roles, permissions, and coordination. Current state: Level 1 (Operational Team, reactive help). The builder's FIRST experience is the teammate relationship. |
| System - Four-Stage Creation | System | Progressive project development: Identify (30s), Scope (10min), Draft (30min), Prioritize (5min). Fully operational. Stage1Form, Stage2Form, Stage3Form, StageWizard. ProjectLifecycleState tracks stage 1-4. |
| Standard - Onboarding Sequence | Standard | Day-by-day first 72 hours spec. Day 1: Campfire + Life Map + project creation only. Day 2: Jarvis intro + Marvin in Drafting Room. Day 3: Sorting Room + Work at Hand. Progressive disclosure rules: features unlock as relevant, not all at once. |
| Capability - Purpose Assignment | Capability | Stage 2 moment when builder declares purpose (Maintenance/Building leverage/Moving forward) determining stream (Bronze/Silver/Gold). Subjective classification -- builder's relationship to the work is the only classification that matters. |
| Component - Campfire | Component | Temporary onboarding entry point. Not yet built. Produces 6-field scorecard via reflected extraction. |

## Relationship Map

- Journey - Builder Onboarding depends-on System - Onboarding (orchestrates the flow)
- Journey - Builder Onboarding depends-on Agent - Marvin (shapes first project, this issue's focus)
- Agent - Marvin implements Principle - Earn Don't Interrogate (progressive capture)
- Room - Drafting Room contains Agent - Marvin (home room)
- Room - Drafting Room implements System - Four-Stage Creation (project creation flow)
- System - Onboarding depends-on Principle - First 72 Hours (72-hour win target)
- Agent - Marvin manages Primitive - Task (can create tasks, relevant to issue scope)
- Agent - Marvin coordinates-with Agent - Jarvis (receives strategic direction)
- ProjectDetailPage depends-on RoomLayout (chat panel rendering)
- RoomLayout contains RoomChatPanel (the chat UI that must auto-open)
- useRoomChat depends-on useRoomConversation (provisions conversation for chat)
- useProjectChatLifecycle manages worker/conversation lifecycle for project rooms

## Codebase Impact Map

Key files that will be touched or referenced:

| File | Role | Impact |
| --- | --- | --- |
| `packages/web/src/components/projects/ProjectDetailPage.tsx` | Project overlay page | Add first-open detection, trigger auto-open of Marvin chat |
| `packages/web/src/components/layout/RoomLayout.tsx` | Chat panel container with toggle | Expose `openChat()` method, persist chat state. Already has `useRoomChatControl` context with `openChat`, `isChatOpen`, `sendDirectMessage` |
| `packages/web/src/components/room-chat/RoomChatPanel.tsx` | Chat panel UI | No changes expected -- receives messages and renders |
| `packages/web/src/hooks/useRoomChat.ts` | Chat hook with message sending | Has `sendDirectMessage` for programmatic message sending |
| `packages/web/src/hooks/useProjectChatLifecycle.ts` | Worker/conversation lifecycle for project rooms | May need to emit auto-greeting or trigger first-open logic |
| `packages/shared/src/rooms.ts` | Room and prompt definitions | Add shim prompt for project-room Marvin (currently uses generic `PROJECT_PROMPT_TEMPLATE`) |
| `packages/shared/src/livestore/events.ts` | Event definitions | May need event for tracking "first project open" state |
| `packages/shared/src/livestore/queries.ts` | Materialized view queries | May need query to check if builder has previously opened a project |

## Gap Manifest

| Dimension | Topic | Searched | Found | Recommendation |
| --- | --- | --- | --- | --- |
| HOW | "Beat 3" definition in code | yes | no | Beat 3 is not defined anywhere in the codebase. Issue #708 (blocked-by) likely introduces the onboarding beat system. Implementer should check #708 for beat tracking mechanism. |
| HOW | First-open tracking mechanism | yes | no | No onboarding state tracking exists in events or schema. Need to decide: localStorage flag vs. LiveStore event. LiveStore event is preferred for cross-device sync, but localStorage is simpler for a shim. |
| HOW | Marvin "observes" user edits pattern | yes | no | No reactive observation pattern exists. The project room currently has a generic guide prompt. Observation likely means: when tasks change, send a system-level context update to the conversation so Marvin's next response can reference what changed. This may require navigation context enrichment or a new event-driven mechanism. |
| WHERE | Project room prompt vs. Drafting Room prompt | yes | found | The project room uses `PROJECT_PROMPT_TEMPLATE` (generic guide), while the Drafting Room uses `DRAFTING_ROOM_PROMPT` (Marvin with full personality). The shim prompt for this issue should be a Marvin-voiced version of the project room prompt, not the Drafting Room prompt. |
| WHAT | Attendant Rail | yes | no | Issue mentions "Marvin is available in the Attendant Rail" on subsequent visits. No Attendant Rail component exists. Likely refers to the existing chat toggle button in `NewUiShell`. Implementer should treat "available but not auto-opened" as the existing chat toggle behavior. |

## Anti-Pattern Warnings

These anti-patterns from the context library are especially relevant to this task:

1. **From Principle - Earn Don't Interrogate:** "Blocking progress until profile is complete." The shim must NOT require any upfront information from the builder before Marvin can greet them. Marvin should use the project's existing context (name, description, tasks) to greet warmly.

2. **From Agent - Marvin:** "Marvin starts facilitating a strategic reflection session." If the builder asks strategic questions during the project overlay, Marvin should NOT engage in strategy. He should stay operational -- "Let's focus on shaping these tasks."

3. **From Journey - Builder Onboarding:** "The stewards feel robotic." The shim prompt must produce a warm, human greeting, not a formulaic "I see you have N tasks. Would you like help?" Marvin should feel like a colleague who just walked up to the whiteboard.

4. **From Standard - Onboarding Sequence:** "Full feature tour on Day 1." The auto-open should introduce Marvin and the project, not explain the entire system. One thing: "I'm here to help with this project."

5. **From System - Four-Stage Creation:** "Requiring all four stages in a single session." Marvin should help with tasks (Stage 3 territory) without forcing the builder through the full creation flow.
