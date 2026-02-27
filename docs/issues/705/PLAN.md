# Plan: Building overlay pattern and routing (#705)

## 1. Architecture Decisions

### Decision: Make URL route state the single source of truth for overlay open/close

Options considered: keep overlay visibility in local React state; use query params for overlay identity; use path-based nested routes for each overlay.  
Chosen approach: path-based nested routes for `'/workshop'`, `'/sanctuary'`, and `'/projects/:projectId'` under a shared map layout route.  
Why: this gives deep links for free, guarantees one overlay at a time, and makes browser back behavior naturally close overlays.  
State boundaries: pathname controls overlay identity; no parallel local `isOverlayOpen` state.

### Decision: Keep the map mounted behind overlays via a parent map layout route

Options considered: render map only on base route and mount separate overlay pages; render map in a parent route and overlay via child route content (`<Outlet />`).  
Chosen approach: parent map layout that always renders `LifeMap`, with overlay routes rendering only overlay content.  
Why: avoids remounting the Three.js canvas and preserves camera/placement state when opening/closing overlays.  
State boundaries: map and placement state stay in map component tree; overlay content changes by route.

### Decision: Build a reusable `BuildingOverlay` chrome component and inject room/project content as children

Options considered: custom overlay markup per route; one shared overlay frame with content slots.  
Chosen approach: one reusable `BuildingOverlay` component for backdrop dim, centered panel, close affordances, and Escape handling.  
Why: enforces consistent Warcraft/StarCraft-style interaction and satisfies “same frame/chrome for all building types.”  
State boundaries: frame behavior in `BuildingOverlay`; business content lives in route-specific child components.

### Decision: Use deterministic close navigation with deep-link fallback

Options considered: always `navigate(-1)` on close; always `navigate('/')`; hybrid close helper with fallback.  
Chosen approach: close helper that prefers history back when opened from map navigation, with fallback to bare map route for direct overlay entries.  
Why: preserves expected back-stack behavior while ensuring Escape/close from a deep link returns to map instead of leaving the app.  
State boundaries: overlay close behavior in a shared route utility used by close button, backdrop click, and Escape.

### Decision: Explicitly prioritize overlay Escape over map placement Escape

Options considered: keep current global Escape behavior in `HexMap`; route-gate or disable map Escape behavior while overlay is active.  
Chosen approach: pass overlay-open signal to map/hex layer and skip placement Escape handling while an overlay route is active.  
Why: prevents a single Escape press from mutating map placement state when user intent is to close overlay.  
State boundaries: overlay keyboard close owned by `BuildingOverlay`; placement keyboard shortcuts remain map-only when no overlay route is active.

## 2. File Changes

