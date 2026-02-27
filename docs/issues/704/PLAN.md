# Plan: Map as Full-Bleed Base Layer (#704)

## 1. Architecture Decisions

### Decision: Move to a map-first route surface with legacy room redirects

Options considered: keep existing room route tree and hide links; remove Drafting/Sorting routes entirely and keep only map routes; introduce map base layout plus immediate overlay routing in this issue.  
Chosen approach: keep map routes (`/`, `/life-map`) as the only primary surfaces in #704 and redirect legacy room paths (`/drafting-room/*`, `/sorting-room/*`) to `/life-map`.  
Why: satisfies “map is default/only page” for this issue without pulling #705 overlay routing into the same change set.  
State boundaries: URL state keeps map entry at `/`; legacy room paths become compatibility redirects; no room-switching navigation remains in shell UI.

### Decision: Make full-bleed a shell/layout contract, not a LifeMap inset hack

Options considered: keep existing shell padding and continue using negative insets in `LifeMap`; remove shell padding and render map edge-to-edge at layout level.  
Chosen approach: add/enable full-bleed layout mode in shell path used by Life Map so map fills viewport directly.  
Why: produces deterministic edge-to-edge behavior at all viewport sizes and avoids brittle `-inset-*` coupling to shell padding.  
State boundaries: shell controls viewport geometry; `LifeMap`/`HexMap` consume full available area without local offset math.

### Decision: Remove list/category fallback and run map-first rendering across viewport sizes

Options considered: keep map/list toggle with desktop + WebGL gating; map-first always, with graceful non-WebGL fallback state.  
Chosen approach: always attempt map render for all viewport sizes and remove category-card/list mode from `LifeMap`.  
Why: issue requires the map to be the sole base layer; desktop-only map behavior conflicts with finish line.  
State boundaries: React local UI state for `viewMode` is removed; data queries only support map/placement panel; fallback is a lightweight unavailable-message state if WebGL init fails.

### Decision: Use reserved hex coordinates as single source of truth for fixed buildings

Options considered: hardcode building coordinates in `HexGrid`; centralize coordinate + building-type metadata in `placementRules`.  
Chosen approach: export named fixed-building metadata (campfire, sanctuary, workshop) from `placementRules` and consume it from `HexGrid`.  
Why: keeps placement blocking and rendering logic synchronized and prevents coordinate drift.  
State boundaries: placement rules own fixed cells; rendering layer reads metadata; no LiveStore events needed.

### Decision: Render fixed buildings as non-interactive landmarks in #704

Options considered: make sanctuary/workshop clickable now; render visual-only landmarks and defer interactions to #705.  
Chosen approach: visual-only building rendering in this issue; no overlay-open behavior yet.  
Why: aligns with stated out-of-scope (building overlay interactions are separate) while meeting visibility/placement finish-line requirements.  
State boundaries: map scene gets decorative/system landmarks; route/navigation behavior for building clicks is deferred.

## 2. File Changes

