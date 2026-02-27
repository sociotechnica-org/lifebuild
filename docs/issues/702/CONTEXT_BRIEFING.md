# Context Briefing: Remove Mesa from the Map

**Issue:** #702
**Type:** Agent Removal
**Assembled by:** Conan
**Date:** 2026-02-27

---

## Executive Summary

Mesa is the Life Map Navigator agent -- a friendly spatial guide that helps builders orient on the hex grid, explain visual indicators, and route to specialist agents. She is in **reserve status** in the codebase: fully defined in `rooms.ts` with a prompt, worker ID (`life-map-mesa`), and room definition (`LIFE_MAP_ROOM`), but not part of the active agent roster for the Map-first UI release. The release plan explicitly calls for Mesa's removal, with Jarvis and Marvin as the two active attendants.

---

## Primary Cards

### Agent - Mesa
**Path:** `docs/context-library/product/agents/Agent - Mesa.md`

Mesa is the Life Map Advisor. Her responsibilities include helping builders manage the hex grid, explaining visual elements, and routing strategic questions to Jarvis and operational questions to Marvin. She implements Strategy - Spatial Visibility and Principle - Guide When Helpful.

**Build phase:** Reserve
**Implementation status:** Implemented (active in codebase, reserve in product strategy)
**Reality note (2026-02-17):** Mesa remains in codebase in reserve status. D4 resolved: category room agents removed entirely for R1, but Mesa was kept separate from that decision. The Map-first UI release now calls for her removal.

### Agent - Jarvis
**Path:** `docs/context-library/product/agents/Agent - Jarvis.md`

Jarvis is the builder's Counselor. He coordinates with Mesa (receives routed strategic questions from the Life Map). After Mesa's removal, Jarvis's card should be updated to remove the Mesa coordination reference.

### Zone - Life Map
**Path:** `docs/context-library/product/zones/Zone - Life Map.md`

The Life Map lists Mesa as its agent (`Agent: [[Agent - Mesa]]`). The HOW section includes "Get help (summon Mesa)" as a primary workflow. Both references need updating.

### Release - The Map-first UI
**Path:** `docs/context-library/releases/Release - The Map-first UI.md`

Explicitly lists "Remove Mesa" as a feature under AI as Teammates (L1 to L1.5): "Remove Mesa agent from map and codebase. Jarvis and Marvin are the two active attendants for this release." Also lists Agent - Mesa under Cards to Deprecate and Affected Library Cards.

---

## Supporting Cards

### Strategy - AI as Teammates
**Path:** `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md`

Lists Mesa as Reserve in the core team: "Core team: [[Agent - Jarvis]], [[Agent - Marvin]], [[Agent - Conan]]. Reserve: [[Agent - Mesa]]." Reality note says "Mesa active on Life Map (reserve status)." Needs update after removal.

### Principle - Guide When Helpful
**Path:** `docs/context-library/rationale/principles/Principle - Guide When Helpful.md`

Governs Mesa's routing behavior. Examples reference Mesa by name ("Mesa suggests..."). After removal, examples could be updated to reference Jarvis/Marvin or remain as future-state illustrations.

### System - Processing Layer
**Path:** `docs/context-library/product/systems/System - Processing Layer.md`

Anti-example references Mesa: "Mesa, on the builder's next Life Map visit, can explain the yellow tint..." This is a future-state example and can remain as-is or be updated.

### Component - Campfire
**Path:** `docs/context-library/product/components/Component - Campfire.md`

Anti-example: "Mesa greeting at the campfire instead of Jarvis -- the first steward relationship must be Jarvis." No changes needed; this already establishes Mesa should NOT be at the campfire.

---

## Codebase Impact Map

### Core Definition (must change)

| File | What to Change |
|------|---------------|
| `packages/shared/src/rooms.ts` | Remove `MESA_PROMPT` constant (lines 30-73). Replace Mesa references in `LIFE_MAP_ROOM` with a new agent (Jarvis or a generic life-map worker). The worker ID `life-map-mesa` and name `MESA` need replacement. |
| `packages/shared/tests/rooms.test.ts` | Update test assertion `expect(LIFE_MAP_ROOM.worker.id).toBe('life-map-mesa')` to match new worker ID. |

