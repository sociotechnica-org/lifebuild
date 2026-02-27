# Context Briefing: Issue #717 — Statue Sprites on Placed Projects

**Issue:** #717
**Type:** Component (new feature)
**Date assembled:** 2026-02-27
**Conan confidence:** High — strong card coverage, existing code patterns clear

---

## Constellation

### Seed Cards (read in full)

| Card | Role in Constellation |
|---|---|
| Component - Hex Tile | **Primary target.** The component where statue sprites will render. Currently shows initials + hover label on a 3D hex cylinder. Sprite rendering is the main addition. |
| Structure - Hex Grid | **Parent container.** Hex Grid holds tiles, manages placement, click/hover interactions. Sprites must integrate without breaking placement or selection flows. |
| Primitive - Project | **Data source.** Projects provide name, category, state, workstream. These properties drive sprite appearance (color vs. gray, border tint). |
| Standard - Visual Language | **Conformance spec.** Defines category colors, stream accents (gold/silver/bronze), state indicators (active = full saturation, completed = dimmed). Sprite treatment must follow these rules. |

### Expanded Cards (read in full)

| Card | Role in Constellation |
|---|---|
| Standard - Project States | **State treatments.** Active = full color, completed = greyed out. Planning = reduced saturation. Work at Hand = glow + stream shimmer. These map directly to sprite visual treatment. |
| Standard - Image Evolution | **Future vision.** Full 5-stage illustration evolution is deferred (Release 8). Issue #717 uses a single static TEMP PNG. This card documents the eventual destination. |
| Standard - Dual Presence | **Deprecated for current release.** The Table is removed. Dual presence is inert. Sprites only need to render in one location (hex grid). |
| Standard - Spatial Interaction Rules | **Interaction constraints.** Builder-driven placement. Click opens overlay. No auto-arrangement. Sprites must not interfere with drag/rearrange (deferred) or placement cursor. |
| Principle - Visual Recognition | **Design principle.** Two-second identification test. For TEMP static sprite this is loosened — all projects share the same image. Real recognition comes with AI-generated sprites (Release 8). |
| Zone - Life Map | **Top-level zone.** The hex map is the sole base layer. Click any building to open overlay. Sprites are the "building" visual representation for projects. |
| Release - The Map-first UI | **Current release context.** Explicitly calls for "Nano Banana generated statues placed on hex cells. Grayed out when completed/archived. Gold/silver/bronze subtle border coloring." |

---

## Codebase Impact

### Files to Modify

| File | Change |
|---|---|
| `packages/web/src/components/hex-map/HexTile.tsx` | **Primary target.** Add sprite image rendering (static PNG) on top of the hex cylinder. Apply grayscale filter for completed state. Keep hover label behavior. Keep stream glow border. |
| `packages/web/src/components/hex-map/HexTile.stories.tsx` | Add stories showing sprite on active, completed, work-at-hand, and planning states. |
| `packages/web/src/components/hex-map/HexGrid.tsx` | May need minor updates if sprite rendering requires passing additional props through `PlacedHexTile` type. |

### Files for Reference (no changes needed)

| File | Why Relevant |
|---|---|
| `packages/hex-grid-prototype/src/components/MapSprite.tsx` | **Proven pattern.** Shows how to render a textured sprite on hex coordinates using `@react-three/fiber`. Uses ShaderMaterial with alpha handling and camera-facing tilt. Direct reference for sprite rendering approach. |
| `packages/hex-grid-prototype/src/store/spriteState.ts` | Shows the prototype's sprite data model (id, url, coord, scale). Current HexTile already has coord; needs sprite URL/texture. |
| `packages/shared/src/livestore/schema.ts` | `hex_positions` table with `entityId`, `entityType`, `hexQ`, `hexR`. No changes needed — sprite is a visual layer on existing placed tiles. |
| `packages/shared/src/livestore/events.ts` | `hexPosition.placed` and `hexPosition.removed` events. No changes needed. |
| `packages/shared/src/livestore/queries.ts` | `hexPositions` query and unplaced projects query. No changes needed. |

### Asset Requirements

| Asset | Details |
|---|---|
| Static sprite PNG | Single temporary statue/building PNG. Likely placed in `packages/web/public/` or similar static assets path. Isometric style to match prototype aesthetic. All projects reuse the same image for now. |

---

## Design Constraints

### From Standard - Visual Language

- **Active projects:** Full color sprite, full saturation.
- **Completed/archived:** Greyed out (desaturated). Current HexTile already applies `#a7a29a` edge color and dimmed inner top for completed state.
- **Planning:** Reduced saturation (~70%).
- **Work at Hand:** Enhanced glow + stream-color shimmer (already implemented in border).

