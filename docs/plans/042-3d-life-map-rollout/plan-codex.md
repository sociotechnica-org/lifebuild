# 042: 3D Life Map Rollout Plan (Orthographic Hex Map)

## Goal

Replace desktop `LifeMap` cards with a fixed-perspective, orthographic 3D hex map using the implementation approach proven in `packages/hex-grid-prototype`, then ship map capabilities in small PRs until Release 1 Campfire map requirements are met.

## Why This Plan

- The current `packages/web/src/components/life-map/LifeMap.tsx` is category-card based and does not support the campfire-to-sanctuary spatial metaphor.
- The prototype already validates the core rendering stack: React + Three.js via `@react-three/fiber`, orthographic camera rig, hex math utilities, and sprite overlays.
- We want a fast vertical slice first, then incremental expansion to full R1 map behavior.

## Scope And Constraints

- Desktop-first 3D map for `/life-map`.
- Mobile fallback remains card-based.
- Fixed map size for R1 (no infinite pan/scroll).
- No semantic zoom for R1.
- One project per hex (sanctuary is the 3-hex exception).
- Manual placement from day one (no auto-placement or suggested positions).
- Keep existing navigation to Drafting Room and Sorting Room.
- Keep map as default route.

## Decision Record

- Prior docs describe an SVG-first map foundation.
- For this implementation track, we are explicitly choosing the Three.js approach proven in `packages/hex-grid-prototype`.
- We keep the same product constraints from Release 1 (fixed map size, no semantic zoom, manual placement), but change rendering tech from SVG to React + Three.js.

## Architectural Baseline

### Rendering Stack

- Add `three`, `@react-three/fiber`, and `@react-three/drei` to `@lifebuild/web`.
- Use a dedicated `LifeMap3D` scene component mounted from `LifeMap.tsx`.
- Use orthographic `Canvas` with fixed perspective camera defaults.
- Disable free user pan/zoom for R1; only scripted camera movement (for walk transitions) is allowed.
- Reuse prototype patterns:
  - `hex/math.ts` for coordinate conversion and rounding.
  - `hex/grid.ts` for fixed map coordinate generation.
  - `CameraRig` concept adapted to app UX requirements.

### Web App Integration

- Keep `RoomLayout` and `NewUiShell` as parent shell; map runs inside the existing Life Map route.
- Add a desktop map + mobile cards split in `LifeMap.tsx` to avoid blocking rollout.
- Keep room chat and existing nav chrome operational through rollout.

### Data Model Direction

- Add a new event for placement, e.g. `v4.ProjectHexPlaced`.
- Persist `hexQ` and `hexR` on `projects` rows (nullable for unplaced projects).
- Enforce one-project-per-hex at command layer with explicit conflict handling UI.
- Introduce queries/selectors for:
  - placed projects,
  - unplaced projects,
  - occupancy lookup by hex coordinate.

## PR Sequence

| PR Name | Outcome | Ship Criteria |
| --- | --- | --- |
| Map Foundation | 3D map foundation renders on `/life-map` | Orthographic hex terrain visible on desktop behind flag; mobile still uses cards |
| Hex Data + Tiles | Hex persistence + real project tiles | Placement event/materializer/queries shipped with project tile rendering and click-through navigation |
| Project Placement | Manual placement workflow works | Unplaced project can be selected and placed onto empty hex with validation |
| Table Overlay | Table overlays map cleanly | Table appears as map overlay with responsive behavior and no shell regressions |
| Landmarks | Sanctuary/campfire landmarks in scene | Sanctuary center and campfire edge render with reserved-hex rules |
| Campfire Walk Hooks | Walk and first-run map transitions | Campfire->sanctuary camera transition and first-run routing hooks integrate |
| Hardening | Hardening and cleanup | Performance pass, telemetry, e2e coverage, and legacy desktop-card cleanup |

## PR Details

### Map Foundation (Fast Vertical Slice)

Files expected:
- `packages/web/src/components/life-map/LifeMap.tsx`
- `packages/web/src/components/life-map/three/*`
- `packages/web/package.json`

Implementation:
- Add scene shell with fixed-size hex grid mesh.
- Orthographic camera with locked perspective defaults.
- Feature flag: `VITE_LIFE_MAP_3D_ENABLED` to stage rollout safely.
- Desktop-only render path; preserve current card layout on mobile.

Tests:
- Unit tests for grid generation and coordinate transforms.
- Storybook story showing empty 3D map in `RoomLayout`.

### Hex Data + Tiles

