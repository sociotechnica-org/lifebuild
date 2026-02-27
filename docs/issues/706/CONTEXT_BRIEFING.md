# Context Briefing: #706 Map navigation: zoom and pan

**Issue:** Map navigation: zoom and pan
**Type:** Capability (Workspace Navigation) / New Feature
**Assembled:** 2026-02-27 by Conan

---

## Constellation

### Primary Cards

| Card                                 | Type       | Relevance                                                                                                                |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Capability - Zoom Navigation         | Capability | Directly specifies zoom behavior: scroll-to-zoom, semantic zoom levels (Far/Mid/Close), zoom persistence across sessions |
| Capability - Workspace Navigation    | Capability | Parent capability; zoom/pan state must persist when switching workspaces                                                 |
| Structure - Hex Grid                 | Structure  | The spatial canvas this navigation operates on; infinite canvas, orthographic view                                       |
| Standard - Spatial Interaction Rules | Standard   | Builder agency over spatial arrangement; pan/zoom must not interfere with drag-and-drop placement                        |

### Supporting Cards

| Card                                  | Type      | Relevance                                                                                      |
| ------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| Zone - Life Map                       | Zone      | The zone where zoom/pan navigation operates; "the map IS the game"                             |
| Strategy - Spatial Visibility         | Strategy  | Strategic Plank 1; zoom levels resolve tension between overview and detail                     |
| Principle - Visibility Creates Agency | Principle | Builders can't control what they can't see; zoom controls information density, not access      |
| Principle - Visual Recognition        | Principle | Two-second recognition test; zoom levels must maintain recognizability at each scale           |
| Component - Hex Tile                  | Component | Tiles must render appropriately at all zoom levels; same size, visual treatments vary by state |

---

## Key Design Constraints

From **Capability - Zoom Navigation**:

- Zoom controls information density, not access. All data exists at every level.
- The Table remains fixed size regardless of zoom.
- Zoom level persists across sessions.
- Three semantic zoom levels: Far (Horizon View), Mid (Working View), Close (Detail View).
- Controls: pinch/scroll to zoom, double-tap to toggle between levels.

From **Capability - Workspace Navigation**:

- Leaving a workspace preserves state (zoom, scroll, selection).
- Return to where you were.

From **Standard - Spatial Interaction Rules**:

- Drag-and-drop must coexist with pan/zoom controls (no confirmation dialogs for moves).
- Spatial arrangement persists exactly as builder left it.

From **Strategy - Spatial Visibility**:

- "A hex grid with no zoom tiers dumps all information at the same density" -- zoom is essential.
- Navigable environments outperform static spatial organization.

From **Principle - Visibility Creates Agency**:

- "Resolution is zoom levels and progressive detail" for managing information density vs. overwhelm.

---

## Current Implementation State

### Web CameraRig (`packages/web/src/components/hex-map/CameraRig.tsx`)

The current web CameraRig is **static** -- it sets the camera once on mount and does not respond to user input. No zoom, no pan, no per-frame updates:

```tsx
import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { MathUtils, OrthographicCamera, Vector3 } from 'three'

const CAMERA_DISTANCE = 24
const CAMERA_ELEVATION_DEGREES = 31
const ORTHOGRAPHIC_VIEW_HEIGHT = 8

export function CameraRig() {
  const { camera, size } = useThree()

  useLayoutEffect(() => {
    const orthoCamera = camera as OrthographicCamera
    const aspectRatio = size.width / Math.max(size.height, 1)

    orthoCamera.left = -ORTHOGRAPHIC_VIEW_HEIGHT * aspectRatio
    orthoCamera.right = ORTHOGRAPHIC_VIEW_HEIGHT * aspectRatio
    orthoCamera.top = ORTHOGRAPHIC_VIEW_HEIGHT
    orthoCamera.bottom = -ORTHOGRAPHIC_VIEW_HEIGHT
    orthoCamera.near = 0.1
    orthoCamera.far = 200

    const elevationRadians = MathUtils.degToRad(CAMERA_ELEVATION_DEGREES)
    orthoCamera.position.set(
      0,
      CAMERA_DISTANCE * Math.sin(elevationRadians),
      CAMERA_DISTANCE * Math.cos(elevationRadians)
    )
    orthoCamera.lookAt(new Vector3(0, 0, 0))
    orthoCamera.updateProjectionMatrix()
  }, [camera, size.height, size.width])

  return null
}
```

### Prototype CameraRig (`packages/hex-grid-prototype/src/components/CameraRig.tsx`)

The reference implementation has **all the controls needed**: scroll wheel zoom, arrow key pan, per-frame updates via `useFrame`, orthographic frustum adjustment, and fixed camera angle based on elevation:

