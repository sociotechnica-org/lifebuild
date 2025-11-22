# Foundations – Data Model, Visual System, and Shared Utilities

## Overview

Stream 0 establishes the shared infrastructure every other workstream depends on: a strict project state machine, persistent Table configuration, procedural Urushi visuals, reusable UI primitives, and room-aware AI context plumbing. Completing this plan first prevents downstream teams from redefining schema fields or duplicating core components.

## Goals

1. Define a discriminated union for `ProjectAttributes` that encodes every lifecycle state (Planning Stages 1–3, Ready/Plans, Work at Hand, Live, Paused, Completed) without overlap.
2. Persist `table_configuration` (singleton record inside each LiveStore instance) with Gold/Silver selections, Bronze mode, and Bronze target counts, plus an append-only `table_bronze_stack` table that tracks the ordered Bronze task stack without array clobbering.
3. Define event contracts (`table.gold_assigned`, `table.gold_cleared`, `bronze_task_added`, etc.) and optimistic concurrency/versioning requirements so multiple writers can mutate shared state safely.
4. Build shared components (`UrushiVisual`, `ProjectCard`, `ProgressRing`) and hooks (`useLifeMapState`, `useTableState`, `useProjectStateMachine`) that other workstreams consume.
5. Extend `RoomLayout` + navigation context so Marvin/Cameron/Devin chats receive structured payloads from each room.
6. Document tokens/patterns in `new-ui.css` for Table grid, card layouts, and procedural visuals.

## Non-Goals

- Rendering The Table or Category cards (handled by Life Map plan).
- Implementing Drafting, Sorting, Roster, or Project Board UX.
- Worker AI prompt generation (Roster plan handles specifics).

## Current State

- Project attributes are loosely typed JSON fields leading to “attribute soup”.
- No canonical `table_state` table exists; Bronze mode metadata is absent.
- Urushi visuals are undefined beyond textual descriptions.
- Room chat context currently passes minimal info, so assistants are blind to in-room state.

## Technical Implementation Plan

1. **Project State Machine**
   - Define `ProjectLifecycleState` union in `@work-squared/shared/schema`:
     ```ts
     type ProjectLifecycleState =
       | { status: 'planning'; stage: 1 | 2 | 3; draftingData: DraftingPayload }
       | { status: 'ready_for_stage4'; stage: 4; draftingData: DraftingPayload }
       | { status: 'plans'; stream: 'gold' | 'silver' | 'bronze'; queuePosition: number }
       | { status: 'work_at_hand'; slot: 'gold' | 'silver'; activatedAt: number }
       | { status: 'live'; lastActiveAt: number }
       | { status: 'paused'; stream: 'gold' | 'silver' | 'bronze'; pausedReason?: string }
       | { status: 'completed'; completedAt: number }
     ```
   - Store this in a structured column (JSON with schema validation) and expose helper guards in shared utils.
2. **Table Configuration Entity**
   - Create `table_configuration` table with a single row (e.g., `id = 'table'`) storing:
     - `goldProjectId`, `silverProjectId`
     - `bronzeMode` ('minimal' | 'target' | 'maximal')
     - `bronzeTargetExtra` (for Target +X)
   - Add `table_bronze_stack` table with rows `{ id, taskId, position, insertedAt, insertedBy, status }` that captures the Bronze stack as ordered entries instead of a mutable array.
   - Store a `version` column on `table_configuration`; gold/silver assignments emit events (`table.gold_assigned`, `table.gold_cleared`, `table.silver_assigned`, etc.) that increment the version so concurrent updates can detect conflicts. Because LiveStore state is already scoped per workspace, no `storeId` column or event field is necessary.
   - Bronze stack mutations become discrete events (`bronze_task_added`, `bronze_task_removed`, `bronze_stack_reordered`) operating on individual rows to avoid multiplayer clobbering.
   - Implement utilities in `@work-squared/shared/tableState.ts` including `getNextBronzeTasks` that reads from Priority Queue data, emits append/remove events atomically, and respects the configuration version.
   - Add `priority_queue_version` tracking (per store or per stream) so reorder events can safely detect conflicts.
   - Define event payload interfaces for `draft_saved`, `draft_paused`, `priority_queue.reordered`, and table mutations so LiveStore has a consistent audit log.
