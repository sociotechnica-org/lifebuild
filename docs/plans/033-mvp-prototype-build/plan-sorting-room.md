# Sorting Room – Priority Activation & Bronze Configuration

## Overview
This plan builds Cameron’s Sorting Room: the space where Directors review Priority Queue candidates, choose Gold/Silver projects, configure Bronze mode, and activate priorities (updating The Table). It consumes data prepared by the Drafting Room plans and feeds the Life Map/Table rendering.

## Goals
1. Implement Sorting Room route with filterable view of Priority Queue streams and selection panels for Gold, Silver, and Bronze.
2. Enforce activation rules: max one Gold/Silver, min three Bronze tasks, no duplicates on Table, allow intentional empty slots.
3. Allow Bronze mode selection (Minimal, Target +X, Maximal) and capture Bronze task sources.
4. On activation, persist Table selections, update project states (Work at Hand), and create Bronze stack tasks.
5. Provide review/confirmation dialog summarizing choices before returning to Life Map.

## Non-Goals
- Editing Stage 4 queue ordering (handled by Drafting Room Priority plan).
- Staffing AI workers (Roster Room).
- Project execution UI (Project Rooms).

## Current State
- No Sorting Room route or selection UI exists in `components/new`.
- Table state is not yet persisted; Bronze mode metadata missing.

## Technical Implementation Plan
1. **Routing & Layout**
   - Add `/new/sorting` route using `RoomLayout` with Cameron persona panel (text + chat integration).
   - Provide summary banner reminding constraints and last activation timestamp.
2. **Priority Queue Intake**
   - Use selectors from Stage 4 plan to fetch ordered candidates for each stream.
   - Present pickers with search/filter (e.g., filter by category) and highlight paused items.
3. **Selection Mechanics**
   - Gold & Silver selectors: radio list of candidates with metadata (category, archetype, stage) plus option “Leave empty intentionally”.
   - Bronze selector: list of candidate tasks; allow multi-select with due date indicators and reorder to set stack order that will become entries in `table_bronze_stack`.
   - Provide inline warnings when Bronze selection <3 tasks or duplicates existing Table items.
   - Bronze mode control: segmented buttons with explanation, input for `Target +X`, and preview of `getNextBronzeTasks` output so Directors see what will auto-pull next.
4. **Validation & Confirmation**
   - “Activate Priorities” button disabled until constraints met.
   - Confirmation modal summarizing Gold/Silver choices (or “Intentionally empty”), Bronze mode, Bronze task count, expected runtime.
   - On confirm, call mutation that:
     - Sets selected projects’ state to `work_at_hand` and updates Table state store via `table.gold_assigned` / `table.silver_assigned` events with optimistic `table_configuration.version` checks.
     - Removes them from Priority Queue (or marks active) while preserving reorder data for unselected items.
     - Emits `bronze_task_added` events that append the ordered Bronze selections into `table_bronze_stack`.
5. **Post-Activation Flow**
   - Navigate back to Life Map (or display success screen with “Go to Life Map”).
   - Fire analytics events for activation type, Bronze mode chosen.
   - Provide quick actions to open Project Board of newly activated projects.
6. **Storybook/Test Coverage**
   - Stories for: empty Gold/Silver, Bronze minimal, Bronze target+X, validation failure (insufficient Bronze), success state.
   - Tests for validation logic, mutation payloads, and duplicate prevention.

## Data & Schema Impact
- Persist `table_configuration` record capturing `goldProjectId`, `silverProjectId`, `bronzeMode`, `bronzeTargetExtra`, and emit Bronze stack events into `table_bronze_stack`.
- Update project attributes: set `workState = 'work_at_hand'`, `activatedAt`, `lastActivationId`.
- Bronze tasks need `bronzeStackOrder` metadata (likely on tasks table or a join table) and should leverage the shared Bronze auto-pull helper for consistency with Project Board behavior.

## Testing & QA
- Component tests for validation + selection logic, including Bronze auto-fill preview and event emission ordering.
- Integration test simulating selection + activation, verifying LiveStore updates and `table_configuration` persistence.
- Manual QA: ensure Table updates instantly, Bronze stack matches selection, re-enter Sorting Room shows current selection, Room chat context reflects the latest counts.

## Source References
- `mvp-source-of-truth-doc.md:411-448` – Sorting Room purpose, cadence, three-stream filtering steps, and activation validation rules.
- `mvp-source-of-truth-doc.md:705-751` – The Table’s Gold/Silver/Bronze semantics and minimum Bronze stack requirements enforced here.
- `mvp-source-of-truth-doc.md:1192-1218` – Activation flow from Priority Queue to The Table, including state transitions for Gold/Silver projects and Bronze stack expectations.

## Room Chat Context
- Provide Cameron with `{ goldSelected, silverSelected, bronzeMode, bronzeCount, queueStats }` so the assistant can highlight gaps (e.g., “Bronze stack only has 2 tasks; add one more before activating”). Include Bronze stack revisions so the AI can confirm when entries are appended.

## Dependencies & Follow-ups
- Requires populated Priority Queue from Stage 4 plan.
- Life Map/Table plan needs persisted state produced here to render dual presence.
- Later work: add “resume previous activation” view or history log.

## Proposed PR Breakdown
1. **PR10 – Selection UI & Activation Flow**  
   *Title:* “Sorting: Activate Gold/Silver projects and Bronze tasks”  
   *Scope:* Build `/new/sorting`, Gold/Silver/Bronze selectors, validation for stream constraints, and activation mutations updating table configuration + Bronze stack in line with `mvp-source-of-truth-doc.md:411-448`.

2. **PR11 – Bronze Modes & Paused Project Handling**  
   *Title:* “Sorting: Configure Bronze modes and manage paused projects”  
   *Scope:* Add Bronze mode picker (Minimal/Target/Maximal), Bronze task reordering, paused-project surfacing, confirmation dialog, and intentionally-empty slot handling per `mvp-source-of-truth-doc.md:433-447` and `705-751`.
