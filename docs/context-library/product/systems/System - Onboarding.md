# System - Onboarding

## WHAT: Definition

The mechanism that implements the portal-first onboarding -- guiding new builders through compression-release, the wow chain, first hex placement, and the three-day deepening arc.

## WHERE: Scope

- Implements: [[Principle - First 72 Hours]] -- this system serves the 72-hour window, with the first 5 minutes as the critical path
- Implements: [[Principle - Action Before Explanation]] -- state transitions are triggered by builder actions, not information delivery
- Implements: [[Principle - Compression and Release]] -- the portal phase is the critical transition
- Implements: [[Principle - The WOW Chain]] -- tracks wow beat delivery
- Entry point: [[Component - Campfire]] -- compression phase
- Agents: [[Agent - Jarvis]] -- portal guide, asks one question, present during compression
- Agents: [[Agent - Marvin]] -- wow beat, appears with work after portal
- Conforms to: [[Standard - Onboarding Sequence]] -- executes the sequenced spec
- Feeds: [[Standard - Service Levels]] -- Level 0 to Level 1 progression

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] -- agents are introduced through action, not explanation
- Principle: [[Principle - First 72 Hours]] -- first impressions define the relationship
- Principle: [[Principle - Action Before Explanation]] -- the builder acts before they understand
- Principle: [[Principle - Compression and Release]] -- the portal creates the emotional foundation
- Driver: New builders need a guided path that creates momentum through action, not through orientation. The system orchestrates the portal, the wow chain, and the deepening arc.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-10):** No onboarding system exists. New users land directly on the Life Map with no guided introduction. No Campfire, no Day 1/2/3 sequence, no Jarvis welcome flow.

**Design refinement (2026-02-26):** System reoriented around portal-first philosophy. State machine restructured: "Not Started -> Portal: Compression -> Portal: Release -> First Session -> Day 2 -> Day 3 -> Complete." The portal phase is the critical transition. Campfire output simplified to one field (`heavyThing`). Source: Power of the Portal.

## HOW: Mechanics

### State

- **Onboarding phase**: One of Not Started / Portal: Compression / Portal: Release / First Session / Day 2 / Day 2: Deepening / Day 3 / Complete / Paused
- **Wow beats delivered**: Tracks which surprise beats have fired (spatial, personal, relational, agency, scalar)
- **Service level**: Level 0 (pre-onboarding) transitioning to Level 1 (active)

### Transitions

| From | Trigger | To | Side Effects |
|------|---------|-----|-------------|
| Not Started | Builder opens app | Portal: Compression | Campfire renders; Jarvis asks one question |
| Portal: Compression | Builder types answer | Portal: Release | View expands; map reveals; hex materializes |
| Portal: Release | Builder places hex | First Session | Marvin appears; project shaped; tasks available |
| First Session | Builder completes first task OR session ends | Day 2 | Context persists; map and hex await return |
| Day 2 | Second session begins | Day 2: Deepening | Jarvis references prior context; second project option |
| Day 2: Deepening | Second project created OR session ends | Day 3 | Sorting Room available |
| Day 3 | Builder visits Sorting Room | Complete | Service Level 0 -> 1; full feature set available |
| Any | Extended disengagement | Paused | Warm re-engagement on return |

### Campfire Output (simplified)

The campfire now produces ONE meaningful field from the builder's answer: the `heavyThing`. All downstream processing (project shaping, task generation, starting state inference) happens AFTER the portal opens, through Marvin and the builder's actions -- not through conversational extraction.

### Examples

- A new builder opens the app. The campfire renders -- intimate space, Jarvis present. "What's something you've been meaning to deal with?" Builder types "I need to get my finances sorted." The portal opens. Map reveals. The builder's words materialize as a hex. Marvin appears: "Here are three things you could do about your finances -- which feels right?" Builder picks one, places the hex. An attendant picks up the first task. Five minutes in, the builder has a project on a map with a team working on it.

- Builder returns on Day 2. The map is there. The hex is there. Jarvis references yesterday: "You mentioned your finances yesterday -- how did it feel seeing it on the map?" A second conversation follows the Me/You/Us arc, now with shared context. Builder shapes a second project with Marvin. The team deepens.

### Anti-Examples

- **Presenting a 20-field profile form on first login** -- this violates Action Before Explanation. The system should capture context through action, not data entry.
- **Introducing all agents simultaneously on Day 1** -- overwhelming a new builder with Jarvis, Marvin, and Conan in a single session creates confusion. Onboarding introduces agents as they become relevant to the builder's natural progression.
- **Running a full MI conversation before showing the map** -- the campfire is 60 seconds, not 15 minutes. One question. The world teaches, not the conversation.
