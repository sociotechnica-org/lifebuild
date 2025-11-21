# Roster Room – AI Worker Staffing

## Overview
This plan implements Devin’s Roster Room: the four-stage workflow for staffing AI workers onto projects that are currently on The Table. It covers worker templates, synopsis/prompt editing, staffing queue display, and integration with the Project Board and worker chat infrastructure.

## Goals
1. Create Roster Room route showing staffing queue of Work-at-Hand projects (Gold first, then Silver) with “1 empty position” indicators.
2. Build the four-stage staffing flow (Project Review, Worker Profile, Prompt Configuration, Confirmation) with Devin guidance.
3. Support template selection plus customization for synopsis and prompt fields (with length guidance).
4. Persist worker records, link them to projects, and expose editing (“Edit Worker”) entry point.
5. Provide Storybook coverage for queue states and each stage of staffing.

## Non-Goals
- Life Map/Table rendering (handled elsewhere).
- Sorting Room activation logic.
- Multi-agent team support (future).

## Current State
- Existing worker infrastructure supports creation but lacks the guided multi-stage UI described in the source doc.
- No dedicated Roster Room route; worker editing occurs via legacy components.

## Technical Implementation Plan
1. **Routing & Layout**
   - Add `/new/roster` route using `RoomLayout`, with Devin persona panel and quick links back to Life Map.
   - Display summary banner showing current staffed projects vs open slots.
2. **Staffing Queue**
   - Query projects with `ProjectLifecycleState.status === 'work_at_hand'` lacking workers (or flagged for edits) and render Gold before Silver.
   - Each queue card includes `UrushiVisual`, category, worker status, and CTA “Staff this project”.
3. **Four-Stage Flow**
   - Stage 1: Project Review – show objectives, archetype, tasks summary, Bronze mode context. Provide quick links to Project Board.
   - Stage 2: Worker Profile – select template (Research Specialist, etc.), auto-generate synopsis, allow edits with word count guidance (150–300 words).
   - Stage 3: Prompt Configuration – generate prompt (500–1000 words) using template + project context via existing LLM tooling; allow editing with validation.
   - Stage 4: Confirmation – review worker summary, confirm assignment, optionally set review reminder.
   - Provide progress indicator and autosave per stage.
4. **Persistence & Editing**
   - Create or update worker entity, store synopsis/prompt text plus template metadata, and set the project’s `assignedWorkerId` (single-worker constraint per MVP).
   - “Edit Worker” entry point from Project Board should deep-link into Stage 2/3 with existing data.
   - Enforce rule from doc: synopsis/prompt editable only within Roster Room.
5. **AI Integration**
   - Use existing AI service endpoints for generating synopses/prompts; capture prompts in LiveStore + existing secret storage.
   - Provide fallbacks when AI generation fails (manual entry guidance).
6. **Storybook/Test Coverage**
   - Stories for queue empty, Gold-only, Gold+Silver, stage flows (per stage) with LiveStore boot states.
   - Tests verifying template selection, word count validation, worker creation event payloads.

## Data & Schema Impact
- Extend worker schema with `templateKey`, `synopsis`, `prompt`, `lastEditedAt`, `createdBy`.
- Possibly add `worker_requests` table for AI generation audit (optional but useful for debugging).

## Testing & QA
- Unit tests for stage form validation and template logic.
- Integration tests ensuring worker creation links to project and surfaces in Project Board/Room Chat, including verifying the staffing queue updates when worker assignments change.
- Manual QA: deep-link from Project Board to edit worker, confirm worker data persists and cannot be edited elsewhere.

## Source References
- `mvp-source-of-truth-doc.md:451-494` – Roster Room overview, staffing queue expectations, Devin’s persona, and one-worker-per-project constraint.
- `mvp-source-of-truth-doc.md:1311-1424` – Detailed 4-stage worker staffing workflow (Project Review → Profile → Prompt → Confirmation) that this plan implements.

## Room Chat Context
- Supply Devin with `{ staffingQueue, activeWorkerDraft, selectedProjectId }` so assistant guidance references the exact synopsis/prompt currently being edited (“Let’s expand the discovery responsibilities section by 2 sentences”).

## Dependencies & Follow-ups
- Requires Life Map/Table plan to flag Work-at-Hand projects needing staffing.
- Project Rooms plan must pull worker info to display in Project Board + chat.
- Future work: multi-worker per project, automation settings.

## Proposed PR Breakdown
1. **PR1 – Staffing Queue & Worker Wizard**  
   *Title:* “Roster: Staff projects with AI workers (end-to-end)”  
   *Scope:* Add `/new/roster`, the Work-at-Hand staffing queue, and the full four-stage worker wizard (Project Review → Profile → Prompt → Confirmation) with Devin integration per `mvp-source-of-truth-doc.md:451-494` and `1311-1424`.

2. **PR2 – Templates & Editing Enhancements**  
   *Title:* “Roster: Worker templates and editing”  
   *Scope:* Add template selection, worker library view, and editing flows (synopsis/prompt regeneration) so Directors can quickly reuse or adjust workers per the “Worker Templates” guidance.
