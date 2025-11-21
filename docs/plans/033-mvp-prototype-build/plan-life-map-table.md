# Life Map & Table Foundation Plan

## Overview
This plan delivers the Life Map surface described in `docs/plans/033-mvp-prototype-build/mvp-source-of-truth-doc.md`. The work covers the persistent Table (Gold/Silver/Bronze), the eight-category grid, and dual-presence rendering for Work at Hand. We will keep the work isolated to `packages/web/src/components/new` and wire it to existing LiveStore data while carving out any schema extensions needed for stream state.

## Goals
1. Implement The Table with three slots, Urushi stage treatments, and Bronze stack behavior using the shared state machine from the Foundations plan.
2. Render the eight category cards with dual presence for Work at Hand projects and planning/live indicators.
3. Keep The Table visible while navigating category/detail routes.
4. Consume the unified `table_configuration` entity for persistence of stream selections and Bronze mode metadata.
5. Provide Storybook coverage for Life Map scenarios (empty, partially populated, full streams) leveraging the new `UrushiVisual` and `ProjectCard` primitives.

## Non-Goals
- Implement Project Board or task-level execution (covered by Project Rooms plan).
- Build queue management UI (handled by Drafting Room plans).
- Sorting interactions (handled by Sorting Room plan).
- Visual polish beyond layout tokens defined in `new-ui.css` (high-fidelity styling can follow later).

## Current State
- `LifeMap.tsx` renders a basic list of categories with counts; no Table, no dual presence.
- Category routes exist but lack awareness of Table status.
- LiveStore schema exposes project attributes but no dedicated fields for Gold/Silver/Bronze activation or Bronze stack metadata.

## Technical Implementation Plan
1. **State/Configuration Consumption**
   - Rely on the `ProjectLifecycleState` union and `table_configuration` table established in the Foundations plan; do not introduce ad-hoc fields.
   - Provide selectors in `useLifeMapState` that derive Table slots, Bronze stack, and category segmentation from those shared sources.
2. **Shared Hooks & Selectors**
   - Create `useLifeMapState` hook inside `packages/web/src/components/new/life-map/hooks.ts` that returns Table slots, Bronze stack tasks, and grouped category data.
   - Reuse `getProjectsByCategory$` queries but add new selectors for `getWorkAtHandProjects$` and `getBronzeTasks$`.
3. **Table Componentry**
   - Build `Table.tsx` with subcomponents for GoldSlot, SilverSlot, BronzeStack. Each slot renders the shared `UrushiVisual`, status labels, worker count, and call-to-action buttons (open project / go to Sorting Room when empty).
   - Bronze stack lists the current operational tasks by querying `table_bronze_stack`, displays Bronze mode state from `table_configuration`, and surfaces min-3 validation messaging.
   - Include “Activate priorities” CTA linking to Sorting Room for first-time setup.
4. **Category Grid**
   - Replace existing unordered list with a responsive grid showing each category card.
   - Each card includes summary stats, segmented sections for Planning vs Live projects, and Work-at-Hand badges referencing the Table entity (dual presence).
   - Project representations should reuse `ProjectCard` but accept props for Urushi stage, Table state, and Bronze/Paused ribbons.
5. **Navigation Persistence**
   - Wrap Life Map route pieces so The Table stays mounted while navigating to category subroutes (e.g., share a parent layout that renders Table and yields nested content via `<Outlet>`).
   - Ensure “Back to Life Map” links preserve storeId and scroll to Table if needed.
6. **Responsive + Storybook**
   - Provide baseline layout tokens in `new-ui.css` for Table grid, Bronze stack, and category sections, reusing Foundations tokens whenever possible.
   - Add Storybook stories under `New UI/LifeMap` showcasing: Empty state, Gold-only, Gold+Silver, Full Table with Bronze stack, Dual presence highlight. Stories should boot LiveStore with canonical `ProjectLifecycleState` payloads for validation.

- No additional schema changes beyond the Foundations plan; this work consumes the `ProjectLifecycleState` column, `table_configuration`, and `table_bronze_stack`.
- Add read-side selectors/queries for `getWorkAtHandProjects$`, `getLifeMapCategories$`, and a join of `getTableConfiguration$` + `getBronzeStack$`.
- Update worker/project queries to include new state-machine-derived fields for UI consumption.

## Testing & QA
- Unit-test new hooks/selectors (e.g., `useLifeMapState`) with mocked LiveStore data that simulate each state-machine variant.
- Add Storybook coverage for each Table state for regression detection.
- Manual QA checklist: Table persistent across navigation, Bronze min-3 enforcement messaging, dual presence updates when toggling stream assignments, Table state updates reflected in `table_configuration`.

## Source References
- `mvp-source-of-truth-doc.md:241-330` – Life Map layout, category card behavior, navigation altitudes, and Project Board entry points this plan must honor.
- `mvp-source-of-truth-doc.md:705-751` – Definition of Gold/Silver/Bronze streams, Bronze mode constraints, and dual presence requirements.
- `mvp-source-of-truth-doc.md:810-833` – Execution model expectations for working from The Table and Kanban, informing how Life Map surfaces status + entry points.

## Room Chat Context
- Provide Life Map–specific context to `RoomLayout`, e.g., `{ goldProject, silverProject, bronzeMode, categoryOverview }`, so surface-level assistants can reference the current setup when Directors ask for guidance.

## Dependencies & Follow-ups
- Sorting Room plan will drive how Table state is mutated; this plan focuses on rendering + read paths.
- Drafting Room plans will set `workState` and feed Planning vs Priority counts consumed here.
- Subsequent visual polish and animation work can layer on top of this baseline.

## Proposed PR Breakdown
1. **PR4 – Empty Table Shell**  
   *Title:* “Life Map: Add empty Table with persistent shell”  
   *Scope:* Introduce the Table component with empty Gold/Silver/Bronze slots, integrate it into `/new/life-map`, and ensure it persists during navigation per `mvp-source-of-truth-doc.md:241-330`. Provides guidance/CTA to Sorting Room when no work is activated.

2. **PR5 – Populate Table with Work at Hand**  
   *Title:* “Life Map: Render Gold/Silver/Bronze streams”  
   *Scope:* Wire the Table to `table_configuration`/`table_bronze_stack`, render Gold/Silver slots with Polish-stage Urushi, show interactive Bronze stack per `mvp-source-of-truth-doc.md:705-751`, and provide click-through to existing project detail.

3. **PR6 – Category Cards & Dual Presence**  
   *Title:* “Life Map: Category grid with dual presence”  
   *Scope:* Replace the list with the eight-card grid, show counts (Work at Hand/Live/Plans/Paused), draw dual presence badges per `mvp-source-of-truth-doc.md:288-310`, and add domain altitude navigation.
