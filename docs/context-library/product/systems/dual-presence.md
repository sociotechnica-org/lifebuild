---
title: Dual Presence
type: system
ca-when: present
ca-where-zone: '[[life-map]]'
ca-where-spans-zones: []
ca-where-dependencies:
  - [[work-at-hand]]
  - [[the-table]]
  - [[category-cards]]
ca-where-dependents:
  - [[life-map]]
ca-why-strategy-links:
  - [[visual-work]]
ca-why-pressure: null
ca-why-signal: null
ca-why-rationale: 'Directors need to see priorities while maintaining domain context. Dual presence solves the tension between "show me what is important" and "show me where things live."'
last-verified: 2026-01-21
---

# Dual Presence

A rendering pattern where Work at Hand items appear in two places simultaneously: on The Table (priority spotlight) and in their home domain context. Both views show the same underlying object -- changes sync automatically.

---

## Core Concept

**Without dual presence, you have to choose:**

- Show priority on The Table -> lose domain context
- Show item in the domain -> lose priority visibility

**With dual presence, you get both:**

- The Table shows "here are your priorities"
- The domain context shows "here is where this work lives"
- Same object, two useful views

---

## How It Works

### Rendering Logic

When an item has Work at Hand status:

1. **The Table** renders the item in its stream position (Gold/Silver/Bronze)
   - Enhanced visual treatment
   - Stream-colored accent
   - Full interactivity

2. **Domain context** renders the same item in its home area
   - Standard Live treatment plus a subtle stream-colored pulse
   - Maintains position among other items
   - Full interactivity

Both views reference the same object. There is no data duplication, only dual rendering.

### State Synchronization

Changes propagate to both views automatically:

- Complete a task -> progress updates in both places
- Pause item -> disappears from both (returns to Priority Queue)
- Complete project -> removed from both

### Visual Differentiation

| Location       | Visual Treatment                                                                |
| -------------- | ------------------------------------------------------------------------------- |
| The Table      | Polish-stage image, stream-color glow, breathing animation, enhanced prominence |
| Domain context | Standard treatment plus subtle stream-color pulse                               |

The pulse in the domain context indicates "this item is also on The Table."

---

## Where It Appears

- [[the-table]] -- priority spotlight (one location of dual presence)
- [[category-cards]] -- domain context (coming soon)

---

## Dependencies

### Requires:

- [[work-at-hand]] -- only Work at Hand items render in dual presence
- [[the-table]] -- one of the two render targets
- [[category-cards]] -- domain context rendering (coming soon)

### Enables:

- Directors maintain spatial awareness while focusing on priorities

---

## Constraints and Rules

- **Same object** -- not a copy; both views reference the same item
- **Sync is automatic** -- no manual refresh needed
- **Only for Work at Hand** -- Live items not on The Table appear only in domain context

---

## Implementation Notes

### Technical Approach

The item component accepts a `displayContext` prop:

- `displayContext: "table"` -> render with enhanced treatment
- `displayContext: "domain"` -> render with standard treatment plus pulse

Both contexts subscribe to the same item state. The UI framework handles re-rendering when state changes.

### Why Not Just One Location?

Alternative considered: only show Work at Hand on The Table, remove from domain context.

Rejected because:

- Loses domain context ("Where did my project go?")
- Breaks spatial mental model
- Creates confusion about where work lives

Dual presence is more complex to implement but better for user understanding.

---

## Edge Cases

### What if a director clicks the item from The Table vs. the domain context?

Same result -- opens the same project board or task view.

### What if the domain context is collapsed (showing counts only)?

Work at Hand still counts in the tally. If expanded, it appears with the pulse indicator.

### What about Bronze tasks?

Same pattern. Bronze tasks appear on Bronze Stack and in their home domain context.

---

## Open Questions

- [ ] Should the pulse animation be more or less subtle?
- [ ] On mobile, does dual presence still make sense or is it confusing?
