# Context Briefing

## Task Frame

**Task:** Implement the hex grid / map foundation for Release 1 ("The Campfire") -- the Minimum Viable Map (MVMap). This includes SVG hex grid rendering, hex tile components, hex coordinate system, LiveStore hex events, map-project integration, builder-driven hex placement UX, and integration with The Table overlay.

**Target type:** Structure (Hex Grid) + Component (Hex Tile)

**Task type:** Feature -- new implementation (nothing exists in the codebase)

**Constraints:**
- R1 scope only -- fixed ~30-40 position SVG grid, NOT infinite canvas
- Builder-driven manual placement from day one (D1 resolved) -- no algorithmic auto-placement
- One project per hex (D3 resolved) -- hex position is a unique constraint
- Sanctuary is a 3-tile exception to the one-per-hex rule
- No semantic zoom (single zoom level)
- No drag-to-rearrange (deferred to R2)
- No infinite pan/scroll
- No image generation on tiles
- No clustering/spatial analysis
- No frontier/grayed-out hexes
- Desktop-first; mobile falls back to existing card view

**Acceptance criteria:**
- SVG hex grid renders with sanctuary at center, campfire at edge
- Projects appear as hex tiles with category-colored borders
- Clicking a hex opens `/projects/:id`
- Builder can place new projects on empty hexes (tap/drag)
- Hex position persists via LiveStore events
- The Table overlay renders on top of the map view
- Map becomes the default route
- Existing nav to Drafting Room and Sorting Room still accessible

---

## Primary Cards (full content)

### Structure - Hex Grid

**Type:** Structure
**Relevance:** This IS the primary build target. Defines the spatial canvas, its behavior, visual treatments, and arrangement rules.

#### WHAT: Definition

The spatial organization canvas that fills most of the Life Map -- a tessellated field of hexagonal tiles where each tile represents a project or system. Builders arrange tiles spatially by category and relationship, creating a visual map of their life's work.

#### WHERE: Ecosystem

- Zone: [[Zone - Life Map]] -- the Hex Grid exists directly in Life Map (not in a Room)
- Contains: [[Component - Hex Tile]], [[Component - Campfire]]
- Displays: [[Primitive - Project]], [[Primitive - System]]
- Conforms to: [[Standard - Visual Language]], [[Standard - Spatial Interaction Rules]]
- Implements: [[Strategy - Spatial Visibility]], [[Principle - Bidirectional Loop]], [[Principle - Visual Recognition]]
- Uses: [[Capability - Zoom Navigation]]

#### WHY: Rationale

- Strategy: Spatial Visibility -- hexagons are the spatial unit
- Principle: Visual Recognition -- "my health stuff is upper-left" becomes automatic
- Principle: Familiarity Over Function -- spatial metaphor feels natural
- Decision: Hexagons (not squares) because they tessellate without privileged axes. Every hex has six equal neighbors -- no "up is better than sideways" bias.
- Constraints: Hex Grid is a thinking tool, not a filing system. Spatial arrangement carries meaning that only the builder assigns.

#### WHEN: Timeline

**Reality note (2026-02-17):** No hex grid exists in the codebase. The Life Map currently renders 8 `CategoryCard` components in a flat layout. Key decisions resolved: manual builder placement (D1), one project per hex with sanctuary as 3-tile exception (D3).

**History:**
- D3 (2026-02-17): One project per hex. Sanctuary is a 3-tile exception. Hex position is a unique constraint.
- D1 (2026-02-17): Manual -- builder places from day one. No algorithmic category zone layout.

#### HOW: Implementation

**Grid behavior (full vision -- scope to R1 below):**
- Infinite canvas (R1: fixed ~30-40 positions)
- Builders drag tiles to arrange (R1: placement only, no rearrange)
- Adjacent tiles form visual clusters (R1: deferred)
- Empty hexes between clusters create breathing room

**Tile types:** Project tiles (bounded work), System tiles (continuous infrastructure)

**Visual treatments:** Category colors on tile borders, stream accents for Work at Hand, state treatments, health indicators for systems.

**Zoom interaction:** Deferred to R2. R1 uses a single zoom level.

