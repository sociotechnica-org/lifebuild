# Standard - Image Evolution

## WHAT: Definition

The specification for the five-stage visual progression of a project's illustration as it develops from initial capture through completion. Each stage adds detail, making the project more instantly recognizable while communicating progress.

## WHERE: Ecosystem

- Conforming entity: [[Primitive - Project]]
- Conforming component: [[Component - Hex Tile]] — where images appear
- Implements: [[Principle - Visual Recognition]] — recognition improves as detail increases
- Uses: [[Standard - Visual Language]] — part of consistent visual vocabulary
- Maps to: [[System - Four-Stage Creation]] — visual stages roughly align with creation stages

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — visual distinctiveness enables spatial memory
- Principle: [[Principle - Visual Recognition]] — two-second identification test
- Decision: Content-depicting diorama-style illustrations over abstract patterns. By Colored stage, director should recognize "that's my kitchen project" from across the room.

## WHEN: Timeline
- Status: active
- Since: v1.0
- Last updated: v1.0

Design decision from Brand Standards v2. Image evolution serves both aesthetic progression AND recognition — each stage makes the project more identifiable.

## HOW: Specification

### Rules

#### Five Illustration Stages

| Stage | Name | Visual | Roughly Maps To |
|-------|------|--------|-----------------|
| 1 | Sketch | Light pencil outlines | Stages 1-3 (Planning) |
| 2 | Clean Pencils | Refined line work | Stage 4 (Planned) |
| 3 | Inked | Bold outlines | Live |
| 4 | Colored | Full color | Work at Hand |
| 5 | Finished | Details and polish | Completed |

#### Progression Rules

- Image advances as project moves through states, not creation stages specifically
- The mapping is approximate — a project selected straight to Work at Hand skips to Colored
- Content-depicting illustrations show recognizable elements of what the project is about, not abstract patterns

#### Recognition Function

A kitchen renovation shows kitchen elements; a marathon training shows running.

### Examples

**Example 1: Standard progression through all five stages**
- Scenario: Director creates a "Garden Redesign" project and develops it through the full lifecycle.
- Input: Project moves Planning -> Planned -> Live -> Work at Hand -> Completed over several weeks.
- Correct output: Illustration progresses Sketch (light pencil outlines of garden beds and plants) -> Clean Pencils (refined line work with clear plant shapes) -> Inked (bold outlines of garden layout) -> Colored (full color showing green plants, brown soil, colorful flowers) -> Finished (details like texture on leaves, water droplets, polished shading). At Colored stage, director recognizes "that's my garden project" from across the room.

**Example 2: Project skipping stages due to direct Work at Hand selection**
- Scenario: Director creates a "Tax Filing" project and selects it straight to Work at Hand during weekly planning.
- Input: Project jumps from Planned directly to Work at Hand state.
- Correct output: Illustration skips from Clean Pencils (Stage 2) directly to Colored (Stage 4), showing full-color content-depicting illustration of tax-related elements (calculator, forms, receipts). The intermediate Inked stage is not shown because illustration tracks meaningful state, not administrative steps.

### Anti-Examples

- **Using abstract patterns instead of content-depicting illustrations** — A generic geometric shape for a kitchen renovation fails the recognition function. Director should see kitchen elements and know "that's my kitchen project" from across the room.
- **Advancing illustration based on creation stage instead of project state** — A project selected straight to Work at Hand should skip to Colored. Illustration tracks meaningful state, not administrative steps.
- **Showing the same visual detail at Sketch and Inked stages** — Each stage must add visible detail. If Sketch and Inked look the same, the progression signal is lost and directors can't read project maturity at a glance.

### Conformance Test

1. For a project at each of the five states, verify its illustration matches the corresponding stage (Sketch/Clean Pencils/Inked/Colored/Finished) and that each stage is visually distinguishable from the others.
2. Verify that illustrations are content-depicting (showing recognizable elements of the project's subject matter) rather than abstract patterns.
3. Move a project directly from Planned to Work at Hand and confirm the illustration skips to Colored (Stage 4) rather than progressing through Inked first.
