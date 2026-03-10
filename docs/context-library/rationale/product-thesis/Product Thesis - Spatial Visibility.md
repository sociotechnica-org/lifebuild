# Product Thesis - Spatial Visibility

## WHAT: The Thesis

Making work visual, placed, and traversable creates comprehension and agency that lists and abstractions cannot. This is Plank 1 — the first of three independent bets LifeBuild is built on.

Counter-thesis: Spatial representation is a novelty that wears off. Lists and search are faster for task execution; spatial views add visual appeal but not comprehension advantage. The brain's spatial memory systems help with physical navigation, not abstract project management — the analogy doesn't transfer.

## WHERE: Ecosystem

- Type: Product Thesis (Plank)
- Parent: [[Product Thesis - The Organized Life]]
- Problem: [[Product Thesis - Organizational Life]]
- Implementing principles: [[Principle - Visibility Creates Agency]], [[Principle - Visual Recognition]]
- Governs: [[Zone - Life Map]], [[Structure - Hex Grid]], [[Overlay - The Table]], [[Capability - Zoom Navigation]], [[Room - Project Board]], [[Room - System Board]]
- Zoom tiers: [[Capability - Zoom Navigation]]
- Visual elements: [[Component - Hex Tile]], [[Component - Campfire]], [[System - Clustering]]

## WHY: Belief

Our commitments — both present and future — are largely abstract. We don't have a clear picture of what we're actually committed to, what state our work is in, or what our future will look like if we follow through. This isn't just about the future being uncertain; we don't have a clear sense of the present either.

Most productivity tools compound this by treating work as lists, databases, or inboxes — abstract containers that require cognitive effort to translate into meaning. You have to _think_ about your work to understand it. You can't _see_ it.

The bet: if work is represented spatially, visually, and traversably — like a place you can visit rather than a list you parse — builders will develop deeper, broader understanding of their present and future, leading to better decisions and greater agency.

Research supports this: the brain's spatial processing and memory systems share neural infrastructure. When you organize information spatially and navigate that space, you engage hippocampal circuits that consolidate long-term memory. Navigable environments outperform static spatial organization because movement through space activates the full spatial memory system. The brain's own coordinate system is hexagonal — grid cells in the entorhinal cortex fire in hex patterns.

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-10):** Between Level 0 and 1 of the maturity ladder. Life Map shows category cards in a flat grid, Kanban boards exist for projects. No hex grid, no hex tiles, no zoom navigation, no spatial indicators. The spatial bet is largely unrealized — current UI is closer to lists + cards than spatial landscape.
**Reality note (2026-02-24):** A prototype demonstrates Level 2-3 spatial capabilities. Illustrated tiles, camera-based navigation, and visual texture are proven. The assumption that "graphics will be difficult" -- which drove deferral of spatial features to later releases -- is no longer accurate. R1 can deliver an illustrated map from day one. R2's sprite gallery is substantially de-risked. The sequence from Level 2 to Level 3 is faster than the original roadmap assumed.

## HOW: Application

### Maturity Ladder

| Level | Name                    | What It Is                                              |
| ----- | ----------------------- | ------------------------------------------------------- |
| 0     | Status Quo              | Lists, databases, inboxes                               |
| 1     | Minimally Viable        | Kanban board + backlogs                                 |
| 2     | Placed & Illustrated    | Hexmap Life Map with visual indicators (current target) |
| 3     | Immersive & Navigable   | Game engine environment, 3D traversal                   |
| 4     | Hybrid Physical/Digital | AR integration, work in physical space                  |

**Current state:** Level 1-2. Hexmap with flat illustrations in development.

### What Following This Looks Like

- A builder opens the Life Map and immediately sees the state of all their projects as hex tiles with visual status indicators — no clicking, no parsing, no mental translation required.
- Zoom levels match intent: Horizon View for big-picture scanning, Working View for current priorities, Detail View for deep focus on a single project. Information density scales with attention.
- Work has a persistent, visible place on the map. A builder can point to where a project lives, remember it by location, and notice when something looks different — the same way you'd notice a change in a familiar room.

### What Violating This Looks Like

- **Defaulting to list or feed views** — Lists and inboxes are Level 0. If the primary view of work is a scrollable list, the spatial bet has failed. Builders should browse a landscape, not parse a feed.
- **Hiding work behind menus or hover states** — Spatial visibility means work has a persistent, visible place. Requiring clicks to reveal status or hover to see details moves work back into abstraction. Default to showing.
- **Flat spatial layout without zoom levels** — A hex grid with no zoom tiers dumps all information at the same density. Horizon View, Working View, and Detail View exist because information needs vary by intent. No zoom means no information hierarchy.

### Decision Heuristic

When choosing between abstract representation and spatial/visual representation, always choose spatial — comprehension through seeing and navigating beats comprehension through reading and thinking.

## Validation Criteria

To validate the spatial bet, measure whether spatial representation creates comprehension advantages over abstract representation, and whether those advantages persist at scale.

- **A/B comprehension test:** Show the same portfolio of 12+ projects in spatial view vs. list view. Ask "what's stalled?" "what's your highest priority?" "what did you forget about?" Measure time-to-answer and accuracy. Target: spatial users answer faster and catch more forgotten/stalled items.
- **Reversion tracking:** After 30 days of access to both spatial and list views, what percentage of sessions begin in spatial view? Target: >60%. If users consistently navigate to list view first, the spatial bet isn't delivering enough value to change default behavior.
- **Scale breakpoint:** At what project count does spatial comprehension degrade? Test at 5, 15, 30, and 50+ active items. If spatial advantage disappears below 20 projects, the thesis holds only for power users — which may not be a large enough market.
- **Recall test:** After a week away, ask users to name their active projects and their status from memory. Compare spatial-primary users vs. list-primary users. Spatial memory encoding predicts that spatial users recall more items and more accurate status.
- **"I forgot about that" metric:** Track how often users rediscover stalled or forgotten work through spatial browsing that they didn't find through list/search. This is the unique spatial value — ambient awareness through presence rather than active querying.
- **Invalidation signal:** Users consistently prefer list/search views, spatial comprehension doesn't outperform lists in controlled tests, or the advantage disappears below a project count that represents most users.

## Tensions

- With information density — too much visible creates noise; resolution is zoom levels and progressive detail
- Independent from other planks — can succeed or fail independently of Process and AI Team bets
