# Standard - Project States

## WHAT: Definition

The specification for lifecycle stages a project moves through from initial capture to completion. States determine where a project appears, what actions are available, and how it renders visually.

## WHERE: Ecosystem

- Conforming entity: [[Primitive - Project]]
- Implements: [[System - Pipeline Architecture]] — states determine queue placement
- Uses: [[Standard - Visual Language]] — states have distinct visual treatment
- Related: [[System - Four-Stage Creation]] — creation stages overlap with early states

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — clear lifecycle enables structured management
- Principle: [[Principle - Visibility Creates Agency]] — state visible at a glance
- Driver: Directors need to know where each project stands and what they can do with it.

## WHEN: Timeline
- Status: active
- Since: v1.0
- Last updated: v1.0

Core to project entity. States enable the pipeline flow and visual feedback systems.

## HOW: Specification

### Rules

#### State Definitions

| State | Description | Location |
|-------|-------------|----------|
| Planning | Stages 1-3, in development | Planning Queue |
| Planned | Stage 4 complete, ready to activate | Priority Queue |
| Live | Active with kanban board | Hex tile on grid |
| Work at Hand | Live + weekly priority | Table + hex tile |
| Paused | Temporarily stopped | Priority Queue (top) |
| Completed | Finished | Archives |

#### Visual Treatment

| State | Treatment |
|-------|-----------|
| Work at Hand | Full saturation, active glow, progress ring, stream-color shimmer |
| Live | Full saturation, standard presence, progress ring |
| Planned | Reduced saturation (70%), no glow |
| Paused | Further reduced saturation (50%), muted presence |

#### State Transitions

| From | To | Trigger |
|------|-----|---------|
| Planning | Planned | Complete Stage 4 |
| Planned | Live | Activate directly |
| Planned | Work at Hand | Weekly selection |
| Live | Work at Hand | Weekly selection |
| Work at Hand | Live | Week ends |
| Work at Hand | Completed | All objectives met |
| Any | Paused | Director choice |
| Paused | Planned | Returns to Priority Queue top |

### Examples

**Example 1: New project reaches Work at Hand**
- Scenario: Director creates a "Kitchen Renovation" project and completes all four planning stages.
- Input: Project in Planning state, Stage 4 just completed. Director selects it during weekly planning.
- Correct output: State transitions Planning -> Planned (on Stage 4 completion), then Planned -> Work at Hand (on weekly selection). Project appears both on hex grid at full saturation with active glow and on The Table in Gold/Silver position.

**Example 2: Pausing and resuming a project**
- Scenario: Director pauses their "Marathon Training" project mid-week to focus on urgent work.
- Input: Project currently in Work at Hand state. Director chooses to pause.
- Correct output: State transitions Work at Hand -> Paused. Project moves to top of Priority Queue. Visual treatment drops to 50% saturation with muted presence. Project no longer appears on The Table. When director resumes, project returns to Planned state at top of Priority Queue, not directly back to Work at Hand.

### Anti-Examples

- **Rendering a Paused project at full saturation** — Paused projects render at 50% saturation. Showing them at full visual weight makes them indistinguishable from Live projects and undermines the state-at-a-glance principle.
- **Allowing direct transition from Planning to Work at Hand** — A project must complete Stage 4 (reach Planned) before it can be selected as Work at Hand. Skipping the Planned gate means selecting unfinished projects for weekly focus.
- **Keeping Work at Hand status after the week ends** — Work at Hand reverts to Live when the week ends. Persisting the status without re-selection defeats the weekly cadence and clutters The Table with stale priorities.

### Conformance Test

1. For each project state in the system, verify it matches one of the six defined states (Planning, Planned, Live, Work at Hand, Paused, Completed) and renders at the correct saturation level per the Visual Treatment table.
2. Attempt to transition a project directly from Planning to Work at Hand — confirm the system requires the Planned intermediate state (Stage 4 completion).
3. At week's end, verify that all Work at Hand projects revert to Live state unless re-selected for the new week.
