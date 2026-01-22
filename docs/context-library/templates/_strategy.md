---
title: Strategy Name
type: strategy
ca-when: present # strategies are typically present (active) or past (deprecated)

ca-where-scope: product # product | zone | feature (how broad is this strategy?)

ca-why-parent-strategy: '[[higher-level-strategy]]' # or null if top-level
ca-why-pressures:
  - [[pressure-one]]
ca-why-signals:
  - [[signal-one]]
ca-why-rationale: 'Why we believe this strategy is correct'

last-verified: YYYY-MM-DD
---

# Strategy Name

One-sentence statement of the strategic principle.

---

## The Belief

What do we believe to be true that makes this strategy correct? State the hypothesis.

---

## What This Means

### We DO:

- Concrete implication one
- Concrete implication two
- Concrete implication three

### We DON'T:

- Anti-pattern one (what this strategy prevents)
- Anti-pattern two

---

## How It Manifests

Features and systems that implement this strategy:

- [[feature-one]] — how it embodies this strategy
- [[feature-two]] — how it embodies this strategy
- [[system-one]] — how it embodies this strategy

---

## Pressures & Signals

### External pressures this responds to:

- [[pressure-one]] — connection to strategy

### Internal signals that informed this:

- [[signal-one]] — connection to strategy

---

## Tradeoffs

What do we give up by following this strategy? What tensions exist?

- Tradeoff one: We gain X but accept Y
- Tradeoff two: We prioritize A over B

---

## How We'd Know It's Wrong

What would make us reconsider this strategy?

- Signal one that would indicate failure
- Signal two that would indicate failure

---

## Related Strategies

- [[related-strategy]] — how they interact or tension with each other

---

## Open Questions

- [ ] Any unresolved questions about this strategy
