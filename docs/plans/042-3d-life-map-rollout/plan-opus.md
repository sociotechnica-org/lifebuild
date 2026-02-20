> **Superseded by [plan-unified.md](./plan-unified.md).** This draft is kept for reference only.

# 3D Life Map — Technical Implementation Plan

## Overview

Replace the current `LifeMap.tsx` (8 CategoryCards in a CSS grid) with a 3D hex grid using Three.js + React Three Fiber, following the approach proven in `packages/hex-grid-prototype`. The map uses an orthographic (fixed-perspective) camera for a clean isometric look.

This plan covers the hex grid portion of Release 1 ("The Campfire"). Campfire/Jarvis/onboarding work is out of scope here — this plan focuses on: **grid renders, projects appear as hex tiles, placement UX, visual polish, sanctuary**.

---

## Architecture Decisions

### Rendering: Three.js + React Three Fiber (from prototype)

- **Three.js** via `@react-three/fiber` for the 3D hex grid
- **Orthographic camera** — fixed perspective, no distortion, isometric feel
- **Camera elevation: 31°** — tested in prototype, feels right for the smaller grid
- **CylinderGeometry** (6 segments) for pointy-top hexagons
- Custom shader materials for parchment/watercolor aesthetic (ported from prototype)
- Shader parameters provided by Jess, with a **per-user random seed** saved so the shader is consistent across loads
- Zustand for 3D-specific state (camera, selection, hover) — LiveStore for persistent data
- **Lazy loaded** via React.lazy + Suspense + Vite code splitting to manage Three.js bundle size (~300-500KB gzipped)

### Coordinate System: Cube Coordinates (from prototype)

- Cube coordinates `(q, r, s)` where `q + r + s = 0`
- Proven in prototype with math utilities, pathfinding, neighbor calculation
- Store `(q, r)` in LiveStore (s is derived)
- Pointy-top orientation matching the prototype

### Grid Size: 3-ring hex grid = 37 positions

- Matches the "~30-40 positions" spec from the release plan
- Rings 0-3: center hex + 3 surrounding rings
- Sanctuary occupies 3 hexes at center (ring 0 + 2 adjacent from ring 1)
- Leaves ~34 hexes available for projects — plenty for early builders

### Hex Positions: Separate Table

Hex positions stored in a **separate `hex_positions` table** (not columns on `projects`), because we may have far more than just projects on the map in the future (systems, landmarks, etc.).

| Column | Type | Notes |
|--------|------|-------|
| `id` | text (PK) | Position ID |
| `hexQ` | integer | Cube coordinate q |
| `hexR` | integer | Cube coordinate r |
| `entityType` | text | `'project'` for now, extensible |
| `entityId` | text | Foreign key to the entity |
| `placedAt` | integer | Timestamp |

Unique constraint on `(hexQ, hexR)` — one entity per hex.

### State Boundary: Zustand vs LiveStore

| State | Store | Why |
|-------|-------|-----|
| Hex positions (q, r) per entity | LiveStore | Persistent, syncs across devices |
| Shader random seed per user | LiveStore | Consistent across loads |
| Camera position/zoom | Zustand | Ephemeral, per-session |
| Hover state | Zustand | Ephemeral, per-frame |
| Selected hex | Zustand | Ephemeral, UI state |
| Placement mode | Zustand | Ephemeral, interaction state |
| Shader parameters | Hardcoded | Not user-configurable |

### Text Rendering: HTML Overlays

Use `@react-three/drei`'s `<Html>` component for project name labels on hex tiles. This is:
- Much cheaper than 3D text geometry
- Gives us CSS styling for free
- Provides Playwright-targetable DOM elements for E2E testing

### Where Code Lives

| Code | Location | Rationale |
|------|----------|-----------|
| Hex math utilities | `packages/shared/src/hex/` | Shared between web and potential server use |
| LiveStore events + materializer | `packages/shared/src/livestore/` | Existing pattern |
| React Three Fiber components | `packages/web/src/components/hex-map/` | Web-only rendering |
| Zustand stores (camera, interaction) | `packages/web/src/components/hex-map/stores/` | 3D state, co-located |

---

## PR Breakdown

### PR1: Three.js Hex Grid Shell (Visual Foundation)

**Goal:** A 3D hex grid renders in the app. No project data yet. Just the visual canvas replacing the category cards on desktop.

**What ships:**
- Add `three`, `@react-three/fiber`, `@react-three/drei` to `packages/web`
- Port hex math utilities from prototype to `packages/shared/src/hex/` (types, math, grid generation)
- Create `packages/web/src/components/hex-map/HexMap.tsx` — the new top-level component
  - React Three Fiber `<Canvas>` with orthographic camera at 31° elevation
  - Warm lighting (ambient + directional + hemisphere, matching prototype)
  - `<CameraRig>` for fixed-angle orthographic view (no user pan/zoom yet)
  - `<HexGrid>` renders 37 hex cells as CylinderGeometry with basic materials
  - **Edge-to-edge canvas** — no padding/margins, fills available space above the Table bar
