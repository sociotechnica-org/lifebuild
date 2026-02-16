# System - Planning Queue

## WHAT: Definition

The holding area for projects still in development — work in stages 1-3 of the four-stage creation process, not yet ready for prioritization. The Planning Queue holds ideas becoming plans.

## WHERE: Scope

- Zone: [[Zone - Strategy Studio]] — visible during planning work
- Fed by: [[Room - Drafting Room]] — where projects are created
- Flows to: [[System - Priority Queue Architecture]] — on Stage 4 completion
- Implements: [[System - Four-Stage Creation]] — stages 1-3 live here
- Agent: [[Agent - Marvin]] — can surface stalled items

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — development is distinct from prioritization
- Principle: [[Principle - Earn Don't Interrogate]] — projects can be incomplete
- Driver: Not all projects are ready for prioritization. The Planning Queue holds work-in-progress until it's ready.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Planning Queue operational. Projects with `status: 'planning'` and `stage: 1-3` rendered in Drafting Room via `PlanningQueueCard.tsx`. Builders click to resume at the appropriate stage form. Marvin guides progression.

## HOW: Mechanics

### State

- **Queue contents**: Ordered list of projects in Stages 1-3
- **Per-project stage**: Identified (1), Scoped (2), or Drafted (3)
- **Staleness tracking**: Time since last interaction with each project

### Transitions

| From                 | Trigger                                           | To                             | Side Effects                                        |
| -------------------- | ------------------------------------------------- | ------------------------------ | --------------------------------------------------- |
| Empty queue          | Builder captures new idea with Marvin            | Queue contains Stage 1 project | Project appears in Planning Queue list              |
| Project at Stage 1   | Builder resumes with Marvin, completes scoping   | Project advances to Stage 2    | Purpose, objectives, priority attributes recorded   |
| Project at Stage 2   | Builder resumes with Marvin, completes drafting  | Project advances to Stage 3    | Task list or system configuration attached          |
| Project at Stage 3   | Builder completes Stage 4 prioritization         | Project exits Planning Queue   | Project moves to Priority Queue with priority score |
| Project stalled      | Marvin detects no interaction for extended period | Stall surfaced                 | Marvin asks: "Want to continue, or archive this?"   |
| Project in any stage | Builder abandons                                 | Project archived               | Removed from Planning Queue                         |

### Processing Logic

**Contents:**

- Projects in Identified state (Stage 1)
- Projects in Scoped state (Stage 2)
- Projects in Drafted state (Stage 3)

**Not included:**

- Projects in Prioritized state (Stage 4) — those live in [[System - Priority Queue Architecture]]

**Flow:**

```
New idea -> Identified (Stage 1) -> Scoped (Stage 2) -> Drafted (Stage 3) -> Prioritized (Stage 4)
           |<-------- Planning Queue -------->|        |<-- Priority Queue -->|
```

**Stall detection:**

- Marvin can surface items that haven't progressed
- "This has been in Scoped for three weeks — want to work on it or archive it?"

### Examples

- A builder captures "Build a reading nook" as a quick idea on Monday morning. It sits in the Planning Queue at Stage 1: Identified. On Wednesday, they open the Drafting Room and Marvin says "You have 3 projects in development — want to pick one up?" The builder chooses the reading nook, works through scoping (Stage 2), and leaves it there. The Planning Queue now shows it at Stage 2: Scoped, waiting for the builder to return for task planning.
- Three weeks pass and a Stage 2 project "Organize photos" hasn't been touched. Marvin surfaces it during a Drafting Room visit: "This has been in Scoped for three weeks — want to work on it or archive it?" The builder realizes they've lost interest and archives it. The Planning Queue shrinks by one, keeping only active intentions visible.

### Anti-Examples

- **Auto-promoting a Stage 3 project to the Priority Queue without builder confirmation** — Stage 4 (prioritization) requires the builder to consciously decide where a project ranks relative to others. The system should never auto-complete this decision, even if a project has a full task list.
- **Hiding stalled projects to keep the queue looking "clean"** — stalled projects represent real decisions the builder hasn't made yet. Hiding them removes visibility. Instead, Marvin surfaces them gently for the builder to continue or consciously archive.
