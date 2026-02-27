# Context Briefing: Issue #705 — Building Overlay Pattern and Routing

> Assembled by Conan | 2026-02-27
> Target type: Structure (new overlay pattern) | Task type: New feature
> Blocked by: #704 (Map as full-bleed base layer) — currently OPEN

---

## Summary

Clicking a building on the hex map opens a centered overlay panel on top of a dimmed map. The overlay frame is reusable across all building types (Workshop, Sanctuary, Project). Routes are URL-addressable (`/workshop`, `/sanctuary`, `/projects/:id`). Browser back button and Escape both close the overlay. Only one overlay open at a time.

---

## Primary Cards

### Structure - Building Overlay (NEW — proposed by Release - The Map-first UI)

This card does not yet exist in the context library but is specified in `Release - The Map-first UI` under "New Cards to Create":

> **Structure - Building Overlay:** Centered panel over dimmed map. URL-addressable. Back-button navigable. Used by Workshop, Sanctuary, and Project overlays. Governs consistency across all overlay implementations.

This is the card that issue #705 will implement. The release spec defines the minimum viable implementation:

- Centered panel over dimmed map
- URL-addressable routes (`/workshop`, `/sanctuary`, `/projects/:id`)
- Back button works
- Animated open/close transitions deferred

### Room - Project Board

`docs/context-library/product/rooms/Room - Project Board.md`

The Project Board defines overlay behavior as canon:

- Opens over Life Map (grid visible behind, dimmed)
- Close to return to grid
- It is an overlay, not a navigation event — the builder should feel like they opened a drawer, not left the room
- Currently implemented as a full-page route at `/projects/:projectId` via `ProjectDetailPage.tsx` — this issue converts it to the overlay pattern

### Release - The Map-first UI

`docs/context-library/releases/Release - The Map-first UI.md`

The authoritative release plan. Relevant specifications:

- **Building overlays:** "Centered panel over dimmed map. URL-addressable routes (`/workshop`, `/sanctuary`, `/projects/:id`). Back button works."
- **Fixed buildings:** Campfire (non-clickable, decorative), Sanctuary (clickable), Workshop (clickable)
- **Success criteria:** "User can click any building to open its overlay interface" and "All overlays are URL-addressable (deep-linkable, back-button works)"
- **Out of scope for this issue:** Content inside overlays, animated transitions, Attendant Rail integration

### Zone - Life Map

`docs/context-library/product/zones/Zone - Life Map.md`

The Life Map is the sole zone. All rooms become building overlays on it:

- Project Board and System Board are listed as "detail overlay for any project/system"
- Map-first architecture confirmed: "everything lives on the map"
- The overlay pattern must not replace the Life Map — it layers on top

---

## Supporting Cards

### Overlay - The Table

`docs/context-library/product/overlays/Overlay - The Table.md`

The only existing overlay card. Being **removed** in the Map-first UI release. Its anti-example is instructive: "Hiding The Table when the builder opens a Project Board — The Table is always visible at all zoom levels." However, with The Table being removed, this constraint is no longer active. The Building Overlay replaces The Table as the primary overlay pattern.

### Capability - Workspace Navigation

`docs/context-library/product/capabilities/Capability - Workspace Navigation.md`

Relevant for routing design:

- Deep linking works via URL routing with `preserveStoreIdInUrl()`
- Context preservation across navigation (zoom/scroll state) is a design goal
- Currently uses `react-router-dom` with `BrowserRouter`

### Standard - Visual Language

`docs/context-library/rationale/standards/Standard - Visual Language.md`

The overlay's dimming treatment and visual chrome should conform to the existing visual language: warm parchment backgrounds (`#f5f3f0`, `#efe2cd`), earthy text colors (`#2f2b27`), and the established border/shadow patterns.

### Room - System Board

`docs/context-library/product/rooms/Room - System Board.md`

Not implemented yet but uses identical overlay behavior: "Opens over Life Map (grid visible behind, dimmed). Close to return to grid." The Building Overlay component built for this issue will serve System Board when it is built.

---

## Codebase Impact Map

### Files to Create

| File                                                             | Purpose                                                                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `packages/web/src/components/layout/BuildingOverlay.tsx`         | Reusable overlay frame component — dimmed backdrop, centered panel, Escape handling, click-outside-to-close |
| `packages/web/src/components/layout/BuildingOverlay.stories.tsx` | Storybook stories per web AGENTS.md                                                                         |
| `packages/web/src/components/layout/BuildingOverlay.test.tsx`    | Unit tests for overlay behavior (Escape, back button, backdrop click)                                       |

### Files to Modify

