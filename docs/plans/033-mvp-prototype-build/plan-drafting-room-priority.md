# Drafting Room – Priority Queue & Stage 4

## Overview
This plan addresses Stage 4 (“Prioritized”) and the Priority Queue inside the Drafting Room, covering Gold/Silver/Bronze filters, paused project behavior, and integrations with Sorting Room + Life Map. It builds on the Planning Queue work by taking fully drafted projects and preparing them for activation.

## Goals
1. Implement Priority Queue UI with three filter tabs (Gold Candidates, Silver Candidates, Bronze Candidates) and drag-to-reorder interactions.
2. Provide Stage 4 workflow for selecting queue position, confirming readiness, and capturing notes.
3. Surface paused projects at the top of their respective filters automatically.
4. Emit events that update Table state and Sorting Room inputs when queue order changes.
5. Cover edge cases (empty filters, validation, duel presence) via Storybook and tests.

## Non-Goals
- Choosing current Table priorities (Sorting Room plan handles activation).
- Managing Planning Queue or Stage 1–3 (covered separately).
- Rendering Life Map visuals (handled in Life Map plan).

## Current State
- No Priority Queue route/component exists.
- Data schema lacks ordering metadata per stream and paused-project flags.
- Stage 4 action currently undefined in new UI.

## Technical Implementation Plan
1. **Routing & Layout**
   - Add `/new/drafting/priority` subroute or integrate within Drafting Room layout via tabs.
   - Provide filter tabs or segmented controls per stream, showing counts and heuristics (e.g., “2 Gold candidates”).
2. **State Machine Integration**
   - Use the `ProjectLifecycleState` union to determine eligibility: only `{ status: 'plans' }` entries appear here; paused entries reuse the `paused` variant.
   - Introduce LiveStore query helpers: `getPriorityQueueProjects$(stream)` returning ordered lists referencing the shared `priority_position` field.
   - Ensure paused metadata (`pausedAt`, `pausedReason`) is stored per the state machine spec rather than bespoke fields.
3. **Stage 4 Workflow**
   - Stage 4 panel shows summary of Stage 1–3 data, allows selecting stream, entering placement (top, specific index), and capturing Stage 4 confirmation (notes, date).
   - On submission, update attributes to `plans` state, set queue position, and remove from Planning Queue.
4. **Queue Interaction**
   - Implement drag-and-drop list per stream (e.g., `@dnd-kit`) with accessible reorder controls for keyboard users.
   - Reordering persists new positions atomically by emitting `priority_queue.reordered` events that only touch affected IDs and require a `queueVersion` check to avoid clobbering concurrent updates.
   - Paused projects pinned at top with visible “Paused” label; they can be reordered after other paused items.
5. **Integrations**
   - Provide `Go to Sorting Room` CTA when user is ready to activate.
   - Fire analytics events when Stage 4 completes, queue order changes, or paused work returned.
   - Update Life Map selectors to listen for `priorityQueuePosition` updates.
6. **Empty/Overload States**
   - Provide messaging when a filter is empty plus quick link to Drafting flow.
   - Warn when a stream exceeds recommended count (>3) per doc guidance; highlight Marvin coaching text.
7. **Storybook/Test Coverage**
   - Stories for each filter state (empty, mixed, paused at top, long list).
   - Tests for Stage 4 validation, reorder operations, paused project insertion.

## Data & Schema Impact
- `projects` table gains `priority_stream`, `priority_position`, and the paused metadata already defined in the Foundations plan.
- Introduce a `priority_queue_version` counter per store (or per stream) to support optimistic concurrency during reorder events.
- Possible `priority_queue_history` table for auditing reorder events.
- Update shared queries/types and LiveStore events for Stage 4 completion.

## Testing & QA
- Unit tests for reorder reducer and Stage 4 form validation using canonical state machine fixtures.
- Integration tests ensuring Stage 4 moves project from Planning Queue to Priority Queue and updates Life Map selectors.
- Manual QA: reordering persistence, paused projects pinned, Sorting Room CTA gating.

## Source References
- `mvp-source-of-truth-doc.md:392-400` – Priority Queue description (filters, paused-project behavior, reorder expectations) surfaced in the Drafting Room.
- `mvp-source-of-truth-doc.md:755-800` – Deeper explanation of Planning vs Priority Queues, contents, and filter rules.
- `mvp-source-of-truth-doc.md:1164-1188` – Stage 4 “Prioritized” workflow, including Marvin’s prompts and the drag-to-position confirmation.

## Room Chat Context
- Surface `{ streamFilter, visibleProjects, pausedCount }` through `RoomLayout` so Marvin can proactively coach Directors (“You currently have 4 Gold candidates; consider trimming before activating”).

## Dependencies & Follow-ups
- Relies on Stage 1–3 plan for project creation and `draftingState` data.
- Sorting Room plan depends on the ordered queue produced here.
- Later optimization: virtualization for large queues if needed.