3. **Shared Visual Components**
   - `UrushiVisual`: procedural SVG/CSS rendering for the five stages (Sketch, Foundation, Color, Polish, Decoration) driven by project category + lifecycle state.
   - `ProgressRing`: reusable circular progress indicator for tasks completed vs total.
   - Update `ProjectCard` to consume the new components and lifecycle union.
4. **Hooks & Selectors**
   - `useLifeMapState`: aggregates Table slots, Bronze stack, and category summaries using state machine fields.
   - `useTableState`: wraps LiveStore queries for `table_configuration` and exposes setters (sorting room, project board autopull).
   - `useProjectStateMachine`: helper hook for components needing derived labels/stage names.
5. **Room Chat Context Contract**
   - Update `RoomLayout` to accept a `contextBuilder(roomContext)` prop so each room can supply structured payloads.
   - Define payload schemas:
     - Drafting Room: `{ activeProjectId, stage, draftingData }`
     - Sorting Room: `{ goldCandidates, silverCandidates, bronzeCounts, selected }`
     - Roster Room: `{ staffingQueue, activeWorkerDraft }`
     - Project Board: `{ projectId, tasksSummary, workerStatus }`
   - Ensure `useRoomChat` sends this context when conversations start/refresh.
6. **Design Tokens & Docs**
   - Extend `new-ui.css` with classes for Table grid, card paddings, Bronze stack badges, and Urushi visuals.
   - Add README section describing how to consume the shared components/hooks.

- Database migration adding `project_lifecycle_state` structured column, `table_configuration`, `table_bronze_stack`, and `priority_queue_version` tracking columns (plus supporting indexes).
- Update LiveStore events and queries to read/write the new structures.
- Provide backfill/migration script mapping existing attributes into the state machine.

## Testing & QA

- Unit tests for state machine guards, `getNextBronzeTasks`, and hook selectors (using LiveStore test harness).
- Visual regression tests for `UrushiVisual` via Storybook screenshot tests.
- Manual QA checklist verifying table configuration CRUD via temporary admin script.

## Source References

- `mvp-source-of-truth-doc.md:560-604` – Project archetypes, lifecycle states, and Urushi stages the state machine + visual system must encode.
- `mvp-source-of-truth-doc.md:374-452` – Descriptions of the Drafting, Sorting, and Roster Rooms that rely on shared navigation context and data contracts.
- `mvp-source-of-truth-doc.md:705-751` – Table slots, Bronze modes, and dual presence behavior informing the `table_configuration`/`table_bronze_stack` schema.
- `mvp-source-of-truth-doc.md:755-800` – Planning/Priority Queue definitions driving queue metadata and version tracking.
- `mvp-source-of-truth-doc.md:1044-1188` – Four-stage project creation process whose states map directly to `ProjectLifecycleState` variants.
- `mvp-source-of-truth-doc.md:1311-1424` – Worker staffing workflow that motivates shared hooks/components for Roster Room + Project Board integrations.

## Dependencies & Follow-ups

- Must land before Life Map, Drafting, Sorting, and Project Rooms workstreams.
- Later plans depend on the hooks/components exported here; document API stability expectations.
- Consider future server-side enforcement of state transitions once telemetry confirms correctness.

## Proposed PR Breakdown

1. **PR1 – Lifecycle & Initial Visuals**  
   _Title:_ “Foundation: Project state machine + basic ProjectCard”  
   _Scope:_ Introduce `ProjectLifecycleState`, migrate `project_lifecycle_state` column, upgrade `ProjectCard` to consume the new state, and add a minimal `UrushiVisual` with Storybook coverage. Ensures developers immediately see state-driven visuals in action.

2. **PR2 – Table State Persistence**  
   _Title:_ “Foundation: Table configuration & Bronze stack persistence”  
   _Scope:_ Add `table_configuration` (with versioning) and `table_bronze_stack` tables, related LiveStore queries/hooks (`getTableConfiguration$`, `useTableState`), and an admin script for manual setup. Establishes durable Gold/Silver/Bronze storage.

3. **PR3 – Shared Hooks & Visual Toolkit**  
   _Title:_ “Foundation: Shared lifecycle hooks and visual system”  
   _Scope:_ Deliver `ProgressRing`, full `UrushiVisual` variants, `useLifeMapState`, `useProjectStateMachine`, RoomLayout context plumbing, and design tokens. Enables downstream streams to render/consume lifecycle-aware UI immediately.
