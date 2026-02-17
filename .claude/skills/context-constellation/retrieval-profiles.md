# Retrieval Profiles

Type-specific instructions for assembling context constellations. Each profile describes what cards to include when building/modifying a card of that type.

**Exclusion: `sources/`** — Source documents in `docs/context-library/sources/` are frozen provenance material (GDDs, research notes, strategic memos). Never include sources in context constellations. Only Conan in audit mode reads sources for drift detection and error checking. See `sources/README.md` for conventions.

---

## System

**Examples:** Bronze Stack, Pipeline Architecture, Four-Stage Creation, Clustering, Adaptation

**Always include:**

- The System card itself (full content)
- At least 1 governing Strategy (follow WHY links)
- All Principles referenced in the card's WHY section
- All Capabilities that invoke this system — `Grep` for the system name across `docs/context-library/product/capabilities/`
- All Rooms where this system is visible — `Grep` for the system name across `docs/context-library/product/rooms/`
- Any Standards this system must conform to

**Traversal depth:** 3 hops upstream via wikilinks.
Read the card → follow its `[[links]]` → follow THOSE cards' `[[links]]` → one more hop for Strategy/Principle chains.

**Dimension priority:** WHY (high) > WHERE (high) > HOW (medium) > WHAT (low).
When summarizing supporting cards, preserve WHY and WHERE content. Compress HOW to key points.

**Anti-pattern check:** Always read the HOW section's "What Breaks This" for the System card and all referenced Principles.

**Lateral scope:** Broad — Systems affect many parts of the product. Check for sibling Systems that interact.

---

## Component

**Examples:** Gold Position, Silver Position, Bronze Position, Hex Tile, Campfire

**Always include:**

- The Component card itself (full content)
- Parent Structure or Room (the container this lives in)
- All Standards this component must conform to — check WHERE section for `[[Standard -` links
- Sibling Components in the same container

**Traversal depth:** 1 hop. Components are leaf nodes — go up to parent, across to siblings, but not deeper.

**Dimension priority:** HOW (high) > WHAT (high) > WHERE (medium) > WHY (low).
Components are implementation-heavy. Focus on HOW details and conforming Standards.

**Anti-pattern check:** Read parent Structure's anti-patterns. Component violations often trace to Structure-level mistakes.

**Lateral scope:** Narrow — focus on the immediate container and siblings.

---

## Room

**Examples:** Drafting Room, Sorting Room, Project Board, Roster Room, Council Chamber

**Always include:**

- The Room card itself (full content)
- Parent Zone (Rooms are always contained by a Zone)
- Resident Agent (if one exists for this Room)
- All Structures contained in this Room — `Grep` for the room name across `docs/context-library/product/structures/`
- All Capabilities performed in this Room — `Grep` for the room name across `docs/context-library/product/capabilities/`
- Artifacts created/edited in this Room

**Traversal depth:** 2 hops. Room → Zone and Room → contained elements.

**Dimension priority:** WHY (medium) > WHERE (high) > HOW (medium) > WHAT (medium).
Rooms are relationship-heavy — WHERE context (what connects to what) is critical.

**Anti-pattern check:** Read the Room's own anti-patterns plus the Agent's anti-patterns (if resident Agent exists).

**Lateral scope:** Medium — include adjacent Rooms in the same Zone for navigation context.

---

## Zone

**Examples:** Life Map, Archives, Strategy Studio

**Always include:**

- The Zone card itself (full content)
- All Rooms contained in this Zone — `Glob` for cards referencing this zone
- Visible Overlays — `Grep` for the zone name across `docs/context-library/product/overlays/`
- Governing Strategies (at least 1)
- Adjacent Zones for navigation context

**Traversal depth:** 2 hops. Zone → contained Rooms → their key elements.

**Dimension priority:** WHY (high) > WHERE (medium) > WHAT (medium) > HOW (medium).
Zones are strategic — WHY they exist matters more than HOW they work.

**Lateral scope:** Medium — include other Zones for contrast and navigation relationships.

---

## Structure

**Examples:** Hex Grid, Kanban Board

**Always include:**

- The Structure card itself (full content)
- Parent Room (where this Structure lives)
- All Components contained in this Structure — `Grep` for the structure name across `docs/context-library/product/components/`
- Primitives displayed by this Structure — check WHERE section
- All Standards this Structure must conform to