- Wire `HexMap` into the LifeMap route, replacing CategoryCards on desktop
- **Mobile fallback**: Keep existing CategoryCard view below a breakpoint (e.g., 768px)
- **List/Map toggle**: Add a toggle in the nav area so desktop users can switch between the old CategoryCard layout and the new hex map
- Lazy load the HexMap component (React.lazy + Suspense) with a loading state
- Basic hex cell appearance: flat color, subtle edge darkening, hover highlight
- Unit tests for hex math (port from prototype)
- **Storybook stories** for HexMap component (Canvas + LiveStoreProvider wrapper)

**Key files created:**
```
packages/shared/src/hex/types.ts
packages/shared/src/hex/math.ts
packages/shared/src/hex/grid.ts
packages/web/src/components/hex-map/HexMap.tsx
packages/web/src/components/hex-map/HexGrid.tsx
packages/web/src/components/hex-map/HexCell.tsx
packages/web/src/components/hex-map/CameraRig.tsx
```

**Does NOT include:** Project data, click navigation, placement, shaders, sanctuary.

---

### PR2: LiveStore Hex Events + Project Tiles

**Goal:** Projects appear as hex tiles on the grid. Clicking a hex navigates to the project. Unplaced projects are visible.

**What ships:**
- New LiveStore event: `hexPosition.placed { id, hexQ, hexR, entityType, entityId, actorId, placedAt }`
- New LiveStore event: `hexPosition.removed { id, actorId, removedAt }`
- New `hex_positions` table with materializer (unique constraint on `(hexQ, hexR)`)
- New query: `getHexPositions$` — returns all placed entities with coordinates
- New query: `getUnplacedProjects$` — returns projects without a hex position
- `HexTile` component: renders project name (truncated via `<Html>` overlay) + category-colored top face
- Click on occupied hex → `navigate(preserveStoreIdInUrl(generateRoute.project(projectId)))`
- **Unplaced projects panel**: A collapsible sidebar/drawer listing projects that need placement
  - Shows project name + category color dot
  - Count badge visible when collapsed
- **Archived projects**: When a project is archived, its hex position is **removed** (freed for reuse)
- **Completed projects**: Keep their hex position, rendered as greyed-out decorative tiles (not clickable)
- Storybook stories for HexTile, UnplacedPanel

**Key files created/modified:**
```
packages/shared/src/livestore/events.ts          (add hex position events)
packages/shared/src/livestore/schema.ts           (add hex_positions table)
packages/shared/src/queries.ts                    (add hex queries)
packages/web/src/components/hex-map/HexTile.tsx
packages/web/src/components/hex-map/UnplacedPanel.tsx
```

---

### PR3: Hex Placement UX

**Goal:** Builder can place unplaced projects onto empty hexes. Manual, no suggestions, no auto-place (per D1).

**What ships:**
- **Click-click placement**: Builder clicks a project in the unplaced panel → enters placement mode → clicks empty hex to place
- **Visual feedback**: Empty hexes highlight (subtle glow/outline) to show they're available during placement mode
- Selected project name shown as floating label near cursor / on hover
- Click empty hex → commits `hexPosition.placed` event → tile appears
- **Validation**: Can't place on occupied hex or sanctuary hexes (visual indication: hex shows as unavailable)
- **Cancel**: Escape key or click away exits placement mode
- **Removal**: Click a placed hex tile to select it, then click a "Remove from map" button in the unplaced panel/drawer to free the position
- Zustand store for placement interaction state (selectedProjectForPlacement, isPlacing)
- **Simple guided flow for first-time map users**: Non-interactive prompt ("Your projects are ready to be placed on your new map") with the unplaced panel open. Note: this needs to dovetail with the eventual Jarvis campfire/walk onboarding sequence — keep it simple and replaceable.

**Key files created/modified:**
```
packages/web/src/components/hex-map/stores/placementStore.ts
packages/web/src/components/hex-map/HexMap.tsx    (placement mode integration)
packages/web/src/components/hex-map/HexCell.tsx   (placement target highlighting)
packages/web/src/components/hex-map/UnplacedPanel.tsx (project selection + removal)
```

---

### PR4: Visual Treatments + State Indicators

**Goal:** Hex tiles visually communicate project state (planning/active/completed, Work at Hand) through color, saturation, and effects.

**What ships:**
- **Category-colored hex borders**: Top-face edge ring in category color (from `PROJECT_CATEGORIES[].colorHex`)
- **State-based saturation** (from Standard - Project States):
  - Planning: 60% saturation, muted
  - Active (not on Table): Full saturation
  - Work at Hand (Gold/Silver/Bronze on Table): Full saturation + stream-colored glow (gold `#d8a650` / silver `#c5ced8` / bronze `#c48b5a`) — tune intensity by feel
  - Completed: Greyed out, low saturation, not clickable
- **Hover state**: Slight elevation + brightness increase (only on active/planning tiles)
- Integrate with existing `resolveLifecycleState()` and Table config queries
- Update HexTile to read lifecycle state and table status

