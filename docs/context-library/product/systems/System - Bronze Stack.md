<!-- OVERLAP CHECK: May duplicate System - Bronze Operations. Review for merge. Bronze Operations covers operational workflow (mode selection, stack population, auto-replenishment, completion handling). Bronze Stack covers the stack mechanism itself (what populates it, mode behaviors, source priorities). Significant overlap in mode settings table, stack sources, and the "Bronze never blocks Gold/Silver" constraint. -->

# System - Bronze Stack

## WHAT: Definition

The mechanism managing which operational tasks populate the Bronze position on The Table. The Bronze Stack draws from multiple sources and operates in one of three modes (Minimal, Target, Maximal) controlling how many tasks surface. Builders set the mode; the system handles population, prioritization, and auto-replenishment.

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

**Bronze sources:**

- Quick Task projects (Purpose = Maintenance)
- System-generated tasks from planted systems
- Small Critical Responses
- Decomposed work from larger efforts

**Mode settings:**

| Mode          | Behavior                                                                           |
| ------------- | ---------------------------------------------------------------------------------- |
| **Minimal**   | Only due-date tasks + Critical Responses + system-generated. Stack varies (0-50+). |
| **Target +X** | Minimal + X discretionary tasks. Auto-replenish to count.                          |
| **Maximal**   | Continuous pull. As tasks complete, next surfaces.                                 |

**Mode selection:** Set during weekly planning in [[Room - Sorting Room]]. Can change mid-week via gear icon.

**Bronze never blocks Gold/Silver:** Even with 50 Bronze candidates queued, if builder has capacity for transformation work, activate those streams. Bronze will always exist. Waiting for Bronze to be "finished" is a trap.
