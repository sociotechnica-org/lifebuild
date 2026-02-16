# Standard - Life Categories

## WHAT: Definition

The specification for the eight default life-domain categories that organize all builder work. Categories determine spatial grouping on the Life Map, advisor assignment, visual color mapping, and Studio structure. Categories are the primary organizing dimension — every project and system belongs to exactly one.

## WHERE: Ecosystem

- Conforming: [[Zone - Life Map]], [[Structure - Hex Grid]], [[Room - Drafting Room]]
- Conforming components: [[Component - Hex Tile]], [[System - Clustering]]
- Implements: [[Principle - Familiarity Over Function]] — categories should feel immediately recognizable
- Implements: [[Principle - Visual Recognition]] — category colors enable spatial scanning
- Related: [[Standard - Visual Language]] — each category has a specific color
- Used by: [[Primitive - Project]] — every project requires a Life Category
- Used by: [[Primitive - System]] — systems belong to a category

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — categories are the primary spatial organizing dimension
- Principle: [[Principle - Familiarity Over Function]] — this standard makes "categories should feel immediately recognizable" testable
- Driver: Builders need a familiar framework for sorting life's work. Derived from a comparative survey of established frameworks (Wheel of Life, Robbins' categories) selecting the most consistently-appearing domains across frameworks. Familiarity over novelty — builders should recognize categories immediately, not learn a new taxonomy.
- Decision: Eight defaults, not immutable. Defaults anchor the Life Map's visual structure and provide familiar starting points. Customization is permitted because the builder's mental model takes priority over system convenience.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Eight default categories are fully implemented and used throughout the app. Projects require a category. Categories have associated colors in `constants.ts`. Category cards appear on the Life Map. Customization (renaming, adding, removing) is not yet supported.

## HOW: Specification

### Rules

#### Default Categories

| LifeBuild Default | Wheel of Life Equivalent | Robbins Equivalent |
| ----------------- | ------------------------ | ------------------ |
| Health            | Health                   | Physical Body      |
| Relationships     | Relationships / Romance  | Relationships      |
| Finances          | Money / Finances         | Finances           |
| Learning          | Personal Growth          | Intellectual       |
| Leisure           | Fun & Recreation         | Emotions           |
| Purpose           | Career / Business        | Career/Mission     |
| Home              | Physical Environment     | —                  |
| Service           | Contribution             | Contribution       |

#### Customization Policy

- Builders CAN rename or replace any category
- Projects follow the category, not the label (renaming "Home" to "Nest" doesn't break existing projects)

### Examples

**Example 1: Builder assigns a project to the correct default category**

- Scenario: Builder creates a "Run a 5K" project.
- Input: Builder is asked to assign a Life Category during project creation.
- Correct output: Builder chooses "Health" based on their mental model. The project inherits Health's vibrant green color on the hex tile and clusters near other Health projects on the Life Map.

**Example 2: Builder customizes a category name**

- Scenario: Builder renames "Service" to "Volunteering" because that label resonates more with their mental model.
- Input: Builder changes the category label from "Service" to "Volunteering."
- Correct output: All existing projects assigned to Service now display under "Volunteering." The visual color remains the same. Projects are not broken or reassigned — they follow the category slot, not the label.

### Anti-Examples

- **Treating categories as immutable taxonomy imposed on builders** — Categories are defaults, not mandates. The builder's mental model takes priority. If "Home" doesn't resonate, they rename it.
- **Using objective criteria to assign categories** — The builder decides which category a project belongs to based on their mental model. There is no algorithm that determines "this is a Health project" — that's a subjective judgment.

### Conformance Test

1. Verify every project and system in the library is assigned to exactly one of the eight default categories (or a builder-customized category occupying one of the eight slots).
2. Rename a category and confirm all existing projects under that category retain their assignment and visual color — no projects are orphaned or reassigned.
3. Confirm category assignment is driven by builder choice (subjective), not algorithmic classification — the UI must present it as a builder decision, not a system suggestion.
