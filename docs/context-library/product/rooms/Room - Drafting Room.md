# Room - Drafting Room

## WHAT: Definition

Marvin's dedicated space — where builders create new projects and systems, guided through structured creation flows. The Drafting Room is where ideas become executable plans (projects) or planted infrastructure (systems).

## WHERE: Ecosystem

- Zone: [[Zone - Strategy Studio]] — planning workspace
- Agent: [[Agent - Marvin]] — operational manager
- Adjacent:
  - [[Room - Council Chamber]] — strategic conversation
  - [[Room - Sorting Room]] — priority selection
  - [[Room - Roster Room]] — delegation management
- Conforms to:
  - [[Standard - Visual Language]] — creation stage visual treatments
- Implements: [[System - Four-Stage Creation]] — guided process
- Implements: [[Strategy - Superior Process]] — structured project development
- Implements: [[Principle - Earn Don't Interrogate]] — progressive capture
- Creates: [[Primitive - Project]] — output of project creation flow
- Creates: [[Primitive - System]] — output of system creation flow

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — creation deserves structure
- Principle: [[Principle - Earn Don't Interrogate]] — Marvin guides without blocking
- Driver: Builders need help turning ideas into actionable projects. The Drafting Room provides that translation.
- Constraints: Drafting Room translates ideas into projects or systems without judging them. Marvin guides structure, not evaluates worth. Quick capture is always available.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Drafting Room exists at `/drafting-room` with Marvin agent active. Stages 1-3 have dedicated forms (`Stage1Form.tsx`, `Stage2Form.tsx`, `Stage3Form.tsx`) plus a `StageWizard.tsx` flow. Planning Queue is visible with `PlanningQueueCard` components. Stage 4 (Prioritizing) happens in the Sorting Room rather than the Drafting Room. CHORUS_TAG navigation links between stages are implemented.

Core support space. Drafting Room process refined as four-stage creation matured.

## HOW: Implementation

**Entity type choice:**

When the builder initiates creation, the **first screen** presents a binary choice: **Project or System**. This is an explicit UI element — not conversational, not something Marvin asks during dialogue. It is upstream of everything else. Gold/Silver/Bronze purpose assignment only appears for projects, after the entity type is chosen. The entity type choice is a distinct UI screen, not a conversation with Marvin.

**Project creation flow (four stages):**

1. **Identify** — capture basics (title, description, category)
2. **Scope** — define purpose (G/S/B), objectives, priority attributes
3. **Draft** — create task list
4. **Prioritize** — place in Priority Queue

**System creation flow (three stages):**

1. **Identify** — capture basics (title, description, category). Designed to take 20 seconds from a phone.
2. **Scope** — define purpose statement ("what does this system maintain?") + recurring task templates with individual cadences. Each template gets its own cadence (daily/weekly/monthly/quarterly/annually). This is where the complexity lives — simple systems have 1 template, complex ones have many.
3. **Detail** — health metrics/controls, delegation profile, refinements. Lightweight in R3 — this stage exists but is minimal initially.

Systems are planted immediately after the Detail stage — they generate tasks right away. There is no prioritization stage for systems because systems are infrastructure, not competing priorities.

**Marvin's role:**

- Entity type choice happens on first screen (before Marvin conversation)
- For projects: guide four-stage flow, suggest task decomposition, ask purpose question (G/S/B)
- For systems: guide three-stage flow, help define per-template cadences and purpose statement, support mid-cycle status button
- Support iteration and refinement of both entity types

**Entry points:**

- "Create project" or "Create system" from anywhere
- Quick capture (Stage 1 only, return later)
- Triggered by life event or advisor suggestion
- Click item in Planning Queue to continue work

**Planning Queue visibility:**

- Shows development stage for each project (Identified, Scoped, Drafted)
- Click any project to open in Drafting Room for continued work

**Output:** Completed project in Planning state, ready for Priority Queue.

### Examples

- Builder has an idea: "Kitchen Renovation" → enters Drafting Room → types title and brief description → Marvin asks: "Is this about changing your life, building infrastructure, or handling something that needs doing?" → builder says "changing my life" → project tagged as Gold stream → Marvin guides through scoping objectives and tasks.
- Builder captures "Call dentist" as quick capture → Stage 1 only (title + description) → task sits in Planning Queue as "Identified" → builder returns three days later → clicks to continue → Marvin picks up at Stage 2 → low-friction capture didn't block the original thought.
- Builder taps "Create" → first screen shows Project or System → builder taps "System" → Stage 1: title "Weekly Meal Prep," category Home → Stage 2: purpose "maintain weekly meal preparation," adds three task templates each with weekly (Sunday) cadence: "plan meals," "create grocery list," "prep ingredients" → builder taps "I'm mid-cycle and need to update this" because they already prepped this week → sets initial health snapshot → Stage 3: delegation profile is builder-only, health metrics deferred → system is planted, next week's tasks generate on schedule.

### Anti-Examples

- **Requiring all four stages before a project can exist in the system** — quick capture (Stage 1 only) must be possible. Forcing full scoping on every idea kills spontaneity and makes capture feel heavy.
- **Marvin auto-classifying projects by analyzing the title** — purpose assignment comes from the builder. "Kitchen Renovation" could be Gold (transformative remodel) or Bronze (fix the faucet) depending on the builder's intent. Only the builder knows.