**Key files modified:**
```
packages/web/src/components/hex-map/HexTile.tsx
packages/web/src/components/hex-map/HexCell.tsx
```

---

### PR5: Parchment Shader + Aesthetic Polish

**Goal:** The hex grid looks and feels like a hand-drawn parchment map. Warm, organic, inviting.

**What ships:**
- Port parchment shader from prototype to web package
- Apply shader parameters provided by Jess (specific values TBD — will be supplied)
- **Per-user random seed**: Saved in LiveStore so the shader noise pattern is consistent across loads for each user
- Apply to hex cell base material (the "ground" of each hex)
- Warm lighting refinement
- Background plane beneath the hex grid (parchment texture, extends beyond grid)
- Subtle edge darkening between hex cells
- Ambient occlusion or shadow approximation for depth
- Performance target: 60fps on a 2020 MacBook Air

**Key files created/modified:**
```
packages/web/src/components/hex-map/shaders/parchmentShader.ts
packages/web/src/components/hex-map/HexCell.tsx (shader material swap)
packages/web/src/components/hex-map/BackgroundPlane.tsx
```

---

### PR6: Sanctuary Structure

**Goal:** The sanctuary (Humble Studio) renders as a distinct 3-hex structure at the center of the grid.

**What ships:**
- Sanctuary occupies 3 hexes: `(0, 0)`, `(0, -1)`, `(1, -1)` — compact triangle cluster at grid center
- Distinct visual treatment — warm, "home" feeling, not a regular hex tile
- **Visually merged geometry** — try connected/merged look, flag PR for visual review
- Not occupiable by regular projects (reserved hexes, validated in placement)
- Clickable → opens Jarvis chat overlay (Jarvis replacement of Mesa is a separate work stream)
- Visual design: warm glow, slightly elevated, distinct material/texture

**Key files created:**
```
packages/web/src/components/hex-map/Sanctuary.tsx
```

**Note:** Flag this PR for visual review — the merged vs grouped question should be decided by looking at it.

---

### PR7: Navigation, Routing, and Polish

**Goal:** The hex map is fully integrated as the default app view. Clean transitions, proper routing, mobile fallback finalized.

**What ships:**
- Map as default route (already wired in PR1, but polish here)
- Smooth transitions when entering/leaving the map
- Loading state while hex data loads
- Empty state: just the sanctuary on an empty grid (no projects placed yet)
- Nav links to Drafting Room and Sorting Room still accessible (already in shell, verify)
- **Mobile fallback**: Old CategoryCard layout below breakpoint
- **List/Map toggle** polish (from PR1) — ensure it persists preference
- Responsive canvas sizing
- Keyboard accessibility considerations
- PostHog analytics: `hex_map_viewed`, `hex_tile_clicked`, `project_hex_placed`

---

## Sequencing Summary

```
PR1: Three.js Hex Grid Shell ──────────────────────┐
  (visual foundation, no data)                      │
                                                    │
PR2: LiveStore Hex Events + Project Tiles ──────────┤
  (projects on the grid, click navigation)          │
                                                    │
PR3: Hex Placement UX ─────────────────────────────┤
  (builder places projects manually)                │
                                                    │
PR4: Visual Treatments + State Indicators ──────────┤  (these 3 can
  (category colors, lifecycle states)               │   partially
                                                    │   parallelize)
PR5: Parchment Shader + Aesthetic Polish ───────────┤
  (the map looks beautiful)                         │
                                                    │
PR6: Sanctuary Structure ───────────────────────────┤
  (3-hex home at center)                            │
                                                    │
PR7: Navigation, Routing, Polish ───────────────────┘
  (final integration, mobile, analytics)
```

PRs 1-3 are strictly sequential (each builds on the last).
PRs 4, 5, 6 can be done in parallel after PR3 (they're independent visual work).
PR7 is the final integration pass.

---

## Storybook Strategy

Storybook stories are critical for visual testing of 3D components. Each PR should include stories.

**Setup:** Stories wrap components in both `<LiveStoreProvider>` (with boot functions creating test data) and Three.js `<Canvas>`. May need a shared decorator/wrapper.

**Story coverage per PR:**
- PR1: HexMap (empty grid), HexCell (hover states)
- PR2: HexTile (with project data), UnplacedPanel (with/without projects)
- PR3: Placement mode (visual feedback states)
- PR4: State treatments (planning/active/WaH/completed side-by-side)
- PR5: Shader aesthetics (before/after)
- PR6: Sanctuary (visual review)

---

## What This Plan Does NOT Cover

- Campfire element / onboarding flow (depends on D5 story structure decision)
- Jarvis agent / Council Chamber overlay (separate work stream)
- Walk animation (campfire → sanctuary)
- Drag-to-rearrange hex tiles (Release 2)
- Semantic zoom levels (Release 2)
- Image generation on tiles (Release 2)
- Infinite canvas (Release 2)
- Agent cleanup / removal of category room agents (separate PR track)
- System tiles (only project tiles in R1)
