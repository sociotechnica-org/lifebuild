# Context Briefing: #710 -- Sanctuary Overlay Shell

## Task Frame

**Task:** Create the Sanctuary building overlay at `/sanctuary`. This is a placeholder shell for the charter/visioning experience with Jarvis. Clicking the Sanctuary building on the map opens a centered overlay panel using the standard building overlay frame (from #705). Jarvis is auto-selected in the Attendant Rail when the overlay opens. The charter editing experience is deferred to a later story.

**Target type:** Room (Sanctuary)

**Task type:** New feature (shell)

**Blocked by:** #705 (Building overlay pattern and routing)

**Constraints:**
- Must use the standard building overlay frame component from #705
- Jarvis auto-selected in Attendant Rail when Sanctuary overlay opens
- Overlay must be URL-addressable at `/sanctuary`
- Browser back button closes overlay and returns to bare map
- Escape key closes overlay
- Only one overlay open at a time (shared constraint with all building overlays)
- Content is placeholder only -- no charter editing, no visioning conversation flow

**Acceptance criteria:**
- Clicking the Sanctuary building on the map opens the Sanctuary overlay at `/sanctuary`
- The overlay displays a placeholder for the charter/visioning experience
- Jarvis is auto-selected in the Attendant Rail when the Sanctuary overlay opens
- Jarvis's chat is functional (generic welcoming/coaching prompt)
- The overlay uses the standard building overlay frame from #705
- The app builds and all tests pass

## Primary Cards (full content)

### Agent - Jarvis

**Type:** Agent
**Relevance:** Jarvis is the resident agent of the Sanctuary. He is auto-selected in the Attendant Rail when the overlay opens and will eventually guide the charter/visioning experience.

#### WHAT: Identity

The builder's Counselor -- a steward whose counsel you seek before making decisions. Not in the therapy sense. In the oldest sense: the person who sits with you and helps you see what you're not seeing. Jarvis facilitates strategic conversations, conducts onboarding at the Campfire, maintains the builder's Charter, and coordinates knowledge-gathering across the steward team. He holds the long view. He asks the questions that matter. Jarvis never prescribes -- he always elicits and recommends.

#### WHERE: Presence

- Home: Room - Council Chamber (future dedicated space)
- Appears in: Zone - Life Map (available for strategic questions); Room - Sorting Room (when priority decisions have strategic implications)
- Manages: Artifact - The Charter (living strategic document); Artifact - The Agenda (session structure); Standard - Knowledge Framework
- Coordinates with: Agent - Conan (receives historical patterns); Agent - Marvin (provides strategic context); Agent - Mesa (receives routed questions)
- Implements: Strategy - AI as Teammates; Principle - Earn Don't Interrogate; Principle - First 72 Hours

#### WHY: Rationale

- Strategy: AI as Teammates -- Jarvis embodies the teammate relationship
- Principle: Plans Are Hypotheses -- tone never implies failure for adaptation
- Driver: Builders need a strategic counsel who knows them deeply. Jarvis is the primary relationship -- the agent who understands the whole picture.

#### WHEN: Timeline

Build phase: Post-MVP. Implementation status: Not started.
Reality note (2026-02-17): Jarvis does not exist in the codebase yet. D2 resolved: R1 will implement Jarvis as an overlay/drawer on the map (no dedicated route). Depends on campfire story decisions (D5) for initial prompt design. Charter and Agenda artifacts remain unbuilt.

#### HOW: Behavior

**Voice:** Warm and thoughtful, the advisor who knows the builder deeply and earns trust through genuine curiosity rather than interrogation. He frames adaptation as leadership, not failure. Jarvis elicits the builder's own thinking before offering perspective, asks questions that open up reflection, and speaks with the quiet confidence of someone who has been paying attention for a long time.

**Boundaries:**
- Does NOT make decisions for the builder -- elicits and recommends, never prescribes
- Does NOT execute tasks, assign attendants, or manage operational details
- Hands off to Marvin when strategic direction needs operational implementation
- Hands off to Conan when deeper historical data is needed

#### Anti-Patterns

- Builder says "I need to assign my Research Attendant to this task" and Jarvis starts configuring Attendant assignments. (Wrong: Operational delegation is Marvin's domain.)
- Builder asks "What's my priority score for this project?" and Jarvis starts computing scores. (Wrong: Priority math is Marvin's domain.)

---

### Artifact - The Charter

**Type:** Artifact
**Relevance:** The Charter is the artifact created in the Sanctuary via Jarvis conversation. This overlay shell is the placeholder for the future charter creation/editing experience.

#### WHAT: Definition

The living strategic document maintained in the Council Chamber -- a builder's articulated values, current themes, active priorities, and known constraints. The Charter is Jarvis's primary reference and the foundation of strategic conversation.

#### WHERE: Ecosystem

- Room: Room - Council Chamber (where the Charter is maintained)
- Used in: Council Chamber (strategic conversations reference it); Week-in-Review (insights may trigger updates)
- Contains: Primitive - Values, Themes, Priorities, Constraints, Commitments
- Conforms to: Standard - Knowledge Framework; Standard - Onboarding Sequence (initial Charter created Day 2)

#### WHY: Rationale

- Strategy: AI as Teammates -- teammates need shared context
- Principle: Plans Are Hypotheses -- strategic documents adapt
- Driver: Jarvis needs to know what matters to the builder. The Charter captures that -- not as rigid doctrine but as living understanding.
- Constraint: The Charter belongs to the builder, not the system. Jarvis proposes updates, the builder decides.

#### WHEN: Timeline

Build phase: Future. Implementation status: Not started.
Reality note (2026-02-10): No Charter artifact exists. Depends on Council Chamber and Jarvis, neither of which are implemented.

#### Anti-Patterns

- Pre-populating the Charter with default values during onboarding -- the Charter captures the builder's own articulation.
- Requiring justification for Charter updates -- the Charter changes because the builder changes.

---

### Room - Council Chamber

**Type:** Room
**Relevance:** The Council Chamber is Jarvis's conceptual home room. The Sanctuary overlay inherits this role in R1 (map-first release). Adjacent room patterns inform how the Sanctuary shell should work.

#### WHAT: Definition

Jarvis's dedicated space in the Strategy Studio -- where builders engage in high-level strategic conversation, conduct weekly reviews, maintain their Charter, and discuss life direction. The Council Chamber is the heart of the human-AI strategic partnership.

#### WHERE: Ecosystem

- Zone: Zone - Strategy Studio (planning workspace, now dissolved into map overlays)
- Agent: Agent - Jarvis (primary occupant)
- Artifacts: Artifact - The Charter; Artifact - The Agenda
- Adjacent: Room - Sorting Room; Room - Drafting Room; Room - Roster Room
- Implements: Strategy - AI as Teammates

#### WHEN: Timeline

Build phase: Future. Implementation status: Not started.
Reality note (2026-02-17): No Council Chamber exists in the codebase. D2 resolved: R1 implements Jarvis as an overlay panel/drawer accessible from the map -- no dedicated `/council-chamber` route. The route-based Council Chamber is deferred to a future release. Charter and Agenda artifacts remain unbuilt.

#### Anti-Patterns

- Jarvis initiating a conversation without the builder entering the Council Chamber -- the builder comes to Jarvis, not the other way around.
- Jarvis offering prescriptive advice before the builder has reflected -- "Here's what I think you should do" before "What are you thinking?"

---

## Supporting Cards (summaries)

### Aesthetic - Sanctuary

**Type:** Aesthetic
**Relevance:** Defines the target feeling the Sanctuary overlay should evoke -- even as a shell.

**Core feeling:** "This is my place. It holds when I'm away. It grows when I tend it. It's becoming something."

**Reinforced by:** Familiar layout that persists; warm palette (wood, glass, stone, Studio Ghibli warmth); steward presence (Jarvis is there when you enter); gentle overgrowth on return.

**Broken by:** Loading screens or empty states on app open; notification counts or badge alerts; catastrophic decay on absence; generic/templated appearance; guilt language ("You've been away for 12 days").

### Journey - Sanctuary Progression

**Type:** Journey
**Relevance:** The Sanctuary overlay is where phase transitions eventually manifest. The shell placeholder should not conflict with this progression model.

**Arc:** From survival to sovereignty -- three phases of sanctuary development. Phase 1 (Survival Building) through Phase 2 (The Shift) to Phase 3 (Directed Living). Sanctuary Maturity Dimension 7 is "Central Structure Evolution" (Humble Studio to Growing Workshop to The Sanctuary).

### Loop - Sanctuary Walk

**Type:** Loop
**Relevance:** Future loop where Jarvis may accompany the builder in surveying their domain. The Sanctuary overlay is the return point for this loop.

**Cycle:** Scan the hex grid at Horizon View, identify what's overgrown/thriving/frontier, tend areas, return to sanctuary with updated mental picture.

### Release - The Map-first UI

**Type:** Release
**Relevance:** Defines the Sanctuary as a fixed building on the map with a building overlay. This is the governing release spec for this work.

**Key specifications for Sanctuary:**
- Fixed buildings: Campfire (non-clickable, decorative), Sanctuary (clickable), Workshop (clickable)
- Building overlays: Centered panel over dimmed map. URL-addressable routes (`/workshop`, `/sanctuary`, `/projects/:id`). Back button works.
- Attendant Rail: Vertical rail on left edge with circular avatar icons. Navigating to Sanctuary auto-selects Jarvis. Chat can contain navigation shortcuts.
- Jarvis at sanctuary: "Jarvis available for charter/visioning work when Sanctuary overlay is open."
- Beat 5 (The Visioning): User clicks Sanctuary building, overlay opens, Jarvis guides charter writing.

### Standard - Naming Architecture

**Type:** Standard
**Relevance:** Naming conventions for agents and the builder. Jarvis is a "Steward" (Counselor), not an "AI assistant."

**Key rule:** In user-facing copy, use "Builder" not "user"; use "Stewards" or individual names (Jarvis) not "agents" or "AIs."

---

## Codebase Impact

### Files to create

| File | Purpose |
|------|---------|
| `packages/web/src/components/sanctuary/SanctuaryOverlay.tsx` | Sanctuary overlay shell component with placeholder content |
| `packages/web/src/components/sanctuary/SanctuaryOverlay.stories.tsx` | Storybook story for the overlay |

### Files to modify

| File | Change |
|------|--------|
| `packages/web/src/constants/routes.ts` | Add `SANCTUARY: '/sanctuary'` route constant and `generateRoute.sanctuary()` |
| `packages/web/src/Root.tsx` | Add `<Route path={ROUTES.SANCTUARY}>` rendering the SanctuaryOverlay inside the building overlay frame |
| `packages/shared/src/rooms.ts` | Add `SANCTUARY_ROOM` static room definition with Jarvis prompt for sanctuary/visioning context. Add to `getRoomDefinitionByRoomId()`. |

### Key patterns to follow

1. **Building overlay frame:** The Sanctuary overlay must use the reusable overlay component from #705. This provides the dimmed map background, centered panel, Escape-to-close, back-button-closes, and URL-addressability.

2. **Attendant Rail auto-selection:** When the Sanctuary overlay opens, Jarvis must be auto-selected in the Attendant Rail. This likely requires the overlay component to signal which attendant to select, or a hook that watches the current route and selects the appropriate agent.

3. **Room definition pattern:** Follow the existing `DRAFTING_ROOM` and `SORTING_ROOM` patterns in `packages/shared/src/rooms.ts`. The Sanctuary room should use `roomKind: 'life-map'` (same as existing rooms), with a Jarvis-voiced prompt focused on chartering/visioning.

4. **Route pattern:** Follow the existing route structure in `Root.tsx` -- wrap in `ErrorBoundary`, use `RoomLayout` (or the new building overlay layout from #705).

### Dependencies

- **#705 (Building overlay pattern and routing):** Must be completed first. Provides the reusable overlay frame, route pattern, and dimmed-map behavior.
- **#704 (Map as base layer):** Transitive dependency via #705. The map must be the base layer for overlays to work.

---

## Design Guidance

### Jarvis prompt for Sanctuary shell

The shell needs a generic Jarvis prompt for the Sanctuary context. Based on the Agent - Jarvis card's voice and the Visioning experience description:

- Warm, welcoming tone
- Oriented around the builder's values, purpose, and direction
- Should feel like arriving at a reflective space, not a task list
- Placeholder prompt should acknowledge the charter experience is coming ("This is where we'll work on your charter together") without blocking conversation
- Follow Principle - Earn Don't Interrogate: elicit, don't interrogate

### Placeholder content

The overlay body should:
- Indicate this is the Sanctuary -- a place for chartering and visioning
- Not feel broken or empty -- frame it as "coming soon" or show Jarvis's welcoming presence
- Match the warm palette described in Aesthetic - Sanctuary

---

## Provenance

| Card | Path | Confidence |
|------|------|------------|
| Agent - Jarvis | `docs/context-library/product/agents/Agent - Jarvis.md` | High -- resident agent, directly specified |
| Artifact - The Charter | `docs/context-library/product/artifacts/Artifact - The Charter.md` | High -- the artifact created in this room |
| Room - Council Chamber | `docs/context-library/product/rooms/Room - Council Chamber.md` | High -- conceptual predecessor to Sanctuary overlay |
| Aesthetic - Sanctuary | `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md` | Medium -- target feeling for this space |
| Journey - Sanctuary Progression | `docs/context-library/experience/journeys/Journey - Sanctuary Progression.md` | Medium -- progression context |
| Loop - Sanctuary Walk | `docs/context-library/experience/loops/Loop - Sanctuary Walk.md` | Low -- future loop, minimal shell impact |
| Release - The Map-first UI | `docs/context-library/releases/Release - The Map-first UI.md` | High -- governing release specification |
| Standard - Naming Architecture | `docs/context-library/product/standards/Standard - Naming Architecture.md` | Medium -- naming conventions for prompts/copy |

**Note:** No `Room - Sanctuary` card exists in the context library. The Release - The Map-first UI card calls for its creation. This issue implements the code shell; the library card should be created separately.
