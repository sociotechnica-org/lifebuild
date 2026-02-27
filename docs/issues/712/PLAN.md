# Plan: Project placement flow (#712)

## 1. Architecture Decisions

### Decision: Reuse the existing hex-map placement engine and only add Workshop entry + routing glue

Options considered: build a separate Workshop-specific placement implementation; route Workshop placement into existing `PlacementContext` + `HexGrid` flow.  
Chosen approach: route Workshop placement into the existing placement stack (`PlacementContext`, `HexGrid`, `HexMap`, `placeProjectOnHex`).  
Why: current implementation already satisfies most finish-line behavior (valid/invalid hex visuals, click-to-place, reserved/occupied blocking, placement commit). This keeps #712 focused on initiation/cancel flow from Workshop.
State boundaries: placement validation and commit stay in hex-map/domain command files; Workshop only initiates placement and closes overlay.

### Decision: Lift placement state to a scope shared by both map and Workshop overlay

Options considered: pass one-off route state (`placeProjectId`) from Workshop to map; keep provider inside `HexMap` and add imperative bridge; move `PlacementProvider` above both map and overlay.  
Chosen approach: move `PlacementProvider` to the shared map-overlay route layer introduced by #705 (or equivalent parent in `Root.tsx`).  
Why: lets Workshop call `startPlacement(projectId)` directly, keeps placement state alive while overlays open/close, and avoids fragile navigation-state handoffs.
State boundaries: shared parent owns placement session state; `HexMap`/Workshop consume via `usePlacement`.

### Decision: Track placement origin so Escape can return to Workshop only for Workshop-initiated sessions

Options considered: always return to Workshop on placement cancel; never return and just clear placement; store a placement origin flag and conditionally navigate.  
Chosen approach: extend placement state with origin metadata (for example `source: 'workshop' | 'panel'`) and make Escape route back to `/workshop` only when source is Workshop.  
Why: meets finish line (“Escape cancels and returns to Workshop”) without regressing existing unplaced-panel placement UX on Life Map.
State boundaries: source metadata in placement context; route navigation decision in map shell/hex-map Escape handler.

### Decision: Keep placement interaction simple click-to-place (no flourish)

Options considered: animate placement confirmation; keep current immediate placement behavior.  
Chosen approach: keep current immediate placement behavior and visuals.  
Why: matches TEMP DECISION and keeps scope aligned with issue finish line.

## 2. File Changes