**Traversal depth:** 1 hop. Like Components, Structures are contained elements.

**Dimension priority:** HOW (high) > WHERE (medium) > WHAT (medium) > WHY (low).
Structures are spatial/visual — HOW they render and behave is primary.

**Lateral scope:** Narrow — focus on the parent Room and contained elements.

---

## Capability

**Examples:** Purpose Assignment, Three-Stream Filtering, Weekly Planning, Workspace Navigation

**Always include:**

- The Capability card itself (full content)
- Room(s) where this Capability is performed — check WHERE section
- Artifacts created or edited by this Capability
- Primitives this Capability operates on
- Systems this Capability invokes — check WHERE section for `[[System -` links
- At least 1 Principle from the WHY section

**Traversal depth:** 2 hops. Capabilities connect Rooms, Artifacts, Primitives, and Systems.

**Dimension priority:** WHERE (high) > HOW (high) > WHY (medium) > WHAT (low).
Capabilities are about connections and workflows — WHERE it happens and HOW it works.

**Lateral scope:** Medium — include related Capabilities in the same Room.

---

## Artifact

**Examples:** The Charter, The Agenda

**Always include:**

- The Artifact card itself (full content)
- Room where this Artifact is edited
- Capabilities that use this Artifact
- Primitives this Artifact contains
- Governing Strategy (at least 1)

**Traversal depth:** 2 hops. Artifact → Room and Artifact → Capabilities.

**Dimension priority:** HOW (high) > WHERE (medium) > WHY (medium) > WHAT (medium).
Artifacts are content objects — HOW they're structured and used matters most.

**Lateral scope:** Medium.

---

## Overlay

**Examples:** The Table

**Always include:**

- The Overlay card itself (full content)
- All Zones where this Overlay is visible — check WHERE section
- Primitives displayed by this Overlay
- Components contained in this Overlay — `Grep` for overlay name across `docs/context-library/product/components/`
- Standards this Overlay must conform to
- Navigation targets (where does interacting with the Overlay take you?)

**Traversal depth:** 2 hops. Overlays bridge zones, so lateral connections matter.

**Dimension priority:** WHERE (high) > HOW (high) > WHY (medium) > WHAT (low).
Overlays are cross-zone — WHERE they appear and HOW they behave across contexts is primary.

**Lateral scope:** Medium — include the Zones this Overlay spans.

---

## Agent

**Examples:** Jarvis, Marvin, Conan

**Always include:**

- The Agent card itself (full content)
- Home Room (where this Agent lives)
- All Capabilities available to this Agent — `Grep` for agent name across `docs/context-library/product/capabilities/`
- Artifacts this Agent manages — check WHERE section
- Coordinating Agents (agents this one hands off to or coordinates with)
- Full WHY chain — at least 1 Strategy, all referenced Principles
- Any Prompts that implement this Agent — `Glob` for `docs/context-library/product/prompts/Prompt - [Agent Name]*.md`

**Traversal depth:** 3 hops. Agents are highly connected — Room, Capabilities, Artifacts, Strategy chain.

**Dimension priority:** WHY (high) > WHERE (high) > HOW (medium) > WHAT (low).
Agent alignment is strategic — WHY they exist and WHERE they fit matters as much as implementation.

**Anti-pattern check:** Always read the Agent card's anti-patterns AND the home Room's anti-patterns.

**Lateral scope:** Broad — include coordinating Agents and shared Capabilities.

---

## Prompt

**Examples:** (no Prompt cards exist yet)

**Always include:**

- Parent Agent card (complete, full content)
- The Agent's home Room
- The Agent carries the context — the Prompt is just the implementation

**Traversal depth:** 1 hop. The Agent card is the context; the Prompt inherits it.

**Dimension priority:** HOW (very high) > WHAT (medium) > WHERE (low) > WHY (low).
Prompts are pure implementation — HOW to write the system prompt.

**Lateral scope:** Minimal — just the parent Agent.

---

## Primitive

**Examples:** Project, Task, System (the data entity)

**Always include:**

- The Primitive card itself (full content)
- Rooms that serve this Primitive — `Grep` for primitive name across `docs/context-library/product/rooms/`
- Capabilities that operate on this Primitive — `Grep` for primitive name across `docs/context-library/product/capabilities/`
- Systems that manage this Primitive — `Grep` for primitive name across `docs/context-library/product/systems/`
- Standards that define this Primitive's properties or states

