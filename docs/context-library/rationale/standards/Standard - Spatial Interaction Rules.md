# Standard - Spatial Interaction Rules

## WHAT: Definition

The specification for builder agency over hex grid spatial organization: builders place their own projects, the system never auto-organizes, rearrangement is low-friction, and spatial clustering carries builder-assigned meaning that the AI team observes but does not impose.

## WHERE: Ecosystem

- Conforming structures: [[Structure - Hex Grid]] — core spatial interaction surface
- Conforming zones: [[Zone - Life Map]] — spatial organization at map level
- Conforming systems: [[System - Clustering]] — cluster meaning from builder placement
- Implements: [[Principle - Bidirectional Loop]] — makes builder spatial agency testable

## WHY: Rationale

- Principle: [[Principle - Bidirectional Loop]] — external representation and internal understanding strengthen through iteration
- Driver: Without this spec, systems default to auto-organizing for efficiency, destroying the cognitive value of builder-driven placement and breaking the bidirectional loop.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No hex grid exists. No builder-driven spatial placement, no drag-and-drop rearrangement, no clustering. These rules cannot be evaluated without the Hex Grid structure they govern.

## HOW: Specification

### Rules

#### Builder Agency Rules

| Rule          | Requirement                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| Placement     | Builders place their own projects. System does not assign locations.               |
| Rearrangement | Drag-and-drop. No confirmation dialogs for moves.                                  |
| Clustering    | Adjacent hexes carry builder-assigned meaning. System observes but doesn't impose. |
| Persistence   | Spatial arrangement persists exactly as builder left it.                           |

#### Interaction Requirements

| Interaction         | Spec                                   |
| ------------------- | -------------------------------------- |
| Place a project     | Single drag-and-drop action            |
| Move a project      | Grab and place — no multi-step process |
| Suggested locations | Prohibited — no auto-place             |
| "Optimize layout"   | Prohibited — no system rearrangement   |

#### AI Observation Rules

| Permission           | Rule                                                                |
| -------------------- | ------------------------------------------------------------------- |
| Notice patterns      | Allowed — "I see you've placed all family projects together"        |
| Ask about placement  | Allowed — curiosity, not correction                                 |
| Move projects        | **Only with explicit builder request**                              |
| Reorganize layout    | **Never without permission**                                        |
| Learn from placement | Allowed — observations feed understanding of builder's mental model |

### Examples

**Example 1: Builder places projects by personal association**

- Scenario: Builder creates three projects — "Family Reunion," "Call Mom Weekly," and "Anniversary Trip" — and places them in adjacent hexes.
- Input: Builder drags each project's hex tile to a cluster in the upper-left area of the Life Map.
- Correct output: All three tiles remain exactly where placed. The system does not suggest a different arrangement, does not auto-sort them by category, and does not offer an "optimize layout" option. The Clustering system observes the grouping and may note "these three family-related projects are clustered together" as knowledge about the builder's mental model.

**Example 2: AI notices a pattern without imposing changes**

- Scenario: Builder has gradually placed all Finances projects near the bottom-right of the grid over several weeks.
- Input: Mesa notices the spatial pattern during a conversation.
- Correct output: Mesa says "I notice you've placed all your financial projects in the lower-right area — is that how you think about that part of your life?" This is curiosity, not correction. Mesa does NOT say "Would you like me to move your remaining Finance projects there too?" or rearrange anything. The builder's response feeds understanding of their mental model.

### Anti-Examples

- **System auto-organizing hex grid by category** — destroys the bidirectional loop. Placement reveals how the builder thinks about their life. Auto-organization imposes system logic where builder cognition should drive.
- **Confirmation dialog when moving a project to a new hex** — friction kills the flywheel. The loop depends on frequent, easy moves. Every dialog between "grab" and "place" discourages iteration.
- **"Optimize layout" feature that rearranges projects for visual balance** — treats spatial arrangement as filing rather than thinking. The grid is an extension of the builder's mind, not a filing system to be optimized.

### Conformance Test

1. Create a new project and place it on the hex grid — verify no suggested location, auto-place, or "optimal position" prompt appears. The builder must freely choose the hex.
2. Move a project from one hex to another and confirm no confirmation dialog interrupts the drag-and-drop. The move should be a single grab-and-place action.
3. Review all AI agent interactions referencing spatial arrangement and verify agents only observe and ask ("I notice...") — never suggest moves, offer optimization, or rearrange without explicit builder request.
