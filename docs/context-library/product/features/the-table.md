---
title: The Table
type: feature
ca-when: present

ca-where:
  zone: '[[life-map]]'
  parent: null
  dependencies:
    - '[[priority-queue]]'
    - '[[work-at-hand]]'
    - '[[three-stream-model]]'
  components:
    - '[[gold-slot]]'
    - '[[silver-slot]]'
    - '[[bronze-stack]]'

ca-why:
  strategy-links:
    - '[[visual-work]]'
  signal: null
  pressure: null
  rationale: 'Persistent visibility into current commitments reduces context switching and prevents priority drift'

last-verified: 2026-01-22
---

# The Table

A persistent visual spotlight at the top of [[life-map]] showing current priorities across three streams defined by [[three-stream-model]]. The Table displays the director's active commitments: one transformative project ([[gold-slot]]), one infrastructure project ([[silver-slot]]), and operational tasks ([[bronze-stack]]). It remains visible at all navigation altitudes, ensuring directors never lose sight of what matters most.

---

## Why It Exists

**Strategy:** [[visual-work]]
The Table is the primary implementation of [[visual-work]] strategy. By keeping priorities persistently visible—never scrolling away, never hidden behind navigation—we prevent the "out of sight, out of mind" problem that causes priority drift. Directors always know what they're working on without hunting through lists or remembering what they committed to.

**Driver:** Observed behavior pattern
Directors using list-based systems frequently lost track of weekly commitments. By Friday, they'd completed tasks that felt urgent but forgotten the important work they'd chosen on Monday. The Table makes that forgetting impossible—priorities are always in view.

**Design Rationale:**
Three positions (not 2, not 5) balances focus with flexibility. Early testing showed:

- 2 positions felt too constraining ("But I have three important things!")
- 5 positions created decision paralysis and diluted focus
- 3 maps naturally to [[three-stream-model]]: transformation, leverage, operations

---

## How It Works

### Layout

Three positions arranged left-to-right:

| Position                 | Content                             | Visual Treatment                                                               |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------ |
| [[gold-slot]] (left)     | One transformative project OR empty | Stream-colored accent glow tied to [[three-stream-model]], breathing animation |
| [[silver-slot]] (center) | One infrastructure project OR empty | Stream-colored accent glow tied to [[three-stream-model]], breathing animation |
| [[bronze-stack]] (right) | 3+ operational tasks                | Stacked cards, expandable                                                      |

### User Interaction

**Clicking [[gold-slot]] or [[silver-slot]] project:**

- Opens [[project-board]] overlay (Execution Altitude)
- Shows kanban board with project tasks
- Can work on tasks, mark complete, or pause project

**Clicking [[bronze-stack]]:**

- Expands to show all operational tasks in [[bronze-stack]]
- Click individual tasks to mark complete
- Can reorder tasks within stack

**Empty slots:**

- Display muted outline in stream color
- Text: "No Gold/Silver work this week" (stream names from [[three-stream-model]])
- Strategic emptiness is valid—not a failure state

### Visual States

[[work-at-hand]] projects receive enhanced treatment:

| Property  | Normal Live             | [[work-at-hand]]                               |
| --------- | ----------------------- | ---------------------------------------------- |
| Image     | Standard stage          | Polish stage (evolved)                         |
| Glow      | None                    | Stream-colored based on [[three-stream-model]] |
| Animation | None                    | Subtle breathing pulse                         |
| Location  | [[category-cards]] only | [[the-table]] + [[category-cards]]             |

---

## Related Features

**Prerequisites:**

- [[sorting-room]] — where directors select what appears on The Table
- [[priority-queue]] — source of all candidates; items must complete Stage 4 before eligibility

**Complements:**

- [[category-cards]] — [[work-at-hand]] items appear on both The Table and their home card via [[dual-presence]]
- [[life-map]] — The Table is the persistent anchor within this zone

**Enables:**

- [[dual-presence]] — the pattern of showing [[work-at-hand]] in multiple locations
- [[project-board]] overlays — clicking [[the-table]] items opens execution interface

---

## Components

- [[gold-slot]] — leftmost position; renders single transformative project or empty state
- [[silver-slot]] — center position; renders single infrastructure project or empty state
- [[bronze-stack]] — rightmost position; renders expandable stack of operational tasks

---

## Dependencies

**Requires:**

- [[priority-queue]] — all [[the-table]] items sourced from [[priority-queue]] via [[sorting-room]] selection
- [[work-at-hand]] — status that determines what appears on [[the-table]]
- [[three-stream-model]] — conceptual framework defining stream identities

**Enables:**

- [[dual-presence]] — [[work-at-hand]] items render on [[the-table]] AND home [[category-cards]]

---

## Constraints

| Constraint                          | Limit         | Rationale                                  |
| ----------------------------------- | ------------- | ------------------------------------------ |
| [[gold-slot]]                       | Max 1 project | Focus on single transformative priority    |
| [[silver-slot]]                     | Max 1 project | Focus on single leverage-building priority |
| [[bronze-stack]]                    | Min 3 tasks   | Ensures operational work isn't neglected   |
| Duplicates                          | None          | Same item cannot occupy multiple positions |
| Empty [[gold-slot]]/[[silver-slot]] | Allowed       | Strategic emptiness is valid choice        |

---

## Edge Cases

**All slots empty:**
Valid but unusual. Director needs to visit [[sorting-room]] to activate priorities. Table shows empty indicators with messaging guiding toward activation.

**[[bronze-stack]] has 50+ tasks:**
[[bronze-stack]] shows manageable view (top 3 visible, count indicator, expandable). Mode settings (Minimal/Target/Maximal) help directors control how many tasks surface.

**A Gold stream project from [[three-stream-model]] completes mid-week:**
Slot becomes empty immediately. Director can:

- Visit [[sorting-room]] to activate the next Gold candidate in [[priority-queue]]
- Leave empty until next planning session
- No automatic replacement (intentional—maintains director agency)

**Pause from Table:**
Clicking Pause on [[project-board]] returns item to [[priority-queue]] (top of relevant filter). Slot becomes empty. Progress preserved for later resumption.

---

## Evolution

**Supersedes:** null (original design for LifeBuild)

**Future:**

- Quick-add to [[bronze-stack]] directly from [[the-table]] (reduces friction for capturing small tasks)
- Mini progress rings on [[gold-slot]]/[[silver-slot]] items showing completion percentage
- Drag-and-drop reordering within [[bronze-stack]]

---

## Open Questions

- [ ] Should [[the-table]] show time estimates? (e.g., "~2 hours of work from [[bronze-stack]]")
- [ ] How prominent should empty slot messaging be? Current approach is subtle; consider coaching new users more actively.
- [ ] Mobile treatment: same three-column layout or stacked?
