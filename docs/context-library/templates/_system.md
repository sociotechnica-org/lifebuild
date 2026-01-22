---
title:
type: system
ca-when: present | planned | future

ca-where:
  zone: null | "[[zone-name]]"
  spans-zones:
    - "[[zone]]"
  dependencies:
    - "[[system-or-entity]]"
  dependents:
    - "[[feature-or-system]]"

ca-why:
  strategy-links:
    - "[[strategy-note]]"
  signal: null | "[[signal-note]]"
  pressure: null | "[[pressure-note]]"
  rationale: "One sentence for query results"

last-verified: YYYY-MM-DD
---

# [System Name]

<!-- One paragraph: what this system is and what it does. Should stand alone. -->

---

## Core Concept

<!--
The key insight or mechanism. What problem does this system solve?
Why does it exist as a distinct system rather than being folded into features?
-->

---

## Why It Exists

**Strategy:** [[strategy-note]]
<!-- How does this system implement the strategy? -->

**Driver:** [[signal-note]] | [[pressure-note]] | "Architectural necessity"
<!-- What caused us to create this system? -->

---

## How It Works

<!--
Mechanics, rules, state transitions.
Use diagrams (ASCII or Mermaid) for complex flows.
-->

---

## Where It Appears

<!-- Which features/zones implement or use this system? -->

- [[feature]] — how it uses this system
- [[zone]] — how this system manifests here

---

## Related Systems

**Prerequisites:**
- [[system]] — what must exist for this to work

**Complements:**
- [[system]] — how they interact

**Enables:**
- [[system]] — what this makes possible

---

## Dependencies

**Requires:**
- [[entity-or-system]] — what this needs

**Required By:**
- [[feature-or-system]] — what depends on this

---

## Constraints & Rules

<!-- Invariants, hard limits, business rules -->

---

## Edge Cases

<!-- Unusual scenarios and how they're handled -->

---

## Evolution

**Supersedes:** [[past-note]] | "null (original design)"
**Future:** [[future-note]] | "No planned changes"

---

## Open Questions

- [ ] Question — owner, timeline
