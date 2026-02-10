# Primitive - Project

## WHAT: Definition

A discrete initiative with a finish line — bounded work that completes and moves to Archives. Projects range from small (scheduling a dentist appointment) to transformative (career transition planning). Every project has objectives, tasks, and moves through states toward completion.

## WHERE: Ecosystem

- Zone: Cross-zone — projects live on [[Zone - Life Map]], created in [[Room - Drafting Room]]
- Implements: [[Standard - Three-Stream Portfolio]] — every project has a Purpose determining stream
- Implements: [[System - Four-Stage Creation]] — projects develop through four stages
- Implements: [[System - Pipeline Architecture]] — projects flow through queues
- Depends on: [[Primitive - Task]] — projects contain tasks
- Governs: [[Room - Project Board]] — execution interface for projects
- Governs: [[Structure - Kanban Board]] — task flow within projects
- Components: [[Standard - Project States]], [[Capability - Purpose Assignment]], [[Standard - Image Evolution]]
- Conforms to: [[Standard - Life Categories]] — every project requires a Life Category
- Contrast: [[Primitive - System]] — systems are continuous, projects are bounded

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — structured work management
- Strategy: [[Strategy - Spatial Visibility]] — projects have spatial presence on hex grid
- Principle: [[Principle - Plans Are Hypotheses]] — project plans can adapt
- Driver: Directors need bounded containers for work with finish lines. The question for projects is always: "How close am I to finished?"

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Project primitive is fully operational. `projects` table in LiveStore schema with full event support (`projectCreated`, `projectUpdated`, `projectDeleted`). `ProjectLifecycleState` stored as flat JSON — status (planning/backlog/active/completed), stage (1-4), archetypes, traits, stream/slot assignment. Projects render as `ProjectCard` components within category cards on Life Map (not hex tiles). No image evolution or progress rings. Category assignment, four-stage creation, and three-stream classification all functional.

Core entity from initial design. Projects are one of two initiative types (alongside Systems) that occupy hex tiles on the Life Map.

## HOW: Implementation

### Defining Characteristics

Projects are bounded. They have a beginning and an end. Success means completion. When a project completes, it moves to Archives.

**Required properties:**

- Life Category (one of eight)
- Purpose (determines stream: Gold/Silver/Bronze)
- Objectives (what success looks like)
- Tasks (specific actions)
- Priority attributes (Urgency, Importance, Effort, Deadline)

### Lifecycle States

| State | Definition | Visual Treatment |
| ----- | ---------- | ---------------- |
| Identified | Initiative recognized but not yet scoped | Faint outline on hex grid |
| Scoped | Objectives and boundaries defined | Outlined hex, no illustration |
| Drafted | Plan created with tasks and structure | Hex with sketch-stage illustration |
| Prioritized | Placed in pipeline queue with priority attributes | Hex with queue position indicator |
| Live | Actively being worked on | Full hex tile with progress ring |
| Work at Hand | Current focus project in active execution | Highlighted hex with prominent progress ring |
| Completed | All objectives met, moved to Archives | Archived hex with completion badge |

### Visual Representation

Hex tile with project illustration, progress ring, category color accent, state indicators. Illustration evolves through five stages as project progresses per [[Standard - Image Evolution]].

### Examples

1. **"Plan kitchen renovation"** — A Gold project in the Home category. State: Live. The director has scoped objectives (new countertops, appliances, layout), created tasks on the kanban board (get quotes, select contractor, choose materials), and tracks progress via the progress ring showing 40% complete.

2. **"Schedule annual physical"** — A Bronze project in the Health category. State: Drafted. A small project with just two tasks (find available slot, book appointment). Moves quickly from Drafted to Completed once the appointment is confirmed.

### Anti-Examples

- **Not a Project:** A recurring daily habit like "Take vitamins every morning" — that is a [[Primitive - System]], not a Project, because it has no finish line.
- **Not a Project:** A single action like "Buy milk" — that is a [[Primitive - Task]], not a Project, because it needs no decomposition into sub-tasks or objectives.
- **Not a Project:** An ongoing weekly review process — that is a [[Primitive - System]] because it repeats indefinitely rather than completing.

**Projects that create Systems:** Silver projects marked as "system-building" plant a new System on completion. The project archives; the system persists.
