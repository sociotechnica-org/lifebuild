---
title: Silver Slot
type: component
ca-when: present
ca-where-zone: '[[life-map]]'
ca-where-parent-feature: '[[the-table]]'
ca-where-dependencies: '[[three-stream-model]], [[work-at-hand]], [[priority-queue]]'
ca-where-dependents: '[[the-table]]'
ca-why-rationale: 'The center position on The Table dedicated to infrastructure and capability-building work. Provides dedicated space for leverage-creating projects that buy future time.'
code-location: null
last-verified: 2026-01-21
---

# Silver Slot

The center position on The Table, reserved for infrastructure and leverage-building work. Contains zero or one project classified as system build, discovery mission, or capability-building.

---

## Purpose

The Silver Slot answers: "What system or capability am I building to make future work easier?"

Silver represents leverage work -- projects that create infrastructure, build reusable systems, or expand capabilities. By giving Silver its own dedicated position, the system:

- Ensures infrastructure work is not crowded out by urgent tasks
- Creates space for projects that buy future time
- Balances transformation (Gold) with sustainable capacity-building

---

## What Qualifies as Silver

| Archetype         | Scale             | Example                               |
| ----------------- | ----------------- | ------------------------------------- |
| System Build      | Moderate to Major | "Implement automated bill pay system" |
| Discovery Mission | Moderate          | "Research investment strategies"      |
| Capability Build  | Moderate          | "Learn new project management tool"   |

Silver work creates leverage -- once done, it reduces future effort or expands what is possible.

---

## Implementation

### Location

Center position on The Table, between Gold Slot (left) and Bronze Stack (right).

### Visual Treatment

| Property     | Value                                |
| ------------ | ------------------------------------ |
| Accent color | Cool silver/platinum                 |
| Glow         | Enhanced, silver tinted              |
| Animation    | Subtle breathing pulse               |
| Image stage  | Polish (evolved from earlier stages) |

### Content Display

When occupied:

- Project title
- Progress indicator (e.g., "3 of 8 tasks")
- Progress ring around project image
- Category color accent (subtle)

When empty:

- Muted silver outline
- Text: "No Silver work this week" or "Empty -- Strategic Choice"
- Valid state, not an error

### Interaction

- **Click** -> opens project board overlay (Execution Altitude)
- **Hover** -> subtle highlight effect
- Project board shows full kanban with tasks

---

## Data Flow

```
Priority Queue (Silver Candidates)
         |
         | director selects in planning workspace
         v
   Silver Slot
         |
         | contains reference to
         v
   Project (Work at Hand status)
```

---

## Dependencies

### Uses:

- [[three-stream-model]] -- defines Silver stream criteria
- [[work-at-hand]] -- project must have this status to appear here
- [[priority-queue]] -- Silver Candidates filter provides selection options

### Used by:

- [[the-table]] -- Silver Slot is one of three components

---

## Technical Constraints

- **Max 1 project** -- hard constraint; system prevents assigning a second Silver project
- **Silver eligible only** -- only projects matching Silver criteria can occupy
- **No direct assignment** -- must go through planning selection flow

---

## Silver vs. Gold

| Dimension | Gold                          | Silver                     |
| --------- | ----------------------------- | -------------------------- |
| Purpose   | Transformation                | Leverage                   |
| Impact    | Opens new frontiers           | Builds capability          |
| Energy    | High intensity, deep focus    | Moderate, building         |
| Example   | "Launch photography business" | "Set up portfolio website" |

Both are important; neither is better. Gold opens doors, Silver builds the infrastructure to walk through them.

---

## Testing Notes

Key scenarios to cover:

- Silver Slot empty (valid state)
- Silver Slot occupied with project
- Clicking Silver project opens correct project board
- Completing Silver project empties slot
- Pausing Silver project empties slot
- Cannot add a second Silver project (validation)
- Visual treatment matches spec (glow, animation, colors)

---

## Open Questions

- [ ] Should Silver show time saved or leverage created metrics?
- [ ] How do we handle projects that could be either Silver or Gold?
