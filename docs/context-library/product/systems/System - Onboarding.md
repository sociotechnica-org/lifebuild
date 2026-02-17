# System - Onboarding

## WHAT: Definition

The mechanism that implements the First 72 Hours principle — guiding new builders through their initial experience with LifeBuild, establishing the spatial metaphor, introducing the agent team, and creating early momentum.

## WHERE: Scope

- Implements: [[Principle - First 72 Hours]] — this system serves that principle
- Entry point: [[Component - Campfire]] — where onboarding begins
- Agents: [[Agent - Jarvis]] (first contact + Charter creation), [[Agent - Marvin]] (first projects)
- Creates: [[Artifact - The Charter]] — initial version during onboarding
- Feeds: [[Standard - Service Levels]] — Level 0 to Level 1 progression

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — agents introduce themselves as teammates, not tools
- Principle: [[Principle - First 72 Hours]] — first impressions define the relationship
- Principle: [[Principle - Earn Don't Interrogate]] — progressive disclosure, not upfront forms
- Driver: New builders need a guided path that creates momentum without overwhelming.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-10):** No onboarding system exists. New users land directly on the Life Map with no guided introduction. No Campfire, no Day 1/2/3 sequence, no Mesa welcome flow. Second priority for MVP upgrade after hex grids.

### History

**2026-02-17 — #613: R1 onboarding collapse**
R1 collapses the Day 1/2/3 onboarding sequence to a single campfire conversation + walk. The multi-day sequence is the full vision; R1 ships the minimal first-touch experience.

## HOW: Mechanics

**R1 Reality:** The Day 1/2/3 sequence described below is the full vision. R1 collapses this to a single campfire conversation + walk — Jarvis greets the builder, introduces the spatial metaphor, and walks them through the Life Map. No multi-day progression, no phased agent introductions. Just a warm first-touch experience that plants seeds.

### State

- **Onboarding phase**: One of Not Started / Day 1 (Orientation) / Day 2 (Foundation) / Day 3 (Momentum) / Complete
- **Milestones achieved**: Tracks which onboarding moments have occurred (first Mesa conversation, Charter draft, first project captured, first Life Map exploration)
- **Service level**: Level 0 (pre-onboarding) transitioning to Level 1 (active)

### Transitions

| From               | Trigger                                                 | To                 | Side Effects                                                                 |
| ------------------ | ------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| Not Started        | Builder opens LifeBuild for the first time              | Day 1: Orientation | Jarvis greets at Campfire; spatial metaphor introduced                       |
| Day 1: Orientation | Builder completes first Jarvis conversation             | Day 2: Foundation  | Jarvis initiates Charter creation; Life Categories established               |
| Day 2: Foundation  | Charter draft created                                   | Day 3: Momentum    | Marvin available for first project capture; Life Map populated               |
| Day 3: Momentum    | Builder has created first project and explored Life Map | Complete           | Service Level transitions from 0 to 1; full agent team available             |
| Any phase          | Builder disengages for extended period                  | Paused             | Gentle re-engagement cues when builder returns, resuming where they left off |

### Processing Logic

_Stub card — detailed implementation to be developed._

**Key design constraints:**

- Progressive disclosure over three days
- Circumstance-responsive, not fixed-sequence
- Measure success by life improvement, not feature adoption
- Warm, patient, encouraging tone throughout

### Examples

- A new builder opens LifeBuild for the first time. Jarvis greets them at the Campfire: "Welcome — I'm Jarvis, and I help you navigate this space." Over a relaxed conversation, Jarvis introduces the Life Map metaphor and asks about what's on the builder's mind. By the end of Day 1, the builder understands the spatial layout and has met one agent. No forms, no onboarding checklist — just a warm introduction that plants seeds.
- On Day 3, Marvin appears in the Drafting Room and says "Ready to capture something you've been meaning to get to?" The builder mentions wanting to organize their garage. Marvin walks them through Stage 1 in under a minute — title, brief description, Life Category = Home. The builder sees their first project appear on the Life Map. They feel momentum: "This thing actually works." Service level transitions to Level 1.

### Anti-Examples

- **Presenting a 20-field profile form on first login** — this violates Earn Don't Interrogate. The system should learn about the builder through conversation and observation over the 72-hour window, not demand data entry before they've experienced any value.
- **Introducing all agents simultaneously on Day 1** — overwhelming a new builder with multiple agents in a single session creates confusion rather than clarity. Onboarding introduces agents as they become relevant to the builder's natural progression.
