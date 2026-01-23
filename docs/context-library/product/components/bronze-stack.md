---
title: Bronze Stack
type: component
ca-when: present

ca-where:
  zone: '[[life-map]]'
  parent-feature: '[[the-table]]'
  dependencies:
    - '[[three-stream-model]]'
    - '[[work-at-hand]]'
    - '[[priority-queue]]'

ca-why:
  rationale: 'Stack format acknowledges operational work is plural (many small tasks) and completes individually rather than as single unit'

code-location: null
last-verified: 2026-01-22
---

# Bronze Stack

The rightmost position on [[the-table]], containing operational tasks. Unlike [[gold-slot]] and [[silver-slot]] (single projects), the Bronze stream defined by [[three-stream-model]] displays a stack of multiple tasks representing ongoing operational work that keeps life running.

---

## Purpose

The Bronze Stack answers: **"What operational tasks am I committed to handling?"**

The Bronze stream in [[three-stream-model]] represents operations—ongoing, necessary work maintaining life. The stack format acknowledges:

- Operational work is plural (many small tasks vs. one big project)
- Tasks complete individually rather than as a single unit
- Volume varies based on life circumstances and capacity
- Implements [[three-stream-model]] Bronze stream

---

## What Qualifies as Bronze

| Archetype   | Scale | Example                |
| ----------- | ----- | ---------------------- |
| Quick Task  | Micro | "Schedule dentist"     |
| Maintenance | Micro | "Pay utility bills"    |
| Errands     | Micro | "Pick up dry cleaning" |
| Admin       | Micro | "File expense report"  |

Bronze keeps life **running**—essential but doesn't create transformation or leverage.

---

## Implementation

### Location

Rightmost position on [[the-table]], approximately 1/3 width.

### Visual Treatment

| Property     | Value                           |
| ------------ | ------------------------------- |
| Accent color | Warm bronze/copper              |
| Layout       | Stacked cards, slight offset    |
| Animation    | None (static until interaction) |
| Expand       | Click to show full list         |

### Content Display

**Collapsed (default):**

- Top 3 tasks visible as stacked cards
- Count indicator if >3 ("+12 more")
- Each card: task title, category color

**Expanded:**

- Full scrollable list
- Checkbox for each task
- Category grouping optional

### Interaction

- **Click stack** → Expands to show all tasks
- **Click task** → Mark complete (checkbox)
- **Complete task** → Removed; next may auto-fill based on mode
- **Click outside** → Collapse back to stack

---

## Bronze Modes

Directors configure behavior via Bronze Mode Settings:

| Mode          | Behavior                               | Use Case                        |
| ------------- | -------------------------------------- | ------------------------------- |
| **Minimal**   | Required tasks only, no auto-fill      | Recovery, low capacity          |
| **Target +N** | Required + N discretionary, auto-fills | Normal operation                |
| **Maximal**   | Continuous auto-fill                   | High capacity, clearing backlog |

Mode affects initial population, auto-fill behavior, and queue processing urgency.

---

## Related Components

**Siblings:** (other components of [[the-table]])

- [[gold-slot]] — left position for transformative work
- [[silver-slot]] — center position for infrastructure work

**Uses:**

- [[task-card]] component — renders individual tasks

---

## Dependencies

**Requires:**

- [[three-stream-model]] — defines Bronze criteria
- [[work-at-hand]] — tasks must have this status to appear
- [[priority-queue]] — Bronze Candidates filter provides tasks

---

## Bronze vs. Gold/Silver

| Dimension  | [[gold-slot]] / [[silver-slot]] | [[bronze-stack]]    |
| ---------- | ------------------------------- | ------------------- |
| Content    | Single project                  | Multiple tasks      |
| Completion | Whole project                   | Individual tasks    |
| Visual     | Single card with glow           | Stacked cards       |
| Auto-fill  | No (manual selection)           | Yes (based on mode) |

---

## Why Tasks Not Projects?

Bronze holds tasks rather than projects because:

1. Operational work is granular (many small things)
2. Progress is task-by-task, not milestone-based
3. Completion should feel continuous
4. Directors need to see actual action items, not abstractions

---

## Technical Constraints

| Constraint | Rule                                    |
| ---------- | --------------------------------------- |
| Minimum    | 3 tasks required to activate priorities |
| Maximum    | None (can have 3 or 300)                |
| Content    | Tasks, not projects                     |
| Auto-fill  | Depends on mode setting                 |

---

## Testing Notes

Key scenarios:

- [ ] Bronze Stack with minimum 3 tasks
- [ ] Bronze Stack with many tasks (10+, 50+)
- [ ] Expanding and collapsing
- [ ] Completing individual tasks
- [ ] Auto-fill in each mode
- [ ] Count indicator accuracy
- [ ] Cannot activate priorities with <3 Bronze (validation)

---

## Edge Cases

**Empty Bronze queue:**
Must create Bronze-eligible tasks before activating. System prompts toward task creation.

**Complete all Bronze tasks:**
Depends on mode:

- Minimal/Target: Stack empties, may need manual refill
- Maximal: Auto-pulls until queue exhausted

**Recurring tasks:**
Completed instance could trigger next occurrence to enter Bronze Candidates.

---

## Open Questions

- [ ] Show estimated time for all tasks combined?
- [ ] Quick-add directly to Bronze Stack?
- [ ] Display urgency/due dates in stack view?
