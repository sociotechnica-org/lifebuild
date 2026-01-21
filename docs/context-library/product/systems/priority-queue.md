---
title: Priority Queue
type: system
ca-when: present
ca-where-zone: null
ca-where-spans-zones: []
ca-where-dependencies:
  - [[project]]
  - [[planning-queue]]
ca-where-dependents:
  - [[the-table]]
  - [[work-at-hand]]
  - [[three-stream-model]]
ca-why-strategy-links:
  - [[visual-work]]
ca-why-pressure: null
ca-why-signal: null
ca-why-rationale: 'Directors need a holding area for fully planned work that is ready to activate but not yet prioritized. The Priority Queue separates ready from selected so a backlog can build without immediate commitment.'
last-verified: 2026-01-21
---

# Priority Queue

A repository of fully planned work waiting to be activated. The Priority Queue is where projects live after planning but before becoming Work at Hand. It is the "ready to go" holding area.

---

## Core Concept

Two queues work together:

| Queue              | Contains                                                           | Purpose                        |
| ------------------ | ------------------------------------------------------------------ | ------------------------------ |
| **Planning Queue** | Projects in early planning stages ([[planning-queue]] coming soon) | Development workspace          |
| **Priority Queue** | Fully planned work                                                 | Ready items awaiting selection |

The Priority Queue represents ready work -- projects that are fully planned and could be activated at any time. The director does not have to select them immediately; they wait here until the director decides to make them Work at Hand.

---

## How It Works

### Entering the Priority Queue

Projects enter the Priority Queue when:

1. **Planning completes** -> project exits [[planning-queue]] (coming soon) and enters Priority Queue as Plans
2. **Work at Hand pauses** -> project returns to Priority Queue (top of appropriate filter) as Paused

### Three-Stream Filtering

The Priority Queue can be viewed through three filters:

**Gold Candidates Filter:**

- Shows: Initiative archetype, Major/Epic scale, or manually tagged Gold-eligible
- Typical count: 2 to 8 projects
- Question: "Which frontier-opening work matters most?"

**Silver Candidates Filter:**

- Shows: System build, discovery mission, or capacity-building projects
- Typical count: 5 to 15 projects
- Question: "Which infrastructure investment will buy the most future time?"

**Bronze Candidates Filter:**

- Shows: Quick tasks, micro-scale work
- Typical count: 10 to 100+ tasks
- Question: "What operational work needs handling?"

### Selection Process

In the [[sorting-room]] (coming soon), the director:

1. Reviews Gold candidates and selects one (or leaves empty)
2. Reviews Silver candidates and selects one (or leaves empty)
3. Configures Bronze mode and target count
4. Activates priorities
5. Selected items exit Priority Queue and become Work at Hand

### Reordering

Within each filter, directors can:

- Drag to reorder priority
- See paused projects at the top of their filter
- Persist ordering until manually changed

---

## Where It Appears

- Planning workspace -- primary UI for viewing and selecting from Priority Queue
- [[the-table]] -- downstream display for selected items

---

## Dependencies

### Requires:

- [[project]] -- planned items with stream classification (coming soon)
- [[planning-queue]] -- upstream planning queue (coming soon)

### Enables:

- [[the-table]] -- all items sourced from Priority Queue
- [[work-at-hand]] -- status applied to items selected from here
- [[three-stream-model]] -- stream filters used for selection

---

## Constraints and Rules

- **Planning complete required** -- only fully planned items can enter Priority Queue
- **Paused items to top** -- paused items jump to top of their filter
- **No duplicates** -- item exists in Priority Queue or on The Table, never both
- **Filters are views** -- same underlying queue, different filtered views

---

## Queue vs. Table Relationship

```
+------------------------- Priority Queue -------------------------+
|  +-----------+  +-----------+  +-----------------------------+  |
|  |   Gold    |  |  Silver   |  |           Bronze            |  |
|  | Candidates|  | Candidates|  |         Candidates          |  |
|  |           |  |           |  | Task 1, Task 2, Task 3...    |  |
|  +-----------+  +-----------+  +-----------------------------+  |
+-----------------------------------------------------------------+
              |                |                |
              | select         | select         | mode
              v                v                v
+--------------------------- The Table ---------------------------+
|  +-----------+  +-----------+  +-----------------------------+  |
|  | Gold Slot |  | Silver    |  |        Bronze Stack         |  |
|  |           |  | Slot      |  | Task 1, Task 2, Task 3       |  |
|  +-----------+  +-----------+  +-----------------------------+  |
+-----------------------------------------------------------------+
```

---

## Bronze Priority Logic

Within Bronze Candidates, tasks are ordered by:

1. **Due date urgency** -- soonest first, imminent dates flagged
2. **Manual priority** -- director can drag to reorder
3. **Time estimate** -- quick tasks sometimes clustered for efficiency

This ordering determines which tasks surface when Bronze mode pulls from the queue.

---

## Edge Cases

### What if Priority Queue is empty?

Valid state. Director needs to create and plan projects before they can activate priorities.

### What if a filter is empty?

Valid state. No Gold candidates means no Gold-eligible work is ready. Director can leave Gold empty or create new Gold-eligible projects.

### What happens to queue position when a project pauses?

Paused project goes to the top of its filter, not back to original position. This makes it easy to resume high-priority work.

---

## Open Questions

- [ ] Should there be a "priority score" calculated automatically?
- [ ] How long can items sit in Priority Queue before prompting review?
