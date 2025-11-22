# Drafting Room – Planning Queue & Stages 1–3

## Overview

This plan delivers the Drafting Room experience for capturing and shaping projects through Stages 1–3 (Identified, Scoped, Drafted) and managing the Planning Queue described in `docs/plans/033-mvp-prototype-build/mvp-source-of-truth-doc.md`. The focus is on Marvin’s workspace: fast idea capture, guided scoping, task drafting, autosave, and keeping the queue lean.

## Goals

1. Implement Planning Queue UI showing Stage 1–3 projects with Urushi progression and metadata.
2. Build the multi-stage creation flow with Marvin-guided prompts and autosave checkpoints.
3. Support pausing/abandoning drafts, with clear affordances for resume/delete.
4. Persist partial stage data and validation rules in LiveStore.
5. Provide Storybook coverage and integration tests for the stage wizard.

## Non-Goals

- Stage 4 prioritization and Priority Queue management (separate plan).
- Sorting Room activation or Table updates.
- Worker staffing (Roster Room plan).
- Final Kanban/task execution (Project Rooms plan).

## Current State

- No Drafting Room route exists; project creation still happens via legacy UI.
- Data schema lacks dedicated fields for “stage in progress” metadata and Autosave states.

## Technical Implementation Plan

1. **Routing & Layout**
   - Add `/new/drafting` route under `NewUiShell`, reusing `RoomLayout` for header navigation and Marvin chat placement.
   - Provide quick navigation links (Life Map, Drafting, Sorting, Roster) consistent with Section 2.3.4 and show a read-only Priority Queue strip (fetched via Stage 4 selectors) so Directors always see downstream context.
2. **Planning Queue View**
   - Create `PlanningQueue.tsx` listing Stage 1–3 projects with the shared `UrushiVisual`, stage badge (“Stage 2 of 4 – Scoped”), category seal, last modified timestamp, resume CTA.
   - Derive project state entirely from the `ProjectLifecycleState` union; the queue should render only items with `status: 'planning'`.
   - Add empty-state guidance encouraging new project capture when queue is empty.
3. **Stage Wizard Infrastructure**
   - Build `useDraftingSession` hook to manage stage transitions, form state, autosave timers, and LiveStore mutations.
   - Stage-specific components:
     - Stage 1 (Identified): fields for title, description, category; 2-minute checklist.
     - Stage 2 (Scoped): objectives, archetype, traits, urgency/importance selectors.
     - Stage 3 (Drafted): integrate Marvin (LLM worker) to generate tasks via existing AI tooling; allow editing/reordering tasks.
   - Each stage enforces validation before enabling “Next”.

- Autosave every edit directly into the canonical LiveStore tables (projects/tasks) so the UI can safely drop explicit “Save Draft” semantics; the UX only needs to communicate that progress is preserved when leaving the flow.
- When the Director approves the Stage 3 task list, immediately materialize those tasks into the canonical `tasks` table (with CODAD metadata); the `project_draft_tasks` store becomes read-only history so downstream surfaces (Sorting, Project Board) always consume the canonical rows.

4. **Autosave & Resume**
  - Persist stage drafts to LiveStore after every meaningful change (debounced) with metadata `currentStage`, `stepProgress`, and `lastUpdatedAt`. Let LiveStore’s last-write-wins semantics resolve any conflicting edits.

- Provide “Pause for now” action that simply routes the user away while keeping the autosaved project data intact—no extra persistence layer or events required.

5. **Abandon/Complete Actions**
   - Allow directors to archive drafts they no longer need (moves to `deletedAt`).
   - When Stage 3 completes and Director confirms “Move to Stage 4”, emit an event marking the draft as Stage-3-complete (`status: 'ready_for_stage4'`) but defer inserting into the Priority Queue until the Stage 4 workflow explicitly places it (handled in the next plan).
6. **Storybook & Fixtures**
   - Create Storybook scenarios for each stage flow, queue with multiple drafts, empty queue, and error validation states.
   - Boot LiveStore stories with events representing mixed stages to ensure UI fidelity.

## Data & Schema Impact

- Extend project schema with `draftingState` containing `currentStage`, partial form payload, `autosaveVersion`.
- Persist Stage 3 task drafts (before they become canonical tasks) in a new `project_drafts` table or JSON field.
- Add Marvin conversation history reference for Stage 3 to support resume.

## Testing & QA

- Component tests covering stage validation and autosave events across each `ProjectLifecycleState` variant.
- Integration tests simulating Stage 1→3 progression using LiveStore test harness.
- Manual QA checklist: autosave indicator, pause/resume, multi-project queue behavior, Stage 3 AI task generation, read-only Priority Queue strip accuracy.

## Source References

- `mvp-source-of-truth-doc.md:374-409` – Drafting Room overview, Planning vs Priority Queue layout, and Marvin’s role in guiding the four stages.
- `mvp-source-of-truth-doc.md:755-775` – Planning Queue definition and “workspace, not storage” philosophy that keeps Stages 1–3 lean.
- `mvp-source-of-truth-doc.md:1044-1163` – Detailed requirements for Stages 1–3 (Identified, Scoped, Drafted) including Marvin prompts, CODAD balance, and autosave expectations.

## Room Chat Context

- Supply Marvin with `{ activeProjectId, stage, draftingData }` via `RoomLayout` contextBuilder so AI assistance can reference the exact step (and even form field contents) when responding.

## Dependencies & Follow-ups

- Requires base navigation/header from Life Map plan for consistent room switching.
- Stage 4 priority placement and Sorting Room integration depend on this plan’s “Move to Stage 4” emit.
- Later plans may add analytics instrumentation for stage dwell time.

## Proposed PR Breakdown

1. **PR1 – Stage 1–2 Capture & Planning Queue Basics**  
   _Title:_ “Drafting: Capture and scope projects (Stages 1–2)”  
   _Scope:_ Add `/new/drafting`, the Stage 1–2 wizard with autosave, and a basic Planning Queue list showing in-progress drafts per `mvp-source-of-truth-doc.md:374-409` and `1044-1109`.

2. **PR2 – Stage 3 Task Drafting & Stage 4 Prioritization**  
   _Title:_ “Drafting: Draft tasks and prioritize projects (Stages 3–4)”  
   _Scope:_ Layer Stage 3 task generation (CODAD balance, Marvin integration) and Stage 4 placement, moving projects into the Priority Queue in line with `mvp-source-of-truth-doc.md:1110-1188`.

3. **PR3 – Planning Queue Management Enhancements**  
   _Title:_ “Drafting: Manage in-progress Planning Queue”  
   _Scope:_ Enhance the queue with stage indicators, resume/pause/abandon actions, stale draft warnings, and improved autosave handling to keep the queue lean per `mvp-source-of-truth-doc.md:384-409`.
