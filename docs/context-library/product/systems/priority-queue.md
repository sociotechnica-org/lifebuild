---
title: Priority Queue
type: system
ca-when: present

ca-where:
  zone: '[[strategy-studio]]'
  spans-zones: null
  dependencies:
    - '[[project]]'
  dependents:
    - '[[the-table]]'
    - '[[sorting-room]]'
    - '[[work-at-hand]]'

ca-why:
  strategy-links:
    - '[[visual-work]]'
  rationale: "Separates 'ready work' from 'selected work' allowing backlog accumulation without commitment"

last-verified: 2026-01-22
---

# Priority Queue

A repository of fully-planned work (Stage 4 complete) waiting to be activated. The Priority Queue holds projects after planning but before becoming [[work-at-hand]]. It's the "ready to go" holding area—directors can build up planned work without immediately committing to it.

---

## Core Concept

Two queues work together:

| Queue              | Contains               | Purpose                        |
| ------------------ | ---------------------- | ------------------------------ |
| **Planning Queue** | Projects in Stages 1-3 | Development workspace          |
| **Priority Queue** | Stage 4 complete       | Ready work, awaiting selection |

The Priority Queue represents **ready work**—projects fully planned that could be activated anytime. Directors don't have to select immediately; items wait here until moved to [[the-table]] via [[sorting-room]].

---

## Why It Exists

**Strategy:** [[visual-work]]
Makes ready work visible and organized. Directors see their backlog of planned work, filtered by stream ([[three-stream-model]]), ready for selection.

**Driver:** Separation of planning and commitment
Directors needed to plan work without immediately committing to it. The Priority Queue creates a staging area between "I thought about this" and "I'm doing this now."

---

## How It Works

### Entering the Priority Queue

Projects enter when:

1. **Stage 4 completes** — exits Planning Queue, enters Priority Queue as "Plans"
2. **[[work-at-hand]] pauses** — returns to Priority Queue (top of filter) as "Paused"

### Three-Stream Filtering

View through three filters matching [[three-stream-model]]:

**Gold Candidates:**

- Initiative archetype, Major/Epic scale, or manually tagged Gold-eligible
- Typical: 2-8 projects
- Question: "Which frontier-opening work matters most?"

**Silver Candidates:**

- System Build, Discovery Mission, or capacity-building
- Typical: 5-15 projects
- Question: "Which infrastructure will buy the most future time?"

**Bronze Candidates:**

- Quick Tasks, Micro-scale
- Typical: 10-100+ tasks
- Question: "What operational work needs handling?"

### Selection Process

In [[sorting-room]]:

1. View Gold Candidates → select one (or leave empty)
2. View Silver Candidates → select one (or leave empty)
3. View Bronze Candidates → configure mode (Minimal/Target/Maximal)
4. Click "Activate Priorities"
5. Selected items exit Priority Queue → become [[work-at-hand]]

### Reordering

Within each filter:

- Drag to reorder priority
- Paused items auto-appear at top of their filter
- Order persists until manually changed

---

## Where It Appears

- [[sorting-room]] — primary UI for viewing and selecting
- [[drafting-room]] — displays Priority Queue for queue management

---

## Related Systems

**Prerequisites:**

- [[project]] — project entity with Stage 4 complete

**Complements:**

- [[three-stream-model]] — provides filter structure
- [[sorting-room]] — selection interface

**Enables:**

- [[work-at-hand]] — status applied to selected items
- [[the-table]] — populated from here via selection

---

## Queue ↔ Table Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                      Priority Queue                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Gold     │  │   Silver    │  │       Bronze        │ │
│  │  Candidates │  │  Candidates │  │     Candidates      │ │
│  │             │  │             │  │                     │ │
│  │  Project A  │  │  Project D  │  │  Task 1, Task 2,    │ │
│  │  Project B  │  │  Project E  │  │  Task 3, Task 4...  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              │                │                │
              │ select         │ select         │ mode config
              ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                        [[the-table]]                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Gold Slot  │  │ Silver Slot │  │    Bronze Stack     │ │
│  │  Project A  │  │  Project D  │  │  Task 1, 2, 3       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Constraints & Rules

| Constraint  | Rule                                              |
| ----------- | ------------------------------------------------- |
| Entry       | Stage 4 required; only fully-planned projects     |
| Paused      | Returns to top of filter, not original position   |
| Exclusivity | Project in Queue XOR on [[the-table]], never both |
| Filters     | Views of same queue, not separate queues          |

---

## Bronze Priority Logic

Within Bronze Candidates, ordered by:

1. **Due date** — soonest first, imminent flagged
2. **Manual priority** — director drag to reorder
3. **Time estimate** — quick tasks sometimes clustered

This ordering determines what surfaces when Bronze mode pulls from queue.

---

## Edge Cases

**Empty Priority Queue:**
Valid. Director needs to create and plan projects. System guides toward [[drafting-room]].

**Empty filter:**
Valid. No Gold Candidates means no Gold-eligible work ready. Director can leave Gold empty or create new Gold-eligible projects.

**Paused position:**
Goes to **top** of filter (not original position). Makes resuming high-priority work easy.

---

## Evolution

**Supersedes:** null (original design)

**Future:**

- Auto-calculated priority scores
- Staleness detection ("Item in queue 6 weeks—still relevant?")

---

## Open Questions

- [ ] Should Priority Queue have capacity limits per filter?
- [ ] Staleness prompts: helpful or annoying?