**Traversal depth:** 2 hops. Primitives are referenced by many card types.

**Dimension priority:** WHERE (high) > WHAT (medium) > HOW (medium) > WHY (medium).
Primitives are the data backbone — WHERE they're used throughout the product is critical.

**Lateral scope:** Medium — include sibling Primitives that interact (e.g., Project contains Tasks).

---

## Loop

**Examples:** Expedition Cycle, Daily Check-In, Seasonal Review

**Always include:**

- The Loop card itself (full content)
- All Rooms involved in this Loop — check WHERE section
- All Capabilities that compose this Loop
- Parent Loop (if nested) and child Loops (if containing)
- Journey this Loop advances (if any)
- Agents who participate
- At least 1 Strategy from the WHY section

**Traversal depth:** 2 hops. Loops connect Rooms, Capabilities, and Agents.

**Dimension priority:** HOW (high) > WHERE (high) > WHY (medium) > WHAT (low).
Loops are about the cycle — HOW it flows and WHERE it happens.

**Lateral scope:** Medium — include sibling Loops at the same timescale and parent/child Loops.

---

## Journey

**Examples:** Builder Onboarding, Sanctuary Progression

**Always include:**

- The Journey card itself (full content)
- All Loops the builder engages in during this Journey
- Rooms involved across journey phases
- Agents who guide through phases
- Systems that support progression
- Capabilities unlocked during progression
- At least 1 Strategy from the WHY section

**Traversal depth:** 3 hops. Journeys span the full product.

**Dimension priority:** WHY (high) > HOW (high) > WHERE (medium) > WHAT (low).
Journeys are strategic — WHY they exist and HOW progression works.

**Lateral scope:** Broad — Journeys touch many parts of the product.

---

## Aesthetic

**Examples:** Sanctuary, Clarity, Being Known, Accomplishment, Stewardship, The Shift

**Always include:**

- The Aesthetic card itself (full content)
- All Rooms/Loops/Capabilities where this feeling should exist — check WHERE section
- Components that reinforce this feeling
- Standards that govern the visual/interaction design supporting this feeling
- At least 1 Principle from the WHY section

**Traversal depth:** 1 hop. Aesthetics are target feelings — they point to contexts, not chains.

**Dimension priority:** HOW (high) > WHY (high) > WHERE (medium) > WHAT (low).
Aesthetics are about what reinforces and what breaks the feeling.

**Lateral scope:** Medium — include contrasting Aesthetics for the same context.

---

## Dynamic

**Examples:** Bronze Flood, Rest Deficit Spiral, The Shift

**Always include:**

- The Dynamic card itself (full content)
- All Systems that produce this emergent behavior — check WHERE section
- Loops and Capabilities that contribute
- Rooms where it manifests
- Agent responses to this Dynamic

**Traversal depth:** 2 hops. Dynamics arise from System interactions.

**Dimension priority:** WHY (medium) > HOW (high) > WHERE (medium) > WHAT (low).
Dynamics are about HOW the system responds to emergent behavior.

**Lateral scope:** Medium — include related Dynamics that share contributing Systems.

---

## Mandatory Categories Summary

Quick reference for what MUST be included regardless of scoring:

| Target Type | Mandatory                                                 |
| ----------- | --------------------------------------------------------- |
| System      | 1+ Strategy, all anti-patterns, all affected Capabilities |
| Component   | Parent Structure/Room, all conforming Standards           |
| Room        | Parent Zone, resident Agent (if exists)                   |
| Zone        | All contained Rooms, 1+ Strategy                          |
| Structure   | Parent Room, all conforming Standards                     |
| Capability  | 1+ Room, all affected Artifacts                           |
| Agent       | Home Room, all managed Artifacts, 1+ Strategy             |
| Prompt      | Parent Agent (complete)                                   |
| Overlay     | All visible Zones, all conforming Standards               |
| Primitive   | All Rooms that serve it, all operating Capabilities       |
| Artifact    | Host Room, all using Capabilities                         |
| Loop        | All composing Capabilities, all involved Rooms            |
| Journey     | All Loops engaged, all guiding Agents                     |
| Aesthetic   | All contexts where feeling applies                        |
| Dynamic     | All contributing Systems, agent responses                 |
