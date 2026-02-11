# Principle - Visibility Creates Agency

## WHAT: The Principle

Directors can't control what they can't see — spatial visibility creates comprehension and agency that lists and abstractions cannot.

## WHERE: Ecosystem

- Type: Design Principle
- Serves: [[Need - Autonomy]] — can't control what you can't see
- Advances: [[Strategy - Spatial Visibility]]
- Governs: [[Zone - Life Map]], [[Overlay - The Table]], [[Structure - Hex Grid]], [[Capability - Zoom Navigation]], [[Room - Project Board]], [[Room - System Board]]
- Zoom tiers: [[Capability - Zoom Navigation]]
- Related: [[Principle - Visual Recognition]] — visibility must also be instantly legible

## WHY: Belief

Most productivity tools treat work as lists, databases, or inboxes — abstract containers requiring cognitive effort to translate into meaning. You have to _think_ about your work to understand it. You can't _see_ it.

The Life Map resolves the tension between comprehensiveness and clarity through spatiality, not suppression. Everything has a place. The director browses their landscape rather than parsing a feed. This is why LifeBuild uses a spatial metaphor (territory map) rather than a temporal metaphor (timeline, feed, inbox).

Research supports this: Kaplan & Kaplan's Attention Restoration Theory (1989) shows spatial environments create "soft fascination" that reduces cognitive load. The brain's spatial processing and memory systems share neural infrastructure — organizing information spatially engages hippocampal circuits that consolidate long-term memory.

The corollary is critical: hiding work removes agency. Defaults should show, not hide. Filters should be opt-in, not opt-out. The director should always answer "where is my stuff?" at a glance.

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-10):** The Table shows Gold/Silver/Bronze simultaneously (follows principle). Life Map shows category cards in a flat grid. But no hex grid, no zoom navigation, no spatial indicators — the spatial dimension of "visibility" is largely unrealized. Current UI is more list/card-based than landscape-based.

## HOW: Application

When designing any feature that displays work, prefer spatial organization over temporal feeds or abstract lists. When considering whether to hide or show information, default to showing — use spatial organization to manage complexity, not suppression.

### What Following This Looks Like

- A director opens the Life Map and immediately sees all 14 of their active projects arranged spatially — health cluster in one area, work projects in another, creative pursuits grouped nearby. They grasp the full landscape in seconds without clicking into anything.
- The Table shows Gold, Silver, and Bronze positions simultaneously. The director sees their entire weekly commitment at a glance — no tabs, no drill-downs, no "show more" buttons hiding work behind interactions.
- A director zooms out on the hex grid and notices a cluster of stalled projects they'd forgotten about. The spatial presence of those hexes reminded them — a list view where completed items scroll off-screen would have buried the same information.

### What Violating This Looks Like

- **Hiding work behind menus or click-through navigation** — The corollary is explicit: hiding work removes agency. If the director must click into a submenu, hover over an icon, or remember where something lives, the work has become invisible. Defaults should show, not hide.
- **Using temporal feeds instead of spatial organization** — Timelines, activity feeds, and inboxes sort by when, not where. The director should answer "where is my stuff?" at a glance — not "what happened recently?"
- **Opt-out filters as default** — Filters that hide work by default and require the director to turn them off violate the principle. Filters should be opt-in: the director chooses to narrow, not to reveal.

### Tensions

- With [[Principle - Protect Transformation]] — showing everything risks overwhelm; resolution is spatial organization, not suppression
- With information density — too much visible creates noise; resolution is zoom levels and progressive detail

### Test

Can the director see and find this without hovering, clicking through menus, or remembering it exists?
