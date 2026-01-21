---
title: The Table
type: feature
ca-when: present
ca-where-zone: '[[life-map]]'
ca-where-parent:
ca-where-dependencies:
  - [[priority-queue]]
  - [[work-at-hand]]
  - [[three-stream-model]]
ca-where-dependents:
  - [[dual-presence]]
ca-where-components:
  - [[gold-slot]]
  - [[silver-slot]]
  - [[bronze-stack]]
ca-why-strategy-links:
  - [[visual-work]]
ca-why-pressure:
ca-why-signal:
ca-why-rationale: Directors need persistent visibility into current commitments. The Table answers "what am I working on right now?" at a glance and reduces context switching.
last-verified: 2026-01-21
---

# The Table

A persistent visual spotlight at the top of the Life Map showing current priorities across three streams. The Table displays the director's active commitments: one transformative project (Gold), one infrastructure project (Silver), and operational tasks (Bronze).

---

## What It Does

The Table provides always-visible priority awareness. Regardless of where the director navigates in the Life Map (Overview, Domain, or Execution altitude), The Table remains anchored at the top of the screen. This ensures:

- Directors never lose sight of what matters most this week
- Context switching is reduced (no hunting for "what was I supposed to do?")
- The three-stream model is reinforced visually (transformation + leverage + operations)

---

## How It Works

### Layout

Three distinct positions arranged left to right:

| Position                 | Content                             | Visual Treatment                        |
| ------------------------ | ----------------------------------- | --------------------------------------- |
| **Gold Slot** (left)     | One transformative project or empty | Gold accent glow, breathing animation   |
| **Silver Slot** (center) | One infrastructure project or empty | Silver accent glow, breathing animation |
| **Bronze Stack** (right) | 3+ operational tasks                | Stacked cards, expandable               |

### User Interaction

**Clicking Gold or Silver project:**

- Opens project board overlay (Execution Altitude)
- Shows kanban board with tasks
- Can work on tasks or pause project

**Clicking Bronze Stack:**

- Expands to show all tasks
- Can click individual tasks to mark complete
- Can reorder tasks within the stack

**Empty slots:**

- Display muted outline in stream color
- Text: "No Gold work this week" or "No Silver work this week"
- Strategic emptiness is valid, not failure

### Visual States

Projects on The Table receive enhanced treatment compared to normal Live projects:

- **Polish-stage imagery** -- projects visually "level up" when promoted to Work at Hand
- **Stream-color glow** -- gold/silver/bronze accent matching position
- **Breathing animation** -- subtle pulse indicating active status
- **Enhanced contrast** -- stands out from the rest of the Life Map

---

## Components

- [[gold-slot]] -- leftmost position for transformative/frontier-opening work
- [[silver-slot]] -- center position for infrastructure/capability-building work
- [[bronze-stack]] -- rightmost position showing operational task stack

---

## Dependencies

### Requires:

- [[priority-queue]] -- all items on The Table come from the Priority Queue selection flow
- [[work-at-hand]] -- the status that determines what appears on The Table
- [[three-stream-model]] -- the conceptual framework that defines Gold/Silver/Bronze streams

### Enables:

- [[dual-presence]] -- Work at Hand items appear on The Table and their home domain card simultaneously

---

## Constraints

- **Max 1 Gold** -- only one project can occupy Gold slot at a time (hard limit)
- **Max 1 Silver** -- only one project can occupy Silver slot at a time (hard limit)
- **Min 3 Bronze** -- cannot activate priorities without at least 3 Bronze tasks
- **No duplicates** -- same project cannot appear in multiple slots

---

## Edge Cases

### What if all slots are empty?

Valid state, but unusual. The Table shows empty slot indicators with messaging. Director would need to visit the planning workspace to activate priorities.

### What if Bronze has 50+ tasks?

Bronze Stack shows a manageable view (scrollable/paginated) with count indicator. Mode settings (Minimal/Target/Maximal) help directors control how many tasks surface.

### What if a Gold project completes mid-week?

Slot becomes empty. Director can immediately activate the next Gold candidate or leave the slot empty until the next planning session.

---

## Future Evolution

Current implementation is stable. Potential enhancements:

- Quick-add to Bronze from The Table itself
- Drag-and-drop reordering within Bronze Stack
- Visual indication of project health/progress at Table level

---

## Open Questions

- [ ] Should The Table show progress indicators (mini rings) for Gold and Silver?
- [ ] How prominent should empty slot messaging be?
