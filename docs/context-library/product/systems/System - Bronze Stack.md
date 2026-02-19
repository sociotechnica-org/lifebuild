# System - Bronze Stack

## WHAT: Definition

The data mechanism governing which operational tasks populate the Bronze position on The Table — sources, population rules, priority ordering, and mode state. Bronze Stack is the "what and why" of Bronze content: where tasks come from, how they are prioritized, and what mode settings control stack depth. For the builder-facing workflow (how builders interact with Bronze — mode selection, completion handling, mid-week changes), see [[System - Bronze Operations]].

## WHERE: Scope

- Zones:
  - [[Zone - Life Map]] — Bronze work appears as part of weekly commitment
- Rooms:
  - [[Room - Sorting Room]] — mode selected during weekly planning
- Capabilities:
  - [[Capability - Weekly Planning]] — mode selection happens during planning
- Primitives:
  - [[Primitive - Task]] — individual tasks that populate the stack
  - [[Primitive - Project]] — maintenance projects source tasks to Bronze
  - [[Primitive - System]] — planted systems generate tasks to Bronze
- Implements:
  - [[Standard - Three-Stream Portfolio]] — Bronze stream mechanics
  - [[Standard - Bronze Mode Behaviors]] — stack behavior follows Bronze mode spec
  - [[Standard - Visual Language]] — task display follows visual spec
- State:
  - Current mode setting (Minimal / Target +X / Maximal)
  - Active task count in stack
  - Source queue depth per priority tier
- Transitions:
  - Mode change (via weekly planning or mid-week gear icon) -> stack recalculates immediately
  - Task completed -> auto-replenish per mode rules
  - New system-generated task arrives -> enters priority queue
- Processing:
  - Stack population follows priority ordering (due-date > Critical Responses > system-generated > Quick Tasks > decomposed)
  - Auto-replenish maintains Target count when in Target mode
- Related:
  - [[System - Bronze Operations]] — full operational workflow
  - [[Overlay - The Table]] — Bronze position displays the stack
  - [[Component - Bronze Position]] — rightmost position on The Table
- Rationale:
  - [[Strategy - Superior Process]] — operational work managed separately from transformation
  - [[Principle - Protect Transformation]] — Bronze has its own space, can't invade Gold/Silver

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — operational work managed separately from transformation
- Principle: [[Principle - Protect Transformation]] — Bronze has its own space, can't invade Gold/Silver
- Driver: Bronze represents multiplicity (many tasks) while Gold/Silver represent singularity (one project each).

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Bronze stack exists as `tableBronzeProjects` table with full event support (`table.bronzeProjectAdded`, `table.bronzeProjectRemoved`, `table.bronzeProjectsReordered`). `TableSlot` component for bronze shows top project plus count. Stack ordering and management work via the Sorting Room.

Core system. Stack mechanics enable builders to control operational load.

## HOW: Implementation

**Bronze sources (priority order):**

1. Due-date items (deadline approaching)
2. Critical Responses (urgent flags)
3. System-generated tasks from planted systems
4. Quick Task project tasks (Purpose = Maintenance)
5. Decomposed tasks from larger efforts

**Mode state definitions:**

| Mode          | Population Rule                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| **Minimal**   | Only due-date tasks + Critical Responses + system-generated. Stack varies (0-50+). |
| **Target +X** | Minimal + X discretionary tasks. Auto-replenish to maintain count.                 |
| **Maximal**   | Continuous pull. As tasks complete, next surfaces from priority queue.              |

Mode state determines stack depth. For how builders select and change modes (weekly planning, mid-week gear icon), see [[System - Bronze Operations]].

**Population rules:**

- Stack draws from source queue in priority order above
- Mode state controls how deep the draw goes
- Auto-replenishment in Target mode maintains count by pulling next-priority item
- New system-generated tasks enter the priority queue and surface per mode rules

**Structural constraint:** Bronze never blocks Gold/Silver. Even with 50 Bronze candidates queued, transformation slots remain independent. Bronze has its own capacity lane.
