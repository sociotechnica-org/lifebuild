# Plan: Statue sprites on placed projects (#717)

## 1. Architecture Decisions

### Decision: Render project statues as a dedicated 3D sprite layer on top of the existing `HexTile` cylinder

Options considered: (1) replace the current hex tile mesh entirely with a sprite-only billboard, (2) render a DOM/CSS overlay above canvas, (3) keep the current hex tile mesh and add a textured plane sprite above it.  
Chosen approach: option 3.  
Why: preserves the current category ring + stream border treatments, keeps interactions in one R3F scene graph, and minimizes regressions in placement/selection behavior.
State boundaries: `HexTile` remains the interaction root; new sprite rendering is an internal visual child.

### Decision: Use one static sprite asset with shader-driven visual states (full color, reduced saturation, grayscale)

Options considered: (1) multiple pre-baked PNG variants per state, (2) tint-only material changes, (3) one PNG + shader uniforms for desaturation/opacity.  
Chosen approach: option 3.  
Why: satisfies TEMP decision (single static PNG), cleanly supports active/planning/completed visuals, and creates a direct path to future per-project image URLs.
State boundaries: `LifeMap`/`HexTile` decide visual mode from project lifecycle; sprite component only maps that mode to shader uniforms.

### Decision: Keep tier signaling on the tile border and ensure sprite sizing does not hide it

Options considered: (1) add a new sprite border overlay for gold/silver/bronze, (2) continue using current hex edge/glow treatment.  
Chosen approach: option 2.  
Why: `HexTile` already encodes subtle stream differentiation (`STREAM_GLOW_COLORS`) and this issue does not require a second border system.
State boundaries: tier color logic stays in `HexTile`; sprite remains neutral placeholder art.

### Decision: Make placed project sprites clickable + hoverable for overlay/tooltip in normal map mode

Options considered: (1) keep completed tiles non-interactive, (2) allow click/hover for all placed project states outside placement/remove mode.  
Chosen approach: option 2.  
Why: directly matches finish line requirements (“click opens project overlay”, “hover shows project name”).
State boundaries: `HexGrid` continues controlling placement/remove mode behavior; `LifeMap` supplies overlay navigation handlers for placed tiles.

## 2. File Changes

| Action | File                                                      | Description                                                                                                                                                                                  |
| ------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| add    | `packages/web/public/sprites/project-statue.png`          | Add the temporary shared statue/building PNG used by all placed projects.                                                                                                                    |
| add    | `packages/web/src/components/hex-map/ProjectSprite.tsx`   | New reusable R3F sprite renderer (texture loading, alpha handling, tilt/position, saturation/grayscale uniforms).                                                                            |
| modify | `packages/web/src/components/hex-map/HexTile.tsx`         | Replace initials-forward tile top treatment with sprite rendering; keep ring/glow logic; keep hover label; adjust click/hover gating so placed tiles remain interactive in normal mode.      |
| modify | `packages/web/src/components/hex-map/HexGrid.tsx`         | Extend `PlacedHexTile` visual props if needed (`isArchived`, optional `spriteUrl`), and pass through to `HexTile` while preserving placement/select mode semantics.                          |
| modify | `packages/web/src/components/life-map/LifeMap.tsx`        | Build tile data with sprite state inputs; ensure placed project clicks navigate to overlay (including completed/archived where applicable); keep lifecycle-to-visual-state mapping coherent. |
| modify | `packages/web/src/components/hex-map/HexTile.stories.tsx` | Update stories to demonstrate sprite rendering across active/planning/work-at-hand/completed states and border-tier subtleties.                                                              |
| modify | `packages/web/src/components/hex-map/HexTile.test.tsx`    | Update click/hover tests for new interaction contract; mock sprite subcomponent/texture path to avoid WebGL loader coupling in jsdom tests.                                                  |
| modify | `packages/web/src/components/hex-map/HexGrid.test.tsx`    | Adjust HexTile mock expectations to match updated completed-tile interactivity while preserving placement-mode cancellation behavior.                                                        |