### From Release - The Map-first UI

- **Gold/silver/bronze subtle border coloring:** Already implemented in `STREAM_GLOW_COLORS` in HexTile.tsx. Sprite does not need its own border — the hex cylinder edge provides this.
- **Click opens project overlay:** Already wired through `onClick` prop. Sprite must not block click propagation.
- **Hover shows project name tooltip:** Already implemented — hover reveals truncated label text. Sprite should not interfere with pointer events.

### From Standard - Image Evolution (deferred)

- Issue #717 uses a single static PNG (TEMP). The eventual vision is 5-stage content-depicting diorama-style illustrations per project. The sprite component should be architected so the image URL can later be swapped per project without structural changes.

---

## Implementation Guidance

### Sprite Rendering Approach

The prototype's `MapSprite.tsx` demonstrates the proven pattern:
1. Load texture via `useLoader(THREE.TextureLoader, url)`
2. Create a plane geometry with aspect-ratio-aware dimensions
3. Position above the hex tile top surface
4. Tilt toward camera angle (~35 degrees from horizontal)
5. Use ShaderMaterial for alpha transparency (fade white/black backgrounds)

For HexTile integration:
- The sprite sits ON TOP of the existing hex cylinder, not replacing it.
- The hex cylinder continues to provide category-colored edges and stream glow.
- The sprite replaces (or supplements) the current initials `Text` element.
- The hover label text continues to appear above the sprite on hover.

### State-Dependent Visual Treatment

| State | Sprite Treatment |
|---|---|
| `active` | Full color, normal opacity |
| `planning` | Reduced saturation, slightly transparent |
| `work-at-hand` | Full color, stream glow on border (already exists) |
| `completed` | Greyscale or heavily desaturated. Could use a shader uniform or CSS filter equivalent in Three.js |

### Grayscale Implementation Options

1. **Shader-based:** Extend the MapSprite shader to accept a `uGrayscale` uniform. When 1.0, convert RGB to luminance.
2. **Texture manipulation:** Apply a grayscale filter at the Three.js material level via `material.color` desaturation.
3. **Opacity + color overlay:** Keep the existing meshStandardMaterial approach with color tinting.

Option 1 (shader-based) is cleanest and matches the prototype pattern.

### Click/Hover Behavior

- Sprite mesh should either pass through raycasts to the parent group's handlers OR have its own handlers that delegate to the parent group's onClick/onPointerOver/onPointerOut.
- The prototype uses `raycast={() => null}` on text elements to prevent them from blocking clicks — same pattern should apply or the sprite should be part of the clickable group.

---

## Anti-Patterns to Avoid

**From Structure - Hex Grid:**
- Do NOT auto-arrange or reposition sprites. Builder controls placement.
- Do NOT make sprite size vary by importance. "All tiles same size" (Component - Hex Tile).

**From Principle - Visual Recognition:**
- A static temp sprite will NOT pass the two-second recognition test (all projects look the same). This is acceptable for TEMP — the release note acknowledges this. Do not add complex per-project visual differentiation now.

**From Standard - Visual Language:**
- Do NOT use unmapped colors. Gold/silver/bronze borders come from `STREAM_GLOW_COLORS`. Category colors come from project data. Sprite itself is neutral (same image for all).

---

## Provenance

| Card | Path | Read? |
|---|---|---|
| Component - Hex Tile | `docs/context-library/product/components/Component - Hex Tile.md` | Yes |
| Structure - Hex Grid | `docs/context-library/product/structures/Structure - Hex Grid.md` | Yes |
| Primitive - Project | `docs/context-library/product/primitives/Primitive - Project.md` | Yes |
| Standard - Visual Language | `docs/context-library/rationale/standards/Standard - Visual Language.md` | Yes |
| Standard - Project States | `docs/context-library/rationale/standards/Standard - Project States.md` | Yes |
| Standard - Image Evolution | `docs/context-library/rationale/standards/Standard - Image Evolution.md` | Yes |
| Standard - Dual Presence | `docs/context-library/rationale/standards/Standard - Dual Presence.md` | Yes |
| Standard - Spatial Interaction Rules | `docs/context-library/rationale/standards/Standard - Spatial Interaction Rules.md` | Yes |
| Principle - Visual Recognition | `docs/context-library/rationale/principles/Principle - Visual Recognition.md` | Yes |
| Zone - Life Map | `docs/context-library/product/zones/Zone - Life Map.md` | Yes |
| Release - The Map-first UI | `docs/context-library/releases/Release - The Map-first UI.md` | Yes |
| Release - The Art | `docs/context-library/releases/Release - The Art.md` | Yes |