| Action | File                                                                                  | Description                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modify | `packages/web/src/components/hex-map/PlacementContext.tsx`                            | Extend placement session state to include initiation source metadata (`workshop` vs `panel`) and expose source-aware start/clear helpers.                                                             |
| modify | `packages/web/src/components/hex-map/PlacementContext.test.tsx`                       | Add tests covering source metadata lifecycle and source reset on clear.                                                                                                                               |
| modify | `packages/web/src/components/hex-map/HexMap.tsx`                                      | Remove local provider ownership (consume shared provider), wire source-aware Escape cancel behavior, and preserve existing click-to-place/blocked-cell behavior.                                      |
| modify | `packages/web/src/components/life-map/LifeMap.tsx`                                    | Consume shared placement context where needed and keep project-open/place handlers compatible with Workshop-initiated placement sessions.                                                             |
| modify | `packages/web/src/Root.tsx` _(or map-overlay layout from #705)_                       | Mount `PlacementProvider` at the shared map + overlay route level so both `LifeMap` and `/workshop` overlay content can access placement actions.                                                     |
| modify | `packages/web/src/components/workshop/Workshop.tsx` _(from #709)_                     | Add “Place on map” initiation action for project sketches/unplaced projects: call `startPlacement(projectId, { source: 'workshop' })` and close Workshop overlay to reveal active map placement mode. |
| modify | `packages/web/src/components/workshop/Workshop.test.tsx` _(from #709)_                | Add tests asserting Workshop placement action triggers placement start + overlay-close navigation.                                                                                                    |
| modify | `packages/web/src/components/hex-map/HexMap.test.tsx`                                 | Add tests for source-aware Escape behavior (Workshop source returns to Workshop; panel source only clears placement).                                                                                 |
| modify | `packages/web/src/components/hex-map/HexGrid.test.tsx`                                | Keep/extend assertions for invalid-cell blocking and visual states to ensure Workshop entry path does not regress map interactions.                                                                   |
| modify | `packages/web/e2e/life-map-placement.spec.ts` _(or add `workshop-placement.spec.ts`)_ | Add critical journey: initiate from Workshop, overlay closes, place on valid hex, building appears and opens project; Escape cancel returns to Workshop.                                              |

## 3. Data Model Changes

No LiveStore schema/event/query changes are planned.

- Reuse existing event path: `events.hexPositionPlaced` (and existing removal flow remains unchanged).
- Reuse existing query path: `getUnplacedProjects$` for Workshop “ready to place” sketches.
- Reuse existing placement conflict constraints: `hex_positions` unique indexes and reserved-coord validation in `placementRules.ts`/`hexPositionCommands.ts`.
- Migrations/backfills: none.

## 4. Component Hierarchy

Target layering (post-#705/#709):

```text
Map overlay route shell
  PlacementProvider (shared)
    RoomLayout(LIFE_MAP_ROOM)
      LifeMap
        HexMap (consumes usePlacement)
      Overlay outlet
        /workshop
          Workshop (consumes usePlacement)
            "Place on map" action
              -> startPlacement(projectId, source='workshop')
              -> close overlay route to map
```

Placement cancel behavior:

```text
Escape in map placement mode
  if source === 'workshop': clear placement + navigate('/workshop')
  if source === 'panel': clear placement only
```

## 5. PR Breakdown

Single PR (after #709 is merged) success criteria:

1. Workshop exposes a placement initiation action for an unplaced project sketch.
2. Triggering placement closes Workshop overlay and enters map placement mode for that project.
3. Valid hex click places the project and exits placement mode.
4. Invalid hexes (occupied/reserved) remain visibly blocked and non-placeable.
5. Placed project renders as a map building/tile and can be opened from the map.
6. Escape during Workshop-initiated placement cancels and returns to Workshop.
7. Existing unplaced-panel placement flow continues to work unchanged.
8. Lint/tests/e2e/build pass.

## 6. Test Plan

Unit/integration:

- `PlacementContext.test.tsx`
  - `startPlacement(projectId, source='workshop')` stores source metadata.
  - `clearPlacement()` resets project + source metadata.
- `Workshop.test.tsx`
  - clicking “Place on map” dispatches placement start for selected project.
  - Workshop route closes/navigates to map surface after initiation.
- `HexMap.test.tsx`
  - Escape with Workshop-origin placement clears session and navigates back to Workshop.
  - Escape with panel-origin placement only clears session.
- `HexGrid.test.tsx`
  - blocked/reserved cells remain non-placeable with `blocked` state.
  - valid cells still call `onPlaceProject` and exit placement mode.

E2E (Playwright):

- create a project sketch (or seed one), open Workshop, click “Place on map.”
- assert overlay closes and map placement mode is active for that project.
- click an invalid cell and assert no placement commit.
- click a valid empty cell and assert tile appears + project opens on tile click.
- repeat initiate flow and press Escape; assert return to `/workshop`.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                                               | Impact                                 | Mitigation                                                                                                                         |
| ---------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| #709 lands with different Workshop component path/API                              | Plan-to-code drift and rework          | Rebase on merged #709 first; adapt only the Workshop integration layer while keeping placement core unchanged.                     |
| Moving `PlacementProvider` scope causes regressions in current unplaced-panel flow | Placement mode bugs in existing map UX | Add provider-scope regression tests (`HexMap` + context tests) and validate current tray journey in E2E.                           |
| Escape handler conflicts with overlay-level Escape behavior from #705              | Wrong layer closes or no-op on Escape  | Gate logic by placement-active state and source; keep overlay close behavior authoritative when overlay is open.                   |
| Workshop source project may become placed/archived before click completes          | Placement errors and stale UI          | Reuse existing stale-selection guards in `HexMap` (`placementProjectId` validity checks) and keep command-level conflict handling. |

## 8. What's Out of Scope

- Placement animations/fanfare.
- Drag-to-rearrange existing buildings.
- Undo or post-placement move/reposition UX.
- Auto-placement, suggested hexes, or optimization prompts.
- Broader Workshop interior redesign beyond adding the placement initiation action.