## 3. Data Model Changes

No LiveStore schema/event changes are planned for #717.

- Reuse existing `hexPosition.placed`/`hexPosition.removed` and project lifecycle fields.
- Reuse existing `HexTileVisualState` mapping (`planning`, `active`, `work-at-hand`, `completed`).
- Optional UI-only type extension in `PlacedHexTile` for sprite metadata (`spriteUrl`) and/or archive hinting (`isArchived`) to prepare for post-P3 unique art without backend changes.

Notes:

- #717 is blocked by #712 (placement flow). This plan assumes placed project coordinates are already available through current `hex_positions` queries.
- Archived rendering support will be handled in the tile visual logic, but actual archived-on-map visibility still depends on upstream placement/archive behavior.

## 4. Component Hierarchy

```text
LifeMap
  HexMap
    HexGrid
      HexCell (base grid)
      HexTile (per placed project, interaction root)
        tile cylinder/ring meshes (existing)
        ProjectSprite (new)
        hover label Text (existing behavior, sprite-aware placement)
```

Interaction flow:

```text
pointer over sprite/tile
  -> HexTile hover state true
  -> tooltip shows project name

click sprite/tile (normal mode)
  -> HexGrid handleTileClick
  -> LifeMap-provided onClick
  -> navigate to project overlay route

click sprite/tile (placement/removal mode)
  -> HexGrid mode logic takes precedence (cancel/select)
```

## 5. PR Breakdown

1. Sprite rendering foundation
   - Add static PNG asset and `ProjectSprite` component.
   - Integrate sprite into `HexTile` without removing existing ring/glow visuals.

2. Interaction and state wiring
   - Update `HexGrid`/`LifeMap` tile props to ensure click-to-open and hover tooltip behavior across visual states.
   - Confirm completed/archived visual treatment maps to grayscale/desaturated sprite output.

3. Regression coverage and docs
   - Update `HexTile`/`HexGrid` tests for new interactions.
   - Refresh Storybook scenarios for all required sprite states.
   - Run full quality/build commands.

## 6. Test Plan

Unit/integration:

- `packages/web/src/components/hex-map/HexTile.test.tsx`
  - sprite layer renders for placed projects
  - hover shows project name tooltip
  - completed-state tile click invokes handler in normal map mode
- `packages/web/src/components/hex-map/HexGrid.test.tsx`
  - placement mode still cancels/blocks correctly when interacting with occupied tiles
  - selection/removal mode behavior unchanged

Storybook:

- `HexTile.stories.tsx`
  - active full-color sprite
  - planning reduced saturation
  - work-at-hand with tier border signal
  - completed grayscale sprite

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                                            | Impact                                         | Mitigation                                                                                                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Texture loading via R3F hooks breaks existing jsdom unit tests                  | Test regressions unrelated to product behavior | Isolate texture logic in `ProjectSprite` and mock it in `HexTile` tests.                                                            |
| Sprite mesh captures pointer events differently than text/mesh stack            | Click/hover regressions on map tiles           | Keep handlers at `HexTile` group level and ensure sprite/text raycasting does not block parent event flow.                          |
| Sprite geometry placement obscures category ring or glow                        | Tier/category signals become harder to read    | Tune sprite plane scale/offset/tilt to preserve visible edge ring and top cap border.                                               |
| Archived projects may not appear on-map depending on upstream archive semantics | Partial mismatch with finish-line language     | Keep archived visual state support in tile rendering and validate behavior against #712 merged branch before implementation closes. |
| Shader-based grayscale looks too aggressive/light under current scene lighting  | Visual inconsistency across states             | Add visual calibration pass in Storybook and clamp desaturation/opacity values per state.                                           |

## 8. What's Out of Scope

- Unique per-project generated art (Nano Banana / P3 follow-up).
- Sprite animations (idle/build progress/etc.).
- Drag-to-rearrange/move sprites.
- Clustering or auto-layout of sprites.
