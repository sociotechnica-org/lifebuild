# Strategy - Spatial Visibility

## WHAT: The Strategy

Making work visual, placed, and traversable creates comprehension and agency that lists and abstractions cannot. This is Strategic Plank 1 — the first of three independent bets LifeBuild is built on.

## WHERE: Ecosystem

- Type: Strategic Bet
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

## Tensions

- With information density — too much visible creates noise; resolution is zoom levels and progressive detail
- Independent from other planks — can succeed or fail independently of Process and AI Team bets
