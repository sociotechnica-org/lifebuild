---
title: System Name
type: system
ca-when: present # past | present | planned | future

ca-where:
  zone: null # systems often span zones, or specify primary zone
  spans-zones:
    - '[[zone-one]]'
    - '[[zone-two]]'
  dependencies:
    - '[[other-system]] — what this system needs to function'
  dependents:
    - '[[feature-one]] — what relies on this system'

ca-why:
  strategy-links:
    - '[[strategy-name]] — how this system implements this strategy'
  pressure: null
  signal: null
  rationale: 'Why this system exists as a cross-cutting mechanism'

last-verified: YYYY-MM-DD
---

# System Name

One-paragraph overview of what this system does and why it exists as a distinct mechanism.

---

## Core Concept

What is the fundamental idea? Explain it simply enough that someone unfamiliar could understand.

---

## How It Works

### Key Mechanics

1. Mechanic one — what happens
2. Mechanic two — what happens
3. Mechanic three — what happens

### State Transitions (if applicable)

```
State A → State B → State C
           ↓
        State D
```

---

## Where It Appears

This system manifests in these features:

- [[feature-one]] — how this system appears there
- [[feature-two]] — how this system appears there

---

## Dependencies

### This system requires:

- [[other-system]] — why it's needed

### These depend on this system:

- [[feature-one]] — how it uses this system

---

## Constraints & Rules

- Constraint one (hard rule that cannot be violated)
- Constraint two
- Constraint three

---

## Edge Cases

### What happens when X?

Answer.

### What happens when Y?

Answer.

---

## Open Questions

- [ ] Any unresolved questions about this system
