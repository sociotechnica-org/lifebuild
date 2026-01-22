---
title:
type: feature
ca-when: present | planned | future

ca-where:
  zone: "[[zone-name]]"
  parent: null | "[[parent-feature]]"
  dependencies:
    - "[[system-or-feature]]"
  components:
    - "[[component]]"

ca-why:
  strategy-links:
    - "[[strategy-note]]"
  signal: null | "[[signal-note]]"
  pressure: null | "[[pressure-note]]"
  rationale: "One sentence for query results"

last-verified: YYYY-MM-DD
---

# [Feature Name]

<!-- One paragraph: what this is and what it does. Should stand alone. -->

---

## Why It Exists

<!--
This section explains the causal chain. Link to strategies and drivers.
Metadata captures the links; this section explains the reasoning.
-->

**Strategy:** [[strategy-note]]
<!-- How does this feature implement the strategy? What principle does it embody? -->

**Driver:** [[signal-note]] | [[pressure-note]] | "No external driver—capability building"
<!-- What caused us to build this? What problem does it solve? -->

**Design Rationale:**
<!-- Why these specific choices? What alternatives were considered? -->

---

## How It Works

<!--
Mechanics, user interactions, states.
Use tables for complex information. Be specific.
-->

---

## Related Features

**Prerequisites:**
- [[feature]] — why it must exist first

**Complements:**
- [[feature]] — how they work together

**Enables:**
- [[feature]] — what this makes possible

---

## Components

<!-- Link to component notes. Brief description of each. -->

- [[component]] — what it does

---

## Dependencies

**Requires:**
- [[system-or-feature]] — what this needs and why

**Enables:**
- [[system-or-feature]] — what depends on this

---

## Constraints

<!-- Hard limits, rules, invariants -->

---

## Edge Cases

<!-- Unusual scenarios and how they're handled -->

---

## Evolution

**Supersedes:** [[past-note]] | "null (new capability)"
**Future:** [[future-note]] | "No planned changes"

---

## Open Questions

<!-- Unresolved decisions. Include owner and timeline if known. -->

- [ ] Question — owner, timeline
