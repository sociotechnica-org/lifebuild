# Capability - Zoom Navigation

## WHAT: Definition

The scale control system for the Life Map, allowing directors to smoothly transition between landscape view (entire life visible) and detail view (individual tile focus). Semantic zoom means information density changes with scale — zoomed out shows less detail per tile.

## WHERE: Ecosystem

- Zone:
  - [[Zone - Life Map]] — where zoom navigation operates
- Uses:
  - [[Structure - Hex Grid]] — zoom changes tile rendering
  - [[Overlay - The Table]] — always visible regardless of zoom
- Enables:
  - [[Capability - Workspace Navigation]] — zoom is one dimension of spatial navigation
- Conforms to:
  - [[Standard - Visual Language]] — semantic zoom changes visual density per level

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — directors need both overview and detail
- Principle: [[Principle - Visibility Creates Agency]] — agency requires ability to change perspective
- Driver: Life is complex — directors need to zoom out for big picture, zoom in for action. Same space, different scales.
- Constraints: Zoom controls information density, not access. All data exists at every level — zoom reveals or conceals detail layers. The Table remains fixed size regardless of zoom.

## WHEN: Timeline

Core to Life Map design. Zoom behavior refined based on usability testing.

## HOW: Implementation

### Zoom Levels

| Level | Name | What's Visible | What's Hidden | Use Case |
|---|---|---|---|---|
| Far | Horizon View | All hex tiles as small icons, cluster shapes and distributions, category color patterns, The Table (always full size). Tiles show state color only, Work at Hand tiles show stream accent glow, Campfire visible as warm center point. | Tile titles (too small), progress indicators, health details, project images. | "Where is everything?" Cluster reorganization, seeing life balance across categories, finding isolated projects. |
| Mid | Working View | Tile titles (readable), project images (thumbnail), progress indicators, state treatments, The Table (always full size). Full visual language applies — category colors, stream accents, Work at Hand enhancement visible. | Full health indicator details, recent activity, task counts. | Daily navigation, finding specific projects, moving between clusters. Most interaction happens here. Default zoom level on session start. |
| Close | Detail View | Full tile contents, project images (larger), progress indicators with specifics, health indicators with details, recent activity snippet, task count (for projects), The Table (always full size). Maximum visual language detail, subtle animations for active items, health color gradients visible. | Nothing — maximum information density. | Examining specific tiles before clicking, comparing adjacent projects, checking health without opening System Board, focused work on a small cluster. |

### Controls

- Pinch/scroll to zoom
- Double-tap to toggle between levels
- The Table remains fixed size (always readable)

### Semantic Zoom

- Far: Title only, state color
- Mid: Title, image thumbnail, progress
- Close: Full tile detail, health indicators, recent activity

**Persistence:** Zoom level persists across sessions. Directors return to where they were.

**Transition:** From Detail View, clicking a tile opens Project Board or System Board overlay.

### Examples

- Director pinch-zooms out on Life Map → hex tiles shrink to colored icons → individual titles disappear → cluster shapes and category colors become the dominant visual → director sees the full landscape of their life at a glance.
- Director double-taps a cluster at Horizon level → zoom animates smoothly to Working level → tiles now show titles, image thumbnails, and progress indicators → director reads project names and states without opening any boards.

### Anti-Examples

- **Showing full tile detail (task lists, health metrics, activity logs) at Horizon zoom** — far zoom shows shapes, colors, and patterns. Rendering full detail at every level creates visual noise where the director needs landscape awareness.
- **Resetting zoom level when the director returns after closing the app** — zoom persists across sessions. Directors build spatial habits based on their preferred working perspective. Resetting destroys that muscle memory.
