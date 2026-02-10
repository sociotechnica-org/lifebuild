# Standard - Life Categories

## WHAT: Definition

The specification for the eight default life-domain categories that organize all director work. Categories determine spatial grouping on the Life Map, advisor assignment, visual color mapping, and Studio structure. Categories are the primary organizing dimension — every project and system belongs to exactly one.

## WHERE: Ecosystem

- Conforming: [[Zone - Life Map]], [[Room - Category Studios]], [[Structure - Hex Grid]], [[Room - Drafting Room]]
- Conforming components: [[Component - Hex Tile]], [[System - Clustering]]
- Implements: [[Principle - Familiarity Over Function]] — categories should feel immediately recognizable
- Implements: [[Principle - Visual Recognition]] — category colors enable spatial scanning
- Related: [[Standard - Visual Language]] — each category has a specific color
- Related: [[System - Category Advisors]] — one advisor per default category
- Used by: [[Primitive - Project]] — every project requires a Life Category
- Used by: [[Primitive - System]] — systems belong to a category

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — categories are the primary spatial organizing dimension
- Principle: [[Principle - Familiarity Over Function]] — this standard makes "categories should feel immediately recognizable" testable
- Driver: Directors need a familiar framework for sorting life's work. Derived from a comparative survey of established frameworks (Wheel of Life, Robbins' categories) selecting the most consistently-appearing domains across frameworks. Familiarity over novelty — directors should recognize categories immediately, not learn a new taxonomy.
- Decision: Eight defaults, not immutable. Defaults serve two functions: (1) anchor the Life Map's visual structure, and (2) enable pre-built Category Advisors tuned to each domain. Customization is permitted because the director's mental model takes priority over system convenience.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Eight default categories are fully implemented and used throughout the app. Projects require a category. Categories have associated colors in `constants.ts`. Category advisor agents are defined per category in `rooms.ts`. Category cards appear on the Life Map. Customization (renaming, adding, removing) is not yet supported.

## HOW: Specification

### Rules

#### Default Categories

| LifeBuild Default | Wheel of Life Equivalent | Robbins Equivalent |
|---|---|---|
| Health | Health | Physical Body |
| Relationships | Relationships / Romance | Relationships |
| Finances | Money / Finances | Finances |
| Learning | Personal Growth | Intellectual |
| Leisure | Fun & Recreation | Emotions |
| Purpose | Career / Business | Career/Mission |
| Home | Physical Environment | — |
| Service | Contribution | Contribution |

#### Customization Policy

- Directors CAN rename or replace any category
- Projects follow the category, not the label (renaming "Home" to "Nest" doesn't break existing projects)
- When a category changes, its pre-built Category Advisor pauses
- Current resolution: **Pause and observe.** Launch with defaults. Observe customization frequency. Let data inform advisor coverage for custom categories.

#### Considered Resolutions for Custom Category Advisors

| Option | Approach | Risk |
|--------|----------|------|
| 1 | Auto-generate advisor | Generic quality |
| 2 | Advisor-less custom categories | Reduced value in most-cared-about domains |
| 3 | Director-configured advisor | Configuration burden, violates [[Principle - Earn Don't Interrogate]] |
| 4 (chosen) | Pause and observe | Honest choice when data doesn't exist yet |

### Examples

**Example 1: Director assigns a project to the correct default category**
- Scenario: Director creates a "Run a 5K" project.
- Input: Director is asked to assign a Life Category during project creation.
- Correct output: Director chooses "Health" based on their mental model. The project inherits Health's vibrant green color on the hex tile, clusters near other Health projects on the Life Map, and falls under the Health Category Advisor's domain.

**Example 2: Director customizes a category name**
- Scenario: Director renames "Service" to "Volunteering" because that label resonates more with their mental model.
- Input: Director changes the category label from "Service" to "Volunteering."
- Correct output: All existing projects assigned to Service now display under "Volunteering." The visual color remains the same. The pre-built Service Category Advisor pauses (per customization policy). Projects are not broken or reassigned — they follow the category slot, not the label.

### Anti-Examples

- **Treating categories as immutable taxonomy imposed on directors** — Categories are defaults, not mandates. The director's mental model takes priority. If "Home" doesn't resonate, they rename it.
- **Using objective criteria to assign categories** — The director decides which category a project belongs to based on their mental model. There is no algorithm that determines "this is a Health project" — that's a subjective judgment.
- **Blocking advisor functionality entirely when a category is customized** — Current plan is pause, not permanent disable. The system acknowledges the gap honestly rather than pretending custom categories don't need advisor support.

### Conformance Test

1. Verify every project and system in the library is assigned to exactly one of the eight default categories (or a director-customized category occupying one of the eight slots).
2. Rename a category and confirm all existing projects under that category retain their assignment and visual color — no projects are orphaned or reassigned.
3. Confirm category assignment is driven by director choice (subjective), not algorithmic classification — the UI must present it as a director decision, not a system suggestion.
