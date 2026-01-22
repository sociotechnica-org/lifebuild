---
title: Work at Hand
type: system
ca-when: present
ca-where-zone: null
ca-where-spans-zones:
  - [[life-map]]
ca-where-dependencies: '[[priority-queue]], [[three-stream-model]], [[sorting-room]]'
ca-where-dependents: '[[the-table]], [[dual-presence]], [[bronze-stack]]'
ca-why-strategy-links: '[[visual-work]]'
ca-why-pressure: null
ca-why-signal: null
ca-why-rationale: 'Directors need clarity on what they have committed to right now. Work at Hand is the explicit designation that separates "active priority" from other work.'
last-verified: 2026-01-21
---

# Work at Hand

A status indicating that a project or task is a current priority -- actively committed to and displayed on The Table. Work at Hand is not just "active" (Live); it is "what I am focused on right now."

---

## Core Concept

The distinction Work at Hand creates:

| Status           | Meaning                                      | Visibility                                  |
| ---------------- | -------------------------------------------- | ------------------------------------------- |
| **Plans**        | Ready to activate, waiting in Priority Queue | Dimmed in [[strategy-studio]] (coming soon) |
| **Live**         | Active, can work on anytime                  | Normal in Life Map                          |
| **Work at Hand** | Current priority, committed this week        | Enhanced on The Table and in domain context |

Work at Hand answers the question: "What should I be working on right now?"

Without this explicit status, directors would need to remember their priorities or scan through all Live projects. Work at Hand makes the answer instantly visible.

---

## How It Works

### Becoming Work at Hand

```
Priority Queue -> planning selection -> Work at Hand status -> appears on The Table
```

1. Project completes planning stage -> enters Priority Queue as Plans
2. Director selects items by stream in [[sorting-room]] (coming soon)
3. Director activates priorities (enforces minimum Bronze tasks)
4. Selected items receive Work at Hand status
5. Items appear on The Table with enhanced visual treatment

### Leaving Work at Hand

**Via completion:**

- All tasks done -> project status changes to Completed
- Project exits The Table, slot becomes empty
- For Bronze: task removed from stack, replacement may auto-fill based on mode

**Via pause:**

- Director pauses a Work at Hand item
- Item returns to Priority Queue (top of appropriate filter)
- Slot becomes empty on The Table
- Progress preserved; can resume later

**Via week-end rhythm (optional):**

- Some directors clear Work at Hand weekly
- Others maintain until complete
- System does not enforce a cadence

### Visual Treatment

Work at Hand items receive enhanced visual treatment:

| Property  | Normal Live         | Work at Hand               |
| --------- | ------------------- | -------------------------- |
| Imagery   | Standard            | Polish stage (evolved)     |
| Glow      | Standard            | Enhanced + stream color    |
| Animation | None                | Subtle breathing pulse     |
| Location  | Domain context only | The Table + domain context |

---

## Where It Appears

- [[the-table]] -- primary display location for Work at Hand items
- [[dual-presence]] -- rendering pattern that keeps items in context
- [[bronze-stack]] -- operational tasks displayed as a stack

---

## Dependencies

### Requires:

- [[priority-queue]] -- items must pass through Priority Queue
- [[three-stream-model]] -- determines which slot or stack applies
- [[sorting-room]] -- selection flow in planning workspace (coming soon)

### Enables:

- [[the-table]] -- populated by Work at Hand items
- [[dual-presence]] -- Work at Hand triggers dual rendering

---

## Constraints and Rules

- **Must come from Priority Queue** -- cannot make an arbitrary item Work at Hand
- **Must fit stream constraints** -- Gold-eligible for Gold slot, Silver-eligible for Silver
- **Bronze minimum** -- cannot activate priorities without 3+ Bronze tasks
- **Slot limits enforced** -- max 1 Gold, max 1 Silver

---

## State Transitions

```
                    +--------------+
                    |    Plans     |
                    | (Priority    |
                    |   Queue)     |
                    +------+-------+
                           |
                           | activate
                           v
+--------------+     +-----------+     +-------------+
|   Paused     | <-- | Work at   | --> |  Completed  |
| (Priority    |     |   Hand    |     |  (archive)  |
|   Queue)     |     +-----------+     +-------------+
+--------------+           |
       ^                   |
       | pause             |
       +-------------------+
              resume
```

---

## Edge Cases

### What if director wants to work on a Live project not on The Table?

They can. Live projects remain accessible in the Life Map. Work at Hand indicates priority, not exclusivity.

### What if a Work at Hand project gets stuck?

Director can pause it and either activate a different item, leave a slot empty, or address the blocker and resume later.

### What happens to Work at Hand on fresh login?

It persists. Work at Hand status is stored, not session-based. Director sees the same Table they left.

---

## Open Questions

- [ ] Should there be a soft deadline concept for Work at Hand items?
- [ ] Should completing Work at Hand auto-suggest the next candidate?
