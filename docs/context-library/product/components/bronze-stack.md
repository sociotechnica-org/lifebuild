---
title: Bronze Stack
type: component
ca-when: present
ca-where-zone: '[[life-map]]'
ca-where-parent-feature: '[[the-table]]'
ca-where-dependencies:
  - [[three-stream-model]]
  - [[work-at-hand]]
  - [[priority-queue]]
ca-where-dependents:
  - [[the-table]]
ca-why-rationale: 'The rightmost position on The Table containing operational tasks. Unlike Gold and Silver (single projects), Bronze holds multiple tasks in a stack, representing the ongoing operational work that keeps life running.'
code-location: null
last-verified: 2026-01-21
---

# Bronze Stack

The rightmost position on The Table, containing operational tasks. Unlike Gold and Silver (single projects), Bronze displays a stack of multiple tasks representing the operational work that keeps life running.

---

## Purpose

The Bronze Stack answers: "What operational tasks am I committed to handling?"

Bronze represents operations -- the ongoing, necessary work that maintains life. Not transformative (Gold) or leverage-building (Silver), but essential nonetheless. The stack format acknowledges:

- Operational work is plural (many small tasks vs. one big project)
- Tasks complete individually rather than as a single unit
- Volume varies based on life circumstances and capacity

---

## What Qualifies as Bronze

| Archetype   | Scale | Example                        |
| ----------- | ----- | ------------------------------ |
| Quick Task  | Micro | "Schedule dentist appointment" |
| Maintenance | Micro | "Pay utility bills"            |
| Errands     | Micro | "Pick up dry cleaning"         |
| Admin       | Micro | "File expense report"          |

Bronze work keeps life running -- without it, things fall apart, but it does not create transformation or leverage.

---

## Implementation

### Location

Rightmost position on The Table. Takes approximately one third of Table width but displays differently than Gold/Silver.

### Visual Treatment

| Property        | Value                           |
| --------------- | ------------------------------- |
| Accent color    | Warm bronze/copper              |
| Layout          | Stacked cards, slight offset    |
| Animation       | None (static until interaction) |
| Expand behavior | Click to expand full list       |

### Content Display

Collapsed (default):

- Top 3 tasks visible as stacked cards
- Count indicator if more than 3 (e.g., "+12 more")
- Each card shows task title and category color

Expanded:

- Full scrollable list of all Bronze tasks
- Checkbox for each task
- Optional category grouping

### Interaction

- **Click stack** -> expands to show all tasks
- **Click individual task** -> mark complete (checkbox)
- **Complete task** -> task removed, next candidate may auto-fill based on mode
- **Click outside** -> collapse back to stack view

---

## Bronze Modes

Directors configure how Bronze behaves via [[bronze-mode-settings]] (coming soon):

| Mode          | Behavior                                         | Use Case                                |
| ------------- | ------------------------------------------------ | --------------------------------------- |
| **Minimal**   | Only required tasks, no auto-fill                | Recovery periods, low capacity          |
| **Target +N** | Required + N discretionary, auto-fills to target | Normal operation                        |
| **Maximal**   | Continuous auto-fill from queue                  | High-capacity periods, clearing backlog |

Mode affects:

- How many tasks initially populate Bronze Stack
- Whether completing a task triggers auto-fill
- How urgently the queue is processed

---

## Data Flow

```
Priority Queue (Bronze Candidates)
         |
         | filtered by mode settings
         v
   Bronze Stack
         |
         | contains references to
         v
   Tasks (Work at Hand status)
```

---

## Dependencies

### Uses:

- [[three-stream-model]] -- defines Bronze stream criteria
- [[work-at-hand]] -- tasks must have this status to appear here
- [[priority-queue]] -- Bronze Candidates filter provides selection options

### Used by:

- [[the-table]] -- Bronze Stack is one of three components

---

## Technical Constraints

- **Minimum 3 tasks** -- cannot activate priorities without at least 3 Bronze tasks
- **No maximum** -- can have 3 or 300 tasks in Bronze
- **Tasks, not projects** -- Bronze contains individual tasks, not full projects
- **Auto-fill depends on mode** -- may or may not pull next candidate automatically

---

## Bronze vs. Gold/Silver

| Dimension  | Gold/Silver             | Bronze                    |
| ---------- | ----------------------- | ------------------------- |
| Content    | Single project          | Multiple tasks            |
| Completion | Whole project completes | Individual tasks complete |
| Visual     | Single card with glow   | Stacked cards             |
| Auto-fill  | No (manual selection)   | Yes (based on mode)       |

---

## Why Tasks Not Projects?

Bronze intentionally holds tasks rather than projects because:

1. Operational work is granular (many small things)
2. Progress is task-by-task, not project-milestone
3. Completion should feel continuous, not blocked by project boundaries
4. Directors need to see the actual action items, not abstractions

---

## Testing Notes

Key scenarios to cover:

- Bronze Stack with minimum 3 tasks
- Bronze Stack with many tasks (10+, 50+)
- Expanding and collapsing stack
- Completing individual tasks
- Auto-fill behavior in each mode
- Count indicator accuracy
- Visual treatment matches spec
- Cannot activate priorities with fewer than 3 Bronze tasks

---

## Edge Cases

### What if Bronze queue is empty?

Director must create Bronze-eligible tasks before activating priorities. System prompts toward task creation.

### What if director completes all Bronze tasks?

Depends on mode:

- **Minimal/Target**: stack empties, may need manual refill
- **Maximal**: auto-pulls until queue exhausted

### What about recurring tasks?

If recurring tasks exist, a completed instance could trigger the next occurrence to enter Bronze Candidates.

---

## Open Questions

- [ ] Should Bronze show estimated time for all tasks combined?
- [ ] Should there be a quick add directly to Bronze Stack?
- [ ] How do we handle task urgency or due dates in the stack display?