| File                                                         | Change                                                                                                                                                                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/src/constants/routes.ts`                       | Add `WORKSHOP: '/workshop'`, `SANCTUARY: '/sanctuary'` routes. Keep existing `PROJECT: '/projects/:projectId'`                                                                                                         |
| `packages/web/src/Root.tsx`                                  | Add overlay routes that render the map as base layer with `BuildingOverlay` on top. Restructure routing so `/workshop`, `/sanctuary`, and `/projects/:id` render the hex map with the overlay, not as standalone pages |
| `packages/web/src/components/projects/ProjectDetailPage.tsx` | Refactor from full-page route to render inside `BuildingOverlay`. Remove `NewUiShell` wrapper (the map shell provides it)                                                                                              |
| `packages/web/src/components/life-map/LifeMap.tsx`           | Potentially needs to handle `onOpenProject` callback that navigates to overlay route instead of full-page route                                                                                                        |
| `packages/web/src/components/hex-map/HexMap.tsx`             | The `onOpenProject` prop already exists — wire it to navigate to overlay route                                                                                                                                         |
| `packages/web/src/components/layout/NewUiShell.tsx`          | May need z-index coordination with overlay layer. TableBar removal (separate issue) will simplify this                                                                                                                 |

### Existing Patterns to Reference

| Pattern                | File                                                             | Relevance                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Modal component        | `packages/web/src/components/ui/Modal/Modal.tsx`                 | Existing overlay pattern with backdrop, Escape handling, click-outside. Building Overlay is similar but route-aware and larger |
| RoomLayout             | `packages/web/src/components/layout/RoomLayout.tsx`              | Current room wrapper — Building Overlay replaces this pattern for map-based rooms                                              |
| TaskDetailModal        | `packages/web/src/components/project-room/TaskDetailModal.tsx`   | Another modal pattern in the codebase                                                                                          |
| HexMap Escape handling | `packages/web/src/components/hex-map/HexMap.tsx` (lines 142-158) | Already handles Escape for placement mode — overlay Escape must take priority when overlay is open                             |

### Routing Architecture Decision

The current routing uses `react-router-dom` v6 with `BrowserRouter` and flat `<Routes>`. The overlay pattern requires a **nested route** or **layout route** approach:

**Option A — Nested routes (recommended):**

```
/ → MapLayout (always renders hex map)
  /workshop → MapLayout + BuildingOverlay(Workshop)
  /sanctuary → MapLayout + BuildingOverlay(Sanctuary)
  /projects/:id → MapLayout + BuildingOverlay(ProjectDetail)
```

This keeps the map always mounted and renders overlays as children. Back button naturally pops the overlay route. `useNavigate(-1)` or `navigate('/')` closes the overlay.

**Option B — Outlet-based:**
Use React Router's `<Outlet>` in a layout route to render overlay content while the map stays mounted.

The key constraint is that the hex map (Three.js Canvas) must remain mounted when an overlay opens — unmounting and remounting the Canvas is expensive and loses camera state.

### z-index Considerations

Current z-index usage:

- Header: `z-[8]`
- Modal: `z-[9999]`
- User dropdown: `z-[9999]`

The Building Overlay should use a z-index between the header and existing modals (e.g., `z-[100]`), allowing modals (like TaskDetailModal) to render above the overlay if needed.

---

## Key Constraints

1. **Map stays mounted.** The Three.js Canvas in `HexMap.tsx` must not unmount when an overlay opens. Camera state, WebGL context, and placement state must persist.

2. **Only one overlay at a time.** The issue spec is explicit: "Only one overlay can be open at a time."

3. **URL-addressable.** Direct navigation to `/workshop` must render the map with the overlay already open. This means the map must be able to render without user interaction (no dependency on clicking a building first).

4. **Back button closes overlay.** This is natural with route-based overlays — the overlay route is pushed onto history, back pops it.

5. **Escape closes overlay.** Must coordinate with HexMap's existing Escape handler for placement mode. When overlay is open, Escape closes overlay; when no overlay is open, Escape cancels placement.

6. **Reusable frame.** Same visual chrome (panel shape, backdrop dimming, close button placement) for all building types. Content is injected as children.

7. **Blocked by #704.** The map must be the full-bleed base layer before overlays can layer on top of it.

---

## Gaps Identified

| Dimension | Topic                                                       | Searched | Found                                                            |
| --------- | ----------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| HOW       | Building Overlay card does not exist yet in context library | Yes      | No — specified in Release plan but card not created              |
| HOW       | Overlay open/close animation spec                           | Yes      | Explicitly deferred in release plan                              |
| WHERE     | Workshop room card does not exist yet                       | Yes      | No — specified in Release plan but card not created              |
| WHERE     | Sanctuary room card does not exist yet                      | Yes      | No — specified in Release plan but card not created              |
| HOW       | Overlay sizing spec (width, max-height, mobile responsive)  | Yes      | Not found — Release plan says "centered panel" but no dimensions |
| HOW       | Overlay scroll behavior when content exceeds viewport       | Yes      | Not found                                                        |

---

## Provenance

- **Session:** 2026-02-27, issue #705
- **Profile used:** Overlay (custom — no existing profile, adapted from Structure)
- **Seeds:** Release - The Map-first UI, Room - Project Board, Zone - Life Map, Overlay - The Table
- **Traversal depth:** 2 hops
- **Cards read in full:** 12 (Overlay - The Table, Zone - Life Map, Capability - Workspace Navigation, Capability - Zoom Navigation, Structure - Hex Grid, Zone - Strategy Studio, Room - Project Board, Room - System Board, Standard - Visual Language, Release - The Map-first UI, Component - Campfire, Provenance Log)
- **Codebase files examined:** Root.tsx, routes.ts, NewUiShell.tsx, RoomLayout.tsx, Modal.tsx, HexMap.tsx, LifeMap.tsx, ProjectDetailPage.tsx