```tsx
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameState } from '../store/gameState.js'

const PAN_SPEED = 15
const ZOOM_SPEED = 0.02
const MIN_ZOOM = 5
const MAX_ZOOM = 50
const INITIAL_ZOOM = 20
const CAMERA_DISTANCE = 50

export function CameraRig() {
  const { camera, size } = useThree()
  const target = useRef(new THREE.Vector3(0, 0, 0))
  const keys = useRef(new Set<string>())
  const zoom = useRef(INITIAL_ZOOM)
  const elevation = useGameState(s => s.cameraElevation)

  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }
      keys.current.add(e.key)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key)
    }
    const onBlur = () => {
      keys.current.clear()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * ZOOM_SPEED
      zoom.current = THREE.MathUtils.clamp(zoom.current + delta, MIN_ZOOM, MAX_ZOOM)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, delta) => {
    const ortho = camera as THREE.OrthographicCamera

    // Pan based on arrow keys
    let dx = 0
    let dz = 0
    if (keys.current.has('ArrowLeft')) dx -= PAN_SPEED * delta
    if (keys.current.has('ArrowRight')) dx += PAN_SPEED * delta
    if (keys.current.has('ArrowUp')) dz -= PAN_SPEED * delta
    if (keys.current.has('ArrowDown')) dz += PAN_SPEED * delta

    target.current.x += dx
    target.current.z += dz

    // Update frustum for zoom
    const aspect = size.width / size.height
    ortho.left = -zoom.current * aspect
    ortho.right = zoom.current * aspect
    ortho.top = zoom.current
    ortho.bottom = -zoom.current
    ortho.updateProjectionMatrix()

    // Arc the camera on a circle from south, based on elevation angle
    const elevRad = THREE.MathUtils.degToRad(Math.max(elevation, 1))
    const d = CAMERA_DISTANCE
    ortho.position.set(target.current.x, d * Math.sin(elevRad), target.current.z + d * Math.cos(elevRad))
    ortho.lookAt(target.current)
  })

  return null
}
```

### Key Differences (Web vs. Prototype)

| Aspect          | Web (current)                           | Prototype (target)                                             |
| --------------- | --------------------------------------- | -------------------------------------------------------------- |
| Zoom            | Fixed at `ORTHOGRAPHIC_VIEW_HEIGHT = 8` | Scroll wheel, clamped `MIN_ZOOM=5` to `MAX_ZOOM=50`            |
| Pan             | None                                    | Arrow keys, per-frame delta-time movement                      |
| Frame loop      | `useLayoutEffect` only (one-shot)       | `useFrame` (per-frame updates)                                 |
| Camera distance | 24                                      | 50                                                             |
| Elevation       | 31 degrees, static                      | Dynamic via `useGameState` (but issue says fixed, no rotation) |
| Event handling  | None                                    | keydown/keyup/wheel listeners                                  |

---

## Impacted Files

| File                                                     | Change                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/web/src/components/hex-map/CameraRig.tsx`      | **Primary** -- replace static camera with zoom/pan controls matching prototype |
| `packages/web/src/components/hex-map/HexMap.tsx`         | May need `{ passive: false }` on canvas or event coordination with placement   |
| `packages/web/src/components/hex-map/HexMap.test.tsx`    | Tests for zoom/pan behavior                                                    |
| `packages/web/src/components/hex-map/HexMap.stories.tsx` | Story updates to demonstrate zoom/pan                                          |

---

## Implementation Notes

1. **Elevation angle:** The issue says "fixed orthographic camera, no rotation/tilt." The web CameraRig already uses a fixed 31-degree elevation. The prototype allows dynamic elevation via `useGameState`. For this issue, use a fixed elevation constant (matching current 31 degrees or prototype default).

2. **Wheel event conflicts:** The `onWheel` handler calls `e.preventDefault()` and needs `{ passive: false }` on the canvas element. The HexMap currently does not set passive on canvas events -- this may need coordination.

3. **Arrow key conflicts:** The HexMap already listens for `Escape` on keydown. Arrow key listeners should not conflict, but ensure `e.preventDefault()` only fires for arrow keys to avoid blocking other keyboard interactions (placement cancellation, etc.).

4. **Zoom constants:** The prototype uses `MIN_ZOOM=5`, `MAX_ZOOM=50`, `INITIAL_ZOOM=20`. The web CameraRig uses `ORTHOGRAPHIC_VIEW_HEIGHT=8`. These need tuning for the web hex tile sizes and layout. The prototype's values may not map 1:1.

5. **Camera distance:** Prototype uses 50, web uses 24. The larger distance in the prototype accommodates its terrain geometry. Web distance should be evaluated against the hex grid scale.

6. **State persistence (future):** The Zoom Navigation capability card requires zoom/pan state to persist across sessions and workspace switches. This is likely out of scope for #706 but should be designed with persistence in mind (extractable state values for zoom level and pan target).

---

## Gaps

| Dimension | Topic                               | Notes                                                                                      |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| HOW       | Zoom/pan state persistence          | Capability card requires persistence; not in #706 scope but architecture should support it |
| HOW       | Touch/mobile controls               | Explicitly out of scope per issue; capability card mentions pinch-to-zoom                  |
| HOW       | Semantic zoom level thresholds      | Capability card defines Far/Mid/Close but no specific zoom value ranges mapped             |
| WHERE     | Interaction with tile drag-and-drop | Zoom/pan during placement mode needs testing                                               |
