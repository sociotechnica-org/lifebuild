# Room - Drafting Room

## WHAT: Definition

Marvin's dedicated space — where directors create new projects, guided through the four-stage creation process. The Drafting Room is where ideas become executable plans.

## WHERE: Ecosystem

- Zone: [[Zone - Strategy Studio]] — planning workspace
- Agent: [[Agent - Marvin]] — operational manager
- Adjacent:
  - [[Room - Council Chamber]] — strategic conversation
  - [[Room - Category Studios]] — domain-specific planning
  - [[Room - Sorting Room]] — priority selection
  - [[Room - Roster Room]] — delegation management
- Conforms to:
  - [[Standard - Visual Language]] — creation stage visual treatments
- Implements: [[System - Four-Stage Creation]] — guided process
- Implements: [[Strategy - Superior Process]] — structured project development
- Implements: [[Principle - Earn Don't Interrogate]] — progressive capture
- Creates: [[Primitive - Project]] — output of drafting process
- Configures: [[Primitive - System]] — for system-building Silver projects

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — creation deserves structure
- Principle: [[Principle - Earn Don't Interrogate]] — Marvin guides without blocking
- Driver: Directors need help turning ideas into actionable projects. The Drafting Room provides that translation.
- Constraints: Drafting Room translates ideas into projects without judging them. Marvin guides structure, not evaluates worth. Quick capture is always available.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Drafting Room exists at `/drafting-room` with Marvin agent active. Stages 1-3 have dedicated forms (`Stage1Form.tsx`, `Stage2Form.tsx`, `Stage3Form.tsx`) plus a `StageWizard.tsx` flow. Planning Queue is visible with `PlanningQueueCard` components. Stage 4 (Prioritizing) happens in the Sorting Room rather than the Drafting Room. CHORUS_TAG navigation links between stages are implemented.

Core support space. Drafting Room process refined as four-stage creation matured.

## HOW: Implementation

**Four-stage flow:**

1. **Identify** — capture basics (title, description, category)
2. **Scope** — define purpose, objectives, priority attributes
3. **Draft** — create tasks or configure system
4. **Prioritize** — place in Priority Queue

**Marvin's role:**

- Guide through stages
- Suggest task decomposition
- Ask purpose question (Gold/Silver/Bronze classification)
- Configure systems for system-building projects

**Entry points:**

- "Create project" from anywhere
- Quick capture (Stage 1 only, return later)
- Triggered by life event or advisor suggestion
- Click item in Planning Queue to continue work

**Planning Queue visibility:**

- Shows development stage for each project (Identified, Scoped, Drafted)
- Click any project to open in Drafting Room for continued work

**Output:** Completed project in Planning state, ready for Priority Queue.

### Examples

- Director has an idea: "Kitchen Renovation" → enters Drafting Room → types title and brief description → Marvin asks: "Is this about changing your life, building infrastructure, or handling something that needs doing?" → director says "changing my life" → project tagged as Gold stream → Marvin guides through scoping objectives and tasks.
- Director captures "Call dentist" as quick capture → Stage 1 only (title + description) → task sits in Planning Queue as "Identified" → director returns three days later → clicks to continue → Marvin picks up at Stage 2 → low-friction capture didn't block the original thought.

### Anti-Examples

- **Requiring all four stages before a project can exist in the system** — quick capture (Stage 1 only) must be possible. Forcing full scoping on every idea kills spontaneity and makes capture feel heavy.
- **Marvin auto-classifying projects by analyzing the title** — purpose assignment comes from the director. "Kitchen Renovation" could be Gold (transformative remodel) or Bronze (fix the faucet) depending on the director's intent. Only the director knows.