**Anti-patterns:**
- Auto-arranging hex tiles into a neat category grid -- spatial arrangement must reflect the builder's thinking
- Snap-to-grid behavior that forces tiles into rigid positions

---

### Component - Hex Tile

**Type:** Component
**Relevance:** The atomic visual unit on the grid. Defines what each hex displays, its interactions, and visual states.

#### WHAT: Definition

An individual hexagonal tile representing a single project or system. Displays identifying information (title, image, category) plus state indicators (progress, health, Work at Hand status).

#### WHERE: Ecosystem

- Parent: [[Structure - Hex Grid]]
- Conforms to: [[Standard - Visual Language]], [[Standard - Image Evolution]], [[Standard - Dual Presence]], [[Standard - Project States]], [[Standard - Smoke Signal Thresholds]]
- Related: [[Component - Campfire]] -- sibling on the hex grid

#### WHY: Rationale

- Strategy: Spatial Visibility -- tiles are the atomic spatial unit
- Principle: Visual Recognition -- consistent tile format aids scanning

#### WHEN: Timeline

**Reality note (2026-02-17):** No hex tiles exist. Projects render as `ProjectCard` within `CategoryCard` containers. D3: each tile = exactly one project (1:1 binding). D1: builder manually places tiles.

#### HOW: Implementation

**Tile contents (R1 scope):**
- Project title (truncated if long)
- Category color border
- Simple state indicator (planning/active/completed)

**Tile contents (deferred):**
- Project illustration (requires image generation pipeline)
- Progress ring (% complete) -- may include in R1 if simple
- Health indicator for systems

**State treatments (R1 simplified):**
- Planning: Lower saturation (~60%)
- Live: Full color, active
- Work at Hand: Enhanced glow, stream accent
- Completed: Greyed, archived indicator

**Interactions:**
- Click -> opens `/projects/:id` (Project Board)
- Placement via tap/drag on empty hex

**Size:** All tiles same size. No "bigger = more important."

---

### Standard - Life Categories

**Type:** Standard
**Relevance:** Categories determine hex tile border colors. The eight defaults and their color mappings are required for hex rendering.

#### WHAT: Definition

Eight default life-domain categories organizing all builder work. Every project belongs to exactly one category. Categories determine spatial grouping, color mapping, and visual identity.

#### HOW: Key Specification (for hex implementation)

| LifeBuild Default | Color (from Standard - Visual Language) |
| --- | --- |
| Health | Vibrant green |
| Relationships | Warm pink/rose |
| Finances | Gold/amber |
| Learning | Teal |
| Leisure | Sky blue |
| Purpose | Deep purple/indigo |
| Home | Earthy brown/terracotta |
| Service | Orange |

**Implementation note:** Category colors are already implemented in `constants.ts`. Hex tiles should use the existing color constants for border rendering.

**Rules:**
- Every project requires exactly one Life Category
- Category assignment is builder-driven (subjective), not algorithmic
- Colors are tied to category slots, not labels (renaming a category does not change its color)

---

### Primitive - Project

**Type:** Primitive
**Relevance:** Projects are the entities that occupy hex tiles. The hex coordinate becomes a new property on the Project primitive.

#### WHAT: Definition

A discrete initiative with a finish line -- bounded work that completes and moves to Archives.

#### WHERE: Ecosystem

- Zone: Cross-zone -- projects live on Life Map, created in Drafting Room
- Conforms to: Standard - Life Categories (every project requires a category)
- Governs: Room - Project Board (execution interface)

#### WHEN: Timeline

**Reality note (2026-02-17):** Project primitive is fully operational. `projects` table in LiveStore schema with full event support. D3 resolved: each project gets a unique hex position. `project.hexPlaced { projectId, q, r }` event to be added for R1.

#### HOW: Implementation (hex-relevant)

**New property for R1:** Hex coordinate (q, r) -- added via `project.hexPlaced` event.

**Lifecycle States relevant to hex rendering:**

| State | Hex Visual Treatment |
| --- | --- |
| Planning | ~60% saturation, no glow |
| Live | Full saturation, standard |
| Work at Hand | Full saturation + glow + stream accent |
| Completed | Greyed, archived |

---

### Strategy - Spatial Visibility

**Type:** Strategy (Strategic Plank 1)
**Relevance:** The foundational bet. Every hex grid decision must serve this strategy. This is WHY hex tiles exist.