### Web App References (must change)

| File | What to Change |
|------|---------------|
| `packages/web/src/Root.tsx` | Imports `LIFE_MAP_ROOM` -- no change needed if `LIFE_MAP_ROOM` is kept but repurposed. |
| `packages/web/src/components/layout/RoomLayout.test.tsx` | Test fixtures reference `id: 'life-map-mesa'` and `name: 'MESA'`. Update to match new definition. |
| `packages/web/src/components/room-chat/RoomChatPanel.test.tsx` | Test fixtures reference `name: 'MESA'` and `workerId: 'life-map-mesa'`. Update. |
| `packages/web/src/components/room-chat/RoomChatMessageList.test.tsx` | References `workerName='MESA'`. Update. |
| `packages/web/src/components/room-chat/RoomChatPanel.stories.tsx` | Story fixtures reference `id: 'life-map-mesa'`, `name: 'MESA'`, `title: 'Life Map . MESA'`. Update. |
| `packages/web/src/components/life-map/LifeMap.stories.tsx` | Story description mentions "MESA chat sidebar". Update to match new agent. Uses `LIFE_MAP_ROOM` properties throughout -- will auto-update if definition changes. |

### Plans/Docs (informational, low priority)

| File | Note |
|------|------|
| `docs/plans/032-room-chat/plan.md` | References `life-map-mesa` in a table. Historical document -- may not need update. |
| `docs/plans/042-3d-life-map-rollout/plan-opus.md` | References Mesa. Historical. |
| `docs/plans/045-ralph-loop-orchestration/plan.md` | References Mesa. Historical. |

---

## Key Decision Context

**D4 (2026-02-17):** "What happens to category room agents?" -- Decided: Remove entirely for R1. Category agents (Maya, Grace, Brooks, etc.) are vestigial. Mesa was noted as "unaffected (already in reserve)" at D4 time, but the Map-first UI release plan subsequently calls for Mesa's removal as well.

**Release plan:** Mesa removal is part of the "AI as Teammates" feature set in the Map-first UI release. The life-map room should be reassigned to either Jarvis (the primary attendant) or Marvin, depending on product direction. The release specifies "Jarvis and Marvin are the two active attendants."

---

## Removal Checklist

1. **Decide replacement agent for life-map room** -- The `LIFE_MAP_ROOM` definition needs a new worker. Options: Jarvis (strategic, aligns with his overlay presence), Marvin (operational), or remove the chat entirely from the life-map view.
2. **Update `packages/shared/src/rooms.ts`** -- Remove `MESA_PROMPT`, update `LIFE_MAP_ROOM` worker definition.
3. **Update tests** -- `packages/shared/tests/rooms.test.ts`, `RoomLayout.test.tsx`, `RoomChatPanel.test.tsx`, `RoomChatMessageList.test.tsx`.
4. **Update stories** -- `RoomChatPanel.stories.tsx`, `LifeMap.stories.tsx`.
5. **Update context library cards** -- Agent - Mesa (mark deprecated), Zone - Life Map (remove Mesa reference), Agent - Jarvis (remove Mesa coordination), Strategy - AI as Teammates (remove Mesa from reserve).
6. **Verify no server-side references** -- Confirmed: no Mesa references in `packages/server/`.

---

## Gaps and Open Questions

| Dimension | Question | Status |
|-----------|----------|--------|
| WHAT | What agent replaces Mesa on the life-map room? Jarvis or Marvin? | Needs decision -- release says both are active attendants but doesn't specify life-map room assignment |
| HOW | Should `LIFE_MAP_ROOM` be removed entirely or repurposed? | Depends on whether life-map chat persists in the Map-first UI |
| WHEN | Should the Mesa context card be deleted or marked deprecated? | Release plan says "Removed. May return in future role" -- suggest marking deprecated with WHEN update |