Files expected:
- `packages/shared/src/livestore/events.ts`
- `packages/shared/src/livestore/schema.ts`
- `packages/shared/src/livestore/queries.ts`
- `packages/shared/src/index.ts` and exports as needed
- `packages/web/src/components/life-map/LifeMap.tsx`
- `packages/web/src/components/life-map/three/ProjectHexTile.tsx`
- `packages/web/src/components/life-map/three/useLifeMapSceneState.ts`

Implementation:
- Add project hex placement event.
- Add `hexQ`/`hexR` columns to `projects`.
- Add materializer update path for placement.
- Add read queries for placed/unplaced projects.
- Add a command helper that validates target hex is free before committing.
- Bind placed projects to scene coordinates.
- Render title, category border color, and basic lifecycle style.
- Click on occupied hex navigates to `generateRoute.project(projectId)`.
- Preserve existing archived/completed access path (no feature regression).

Tests:
- Shared package tests for materialization and occupancy rules.
- Regression checks for existing project create/update flows.
- Storybook states: empty placed map, mixed categories, long titles, lifecycle variants.
- UI tests for click-through navigation.

### Project Placement

Files expected:
- `packages/web/src/components/life-map/placement/*`
- `packages/web/src/components/life-map/LifeMap.tsx`

Implementation:
- Add unplaced-project tray/panel.
- Select project, then click empty hex to place.
- Reject occupied and reserved hexes with clear feedback.
- Persist placement via placement event.
- Support first-time migration of existing projects (all initially unplaced).

Tests:
- Unit tests for placement reducer/helpers.
- E2E: place project, refresh, verify persistence.

### Table Overlay

Files expected:
- `packages/web/src/components/life-map/*`
- `packages/web/src/components/layout/NewUiShell.tsx` (if shell hooks needed)

Implementation:
- Render table as overlay layer above map scene.
- Ensure chat panel, table, and map input layering are stable.
- Keep desktop and mobile behavior consistent with route shell.

Tests:
- Visual regression stories for overlay + chat open/closed.
- E2E smoke for map + table interaction.

### Landmarks

Files expected:
- `packages/web/src/components/life-map/three/Landmarks.tsx`
- `packages/web/public/...` (if static art assets are introduced)

Implementation:
- Render sanctuary at center using reserved 3-hex footprint.
- Render campfire at map edge when onboarding not complete.
- Mark sanctuary/campfire hexes as non-placeable for normal projects.

Tests:
- Unit tests for reserved-hex rules.
- Storybook variants: onboarding incomplete vs complete.

### Campfire Walk Hooks

Files expected:
- `packages/web/src/components/life-map/*`
- `packages/web/src/Root.tsx` (route guard integration)
- shared event/query files if onboarding signal is event-backed

Implementation:
- Add camera transition path from campfire position to sanctuary target.
- Expose trigger API for campfire flow integration.
- Integrate first-run routing conditions needed for map entry behavior.

Tests:
- E2E: first-run route path and return-user route path.
- Unit tests around guard logic.

### Hardening

Implementation:
- Performance tune scene graph and rerenders.
- Add map telemetry events (viewed, placement started, placement completed).
- Finalize fallback strategy for WebGL unsupported browsers.
- Remove or archive obsolete desktop-only card code paths once parity is complete.

Tests:
- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`

## Open Questions And Recommended Defaults

| Topic | Recommendation | Why |
| --- | --- | --- |
| Grid size for R1 | Use radius 3 (37 hexes) | Matches 30-40 target and keeps scene manageable |
| Coordinate storage | Store axial `q,r` only | Minimal persistent shape; derive `s` for math |
| Sanctuary footprint | Reserve 3 fixed coordinates near center | Implements D3 exception cleanly |
| Placement interaction | Click-to-place first, drag later | Fastest path to functional placement |
| Desktop fallback for WebGL failure | Automatically fall back to card view | Avoids hard failure on unsupported environments |
| Table treatment in Map Foundation through Project Placement | Keep existing table behavior until Table Overlay | Reduces early integration risk |
| Existing archived/completed UX | Preserve current access in side panel or drawer | Prevents regression while replacing cards |
| Category taxonomy source | Keep using `PROJECT_CATEGORIES` constants | Avoids map work getting blocked by naming migrations |

## Dependencies Outside This Plan

- Jarvis overlay and category-agent cleanup (release-level agent architecture work).
- Campfire conversation design and prompt flow decisions.
- Builder onboarding context storage details if owned by separate PR track.

## Exit Criteria For Map Track

- Desktop users land on 3D orthographic Life Map by default.
- Projects are visible and navigable as hex tiles.
- Builders can manually place unplaced projects onto empty hexes.
- Sanctuary and campfire landmarks support the release metaphor.
- Table is available on map as overlay.
- Mobile and non-WebGL users have a reliable fallback experience.