#### WHAT: The Strategy

Making work visual, placed, and traversable creates comprehension and agency that lists and abstractions cannot.

#### WHY: Belief

Most productivity tools treat work as lists, databases, or inboxes -- abstract containers requiring cognitive effort. The bet: if work is represented spatially, visually, and traversably, builders develop deeper understanding leading to better decisions and greater agency.

Research: the brain's spatial processing and memory systems share neural infrastructure. Grid cells in the entorhinal cortex fire in hex patterns -- hexagonal spatial organization is neurologically native.

#### HOW: Maturity Ladder

| Level | Name | Current State |
| --- | --- | --- |
| 0 | Status Quo | Lists, databases |
| 1 | Minimally Viable | Kanban + backlogs (current) |
| **2** | **Placed & Illustrated** | **Hexmap Life Map (R1 target)** |
| 3 | Immersive & Navigable | Game engine (future) |
| 4 | Hybrid Physical/Digital | AR (far future) |

**Decision heuristic:** When choosing between abstract and spatial/visual representation, always choose spatial.

**Anti-patterns:**
- Defaulting to list or feed views
- Hiding work behind menus or hover states
- Flat spatial layout without zoom levels (acceptable for R1 given scope constraints)

---

### Standard - Spatial Interaction Rules

**Type:** Standard
**Relevance:** Governs ALL builder interactions with the hex grid. Critical for placement UX design. D1 confirms this standard is upheld from R1.

#### WHAT: Definition

Builder places their own projects. System never auto-organizes. Rearrangement is low-friction. Spatial clustering carries builder-assigned meaning.

#### HOW: Specification

**Builder Agency Rules:**

| Rule | Requirement |
| --- | --- |
| Placement | Builders place their own projects. System does not assign locations. |
| Rearrangement | Drag-and-drop. No confirmation dialogs. (R2) |
| Clustering | Adjacent hexes carry builder-assigned meaning. System observes but doesn't impose. |
| Persistence | Spatial arrangement persists exactly as builder left it. |

**Interaction Requirements:**

| Interaction | Spec |
| --- | --- |
| Place a project | Single drag-and-drop action |
| Suggested locations | Prohibited -- no auto-place |
| "Optimize layout" | Prohibited -- no system rearrangement |

**Anti-patterns:**
- System auto-organizing hex grid by category
- Confirmation dialog when moving a project
- "Optimize layout" feature

**Conformance test:**
1. Create a project and place it -- verify no suggested location or auto-place prompt appears
2. Review all AI interactions -- agents only observe, never suggest moves

---

## Supporting Cards (summaries)

| Card | Type | Key Insight |
| --- | --- | --- |
| Zone - Life Map | Zone | The hex grid lives directly in Life Map (not nested in a Room). Life Map is the primary workspace and default route. Map-first architecture confirmed. |
| Component - Campfire | Component | Temporary onboarding moment at edge of grid. Fades after builder walks to sanctuary. First-run only. Off to the side, NOT at center. |
| Standard - Dual Presence | Standard | Work at Hand projects appear both on hex tile AND on The Table. Same object rendered twice, not two synced objects. Both views update simultaneously. |
| Standard - Visual Language | Standard | Category colors, stream accents (Gold/Silver/Bronze), state indicators (saturation levels), entity markers (progress rings for projects, health dots for systems). Already partially implemented in `constants.ts`. |
| Standard - Project States | Standard | Six states (Planning, Planned, Live, Work at Hand, Paused, Completed) with distinct visual treatments. Work at Hand = full saturation + glow. Planned = 70%. Paused = 50%. |
| Principle - Visual Recognition | Principle | Two-second test: builder must identify a tile in under 2 seconds at glance distance. Content-depicting illustrations (deferred for R1), but category colors and title must suffice initially. |
| Principle - Bidirectional Loop | Principle | External representation and internal understanding strengthen each other. Builder placement reveals mental models. Justifies manual placement (no auto-organization). |
| Principle - Visibility Creates Agency | Principle | Builders can't control what they can't see. Default to showing, not hiding. Filters opt-in, not opt-out. Everything has a persistent, visible place. |
| Principle - Familiarity Over Function | Principle | Builders classify by feeling, not objective criteria. Categories feel immediately recognizable. Spatial metaphor should feel natural. |