| Action | File                                                                 | Description                                                                                                                                                                                                                                        |
| ------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| create | `packages/web/src/components/layout/BuildingOverlay.tsx`             | Reusable overlay frame: dimmed backdrop, centered panel container, close button, backdrop click-to-close, Escape-to-close, and route-close callback hook-up.                                                                                       |
| create | `packages/web/src/components/layout/BuildingOverlay.test.tsx`        | Unit tests for close button, backdrop click, Escape, and close callback behavior.                                                                                                                                                                  |
| create | `packages/web/src/components/layout/BuildingOverlay.stories.tsx`     | Storybook coverage for default frame, long-scroll content, and mobile viewport behavior.                                                                                                                                                           |
| modify | `packages/web/src/constants/routes.ts`                               | Add `WORKSHOP` and `SANCTUARY` route constants and generators while retaining `PROJECT` route shape (`/projects/:projectId`).                                                                                                                      |
| modify | `packages/web/src/Root.tsx`                                          | Introduce map layout route that always renders `LifeMap`; move project detail route into overlay child route; add sanctuary/workshop overlay routes; ensure base map route remains reachable at `'/'` (and `'/life-map'` compatibility as needed). |
| create | `packages/web/src/components/buildings/WorkshopOverlayContent.tsx`   | Minimal workshop overlay content scaffold (title + placeholder body) rendered inside `BuildingOverlay` frame.                                                                                                                                      |
| create | `packages/web/src/components/buildings/SanctuaryOverlayContent.tsx`  | Minimal sanctuary overlay content scaffold (title + placeholder body) rendered inside `BuildingOverlay` frame.                                                                                                                                     |
| modify | `packages/web/src/components/projects/ProjectDetailPage.tsx`         | Refactor from full-page shell/room wrapper to overlay content component (retain data/query/task modal behavior, remove standalone page chrome assumptions).                                                                                        |
| modify | `packages/web/src/components/life-map/LifeMap.tsx`                   | Wire map interactions to new overlay routes (project remains route-driven; add callbacks for sanctuary/workshop building clicks) and pass overlay-open signal into hex-map layer.                                                                  |
| modify | `packages/web/src/components/hex-map/HexMap.tsx`                     | Add props for fixed-building click callbacks and a flag to disable map Escape placement handling when overlay is active.                                                                                                                           |
| modify | `packages/web/src/components/hex-map/HexGrid.tsx`                    | Surface click handlers for fixed buildings (sanctuary/workshop) and keep campfire non-interactive; route callbacks up through `HexMap`.                                                                                                            |
| modify | `packages/web/src/components/hex-map/FixedBuilding.tsx` (post-#704)  | Make sanctuary/workshop landmarks keyboard/mouse interactive with accessible labels; leave campfire decorative only.                                                                                                                               |
| modify | `packages/web/src/hooks/useNavigationContext.ts`                     | Recognize map-overlay routes (`/`, `/workshop`, `/sanctuary`, `/projects/:projectId`) so assistant context reflects active surface correctly.                                                                                                      |
| modify | `packages/web/src/components/hex-map/HexGrid.test.tsx`               | Add assertions for sanctuary/workshop click callback behavior and non-interactive campfire behavior.                                                                                                                                               |
| modify | `packages/web/src/components/hex-map/HexMap.test.tsx`                | Add Escape precedence test to verify overlay-open mode suppresses placement Escape side effects.                                                                                                                                                   |
| modify | `packages/web/src/components/projects/ProjectDetailPage.stories.tsx` | Update story route scaffolding for overlay-hosted project detail rendering.                                                                                                                                                                        |
| create | `packages/web/e2e/building-overlay-routing.spec.ts`                  | E2E happy-path coverage for building click routing, deep-link overlay open, back button close, Escape close, and single-overlay invariant.                                                                                                         |
| modify | `packages/web/e2e/smoke.spec.ts`                                     | Update smoke expectations to include map-first overlay route availability (`/workshop`, `/sanctuary`, `/projects/:id`).                                                                                                                            |

## 3. Data Model Changes

No LiveStore schema/event/query migrations are planned for #705.

- Events: no new event types.
- Schema/materializers: no changes.
- Shared queries: no new query required for overlay routing itself.
- Migration/backfill: none.

## 4. Component Hierarchy

Current (relevant path):

```text
ProtectedApp Routes
  / or /life-map -> RoomLayout(LIFE_MAP_ROOM) -> LifeMap
  /projects/:projectId -> ProjectDetailPage (standalone page shell)
```

Target (overlay routing):

```text
ProtectedApp Routes
  MapOverlayLayoutRoute (always mounted)
    RoomLayout(LIFE_MAP_ROOM)
      LifeMap (base layer)
      Outlet (overlay layer)
        index -> no overlay
        /workshop -> BuildingOverlay -> WorkshopOverlayContent
        /sanctuary -> BuildingOverlay -> SanctuaryOverlayContent
        /projects/:projectId -> BuildingOverlay -> ProjectDetailPage (overlay content)
```

Overlay close flow:

```text
BuildingOverlay onClose
  -> closeOverlayRoute()
     -> history back when prior entry is map-internal
     -> fallback navigate to bare map route for deep-link entries
```

## 5. PR Breakdown

Single PR (after #704 is merged) success criteria:

1. Clicking sanctuary/workshop landmarks opens centered overlay and updates URL to `/sanctuary` or `/workshop`.
2. Clicking a project tile opens centered overlay and updates URL to `/projects/:projectId`.
3. Direct navigation to any overlay URL renders map + active overlay (not standalone page).
4. Browser back closes overlay to bare map route.
5. Escape closes overlay and does not trigger map placement-cancel side effects.
6. Exactly one overlay can be open at a time (route-enforced).
7. `BuildingOverlay` frame is reused by all three overlay routes.
8. Lint/tests/e2e pass.

## 6. Test Plan

Unit/component tests:

- `BuildingOverlay.test.tsx`
  - renders overlay frame and backdrop
  - invokes close on backdrop click
  - invokes close on Escape
  - does not close on inner panel click
- `HexGrid.test.tsx`
  - sanctuary/workshop building click triggers expected callback
  - campfire remains non-clickable
- `HexMap.test.tsx`
  - overlay-active mode suppresses placement Escape handling
- Route integration test (new or in existing routing test file)
  - map stays mounted while transitioning `'/`' -> `'/workshop'` -> `'/projects/:id'`
  - only one overlay child route renders at a time

Storybook:

- Add `BuildingOverlay.stories.tsx` with map-dim frame states and responsive panel sizing.
- Update project detail story scaffolding so project content renders correctly within overlay host.

E2E (`building-overlay-routing.spec.ts`):

- Click sanctuary landmark from map and assert URL + overlay visibility + dimmed map backdrop.
- Click workshop landmark and assert route swap keeps one overlay visible.
- Click project tile and assert `/projects/:id` overlay.
- Deep link directly to `/sanctuary` and verify map is visible behind overlay.
- Press browser back and verify overlay closes to bare map.
- Press Escape and verify overlay closes.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`

## 7. Risks and Mitigations

| Risk                                                                 | Impact                                                | Mitigation                                                                                                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| #704 route/layout churn lands with different map container structure | Merge conflicts and stale assumptions                 | Rebase #705 on merged #704 branch and validate route/layout contract before coding; keep map-overlay route logic localized in `Root.tsx`. |
| Overlay close uses history-back on deep-link entries                 | Escape/close may navigate outside app                 | Implement close helper with explicit fallback to bare map route when no safe in-app back target exists.                                   |
| Escape key conflicts between overlay and map placement mode          | Unexpected placement cancel state changes             | Gate map Escape listener with overlay-open flag and cover with unit tests.                                                                |
| Map remount during route changes resets camera and WebGL state       | Poor UX and potential performance regressions         | Keep map in parent layout route and verify mount stability in route integration tests.                                                    |
| z-index clashes with existing modal/user-menu layers                 | Overlay or controls may appear under/over wrong layer | Define explicit z-index contract (`header < building overlay < modal(9999)`) and verify with Storybook + E2E.                             |

## 8. What's Out of Scope

- Workshop/Sanctuary/Project internal product workflows (drafting, chartering, task feature expansion).
- Animated overlay open/close transitions.
- Attendant Rail/chat integration behavior.
- Non-overlay map interaction upgrades (zoom/pan redesign, camera control changes).
