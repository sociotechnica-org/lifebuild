---
title: Zone Name
type: zone
ca-when: present # past | present | planned | future

ca-where:
  zone: null # zones are top-level, no parent zone
  parent: null
  adjacent-zones:
    - '[[other-zone]] — relationship description'
  contains:
    - '[[feature-one]] — brief description'
    - '[[feature-two]] — brief description'

ca-why:
  strategy-links:
    - '[[strategy-name]] — how this zone implements this strategy'
  pressure: null
  signal: null
  rationale: 'Why this zone exists as a distinct product area'

last-verified: YYYY-MM-DD
---

# Zone Name

One-paragraph overview of what this zone is and its primary purpose.

---

## What It Contains

### Features

- [[feature-one]] — brief description of role in this zone
- [[feature-two]] — brief description of role in this zone

### Systems (if zone-specific)

- [[system-one]] — brief description

---

## User Journey

How does a director typically move through this zone? What's the flow?

1. Step one
2. Step two
3. Step three

---

## Boundaries

### This zone is responsible for:

- Responsibility one
- Responsibility two

### This zone is NOT responsible for:

- Thing handled elsewhere → see [[other-zone]]

---

## Adjacent Zones

- [[other-zone]] — How directors move between this zone and that one

---

## Open Questions

- [ ] Any unresolved questions about this zone's scope or behavior
