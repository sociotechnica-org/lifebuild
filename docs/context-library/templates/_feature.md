---
title: Feature Name
type: feature
ca-when: present # past | present | planned | future

ca-where-zone: '[[parent-zone]]'
ca-where-parent: '[[parent-feature-if-any]]' # null if top-level feature in zone
ca-where-dependencies:
  - [[dependency]]
ca-where-dependents:
  - [[other-feature]]
ca-where-components:
  - [[component-one]]
  - [[component-two]]

ca-why-strategy-links:
  - [[strategy-name]]
ca-why-pressure: '[[pressure-if-any]]' # or null
ca-why-signal: '[[signal-if-any]]' # or null
ca-why-rationale: 'Why this specific feature exists and why it works this way'

last-verified: YYYY-MM-DD
---

# Feature Name

One-paragraph overview: what is this feature and what does it do for the director?

---

## What It Does

Describe the feature's behavior from the director's perspective. What can they do? What do they see?

---

## How It Works

### User Interaction

1. Director does X
2. System responds with Y
3. Director sees Z

### Visual States (if applicable)

- State A: description
- State B: description

---

## Components

Technical pieces that make up this feature:

- [[component-one]] — role in this feature
- [[component-two]] — role in this feature

---

## Dependencies

### Requires:

- [[system-or-feature]] — why it's needed

### Enables:

- [[other-feature]] — what this makes possible

---

## Constraints

- Constraint one (business rule or technical limit)
- Constraint two

---

## Edge Cases

### What if X happens?

Answer.

### What if Y happens?

Answer.

---

## Future Evolution

If `ca-when: planned` or `future`, describe what's envisioned.

If `ca-when: present`, note any planned enhancements:

- [[future-enhancement]] — brief description

---

## Open Questions

- [ ] Any unresolved questions about this feature