---

## Relationship Map

- Structure - Hex Grid **lives-in** Zone - Life Map (direct child, no Room intermediary)
- Component - Hex Tile **contained-by** Structure - Hex Grid
- Component - Campfire **contained-by** Structure - Hex Grid (temporary, at edge)
- Structure - Hex Grid **displays** Primitive - Project (via hex tiles)
- Structure - Hex Grid **constrained-by** Standard - Spatial Interaction Rules
- Structure - Hex Grid **constrained-by** Standard - Visual Language
- Structure - Hex Grid **implements** Strategy - Spatial Visibility
- Component - Hex Tile **constrained-by** Standard - Visual Language
- Component - Hex Tile **constrained-by** Standard - Dual Presence
- Component - Hex Tile **constrained-by** Standard - Project States
- Primitive - Project **occupies** Component - Hex Tile (1:1 binding, D3)
- Primitive - Project **conforms-to** Standard - Life Categories (determines border color)
- Standard - Spatial Interaction Rules **implements** Principle - Bidirectional Loop
- Strategy - Spatial Visibility **governs** Structure - Hex Grid, Zone - Life Map, Component - Hex Tile
- Principle - Visual Recognition **governs** Structure - Hex Grid, Component - Hex Tile
- Overlay - The Table **renders-on** Zone - Life Map (above hex grid)
- Standard - Dual Presence **connects** Component - Hex Tile to Overlay - The Table

---

## Decisions Already Made

### D1: Manual placement from day one (2026-02-17)

**Chosen:** Builder places projects manually. No algorithmic category zone layout.
**Impact on implementation:**
- Must build placement UX (tap/drag to place on empty hex)
- Must build placement validation (no two projects on same hex)
- No need for auto-placement algorithm
- Existing projects (created before hex grid) will need manual placement by builder
- Standard - Spatial Interaction Rules is upheld as-is -- no override patch needed

### D3: One project per hex (2026-02-17)

**Chosen:** One project per hex. Sanctuary is a 3-tile exception.
**Impact on implementation:**
- Hex position (q, r) is a unique constraint on projects
- LiveStore event: `project.hexPlaced { projectId, q, r }`
- Placement validation: reject if hex already occupied
- Sanctuary structure occupies 3 hexes at grid center (special case)
- Data model is simpler: no need for multi-project-per-hex rendering

### D4: Remove category room agents (2026-02-17)

**Chosen:** Remove entirely for R1.
**Impact:** Category agents (Maya, Grace, Brooks, etc.) from `rooms.ts` should be removed. Not directly hex-grid work, but part of the same release scope.

---

## R1 Implementation Scope

### What to build

1. **SVG hex grid renderer** -- Fixed ~30-40 hex positions using offset coordinates (odd-q or even-q). SVG for simplicity, debuggability, CSS integration.

2. **Hex coordinate system** -- Offset coordinates with hex math utilities (neighbor calculation, pixel-to-hex conversion, hex-to-pixel conversion).

3. **Hex tile component** -- Individual hex SVG element displaying: project title (truncated), category color border, simple state indicator. Click handler navigates to `/projects/:id`.

4. **Sanctuary structure** -- Distinct 3-hex visual element at grid center. Warm, recognizable as "home." Clickable.

5. **Campfire element** -- Only for builders who haven't completed onboarding. Corner/edge of grid. Warm glow.

6. **LiveStore hex events** -- `project.hexPlaced { projectId, q, r }` event. Materializer adds hex coordinates to project records. Uniqueness constraint on (q, r).

7. **Hex placement UX** -- Builder taps/drags to place project on empty hex. No suggested positions. No auto-place. Single action.

8. **Map-project integration** -- Hex-project binding via `project.hexPlaced` events. Click hex to navigate to project. Map replaces category cards as default route.

9. **The Table overlay** -- Existing Table component renders on top of the map view.

10. **Navigation** -- Map as default route. Existing nav to Drafting Room, Sorting Room still accessible.

### What NOT to build (explicitly deferred)

