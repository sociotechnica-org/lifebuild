# Standard - Dual Presence

## WHAT: Definition

The specification for how Work at Hand projects appear in two places simultaneously: their hex tile on the Life Map grid AND their position on The Table. Both render the same object; state changes update both automatically.

## WHERE: Ecosystem

- Conforming: [[Zone - Life Map]], [[Overlay - The Table]]
- Conforming components: [[Component - Hex Tile]], [[Component - Gold Position]], [[Component - Silver Position]]
- Implements: [[Principle - Visibility Creates Agency]] — priority always visible
- Uses: [[Standard - Visual Language]] — enhanced treatment for Work at Hand
- Depends on: [[System - Weekly Priority]] — creates Work at Hand status

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — work has spatial location AND priority status
- Principle: [[Principle - Visibility Creates Agency]] — director sees both where work lives (grid) and that it's prioritized (Table)
- Decision: Same object rendered twice, not two objects synced. Ensures consistency.

## WHEN: Timeline
- Status: active
- Since: v1.0
- Last updated: v1.0

Core architecture. Dual presence enables the Life Map to show both spatial context (hex grid) and priority focus (The Table) simultaneously.

## HOW: Specification

### Rules

#### Visual Treatment

| Location | Treatment |
|----------|-----------|
| Hex tile | Full saturation, active glow, progress ring, stream-color shimmer |
| Table position | Same project rendered with position-specific treatment |

#### State Synchronization Rules

| Event | Behavior |
|-------|----------|
| Progress update | Both views update |
| Completion | Both views respond |
| Pause | Both views dim appropriately |

#### Interaction Rules

| Action | Result |
|--------|--------|
| Click either | Opens Project Board overlay |
| Changes in overlay | Reflected in both views |

### Examples

**Example 1: Progress update reflected in both views**
- Scenario: Director completes a task on their Gold project "Write Novel" via the Project Board opened from The Table.
- Input: Task marked complete, progress advances from 40% to 50%.
- Correct output: The progress ring on the hex tile on the Life Map grid updates to 50%. The Table's Gold position also reflects 50% progress. Both views update because they render the same underlying object.

**Example 2: Clicking hex tile vs. Table position**
- Scenario: Director sees their Silver project "Automate Invoicing" both on the hex grid (near their Finances cluster) and on The Table's Silver position.
- Input: Director clicks the hex tile on the Life Map.
- Correct output: The Project Board overlay opens for "Automate Invoicing" — the same overlay that would open if the director had clicked the Silver position on The Table instead. One object, two entry points, same destination.

### Anti-Examples

- **Syncing two separate objects instead of rendering one object twice** — If hex tile and Table position are different objects, state can drift. Same object, two views is the architecture.
- **Updating Table position but not hex tile on progress change** — Both views must respond to every state change. A completion reflected only on The Table breaks the spatial context the grid provides.
- **Opening different overlays from each location** — Click on hex tile and click on Table position must both open the same Project Board overlay. Two entry points, one destination.

### Conformance Test

1. Update progress on a Work at Hand project and verify both the hex tile (Life Map) and the Table position reflect the change simultaneously.
2. Click the hex tile for a Work at Hand project, note the overlay that opens. Close it, click the Table position for the same project, and confirm the identical Project Board overlay opens.
3. Pause a Work at Hand project and verify both views dim appropriately at the same time, with no state drift between the two rendering locations.