| Action | File                                                         | Description                                                                                                                                      |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| modify | `packages/web/src/Root.tsx`                                  | Remove Drafting/Sorting room route mounts (post-#700/#701), keep map as primary route surface, and add/retain legacy redirects to `/life-map`.   |
| modify | `packages/web/src/constants/routes.ts`                       | Ensure room-switching route constants/generators are removed after blockers; keep map/project/auth/admin routes needed for current app behavior. |
| modify | `packages/web/src/components/layout/NewUiShell.tsx`          | Remove room navigation links and table assumptions; add/enable full-bleed map content mode (no content max-width/padding).                       |
| modify | `packages/web/src/components/layout/RoomLayout.tsx`          | Ensure map path uses full-bleed shell behavior and chat overlay positioning still works over edge-to-edge map canvas.                            |
| modify | `packages/web/src/components/life-map/LifeMap.tsx`           | Convert to map-only render path; remove map/list toggle, category-card layout, and desktop gating; make `HexMap` always fill available viewport. |
| delete | `packages/web/src/components/life-map/CategoryCard.tsx`      | Remove list-mode category UI no longer used in map-first architecture.                                                                           |
| modify | `packages/web/src/components/life-map/LifeMap.stories.tsx`   | Update Storybook setup and docs text for map-only/full-bleed behavior.                                                                           |
| modify | `packages/web/src/components/hex-map/HexMap.tsx`             | Keep map surface `h-full w-full` and ensure panel/prompts layer correctly on full-viewport canvas.                                               |
| modify | `packages/web/src/components/hex-map/HexGrid.tsx`            | Render fixed buildings (campfire/sanctuary/workshop) at reserved coordinates while preserving existing project tile placement behavior.          |
| create | `packages/web/src/components/hex-map/FixedBuilding.tsx`      | Add visual component for system-placed landmarks (reused by `HexGrid`).                                                                          |
| modify | `packages/web/src/components/hex-map/placementRules.ts`      | Export typed fixed-building coordinate map (campfire center, sanctuary, workshop) and keep reserve checks derived from that source.              |
| modify | `packages/web/src/components/hex-map/HexGrid.test.tsx`       | Add assertions that fixed buildings render at reserved cells and cells remain blocked for project placement.                                     |
| create | `packages/web/src/components/hex-map/placementRules.test.ts` | Unit tests for building-coordinate mapping and reserve invariants.                                                                               |
| modify | `packages/web/src/components/hex-map/HexMap.stories.tsx`     | Update stories to show fixed landmarks in full-bleed map context.                                                                                |
| modify | `packages/web/e2e/smoke.spec.ts`                             | Assert map-first route behavior and redirects from legacy room routes.                                                                           |
| modify | `packages/web/e2e/life-map-room-chat.spec.ts`                | Ensure chat toggle still works with full-bleed map shell/no room nav links.                                                                      |

## 3. Data Model Changes

No LiveStore event/schema/query migration is planned for #704.

- Events: no additions/removals.
- Schema/materializers: no changes.
- Queries: no new shared queries required.
- Migration notes: none.

## 4. Component Hierarchy

Removed room-navigation surface:

```text
NewUiShell
  nav
    Drafting Room
    Sorting Room
    Life Map
```

Updated map-first runtime tree:

```text
Root Routes
  / and /life-map
    RoomLayout (life-map room plumbing)
      NewUiShell (full-bleed mode)
        LifeMap (map-only)
          HexMap
            Canvas
              CameraRig
              HexGrid
                HexCell* (base grid)
                FixedBuilding* (campfire/sanctuary/workshop)
                HexTile* (placed projects)
            UnplacedPanel (overlay UI)
        RoomChatPanel (optional overlay)
  /drafting-room/* -> redirect /life-map
  /sorting-room/* -> redirect /life-map
```

## 5. PR Breakdown

Single PR success criteria:

1. Blockers #699/#700/#701 are merged (or equivalent code state exists in branch).
2. Life Map is full-bleed edge-to-edge with no room-switching nav/sidebar.
3. `LifeMap` no longer has map/list toggle or category-card fallback path.
4. Fixed buildings render at reserved coordinates: campfire `(0,0)`, sanctuary `(0,-1)`, workshop `(1,-1)`.
5. Reserved cells remain unplaceable for project tiles.
6. Legacy Drafting/Sorting URLs redirect to `/life-map`.
7. Build and test suites pass.

## 6. Test Plan

Unit/component tests:

- Extend `HexGrid.test.tsx` to verify fixed building rendering and placement blocking at reserved cells.
- Add `placementRules.test.ts` for coordinate-to-building mapping and reserve helper consistency.
- Update shell/layout tests if needed to assert full-bleed main container classes and absence of room nav links.

Storybook:

- Update `LifeMap.stories.tsx` and `HexMap.stories.tsx` to reflect map-only, full-bleed presentation and visible fixed buildings.

E2E:

- Update smoke routing checks to validate `/`, `/life-map`, and legacy room redirects.
- Validate map canvas visibility at desktop + mobile viewport sizes (no category-card fallback path).
- Validate chat toggle still opens/closes over the full-bleed map.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`

## 7. Risks and Mitigations

| Risk                                                               | Impact                                                        | Mitigation                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Blocker changes not fully landed before #704 starts                | Plan/file list drift and merge conflicts                      | Gate implementation on blocker merge state; run repo-wide symbol checks before coding.                 |
| WebGL unavailable on some devices                                  | Map cannot render, violating map-first expectation            | Provide explicit non-WebGL fallback state/message instead of reverting to legacy category-list UI.     |
| Full-bleed shell changes regress other pages                       | Unintended layout breakage in non-map routes                  | Scope full-bleed behavior to map path/layout mode; keep existing shell defaults for non-map surfaces.  |
| Landmark coordinates diverge between rendering and placement rules | Buildings appear in one location but placement blocks another | Keep one exported coordinate source in `placementRules` consumed by both systems and covered by tests. |
| Overlay z-index conflicts (chat/panels over canvas)                | Controls become inaccessible on some viewports                | Standardize z-index layering in shell/map components and verify in Storybook + e2e.                    |

## 8. What's Out of Scope

- Building click interactions and overlay-opening behavior (`#705` and downstream overlay issues).
- Zoom/pan navigation controls and camera interaction upgrades.
- Project statue/building visual generation pipeline.
- Fog-of-war/dawn onboarding state.
- Attendant sprites and movement.
