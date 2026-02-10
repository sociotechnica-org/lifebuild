# Standard - Visual Language

## WHAT: Definition

The specification for visual vocabulary across all LifeBuild interfaces — category colors, stream accents, state indicators, and entity type markers. This standard defines what visual treatments must be applied; the rendering systems implement these specifications.

## WHERE: Ecosystem

- Conforming: [[Zone - Life Map]], [[Overlay - The Table]], [[Structure - Hex Grid]], [[Room - Project Board]], [[Room - System Board]]
- Conforming components: [[Component - Hex Tile]], [[Component - Gold Position]], [[Component - Silver Position]], [[Component - Bronze Position]]
- Implements: [[Principle - Visual Recognition]] — instant identification without inspection
- Implements: [[Principle - Visibility Creates Agency]] — state visible at a glance
- Advances: [[Strategy - Spatial Visibility]] — spatial organization requires visual clarity
- Related: [[Standard - Image Evolution]] — project illustration progression
- Related: [[Standard - Life Categories]] — category-to-color mapping

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — visibility requires legibility
- Principle: [[Principle - Visual Recognition]] — two-second identification test
- Decision: Content-depicting illustrations over abstract patterns. Recognition trumps beauty.

## WHEN: Timeline
- Status: active
- Since: v1.0
- Last updated: v1.0

Established in Brand Standards v2. Visual language is stable — changes require updating all conforming elements simultaneously.

## HOW: Specification

### Rules

#### Category Colors

| Category | Color |
|----------|-------|
| Health | Vibrant green |
| Purpose | Deep purple/indigo |
| Finances | Gold/amber |
| Relationships | Warm pink/rose |
| Home | Earthy brown/terracotta |
| Community | Orange |
| Leisure | Sky blue |
| Personal Growth | Teal |

#### Stream Accents

| Stream | Color |
|--------|-------|
| Gold position | Deep amber/gold |
| Silver position | Cool silver/platinum |
| Bronze position | Warm bronze/copper |

#### State Indicators

| State | Treatment |
|-------|-----------|
| Live projects / Planted systems | Full saturation |
| Planned projects / Hibernating systems | Dimmed (~60%) |
| Paused projects | Very dimmed (~30%) |
| Work at Hand | Enhanced + glow |

#### Entity Type Markers

| Entity | Marker |
|--------|--------|
| Projects | Progress ring (% complete) |
| Systems | Health dots (●●●●○) |

### Examples

**Example 1: Correctly rendering a Health project at Work at Hand state**
- Scenario: Director's "Run a 5K" project (Health category) is selected as Gold Work at Hand this week.
- Input: Category = Health, State = Work at Hand, Entity = Project, Stream = Gold.
- Correct output: Hex tile uses vibrant green (Health category color) at enhanced saturation with active glow (Work at Hand state). A progress ring shows completion percentage (Project entity marker). The Gold position on The Table uses deep amber/gold accent (Gold stream accent). No health dots appear (those are for Systems only).

**Example 2: Distinguishing a Live project from a Planned project visually**
- Scenario: Two projects on the Life Map — "Kitchen Renovation" (Live) and "Vacation Planning" (Planned), both in the Home category.
- Input: Both are Home category (earthy brown/terracotta). One is Live, one is Planned.
- Correct output: "Kitchen Renovation" renders at full saturation earthy brown/terracotta with a progress ring. "Vacation Planning" renders at ~60% saturation (dimmed) earthy brown/terracotta with a progress ring. The saturation difference makes the state distinction visible at a glance without needing to inspect either tile.

### Anti-Examples

- **Using arbitrary colors not mapped to life categories** — Each category has a specific color (Health = vibrant green, Finances = gold/amber, etc.). Introducing unmapped colors breaks the visual vocabulary and forces directors to re-learn associations.
- **Rendering a Planned project at full saturation** — Planned projects render at ~60% saturation (dimmed). Showing them at full saturation makes them visually identical to Live projects, destroying the state-at-a-glance signal.
- **Using progress rings on systems or health dots on projects** — Entity type markers are distinct: projects get progress rings (% complete), systems get health dots (●●●●○). Mixing markers creates confusion about what kind of entity the director is looking at.

### Conformance Test

1. For each of the eight categories, verify the hex tile renders in the correct mapped color (Health = vibrant green, Purpose = deep purple/indigo, Finances = gold/amber, etc.) — no unmapped or arbitrary colors.
2. Place a Live project and a Planned project from the same category side by side and verify the saturation difference is visible (full vs. ~60%) — state must be distinguishable at a glance without inspection.
3. Verify that Projects display progress rings and Systems display health dots — confirm no entity has the wrong marker type.
