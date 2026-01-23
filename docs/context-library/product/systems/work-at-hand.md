---
title: Work at Hand
type: system
ca-when: present

ca-where:
  zone: null
  spans-zones:
    - '[[life-map]] — Work at Hand projects appear on [[the-table]]'
    - '[[strategy-studio]] — status assigned in [[sorting-room]]'
  dependencies:
    - '[[priority-queue]]'
    - '[[sorting-room]]'
  dependents:
    - '[[the-table]]'
    - '[[dual-presence]]'
    - '[[category-cards]]'

ca-why:
  strategy-links:
    - '[[visual-work]]'
  rationale: "Explicit commitment status separates 'active priority' from 'other work I could do'"

last-verified: 2026-01-22
---

# Work at Hand

A project status indicating current priority—actively committed to and displayed on [[the-table]]. [[work-at-hand]] is not just "active" (that's Live status); it's "what I'm focused on right now." This explicit designation creates clarity about commitments and enables [[dual-presence]] rendering.

---

## Core Concept

The distinction [[work-at-hand]] creates:

| Status               | Meaning                                  | Visibility                                   |
| -------------------- | ---------------------------------------- | -------------------------------------------- | --------------- |
| **Plans**            | In [[priority-queue]], ready to activate | Dimmed on [[category-cards                   | Category Card]] |
| **Live**             | Active, can work on anytime              | Normal on [[category-cards                   | Category Card]] |
| **[[work-at-hand]]** | Current priority, committed              | Enhanced on [[the-table]] + [[category-cards | Category Card]] |

[[work-at-hand]] answers: **"What should I be working on right now?"**

Without this explicit status, directors would scan through all Live projects guessing at priority. [[work-at-hand]] makes the answer visible instantly.

---

## Why It Exists

**Strategy:** [[visual-work]]
[[work-at-hand]] enables the visual distinction that makes [[the-table]] work. Items with this status receive enhanced treatment (glow, animation, prominence) making priorities unmistakable.

**Driver:** Clarity of commitment
Directors needed a way to say "these specific items are my focus" distinct from "I could work on this." The status creates explicit commitment, not just possibility.

---

## How It Works

### Becoming Work at Hand

```
[[priority-queue]] → [[sorting-room]] selection → [[work-at-hand]] status → [[the-table]]
```

1. Project completes Stage 4 (Prioritized) → enters [[priority-queue]] as "Plans"
2. Director visits [[sorting-room]] → reviews candidates by stream filter
3. Director selects project for [[gold-slot]] or [[silver-slot]] (or tasks for [[bronze-stack]])
4. Director clicks "Activate Priorities" (validates min 3 [[bronze-stack]] tasks)
5. Selected items receive [[work-at-hand]] status
6. Items appear on [[the-table]] with enhanced visual treatment

### Leaving Work at Hand

**Via Completion:**

- All tasks Done → Project status → "Completed"
- Exits [[the-table]], slot becomes empty
- [[bronze-stack]]: task removed, replacement may auto-pull based on mode

**Via Pause:**

- Director clicks "Pause" on [[project-board]]
- Project status → "Paused"
- Returns to [[priority-queue]] (top of appropriate filter)
- Slot becomes empty
- Progress preserved; can resume later

### Visual Treatment

| Property  | Normal Live             | [[work-at-hand]]                 |
| --------- | ----------------------- | -------------------------------- | --------------- |
| Image     | Standard stage          | Polish stage (evolved)           |
| Glow      | None                    | Stream-colored                   |
| Animation | None                    | Breathing pulse                  |
| Location  | [[category-cards]] only | [[the-table]] + [[category-cards | Category Card]] |

---

## Where It Appears

- [[the-table]] — primary display for [[work-at-hand]] items
- [[category-cards]] — [[work-at-hand]] also appears on home card with pulse via [[dual-presence]]
- [[sorting-room]] — where status is assigned

---

## Related Systems

**Prerequisites:**

- [[priority-queue]] — items must pass through before becoming [[work-at-hand]]
- [[sorting-room]] — selection UI assigns the status

**Complements:**

- [[three-stream-model]] — determines which slot ([[gold-slot]]/[[silver-slot]]/[[bronze-stack]])

**Enables:**

- [[the-table]] — populated by [[work-at-hand]] items
- [[dual-presence]] — triggers dual rendering

---

## State Transitions

```
                    ┌──────────────┐
                    │    Plans     │
                    │ (in Priority │
                    │    Queue)    │
                    └──────┬───────┘
                           │ activate
                           ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Paused    │◄───│ Work at Hand │───►│  Completed   │
│ (in Priority │    │ (on Table)   │    │  (archived)  │
│    Queue)    │    └──────────────┘    └──────────────┘
└──────────────┘           ▲
       │                   │
       └───────────────────┘
              resume
```

---

## Constraints & Rules

| Constraint     | Rule                                                                  |
| -------------- | --------------------------------------------------------------------- |
| Source         | Must come from [[priority-queue]]                                     |
| Eligibility    | Must match stream constraints (Gold-eligible for [[gold-slot]], etc.) |
| Bronze minimum | Cannot activate without 3+ [[bronze-stack]] tasks                     |
| Slot limits    | Max 1 [[gold-slot]], max 1 [[silver-slot]] (hard limits)              |

---

## Edge Cases

**Working on non-Table items:**
Directors can still work on Live projects via [[category-cards]]. [[work-at-hand]] indicates priority, not exclusivity. [[the-table]] shows "what I committed to" but doesn't lock out other work.

**Stuck project:**
Director can Pause (returns to [[priority-queue]]) and either activate replacement or leave slot empty.

**Fresh login:**
Persists. [[work-at-hand]] is stored, not session-based. Director sees same [[the-table]] they left.

---

## Evolution

**Supersedes:** null (original design)

**Future:**

- Soft deadlines for [[work-at-hand]] items
- Auto-suggest next candidate when slot empties

---

## Open Questions

- [ ] Should completing [[work-at-hand]] prompt "activate next candidate?"
- [ ] Time-boxing: should [[work-at-hand]] have optional duration limits?
