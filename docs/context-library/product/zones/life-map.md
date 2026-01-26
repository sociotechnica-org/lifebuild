---
title: Life Map
type: zone
ca-when: present

ca-where:
  parent: null
  adjacent-zones:
    - '[[strategy-studio]] — planning workspace for project creation and priority selection'
  contains:
    - '[[the-table]]'
    - '[[category-cards]]'

ca-why:
  strategy-links:
    - '[[visual-work]]'
  rationale: "Primary execution workspace making all of life's work spatially visible"

last-verified: 2026-01-22
---

# Life Map

The primary execution workspace where Directors spend the majority of their time. The Life Map displays all projects spatially organized across eight life domains, with current priorities always visible via [[the-table]] at the top. Directors can navigate between altitude levels while maintaining awareness of their commitments.

---

## What It Contains

### Primary Elements

- [[the-table]] — persistent priority spotlight showing work across [[three-stream-model]]; always visible at top regardless of navigation depth
- [[category-cards]] — eight cards arranged in a grid, each representing a major life domain (Health, Purpose, Finances, Relationships, Home, Community, Leisure, Personal Growth)

### Navigation System

Three altitude levels:

- **Overview Altitude** — default view; all 8 [[category-cards|Category Cards]] visible with [[the-table]] at top
- **Domain Altitude** — single category fills 80% of screen; adjacent categories dimmed; [[the-table]] remains visible
- **Execution Altitude** — [[project-board]] overlay; background dimmed but visible for spatial context

---

## Why It Exists

**Strategy:** [[visual-work]]
The Life Map embodies [[visual-work]] by making all projects spatially organized and persistently visible. Rather than hiding work in lists or folders, the Life Map presents everything in a navigable landscape. Directors develop spatial memory ("my health projects are top-left") and never lose sight of priorities.

**User Need:**
Directors need a place to:

1. See all their work across life domains at a glance
2. Know what they're committed to right now ([[the-table]])
3. Work on projects without losing context of the whole

---

## User Journey

1. **Enter Life Map** — see Overview Altitude with [[the-table]] showing current priorities and all 8 [[category-cards]] below
2. **Scan priorities** — [[the-table]] answers "what am I working on right now?"
3. **Work on priority** — click project on [[the-table]] to open [[project-board]] overlay (Execution Altitude)
4. **Complete tasks** — move tasks through kanban columns (To Do → In Progress → Done)
5. **Return to overview** — ESC or click outside to close overlay
6. **Explore domains** — click [[category-cards|Category Card]] to zoom into that domain (Domain Altitude)
7. **Navigate freely** — move between altitudes; [[the-table]] always visible as anchor

---

## Boundaries

### This zone is responsible for:

- Displaying all projects across all life domains
- Showing current priorities via [[the-table]]
- Enabling project execution (kanban boards via [[project-board]] overlays)
- Spatial navigation between life domains
- Visual state representation (Live, Plans, Paused, [[work-at-hand]])

### This zone is NOT responsible for:

- Project creation → see [[strategy-studio]] / [[drafting-room]]
- Priority selection → see [[strategy-studio]] / [[sorting-room]]
- Worker staffing → see [[strategy-studio]] / [[roster-room]]
- Historical analysis → see [[archives]] (future)

---

## Adjacent Zones

- [[strategy-studio]] — Directors move here when planning: creating projects ([[drafting-room]]), selecting priorities ([[sorting-room]]), or staffing workers ([[roster-room]]). Return to Life Map after planning completes.
- [[archives]] — (future) Directors will visit for historical reflection and pattern analysis.

---

## Visual Design

The Life Map embodies LifeBuild's design philosophy:

- **Contemplative aesthetics** — warm neutrals, generous spacing, calm atmosphere
- **Dignified gamification** — progress rings, visual states, respects adult intelligence
- **Tactile digital materials** — cards feel graspable, buttons pressable
- **Always-visible priorities** — [[the-table]] never scrolls away

---

## Open Questions

- [ ] Mobile navigation: same three altitudes or simplified?
- [ ] Should Overview show project counts or thumbnails on [[category-cards]]?
