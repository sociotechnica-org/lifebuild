# Plan Comparison: Opus vs Codex — 3D Life Map Rollout

## Where They Agree

Both plans are strongly aligned on fundamentals:

- **Rendering stack**: Three.js + React Three Fiber + @react-three/drei (matching prototype)
- **Orthographic camera** at fixed perspective (no free pan/zoom in R1)
- **Cube coordinates** (q, r) with s derived — proven in prototype
- **Grid size**: 3-ring hex grid = 37 positions
- **CylinderGeometry** (6 segments) for pointy-top hexagons
- **Manual placement** (D1): click-to-place, no suggestions
- **One project per hex** (D3): unique constraint on coordinates
- **Sanctuary**: 3-hex structure at grid center
- **Desktop-first**: mobile falls back to existing CategoryCard view
- **Lazy loading**: React.lazy + Suspense for Three.js bundle
- **Zustand** for ephemeral 3D state, **LiveStore** for persistent data
- **HTML overlays** (drei `<Html>`) for text labels
- **Sequential first PRs**: foundation → data → placement must be sequential
- **Storybook stories** for each PR

---

## Key Differences

### 1. Data Model: Separate Table vs Columns on Projects

| | Opus | Codex |
|---|---|---|
| **Approach** | Separate `hex_positions` table with `entityType` + `entityId` | `hexQ`/`hexR` nullable columns on `projects` table |
| **Events** | `hexPosition.placed`, `hexPosition.removed` | `v4.ProjectHexPlaced` (implied columns on projects) |
| **Rationale** | Extensible for future entity types (systems, landmarks) | Simpler, fewer joins |

**Analysis:** Opus's separate table is more forward-looking — the context library mentions System tiles (deferred to R2) and other entity types. However, for R1 scope (projects only), Codex's approach is simpler. The context briefing suggests `project.hexPlaced { projectId, q, r }` which is closer to Codex's model but could work with either storage approach.

**Recommendation:** Use Opus's separate `hex_positions` table. The extensibility cost is minimal (one extra join) and avoids a migration when systems/landmarks need positions later. But use simpler event names closer to the context briefing pattern.

---

### 2. Code Location

| | Opus | Codex |
|---|---|---|
| **3D components** | `packages/web/src/components/hex-map/` (new directory) | `packages/web/src/components/life-map/three/` (nested in existing) |
| **Hex math** | `packages/shared/src/hex/` | Not explicitly specified |

**Analysis:** Opus creates a clean new namespace (`hex-map/`), Codex nests inside existing `life-map/`. Since the hex map IS the life map on desktop, Codex's nesting makes conceptual sense — but Opus's separation is cleaner for code organization since the 3D code is a fundamentally different rendering paradigm.

**Recommendation:** Use Opus's `hex-map/` directory. The 3D rendering code is sufficiently different from the CategoryCard code that it deserves its own namespace. Hex math goes in `packages/shared/src/hex/` as Opus suggests (shared utilities).

---

### 3. PR Structure

| PR# | Opus | Codex |
|-----|------|-------|
| 1 | Three.js Hex Grid Shell | Map Foundation (similar) |
| 2 | LiveStore Events + Project Tiles | Hex Data + Tiles (similar) |
| 3 | Hex Placement UX | Project Placement (similar) |
| 4 | Visual Treatments + State Indicators | **Table Overlay** |
| 5 | Parchment Shader + Aesthetic Polish | **Landmarks (Sanctuary/Campfire)** |
| 6 | Sanctuary Structure | **Campfire Walk Hooks** |
| 7 | Navigation, Routing, Polish | Hardening |

**Analysis:** PRs 1-3 are essentially identical. The divergence is in PRs 4-7:

- **Opus** separates visual polish into two PRs (state indicators, then shaders) and has a dedicated sanctuary PR
- **Codex** includes a **Table Overlay PR** (missing from Opus entirely) and a **Campfire Walk Hooks PR** (camera transitions)
- The context briefing's acceptance criteria explicitly include "The Table overlay renders on top of the map view" — this is a gap in Opus's plan
- Campfire walk transitions are part of the release vision but may be out of scope per Opus's stated exclusions

