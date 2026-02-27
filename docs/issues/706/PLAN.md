# Plan: Map navigation: zoom and pan (#706)

## 1. Architecture Decisions

### Decision: Replace one-shot camera setup with a frame-driven navigation rig

Options considered: keep `useLayoutEffect` static camera setup and mutate camera only on resize; move camera/frustum updates into `useFrame` with mutable refs for input state.  
Chosen approach: move navigation updates to `useFrame` in `CameraRig`.  
Why: pan/zoom are continuous interactions and need frame-time (`delta`) updates for consistent motion across machines.  
State boundaries: navigation runtime state (`pressedKeys`, `target`, `zoom`) remains local to `CameraRig` refs (no global app state in #706).

### Decision: Keep strict orthographic + fixed-angle camera contract

Options considered: add perspective fallback or optional tilt controls; enforce orthographic projection with fixed elevation and no user rotation/tilt.  
Chosen approach: orthographic-only camera with fixed elevation constant (matching current map angle), no rotation controls exposed.  
Why: issue finish line explicitly requires no perspective distortion and no rotation/tilt behavior.  
State boundaries: `CameraRig` owns camera position/look-at math; `HexMap` remains responsible for canvas creation only.

### Decision: Port prototype control scheme, with web-app safety guards

Options considered: exact prototype listeners on `window` with no guards; pointer-drag controls; keyboard + wheel controls with minimal guardrails.  
Chosen approach: prototype-style controls (wheel zoom + arrow-key pan) with guardrails: prevent default only for arrow keys, ignore arrow-key pan while focus is inside editable elements, clear key state on blur/unmount.  
Why: matches desired behavior while avoiding regressions in text inputs/chat fields and preventing stuck-key behavior after tab switches.  
State boundaries: input listeners live in `CameraRig` effect; no cross-component keyboard orchestration needed.

### Decision: Use zoom-by-frustum-height with clamp bounds tuned to web map scale

Options considered: mutate camera `zoom` property; control orthographic frustum extents (`left/right/top/bottom`) from a scalar; copy prototype constants 1:1 without calibration.  
Chosen approach: frustum-height scalar (`zoom`) with min/max clamp, initialized near current web framing and tuned against the 3-ring map footprint.  
Why: frustum extents are explicit and already used in current camera math; tuning avoids over-zooming/under-zooming due to scale differences between prototype and web map.  
State boundaries: zoom constants stay local to `CameraRig`; persistence is deferred.

### Decision: Keep #706 state ephemeral but persistence-ready

Options considered: implement zoom/pan persistence now; keep purely in-memory values with no extraction path.  
Chosen approach: no persistence in #706, but keep camera target/zoom in a shape that can later be hoisted to workspace state (#capability requirement follow-up).  
Why: persistence is identified as a context-library requirement but not in this issue’s finish line; deferring keeps PR focused while avoiding rework.  
State boundaries: local refs now; future workspace/session store integration as a separate issue.

## 2. File Changes

| Action | File                                                     | Description                                                                                                                                                                                                            |
| ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modify | `packages/web/src/components/hex-map/CameraRig.tsx`      | Core implementation: move to `useFrame`, add wheel + arrow key listeners, pan/zoom state refs, orthographic frustum updates, fixed-elevation camera positioning, and zoom clamp constants calibrated to web map scale. |
| create | `packages/web/src/components/hex-map/CameraRig.test.tsx` | Unit tests for camera controls: wheel zoom clamping, arrow-key pan updates, editable-focus key guard behavior, and listener cleanup (`blur`/unmount).                                                                  |
| modify | `packages/web/src/components/hex-map/HexMap.tsx`         | Add any canvas-level wiring needed by camera controls (for example, ensuring wheel listener target/interaction lifecycle remains stable with current `<Canvas>` usage).                                                |
| modify | `packages/web/src/components/hex-map/HexMap.test.tsx`    | Update/match mocks and add coverage for map-level keyboard coexistence assumptions if `HexMap` props/wiring change for camera navigation.                                                                              |
| modify | `packages/web/src/components/hex-map/HexMap.stories.tsx` | Update docs text and stories to reflect interactive navigation (zoom/pan) and provide a manual QA story variant for camera behavior.                                                                                   |
| create | `packages/web/e2e/map-navigation.spec.ts`                | E2E smoke for navigation controls in browser runtime: wheel changes visible scale, arrow keys move map viewpoint, and controls remain responsive without app-level regressions.                                        |

## 3. Data Model Changes

No LiveStore schema/event/query changes are planned for #706.

- Events: no new events.
- Schema/materializers: no changes.
- Shared queries: no changes.
- Migration/backfill: none.

Notes:

- Camera target/zoom state remains UI runtime state in this issue.
- Workspace/session persistence for zoom/pan is a follow-up item, not part of #706.

## 4. Component Hierarchy

Current (relevant path):

```text
HexMap
  Canvas (orthographic)
    CameraRig (static one-time setup)
    HexGrid
```

Target (#706):

```text
HexMap
  Canvas (orthographic)
    CameraRig
      useEffect: input listeners (wheel + arrow keys)
      useFrame: per-frame pan + zoom frustum + fixed-angle camera update
    HexGrid
```

Runtime control flow:

```text
wheel on canvas -> update target zoom (clamped)
arrow keys down/up -> update pressed key set
useFrame(delta)
  -> compute pan delta in world X/Z
  -> update camera target
  -> recompute orthographic frustum from zoom + viewport aspect
  -> place camera at fixed elevation arc
  -> lookAt(target)
```

## 5. PR Breakdown

Single PR (after #704 is merged) success criteria:

1. Scroll wheel zooms map in/out with clamped min/max bounds.
2. Arrow keys pan map smoothly and consistently across frame rates.
3. Camera remains orthographic (no perspective distortion).
4. Camera angle remains fixed (no rotation/tilt controls).
5. Interaction behavior matches X-Grid prototype intent (wheel zoom + arrow pan + fixed camera arc).
6. Keyboard controls do not break editable text inputs.
7. Lint, tests, e2e, and build pass.

## 6. Test Plan

Unit/component tests:

- `CameraRig.test.tsx`
  - wheel zoom increases/decreases zoom scalar correctly.
  - zoom clamps at configured `MIN_ZOOM`/`MAX_ZOOM`.
  - arrow keys update pan target over frame ticks.
  - editable-focus guard prevents arrow-key pan capture in input/textarea/contentEditable contexts.
  - key state clears on `window.blur` and listeners are removed on unmount.
- `HexMap.test.tsx`
  - validate map-level key handling still coexists with placement Escape handling.
  - verify camera rig wiring remains mounted under Canvas in test harness.

Storybook:

- Update `HexMap.stories.tsx` docs copy to describe controls.
- Add/adjust a story state used for manual verification of zoom bounds and pan responsiveness.

E2E (`map-navigation.spec.ts`):

- Load map route and confirm canvas renders.
- Trigger wheel in/out and assert expected visual/behavioral zoom change.
- Hold arrow keys and assert viewpoint movement.
- Confirm no fatal input conflicts/regressions in map shell.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                            | Impact                                                  | Mitigation                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Arrow-key pan captures keystrokes intended for text inputs/chat | Usability regression while typing                       | Guard keyboard handler for editable targets and limit `preventDefault()` to arrow keys only.                 |
| Wheel handling is passive or bound to wrong element             | `preventDefault` fails; page scrolls instead of zooming | Bind wheel listener to canvas element with `{ passive: false }` and clean up on unmount.                     |
| Prototype constants feel wrong on web grid scale                | Navigation feels too slow/fast or zoom bounds unusable  | Start from prototype constants, then calibrate against current web map dimensions and lock with tests.       |
| Frame-update logic causes jitter on low FPS                     | Poor control feel                                       | Use delta-time pan computation and avoid re-render-driven camera updates.                                    |
| Future workspace persistence requirement is forgotten           | Rework later for context-preserving navigation          | Keep target/zoom state representation simple and extractable; track persistence as explicit follow-up issue. |

## 8. What's Out of Scope

- Click-and-drag panning.
- Pinch-to-zoom/mobile touch gestures.
- Camera rotation or tilt controls.
- Programmatic animated camera transitions (snap-to-building, cinematic moves).
- Minimap or overview navigator.
- Cross-session/workspace persistence of camera position/zoom (follow-up).
