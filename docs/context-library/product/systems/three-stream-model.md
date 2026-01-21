---
title: Three-Stream Model
type: system
ca-when: present

ca-where:
  zone: null
  spans-zones:
    - "[[life-map]] -- manifests as The Table's three positions"
  dependencies:
    - '[[project]] -- work items with archetype and scale metadata (coming soon)'
  dependents:
    - '[[the-table]] -- implements this model with Gold/Silver/Bronze positions'
    - '[[priority-queue]] -- filters candidates by stream'
    - '[[work-at-hand]] -- assigns Work at Hand by stream constraints'

ca-why:
  strategy-links:
    - '[[visual-work]] -- makes different work types visually distinct'
  pressure: null
  signal: null
  rationale: 'Not all work is equal. Some work transforms, some builds leverage, some just needs doing. The three-stream model helps directors balance their portfolio across fundamentally different work types.'

last-verified: 2026-01-21
---

# Three-Stream Model

A conceptual framework that organizes work into three fundamentally different streams: **Gold** (transformation), **Silver** (leverage), and **Bronze** (operations). Each stream serves a different purpose and requires different energy and focus.

---

## Core Concept

The insight behind the three-stream model: work is not homogeneous.

A director's week contains:

- Work that opens new frontiers and creates transformation
- Work that builds systems and creates future leverage
- Work that keeps life running and maintains operations

Treating all work the same leads to either:

- Constant firefighting (all Bronze, no progress)
- Burnout from overreach (all Gold, no sustainability)
- Stagnation (no Gold, just maintenance)

The three-stream model makes these categories explicit and helps directors consciously balance across them.

---

## How It Works

### The Three Streams

| Stream     | Purpose        | Project Types                     | Energy Profile         |
| ---------- | -------------- | --------------------------------- | ---------------------- |
| **Gold**   | Transformation | Initiatives (Major/Epic scale)    | High focus, deep work  |
| **Silver** | Leverage       | System builds, discovery missions | Medium focus, building |
| **Bronze** | Operations     | Quick tasks, micro-scale work     | Low focus, execution   |

### Stream Definitions

**Gold Stream -- Frontier Opening**

- Transformative projects that unlock new capabilities or open new horizons
- One project at a time (or intentionally empty)
- Examples: "Launch photography business," "Complete graduate degree"
- Archetype: Initiative
- Scale: Major or Epic

**Silver Stream -- Capability Building**

- Infrastructure and leverage-building projects that buy future time
- One project at a time (or intentionally empty)
- Examples: "Implement automated bill payment," "Research investment strategies"
- Archetypes: System build, discovery mission
- Scale: Moderate to Major

**Bronze Stream -- Operational Execution**

- Multiple small tasks that keep life running
- Minimum 3 tasks, scales based on capacity and mode
- Examples: "Schedule dentist appointment," "Pay utility bills"
- Archetype: Quick task
- Scale: Micro

### Classification Logic

Projects are assigned to streams based on:

1. **Archetype** -- Initiative -> Gold; System build/Discovery -> Silver; Quick task -> Bronze
2. **Scale** -- Major/Epic -> Gold; Moderate -> Silver; Micro -> Bronze
3. **Manual override** -- Director can tag projects as stream-eligible if classification does not match intent

---

## Where It Appears

This system manifests in:

- [[the-table]] -- three positions implement this model directly
- [[priority-queue]] -- candidate filters organize selection by stream
- [[work-at-hand]] -- stream constraints determine slot assignment

---

## Dependencies

### This system requires:

- [[project]] -- work items with archetype and scale metadata (coming soon)

### These depend on this system:

- [[the-table]] -- structure is built around three streams
- [[priority-queue]] -- filtering organized by stream
- [[work-at-hand]] -- stream constraints enforced on activation

---

## Constraints and Rules

- **Gold and Silver are singular** -- max one project per stream on The Table at a time
- **Bronze is plural** -- multiple tasks, minimum 3 to activate priorities
- **Empty is valid** -- Gold and Silver can be strategically empty; Bronze requires minimum
- **Streams do not compete** -- a project belongs to one stream; no overlap

---

## Strategic Implications

### Balancing Streams

Healthy weeks often include work from all three streams:

- **Gold** -- making progress on what matters most
- **Silver** -- building infrastructure that makes future weeks easier
- **Bronze** -- keeping life running smoothly

Balance varies by life season:

- **Recovery periods** -- heavy Bronze, light or empty Gold and Silver
- **Building periods** -- heavy Silver, moderate Bronze, light Gold
- **Push periods** -- heavy Gold, moderate Bronze, light Silver

### Common Anti-Patterns

- **Bronze trap** -- only doing operational work, never building leverage or transformation
- **Gold burnout** -- always pushing on transformation without operational sustainability
- **Silver avoidance** -- never investing in infrastructure, fighting fires forever

---

## Edge Cases

### What if a project could be Gold or Silver?

Go by archetype first. If genuinely ambiguous, the director can manually tag. The key question: "Is this opening a frontier (Gold) or building capability (Silver)?"

### What if Bronze is overwhelming?

Set Bronze to Minimal mode, leave Gold/Silver empty, focus on stabilization. The system makes reality visible without judgment.

---

## Open Questions

- [ ] Should there be visual feedback when streams are imbalanced over time?
- [ ] How do Critical Response projects fit? (Currently based on scale, often Bronze)
