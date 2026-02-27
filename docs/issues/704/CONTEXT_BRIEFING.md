# Context Briefing: #704 - Map as full-bleed base layer

> Assembled by Conan the Librarian on 2026-02-27
> Classification: Zone (Life Map) / Architecture change

---

## Constellation

### Seed Cards

| Card                                                                                               | Type      | Relevance                                             |
| -------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------- |
| [Zone - Life Map](../../context-library/product/zones/Zone%20-%20Life%20Map.md)                    | Zone      | The zone being transformed into the sole base layer   |
| [Structure - Hex Grid](../../context-library/product/structures/Structure%20-%20Hex%20Grid.md)     | Structure | The spatial canvas becoming the full-bleed foundation |
| [Release - The Map-first UI](../../context-library/releases/Release%20-%20The%20Map-first%20UI.md) | Release   | The release plan that defines this issue's scope      |
| [Component - Campfire](../../context-library/product/components/Component%20-%20Campfire.md)       | Component | One of three fixed buildings to place on the map      |

### Hop 1: Directly Referenced

| Card                                                                                                                              | Type       | Connection                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| [Component - Hex Tile](../../context-library/product/components/Component%20-%20Hex%20Tile.md)                                    | Component  | Atomic spatial unit on the Hex Grid                                                 |
| [Capability - Zoom Navigation](../../context-library/product/capabilities/Capability%20-%20Zoom%20Navigation.md)                  | Capability | Scale control for Life Map (deferred for this issue, but relevant for camera setup) |
| [Capability - Workspace Navigation](../../context-library/product/capabilities/Capability%20-%20Workspace%20Navigation.md)        | Capability | Current sidebar/room navigation being removed                                       |
| [Strategy - Spatial Visibility](../../context-library/rationale/strategies/Strategy%20-%20Spatial%20Visibility.md)                | Strategy   | Governing strategy -- the map IS the primary embodiment                             |
| [Overlay - The Table](../../context-library/product/overlays/Overlay%20-%20The%20Table.md)                                        | Overlay    | Being removed (blocker #699) to clear viewport                                      |
| [Standard - Spatial Interaction Rules](../../context-library/rationale/standards/Standard%20-%20Spatial%20Interaction%20Rules.md) | Standard   | Fixed buildings (campfire, sanctuary, workshop) are system-placed exceptions        |

### Hop 2: Adjacent Zones & Context

| Card                                                                                          | Type | Connection                                             |
| --------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------ |
| [Zone - Strategy Studio](../../context-library/product/zones/Zone%20-%20Strategy%20Studio.md) | Zone | Dissolved -- rooms become building overlays on the map |
| [Zone - Archives](../../context-library/product/zones/Zone%20-%20Archives.md)                 | Zone | Future building on the map; not in this issue's scope  |

---

## Key Design Decisions

1. **Map is the sole base layer.** The Life Map is the primary and essentially only UI. All other experiences are overlays on top of it. (Zone - Life Map, Release - The Map-first UI)

2. **Three fixed buildings: Campfire, Sanctuary, Workshop.** These are system-placed at specific hex coordinates. The `placementRules.ts` already reserves three hex coords: `(0,0)`, `(0,-1)`, `(1,-1)`. These are the fixed building positions. (Release - The Map-first UI: "Fixed buildings visible: campfire (center), sanctuary, workshop")

3. **Campfire positioning note.** The Component - Campfire card says the campfire is "off to the side, in a corner" during onboarding, NOT at center. However, the Release - The Map-first UI explicitly puts "Campfire (non-clickable, decorative)" at center for the MVP. The release card notes this is an "open decision" -- the card says it fades after onboarding; the release assumes it persists as decorative. For #704, follow the release plan: campfire at center, non-interactive.

4. **Old room navigation is fully removed.** The sidebar navigation between Drafting Room, Sorting Room, and Life Map goes away. This is coordinated with blockers #699 (Remove Table), #700 (Remove Sorting Room), #701 (Remove Drafting Room).

5. **Spatial Interaction Rules exception.** Fixed buildings are system-placed exceptions to the builder-only placement rule. This is explicitly documented in the Standard card's WHEN section.

6. **No zoom/pan in this issue.** Map navigation controls are out of scope per the issue definition. The existing `CameraRig` from the hex-map components provides basic camera, but zoom/pan interaction is a separate story.

---

## Codebase Impact Map

### Files to Modify

| File                                                    | Change                                                                                                                                                                                                                               | Priority |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `packages/web/src/Root.tsx`                             | Remove room-based routes (drafting-room, sorting-room). Make hex map the default/only route layout. Remove `RoomLayout` wrapping for Life Map route.                                                                                 | High     |
| `packages/web/src/components/layout/NewUiShell.tsx`     | Remove room navigation links (Drafting Room, Sorting Room, Life Map). Remove or replace header nav with minimal chrome. Remove `<TableBar />` dependency (after #699).                                                               | High     |
| `packages/web/src/components/life-map/LifeMap.tsx`      | Transform from dual-mode (map/list toggle) to full-bleed map-only. Remove category card layout, view mode toggle, list fallback. The hex map becomes the only render path. Remove `min-h-[520px]` constraint; make it fill viewport. | High     |
| `packages/web/src/components/hex-map/HexMap.tsx`        | Ensure the Canvas fills the entire viewport (full-bleed). Currently renders in a `relative h-full w-full` container -- needs to be the root visual layer.                                                                            | High     |
| `packages/web/src/components/hex-map/HexGrid.tsx`       | Add fixed building rendering at reserved hex coords. Currently only renders project tiles and empty hex cells. Needs campfire/sanctuary/workshop visual representations at `(0,0)`, `(0,-1)`, `(1,-1)`.                              | High     |
| `packages/web/src/components/hex-map/placementRules.ts` | Already reserves three coords. May need named exports mapping coord to building type (campfire, sanctuary, workshop) for the HexGrid to render appropriately.                                                                        | Medium   |
| `packages/web/src/constants/routes.ts`                  | Remove drafting-room and sorting-room routes (after #700, #701). May add future overlay routes (`/workshop`, `/sanctuary`).                                                                                                          | Medium   |

### Files to Remove (via blockers)

| File                                               | Blocker | Reason                |
| -------------------------------------------------- | ------- | --------------------- |
| `packages/web/src/components/layout/TableBar.tsx`  | #699    | Table UI removal      |
| `packages/web/src/components/layout/TableSlot.tsx` | #699    | Table UI removal      |
| `packages/web/src/components/sorting-room/*`       | #700    | Sorting Room removal  |
| `packages/web/src/components/drafting-room/*`      | #701    | Drafting Room removal |

### Files Likely Unaffected

| File                                                       | Why                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `packages/web/src/components/hex-map/CameraRig.tsx`        | Camera controls stay as-is; zoom/pan is out of scope |
| `packages/web/src/components/hex-map/HexCell.tsx`          | Base hex cell rendering unchanged                    |
| `packages/web/src/components/hex-map/HexTile.tsx`          | Project tile rendering unchanged                     |
| `packages/web/src/components/hex-map/PlacementContext.tsx` | Placement state management unchanged                 |
| `packages/web/src/components/hex-map/UnplacedPanel.tsx`    | Panel may remain for project placement               |
| `packages/shared/src/hex/grid.ts`                          | Hex math utilities unchanged                         |

### New Components Needed

| Component                                              | Purpose                                                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fixed building visuals (campfire, sanctuary, workshop) | Three-js meshes or sprites rendered at reserved hex coords in HexGrid. These are visual-only for this issue (click interaction is out of scope). |

---

## Dependency Chain

```
#699 Remove the Table ─────────┐
#700 Remove the Sorting Room ──┤──> #704 Map as full-bleed base layer
#701 Remove the Drafting Room ─┘
```

All three blockers remove UI elements and routes that conflict with the map-first layout. They must complete first so that:

- The TableBar no longer claims viewport space at the bottom
- The NewUiShell navigation no longer routes to rooms
- The route tree is clean for the map-only architecture

---

## Design Constraints from Context Library

1. **The map IS the game.** "A spatial canvas where builders see their entire life organized as a hex grid." Life Map is not a view or a page; it is the application. (Zone - Life Map)

2. **Strategy - Spatial Visibility governs.** "When choosing between abstract representation and spatial/visual representation, always choose spatial." The map must be the dominant visual, not an embedded widget. (Strategy - Spatial Visibility)

3. **Full-bleed means edge-to-edge.** No margins, no sidebars, no chrome competing for viewport space. The map occupies 100% of the visual field. Other UI layers (overlays, panels) float on top. (Release - The Map-first UI: "Hex map is always visible, full-bleed. All other UI layers on top.")

4. **Entry point is the map.** "Life Map is the default view when builders open LifeBuild." The `/` route should render the map directly. (Zone - Life Map)

5. **Hex Grid prototype is proven.** "A working prototype demonstrates the hex grid with illustrated tiles, camera-based navigation, sprite placement, and pathfinding. The visual approach is proven." Integration is an engineering task. (Structure - Hex Grid, reality note 2026-02-24)

---

## Risks & Open Questions

1. **WebGL fallback.** The current `LifeMap.tsx` falls back to category card list when WebGL is unavailable or viewport is mobile. With map-first, what happens on non-WebGL devices? The release plan does not address this. Likely: show a graceful error or simplified view.

2. **Mobile viewport.** The current code only shows the hex map on desktop (`isDesktopViewport`). Map-first means mobile needs the map too, or at minimum a clear path forward.

3. **Fixed building visual assets.** No campfire/sanctuary/workshop visual assets exist in the codebase. These need to be created or placeholders used. The release plan mentions "Nano Banana generated statues" for projects but the fixed buildings need distinct visuals.

4. **Overlay routing.** While clicking buildings to open overlays is out of scope for #704, the routing architecture needs to support it. Routes like `/workshop` and `/sanctuary` need to render as overlays on top of the map, not as separate pages.
