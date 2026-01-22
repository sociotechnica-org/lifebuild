---
title: Dual Presence
type: system
ca-when: present

ca-where:
  zone: "[[life-map]]"
  spans-zones: null
  dependencies:
    - "[[work-at-hand]]"
    - "[[the-table]]"
    - "[[category-cards]]"
  dependents: null

ca-why:
  strategy-links:
    - "[[visual-work]]"
  rationale: "Directors need both priority visibility ([[the-table]]) and domain context ([[category-cards]]) simultaneously"

last-verified: 2026-01-22
---

# Dual Presence

A rendering pattern where [[work-at-hand]] projects appear in two places simultaneously: on [[the-table]] (priority spotlight) AND on their home [[category-cards|Category Card]] (domain context). Both views show the same underlying object—changes sync automatically. This solves the tension between "show me what's important" and "show me where things live."

---

## Core Concept

The problem Dual Presence solves:

**Without Dual Presence, you must choose:**
- Show priority on [[the-table]] → lose domain context (where does this live?)
- Show project on [[category-cards|Category Card]] → lose priority visibility (is this my focus?)

**With Dual Presence, you get both:**
- [[the-table]] shows "here are your priorities"
- [[category-cards]] shows "here's all work in Health, including your priority"
- Same object, two useful views

---

## Why It Exists

**Strategy:** [[visual-work]]
[[visual-work]] means showing work in useful ways. Sometimes useful = "what's most important" ([[the-table]] view). Sometimes useful = "what's in this domain" ([[category-cards]] view). Dual Presence provides both without forcing a choice.

**Driver:** Spatial memory preservation
Directors build spatial memory around [[category-cards]] ("my health projects are top-left"). Removing [[work-at-hand]] items from their home location would break that mental map.

---

## How It Works

### Rendering Logic

When a project has [[work-at-hand]] status:

1. **[[the-table]]** renders in stream position defined by [[three-stream-model]] ([[gold-slot]]/[[silver-slot]])
   - Enhanced visual: glow, animation
   - Stream-colored accent
   - Full interactivity (click → [[project-board]])

2. **[[category-cards]]** renders on home domain card
   - Standard Live treatment PLUS subtle pulse matching stream color
   - Maintains position among other projects
   - Full interactivity (click → [[project-board]])

Both render the **same object**. No duplication in data—just dual rendering.

### State Synchronization

Changes propagate to both views automatically:
- Complete task → progress ring updates in both
- Pause project → disappears from both (moves to [[priority-queue]])
- Project completes → removed from both

### Visual Differentiation

| Location | Treatment |
|----------|-----------|
| [[the-table]] | Polish-stage image, stream glow, breathing animation |
| [[category-cards]] | Standard Live + subtle stream-colored pulse |

The pulse on [[category-cards|Category Card]] says: "This one is also on [[the-table]]."

---

## Where It Appears

- [[the-table]] — priority spotlight (one location)
- [[category-cards]] — domain containers (other location)

---

## Related Systems

**Prerequisites:**
- [[work-at-hand]] — only [[work-at-hand]] items render in dual presence
- [[the-table]] — one render target
- [[category-cards]] — other render target

**Complements:**
- [[three-stream-model]] — determines stream color for pulse

**Enables:**
- Directors maintain spatial awareness while focusing on priorities

---

## Technical Implementation

### Approach

Project component accepts `displayContext` prop:
- `displayContext: "table"` → enhanced treatment
- `displayContext: "category"` → standard + pulse

Both contexts subscribe to same project state.

### Why Not Single Location?

Alternative considered: only show [[work-at-hand]] on [[the-table]], remove from [[category-cards|Category Card]].

Rejected because:
- Loses domain context ("How much work in Health?")
- Creates confusion ("Where did my project go?")
- Breaks spatial mental model

Dual Presence is more complex but better for understanding.

---

## Constraints & Rules

| Constraint | Rule |
|------------|------|
| Same object | Not a copy; both views reference same data |
| Sync | Automatic; no manual refresh |
| Scope | Only [[work-at-hand]] items; Live items appear only on [[category-cards|Category Card]] |
| Bronze | Same pattern—tasks appear on [[bronze-stack]] and home [[category-cards|Category Card]] |

---

## Edge Cases

**Click from [[category-cards|Category Card]] vs. [[the-table]]:**
Same result—opens [[project-board]]. Entry point doesn't matter.

**[[category-cards|Category Card]] collapsed:**
[[work-at-hand]] still counts in tally. Expanded view shows pulse indicator.

**Bronze tasks:**
Same pattern. Bronze task appears in [[bronze-stack]] AND on home [[category-cards|Category Card]] (e.g., "Schedule dentist" in [[bronze-stack]] and on Health card).

---

## Evolution

**Supersedes:** null (original design)

**Future:**
- Tune pulse animation prominence based on user feedback
- Consider mobile: does dual presence help or confuse on small screens?

---

## Open Questions

- [ ] Should pulse be more or less subtle?
- [ ] Mobile treatment: helpful or confusing?
