# System - Pipeline Architecture

## WHAT: Definition

The two-queue system that separates work in development (Planning Queue) from work ready for activation (Priority Queue). Projects flow through the pipeline as they mature from idea to executable plan.

## WHERE: Scope

- Zone: [[Room - Drafting Room]] — both queues visible here
- Implements: [[System - Four-Stage Creation]] — stages determine which queue
- Feeds: [[System - Priority Queue Architecture]] — projects completing Stage 4 enter Priority Queue
- Governs: [[System - Planning Queue]] — Stages 1-3 projects
- Related: [[Primitive - Project]] — projects move through the pipeline

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — structured flow from capture to activation
- Principle: [[Principle - Earn Don't Interrogate]] — progressive investment, not upfront interrogation
- Decision: Separating queues prevents the common failure mode where effort required to "properly create" a project discourages capturing ideas at all.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Two-queue pipeline exists. Planning Queue: projects with `status: 'planning'` (stages 1-3) in Drafting Room. Priority Queue: projects with `status: 'backlog'` (stage 4) in Sorting Room by stream. Projects flow Drafting Room → Sorting Room → The Table.

## HOW: Mechanics

### State

- **Planning Queue contents**: Set of projects in Stages 1-3, each with its current stage
- **Priority Queue contents**: Set of projects that have completed Stage 4, ordered by stream-specific priority score
- **Flow position per project**: Which queue a project belongs to and its stage within that queue

### Transitions

| From | Trigger | To | Side Effects |
|------|---------|-----|--------------|
| No project | Director captures new idea with Marvin | Planning Queue (Stage 1) | Project created with minimal data; appears in Planning Queue |
| Planning Queue (Stage 1-2) | Director resumes and advances with Marvin | Planning Queue (next stage) | Additional project data captured |
| Planning Queue (Stage 3) | Director completes Stage 4 prioritization | Priority Queue | Project receives priority score; exits Planning Queue |
| Priority Queue | Director selects as Work at Hand | Active on The Table | Project leaves queue; fills weekly position |
| Either queue | Director abandons project | Archived | Project removed from pipeline entirely |
| Priority Queue (was Live) | Director pauses active project | Priority Queue (top) | Paused project reappears at top of its stream |

### Processing Logic

**Planning Queue:**

- Contains: Projects in Stages 1-3
- Typical state: 0-3 projects in development
- Actions: Click to resume with Marvin, abandon if no longer relevant

**Priority Queue:**

- Contains: Projects completing Stage 4
- Entry: Automatic on Stage 4 completion
- Exit: Selection as Work at Hand, or abandonment

**Flow:**

```
Idea -> Stage 1 (Planning Queue) -> Stages 2-3 -> Stage 4 -> Priority Queue -> Work at Hand
```

**Note on Systems:** Planted systems bypass the pipeline entirely. They generate tasks directly to Bronze according to configured patterns. The pipeline handles project lifecycle only.

### Examples

- A director has three ideas in quick succession: "Learn guitar," "Fix fence," and "Meal prep system." They capture all three with Marvin in under five minutes — each becomes a Stage 1 project in the Planning Queue. The Priority Queue is unaffected. Later that week, the director returns to "Meal prep system," works through Stages 2-3, and on completing Stage 4, the project moves to the Priority Queue with a Silver priority score. The other two ideas remain safely in the Planning Queue, waiting.
- A director's "Home renovation" project has been Live (on The Table) but life gets busy. They pause it. The project returns to the top of the Gold stream in the Priority Queue — it doesn't go back to the Planning Queue because it's already fully planned. Next week during planning, it appears as the first Gold candidate, easy to re-select.

### Anti-Examples

- **Requiring full planning before a project can exist in the system** — the entire pipeline design exists so that a 30-second idea capture (Stage 1) is valid. If the system forced directors to complete all four stages before saving, most ideas would never be recorded. The Planning Queue holds incomplete work deliberately.
- **Planted systems entering the pipeline** — systems generate recurring Bronze tasks directly, bypassing the project pipeline entirely. Routing a system's generated task through four stages of project creation would be absurd overhead for "take out the trash."
