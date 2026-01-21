---
title: Visual Work
type: strategy
ca-when: present

ca-where:
  scope: product

ca-why:
  parent-strategy: null
  pressures: []
  signals: []
  rationale: "Humans think spatially. Making work visible and persistent reduces cognitive load, prevents important work from being forgotten, and creates a sense of agency over one's life."

last-verified: 2026-01-21
---

# Visual Work

**Strategic principle:** Making work visible creates agency. Directors should see their commitments, priorities, and progress at a glance -- not buried in lists or hidden behind navigation.

---

## The Belief

Most productivity tools hide work:

- Tasks buried in long lists requiring scrolling
- Projects nested in folders requiring navigation
- Priorities implicit, not visually distinct
- Progress invisible until you dig into details

This creates cognitive load and anxiety. Directors do not know what they have committed to, what matters most, or how they are progressing.

**Visual Work inverts this pattern.** Work is:

- Spatially organized (categories map to life domains)
- Persistently visible (The Table never scrolls away)
- Visually distinct (different states have different treatments)
- Progress-apparent (rings, stages, and states show status)

---

## What This Means

### We DO:

- Make priorities permanently visible (see [[the-table]])
- Organize projects spatially across life domains (see [[life-map]])
- Use visual state to communicate status (Live, Plans, Paused, Work at Hand)
- Show progress without requiring a click (rings, stages, animations)

### We DON'T:

- Hide important work behind multiple navigation steps
- Treat all work with the same visual weight
- Default to dense lists when spatial layouts serve better
- Make users remember priorities without visual support

---

## How It Manifests

Features and systems that implement this strategy:

- [[life-map]] -- primary workspace that keeps all work spatially visible
- [[the-table]] -- persistent priority spotlight
- [[dual-presence]] -- priorities visible in both spotlight and context
- [[three-stream-model]] -- provides distinct visual categories for work types

---

## Pressures and Signals

### External pressures this responds to:

- None documented yet

### Internal signals that informed this:

- None documented yet

---

## Tradeoffs

- **Visibility vs. overwhelm:** Showing everything can overwhelm. We use altitude levels and priority filtering to limit noise.
- **Persistence vs. real estate:** The Table takes space that could show more projects. We accept this to preserve priority awareness.
- **Visual richness vs. performance:** Rich visuals cost render performance. We optimize and degrade gracefully on lower-end devices.

---

## How We'd Know It's Wrong

- Directors still report losing track of priorities despite The Table
- Visual density creates anxiety or avoidance instead of clarity
- Performance degradation causes users to turn off visual features

---

## Related Strategies

- None documented yet

---

## Open Questions

- [ ] How does Visual Work translate to mobile screen constraints?
- [ ] Should there be a focus mode that temporarily reduces visual complexity?
- [ ] How do we handle directors with very large project counts while preserving clarity?