- Semantic zoom (Horizon/Working/Detail views)
- Infinite pan/scroll
- Drag-to-rearrange existing hex positions
- Frontier / grayed-out unclaimed hexes
- Image generation / illustration on tiles
- Clustering / spatial analysis
- Sanctuary structure evolution (stays as Humble Studio)
- Complex state treatments (hibernating, overgrowth, dormancy)
- Smoke signals / health indicators
- System tiles (only project tiles in R1)
- Progress rings (include if trivial, defer if complex)

---

## Gap Manifest

| Dimension | Topic | Searched | Found | Recommendation |
| --- | --- | --- | --- | --- |
| HOW | Exact hex grid dimensions (how many rings, what radius) | yes | partial | Release plan says "~30-40 positions." Builder should decide exact grid size. A 3-ring hex grid = 37 hexes (good fit). |
| HOW | Hex coordinate system choice (offset vs cube vs axial) | yes | no | Release plan says "offset coordinates (odd-q or even-q)." Use offset for storage, cube for math operations. Well-documented pattern. |
| HOW | SVG rendering approach (individual hex elements vs single path) | yes | no | Individual SVG elements recommended for click handling and per-hex styling. |
| HOW | Viewport/container sizing and responsive behavior | yes | partial | Release plan says "desktop-first, mobile falls back to existing card view." Need to determine breakpoint and container dimensions. |
| HOW | Existing project migration UX (how builders place pre-existing projects) | yes | partial | D1 says "existing projects need manual placement by builder." Need UX for prompting builder to place unplaced projects. |
| HOW | Sanctuary 3-tile visual design | yes | no | Described as "Humble Studio -- small, warm, recognizable as home." No visual spec exists. Builder should design this. |
| HOW | Campfire visual design | yes | partial | "Fire in the wilderness, off to the side." No SVG spec. Builder should design warm/glowing element. |
| WHERE | How hex grid integrates with existing LifeMap.tsx component | yes | no | Current LifeMap.tsx renders CategoryCards. Hex grid replaces this. Need to understand current component structure. |
| WHEN | Which hex features ship in Milestone 1 vs later R1 milestones | yes | partial | Milestone 1 ("The Grid"): hex grid renders, projects as hex tiles, click opens project, Table overlay works. Campfire/walk are Milestone 3. |

---

## Anti-Patterns to Avoid

These are extracted from the HOW sections of primary and supporting cards. Read carefully before implementation.

1. **Auto-arranging hex tiles into a neat category grid.** Spatial arrangement must reflect the builder's thinking, not the system's optimization. Even if auto-sort would look cleaner, it destroys cognitive value. (Source: Structure - Hex Grid)

2. **Snap-to-grid behavior that forces tiles into rigid positions.** Builders must be able to place tiles on any empty hex. No "this hex is reserved for Health projects." (Source: Structure - Hex Grid)

3. **Suggesting hex locations during placement.** No "recommended position" indicators. No "place near similar projects" hints. The builder chooses freely. (Source: Standard - Spatial Interaction Rules)

4. **Confirmation dialogs for placement.** Placement should be a single action. No "Are you sure you want to place here?" (Source: Standard - Spatial Interaction Rules)

5. **Syncing two separate objects instead of rendering one object twice.** For Dual Presence (hex tile + Table position), both views render the SAME underlying project. Not two copies kept in sync. (Source: Standard - Dual Presence)

6. **Defaulting to list or feed views.** The hex grid IS the primary view. If the fallback looks like a list, the spatial bet has failed. (Source: Strategy - Spatial Visibility)

7. **Hiding work behind menus or hover states.** Project information should be visible on the hex tile at rest. No hover-to-reveal patterns for core information. (Source: Principle - Visibility Creates Agency)

8. **Rendering planned/paused projects at full saturation.** State must be distinguishable at a glance via saturation levels. (Source: Standard - Visual Language, Standard - Project States)

9. **Building zoom levels, infinite scroll, or clustering for R1.** These are explicitly deferred. Overbuilding from the full vision is the most likely failure mode when the library cards describe the complete product. (Source: Release - The Campfire)

10. **Campfire at the center of the map.** The campfire is at the edge/corner. The sanctuary is at the center. The walk FROM campfire TO sanctuary is the spatial metaphor. (Source: Component - Campfire)
