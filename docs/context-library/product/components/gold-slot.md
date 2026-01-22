---
title: Gold Slot
type: component
ca-when: present

ca-where:
  zone: "[[life-map]]"
  parent-feature: "[[the-table]]"
  dependencies:
    - "[[three-stream-model]]"
    - "[[work-at-hand]]"
    - "[[priority-queue]]"

ca-why:
  rationale: "Dedicated visual position for transformative work ensures frontier-opening projects don't get lost in operational noise"

code-location: null
last-verified: 2026-01-22
---

# Gold Slot

The leftmost position on [[the-table]], reserved for transformative work. Contains zero or one Initiative-type project at Major or Epic scale. Provides dedicated, prominent space for the director's most important frontier-opening project.

---

## Purpose

The Gold Slot answers: **"What's the most important transformative work I'm doing right now?"**

By giving Gold its own dedicated position with enhanced visual treatment, the system:
- Ensures transformative work isn't lost in operational noise
- Creates psychological commitment to important work
- Makes progress on life goals visible
- Implements [[three-stream-model]] Gold stream

---

## Implementation

### Location
Leftmost position on [[the-table]], approximately 1/3 of [[the-table]] width.

### Visual Treatment

| Property | Value |
|----------|-------|
| Accent color | Deep amber/gold |
| Glow | Enhanced, gold-tinted |
| Animation | Subtle breathing pulse |
| Image stage | Polish (evolved from earlier stages) |

### Content Display

**When occupied:**
- Project title
- Progress indicator ("5 of 12 tasks")
- Progress ring around project image
- Category color accent (subtle)

**When empty:**
- Muted gold outline
- Text: "No Gold work this week"
- Not an error—strategic emptiness is valid

### Interaction

- **Click** → Opens [[project-board]] overlay
- **Hover** → Subtle highlight
- [[project-board]] shows kanban with tasks

---

## Related Components

**Siblings:** (other components of [[the-table]])
- [[silver-slot]] — center position for infrastructure work
- [[bronze-stack]] — right position for operational tasks

**Uses:**
- [[project-card]] component — renders the actual project

---

## Dependencies

**Requires:**
- [[three-stream-model]] — defines Gold criteria (Initiative, Major/Epic)
- [[work-at-hand]] — project must have this status to appear
- [[priority-queue]] — Gold Candidates filter provides options

---

## Technical Constraints

| Constraint | Rule |
|------------|------|
| Capacity | Max 1 project (hard limit) |
| Eligibility | Gold-eligible only (Initiative, Major/Epic, or manually tagged) |
| Assignment | Must go through [[sorting-room]]; no direct assignment |

---

## Testing Notes

Key scenarios:
- [ ] Gold Slot empty (valid state, proper messaging)
- [ ] Gold Slot occupied (visual treatment correct)
- [ ] Click → correct [[project-board]] opens
- [ ] Complete project → slot empties
- [ ] Pause project → slot empties, project returns to [[priority-queue]]
- [ ] Cannot assign 2nd Gold project (validation)
- [ ] Visual treatment matches spec (glow, animation, colors)

---

## Open Questions

- [ ] Show estimated time remaining?
- [ ] Quick-pause button visible without opening [[project-board]]?
