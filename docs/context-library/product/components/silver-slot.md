---
title: Silver Slot
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
  rationale: "Dedicated visual position for infrastructure work ensures leverage-building projects don't get crowded out by urgent operational tasks"

code-location: null
last-verified: 2026-01-22
---

# Silver Slot

The center position on [[the-table]], reserved for infrastructure and leverage-building work. Contains zero or one project classified as System Build, Discovery Mission, or capability-building. Provides dedicated space for projects that "buy future time."

---

## Purpose

The Silver Slot answers: **"What system or capability am I building to make future work easier?"**

By giving Silver its own dedicated position, the system:
- Ensures infrastructure work isn't crowded out by urgent tasks
- Creates space for leverage—work that reduces future effort
- Balances transformation ([[gold-slot]]) with sustainable capacity-building
- Implements [[three-stream-model]] Silver stream

---

## What Qualifies as Silver

| Archetype | Scale | Example |
|-----------|-------|---------|
| System Build | Moderate-Major | "Automate bill payments" |
| Discovery Mission | Moderate | "Research investment strategies" |
| Capability Build | Moderate | "Learn project management tool" |

Silver work creates **leverage**—once done, it reduces future effort or expands what's possible.

---

## Implementation

### Location
Center position on [[the-table]], between [[gold-slot]] (left) and [[bronze-stack]] (right).

### Visual Treatment

| Property | Value |
|----------|-------|
| Accent color | Cool silver/platinum |
| Glow | Enhanced, silver-tinted |
| Animation | Subtle breathing pulse |
| Image stage | Polish (evolved) |

### Content Display

**When occupied:**
- Project title
- Progress indicator ("3 of 8 tasks")
- Progress ring around project image
- Category color accent (subtle)

**When empty:**
- Muted silver outline
- Text: "No Silver work this week"
- Valid state—not an error

### Interaction

- **Click** → Opens [[project-board]] overlay
- **Hover** → Subtle highlight
- [[project-board]] shows kanban with tasks

---

## Related Components

**Siblings:** (other components of [[the-table]])
- [[gold-slot]] — left position for transformative work
- [[bronze-stack]] — right position for operational tasks

**Uses:**
- [[project-card]] component — renders the actual project

---

## Dependencies

**Requires:**
- [[three-stream-model]] — defines Silver criteria
- [[work-at-hand]] — project must have this status to appear
- [[priority-queue]] — Silver Candidates filter provides options

---

## Silver vs. Gold

| Dimension | [[gold-slot]] | [[silver-slot]] |
|-----------|------|--------|
| Purpose | Transformation | Leverage |
| Impact | Opens new frontiers | Builds capability |
| Energy | High intensity | Moderate, building |
| Example | "Launch business" | "Set up portfolio website" |

Both important; neither "better." [[gold-slot]] opens doors, [[silver-slot]] builds infrastructure to walk through them.

---

## Technical Constraints

| Constraint | Rule |
|------------|------|
| Capacity | Max 1 project (hard limit) |
| Eligibility | Silver-eligible only |
| Assignment | Must go through [[sorting-room]] |

---

## Testing Notes

Key scenarios:
- [ ] Silver Slot empty (valid state)
- [ ] Silver Slot occupied (visual treatment correct)
- [ ] Click → correct [[project-board]] opens
- [ ] Complete project → slot empties
- [ ] Pause project → slot empties
- [ ] Cannot assign 2nd Silver project (validation)
- [ ] Visual treatment matches spec

---

## Open Questions

- [ ] Show "leverage created" metrics?
- [ ] Handle ambiguous Gold/Silver classification?