**Recommendation:** Merge the best of both:
- Keep Opus's visual treatment separation (state indicators + shader are genuinely independent)
- Add Codex's Table Overlay PR (it's in the acceptance criteria)
- Combine sanctuary + campfire into one landmarks PR
- Defer campfire walk hooks (Opus explicitly excludes walk animation; it depends on onboarding flow design)

---

### 4. Feature Flag / Toggle Strategy

| | Opus | Codex |
|---|---|---|
| **Approach** | List/Map toggle in nav for desktop users | `VITE_LIFE_MAP_3D_ENABLED` feature flag |
| **Rationale** | User choice | Safe staged rollout |

**Analysis:** These aren't mutually exclusive. A feature flag controls rollout; a toggle gives users the option once it's enabled. But the context briefing says "Map as default route" and the strategy warns against "defaulting to list or feed views." A permanent toggle risks undermining the spatial-first bet.

**Recommendation:** Use Codex's feature flag for rollout safety. Include a temporary list/map toggle (as Opus suggests) but plan to remove it once the map is stable. The toggle is a development/transition aid, not a permanent feature.

---

### 5. Archived/Completed Project Handling

| | Opus | Codex |
|---|---|---|
| **Archived** | Hex position removed (freed for reuse) | "Preserve current access in side panel or drawer" |
| **Completed** | Greyed-out decorative tile (not clickable), keeps position | Not explicitly addressed |

**Analysis:** Opus is more specific. The context briefing says completed projects get "Greyed, archived indicator" treatment. Opus's approach (completed keeps position, archived frees it) makes spatial sense — completed work is still part of the map's history.

**Recommendation:** Follow Opus's approach. Completed projects retain their hex position (greyed out). Archived projects free their hex position. The existing completed/archived sections in LifeMap can remain accessible via a panel.

---

### 6. Scope Boundaries

| Topic | Opus | Codex |
|-------|------|-------|
| Table Overlay | Not mentioned | Dedicated PR |
| Campfire Walk | Explicitly excluded | Dedicated PR |
| WebGL Fallback | Not mentioned | Fallback to card view |
| PostHog Analytics | In final PR | In hardening PR |
| Shader Details | Dedicated PR with specifics | Not explicitly addressed |
| First-time UX | Simple prompt in placement PR | "Support first-time migration of existing projects" |

**Recommendation:** Include Table Overlay (it's in acceptance criteria). Exclude campfire walk (depends on onboarding design decisions not yet made). Include WebGL fallback (Codex's pragmatism). Include analytics in final PR. Include shader work. Address first-time migration in placement PR.

---

## Tensions to Resolve

### Tension 1: Context Briefing says SVG, both plans say Three.js

The context briefing repeatedly mentions "SVG hex grid" but both plans choose Three.js via React Three Fiber, citing the proven prototype. This is the right call — the prototype validates the approach, and the shader/aesthetic goals require Three.js. The context briefing's SVG references appear to predate the prototype validation.

**Resolution:** Three.js is correct. The context briefing's SVG references should be considered superseded by the prototype work and these plans.

### Tension 2: Event naming — `hexPosition.placed` vs `project.hexPlaced`

The context briefing uses `project.hexPlaced { projectId, q, r }`. Opus uses `hexPosition.placed { id, hexQ, hexR, entityType, entityId }`. Codex uses `v4.ProjectHexPlaced`.

**Resolution:** With the separate `hex_positions` table (recommended above), use `hexPosition.placed` / `hexPosition.removed` event names. This matches the entity-agnostic storage model while keeping the event namespace clean.

### Tension 3: Where does the toggle/flag live in the UI?

Opus puts a list/map toggle in the nav. Codex uses an env var. Neither addresses what happens when both the old and new views need to coexist during development.

**Resolution:** Use `VITE_LIFE_MAP_3D_ENABLED` as the master gate. When enabled, the hex map renders on desktop with a small temporary toggle to switch back to cards (for comparison during development). When disabled, cards render as today. Remove the toggle before R1 ships.
