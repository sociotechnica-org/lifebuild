---
title: Signal Name
type: signal
ca-when: present # past | present (signals are observations, usually current)

signal-type: metric | feedback | behavior | technical

ca-where-observed-in:
  - [[zone-or-feature]]

ca-why-indicates: 'What this signal suggests about user needs or system health'
ca-why-confidence: low | medium | high

first-observed: YYYY-MM-DD
last-verified: YYYY-MM-DD
---

# Signal Name

One-sentence description of what we're observing.

---

## The Observation

What are we seeing? Be specific with data if available.

---

## Source

- **Type:** metric | feedback | behavior | technical
- **Where observed:** [[feature-or-zone]]
- **How measured:** Description of measurement method

---

## What It Indicates

### Our interpretation:

What do we believe this signal tells us?

### Alternative interpretations:

What else could this signal mean? (Intellectual honesty)

---

## Responses

How have we responded or plan to respond to this signal?

- [[strategy-one]] — informed by this signal
- [[feature-one]] — built in response to this signal

---

## Tracking

- **Baseline:** Original measurement
- **Current:** Latest measurement
- **Target:** Where we want it to be (if applicable)
- **Trend:** Improving | Stable | Worsening | Unknown

---

## Related Signals

- [[other-signal]] — how they correlate or relate

---

## Open Questions

- [ ] Any unresolved questions about this signal
