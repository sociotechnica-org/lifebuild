---
title: Gold Slot
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
ca-why-rationale: "The leftmost position on The Table dedicated to transformative, frontier-opening work. Provides visual prominence and dedicated space for the director's most important project."
code-location: null
last-verified: 2026-01-21
---

# Gold Slot

The leftmost position on The Table, reserved for transformative work. Contains zero or one Initiative-type project at Major or Epic scale.

---

## Purpose

The Gold Slot answers: "What is the most important transformative work I am doing right now?"

Gold represents frontier-opening work -- projects that unlock new capabilities, open new horizons, or represent significant life progress. By giving Gold its own dedicated, prominent position, the system:

- Ensures transformative work does not get lost in operational noise
- Creates psychological commitment to important work
- Makes progress on life goals visible

---

## Implementation

### Location

Leftmost position on The Table, occupying roughly one third of the Table width.

### Visual Treatment

| Property     | Value                                |
| ------------ | ------------------------------------ |
| Accent color | Deep amber/gold                      |
| Glow         | Enhanced, gold tinted                |
| Animation    | Subtle breathing pulse               |
| Image stage  | Polish (evolved from earlier stages) |

### Content Display

When occupied:

- Project title
- Progress indicator (e.g., "5 of 12 tasks")
- Progress ring around project image
- Category color accent (subtle)

When empty:

- Muted gold outline
- Text: "No Gold work this week" or "Empty -- Strategic Choice"
- Not an error state; strategic emptiness is valid

### Interaction

- **Click** -> opens project board overlay (Execution Altitude)
- **Hover** -> subtle highlight effect
- Project board shows full kanban with tasks

---

## Data Flow

```
Priority Queue (Gold Candidates)
         |
         | director selects in planning workspace
         v
    Gold Slot
         |
         | contains reference to
         v
   Project (Work at Hand status)
```

---

## Dependencies

### Uses:

- [[three-stream-model]] -- defines Gold stream criteria
- [[work-at-hand]] -- project must have this status to appear here
- [[priority-queue]] -- Gold Candidates filter provides selection options

### Used by:

- [[the-table]] -- Gold Slot is one of three components

---

## Technical Constraints

- **Max 1 project** -- hard constraint; system prevents assigning a second Gold project
- **Gold eligible only** -- only projects matching Gold criteria can occupy
- **No direct assignment** -- must go through planning selection flow

---

## Testing Notes

Key scenarios to cover:

- Gold Slot empty (valid state)
- Gold Slot occupied with project
- Clicking Gold project opens correct project board
- Completing Gold project empties slot
- Pausing Gold project empties slot
- Cannot add a second Gold project (validation)
- Visual treatment matches spec (glow, animation, colors)

---

## Open Questions

- [ ] Should Gold Slot show estimated time remaining?
- [ ] Should there be a quick pause button without opening the project board?
