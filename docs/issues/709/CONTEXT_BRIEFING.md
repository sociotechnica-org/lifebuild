# Context Briefing: Workshop Overlay with Coming Soon Sign

**Issue:** #709
**Type:** Room (New Feature Shell)
**Assembled by:** Conan
**Date:** 2026-02-27

---

## Executive Summary

The Workshop is a new Room -- the successor to the Drafting Room -- where builders draft new projects with Marvin (the "Unburdening" experience). For this story, the Workshop overlay opens at `/workshop` with a "Coming soon" placeholder interior and Marvin auto-selected in the Attendant Rail. This establishes the route, the overlay chrome, and the attendant wiring. The real drafting experience will be filled in after prototype P1 ("Workshop / Unburdening Flow") resolves.

**Blocked by:** #705 (Building overlay pattern and routing) -- the reusable building overlay frame must exist before this story can wire the Workshop into it.

**TEMP DECISION:** Placeholder interior. Replace after P1 prototype resolves.

---

## Primary Cards

### Room - Drafting Room
**Path:** `docs/context-library/product/rooms/Room - Drafting Room.md`

The Drafting Room is Marvin's dedicated space for project and system creation. It currently lives at `/drafting-room` with stages 1-3 forms and a Planning Queue. The Map-first UI release plan explicitly marks the Drafting Room as **deprecated** -- its functionality is rebuilt inside the Workshop building as a map overlay. The Drafting Room card's architectural decisions (entity type choice on first screen, four-stage project flow, three-stage system flow, quick capture) will inform the eventual Workshop interior once P1 resolves.

**Implementation status:** Implemented at `/drafting-room`.
**Map-first UI status:** Deprecated. Replaced by Room - Workshop.

### Agent - Marvin
**Path:** `docs/context-library/product/agents/Agent - Marvin.md`

Marvin is the builder's Manager -- steward of the operational cycle from idea capture through prioritization to delegation. He is the resident agent for the Workshop. In the Map-first UI, Marvin operates via the Attendant Rail: his avatar appears in the left rail, and clicking it opens his chat panel. When the Workshop overlay opens, Marvin should be auto-selected in the Attendant Rail.

**Key behaviors for Workshop context:**
- Guides creation of both projects and systems
- Supports iteration and refinement
- Voice: precise, energetic, pro-social -- "Let's frame this out."
- Does NOT provide strategic life counsel (that's Jarvis)
- Does NOT override builder's selections

**Implementation status:** Active in Drafting Room and Sorting Room. Fully defined in `rooms.ts` with prompt, worker ID (`drafting-room-marvin`), and room definition.

### Release - The Map-first UI
**Path:** `docs/context-library/releases/Release - The Map-first UI.md`

The governing release. Key decisions relevant to this story:

- **Building overlays:** Centered panel over dimmed map. URL-addressable (`/workshop`). Back button closes overlay. Escape closes overlay. One overlay at a time. Reusable frame for all building types. (Story #705)
- **Attendant Rail:** Vertical rail on left edge with circular avatar icons for Jarvis and Marvin. Click to expand chat. Navigating to Workshop auto-selects Marvin.
- **Workshop:** Primary project creation space. Houses the Unburdening experience. Marvin is the resident attendant.
- **Prototype P1:** "Workshop / Unburdening Flow" -- unresolved. This story is a placeholder UNTIL P1 resolves.
- **Removals:** Drafting Room (`/drafting-room` and all sub-routes), Sorting Room, Table -- all replaced by map-first equivalents.

---

## Supporting Cards

### Zone - Strategy Studio
**Path:** `docs/context-library/product/zones/Zone - Strategy Studio.md`

The Strategy Studio was the parent zone for the Drafting Room, Sorting Room, Council Chamber, and Roster Room. The Map-first UI release dissolves this zone entirely -- rooms now live as building overlays on the hex map. The Workshop replaces the Drafting Room's role but is no longer nested under a "Strategy Studio" hub. This is relevant because the Workshop does NOT have a zone parent in the new architecture; it is a standalone building on the map.

**Implementation status:** Partial (rooms exist as top-level routes, no hub view).
**Map-first UI status:** Dissolved. Rooms become map building overlays.

### System - Four-Stage Creation
**Path:** `docs/context-library/product/systems/System - Four-Stage Creation.md`

The progressive development process (Identify, Scope, Draft, Prioritize) that currently powers the Drafting Room. The Map-first UI release notes that "stages may be reworked for Workshop flow -- depends on P1 prototype." For this placeholder story, the creation flow is explicitly out of scope. The system is noted here because it will inform the Workshop's eventual interior.

**Implementation status:** Fully operational with `Stage1Form.tsx`, `Stage2Form.tsx`, `Stage3Form.tsx`, `StageWizard.tsx`.
**Map-first UI status:** Stage forms to be deleted. May become conversation-driven via Marvin in Workshop.

### Capability - Workspace Navigation
**Path:** `docs/context-library/product/capabilities/Capability - Workspace Navigation.md`

Navigation is being fundamentally reworked. Currently, header navigation links to Drafting Room, Sorting Room, and Life Map. In the Map-first UI, navigation shifts to: clicking buildings opens overlays (URL-addressable), Attendant Rail provides agent access, and building overlays are the primary interaction surface. The Workshop at `/workshop` becomes a new navigable destination.

**Implementation status:** Header nav in `NewUiShell.tsx` with direct room links.
**Map-first UI status:** Header nav replaced by map-based building clicks and Attendant Rail.

### Aesthetic - Sanctuary
**Path:** `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md`

The Workshop building should participate in the sanctuary aesthetic: warm palette (wood, glass, stone, Studio Ghibli workshop warmth), the feeling of "this is my place," and visual language consistent with the spatial world. Even the "coming soon" placeholder should feel like a warm, inviting space under construction -- not a cold error page or empty state.

---

## Codebase Impact Map

### New Files (to create)

| File | What to Create |
|------|---------------|
| `packages/web/src/components/workshop/Workshop.tsx` | Workshop overlay component. Renders "Coming soon" placeholder content inside the building overlay frame from #705. |
| `packages/web/src/components/workshop/Workshop.stories.tsx` | Storybook story with real LiveStore events per web AGENTS.md conventions. |

### Files to Modify

| File | What to Change |
|------|---------------|
| `packages/web/src/constants/routes.ts` | Add `WORKSHOP: '/workshop'` to `ROUTES` and `workshop: () => '/workshop'` to `generateRoute`. |
| `packages/web/src/Root.tsx` | Add `<Route path={ROUTES.WORKSHOP}>` with Workshop component inside the building overlay frame. Wire Marvin as the room agent. |
| `packages/shared/src/rooms.ts` | Potentially add a `WORKSHOP_ROOM` definition (or reuse `DRAFTING_ROOM` with Marvin). The room definition connects Marvin's worker to the Workshop context. Note: `ROOM_KIND_VALUES` may need a new kind or the Workshop can use `'life-map'` kind like Drafting Room does currently. |
| `packages/web/src/components/layout/NewUiShell.tsx` | Navigation may need updating if the Workshop should appear in nav. However, in the Map-first UI, navigation is via map building clicks, not header links -- check if header nav changes are in scope for this story or handled by a different story. |

### Dependencies

| Dependency | Issue | Status |
|-----------|-------|--------|
| Building overlay pattern and routing | #705 | Blocked -- must ship first. Provides the reusable overlay frame, URL routing (`/workshop`, `/sanctuary`, `/projects/:id`), dimmed map background, Escape-to-close, back-button behavior. |
| Attendant Rail | (part of Map-first UI) | Must exist for Marvin auto-selection. Check if this is a separate story or bundled with #709. |

---

## Key Decision Context

**From the release plan:**

- The Workshop is a fixed building on the hex map (alongside Campfire and Sanctuary).
- Clicking it opens a building overlay at `/workshop`.
- Marvin is the resident attendant -- auto-selected in the Attendant Rail when the overlay opens.
- The Drafting Room (`/drafting-room`) is being removed. The Workshop is its spatial successor.
- Prototype P1 will determine the Workshop's actual interior. This story is the placeholder.

**From #705 (the blocker):**

- Overlay routes: `/workshop`, `/sanctuary`, `/projects/:id`
- Centered overlay panel over dimmed map
- Browser back button closes overlay
- Escape key closes overlay
- One overlay at a time
- Reusable component (same frame/chrome for all building types)

---

## Gaps and Open Questions

| Dimension | Question | Status |
|-----------|----------|--------|
| WHERE | Does the Attendant Rail exist as a component yet, or does this story need to stub it? | Needs clarification -- no `AttendantRail` component found in codebase. Release plan lists it as a separate feature. |
| HOW | Should `WORKSHOP_ROOM` reuse the existing Marvin prompt from `DRAFTING_ROOM`, or get a new generic prompt? | Issue says "generic project-helper prompt" -- suggests a new, simpler prompt. |
| HOW | Does the Workshop need a `StaticRoomDefinition` in `rooms.ts`, or does the building overlay frame handle agent wiring differently? | Depends on #705 architecture. Current pattern uses `RoomLayout` wrapping a room definition. |
| WHAT | What should the "coming soon" placeholder look like? Plain text? Illustrated sign? Construction visual? | Not specified. Should align with sanctuary aesthetic (warm, inviting, not clinical). |
| WHEN | What is the Workshop's `roomKind`? Current kinds are `life-map`, `category`, `project`. May need a new kind or reuse existing. | Needs decision -- likely a new kind or reuse `'life-map'`. |

---

## Provenance

| Card | Path | Relevance |
|------|------|-----------|
| Room - Drafting Room | `docs/context-library/product/rooms/Room - Drafting Room.md` | Direct predecessor to Workshop. Architecture informs future interior. |
| Agent - Marvin | `docs/context-library/product/agents/Agent - Marvin.md` | Resident agent for the Workshop. Auto-selected in Attendant Rail. |
| Release - The Map-first UI | `docs/context-library/releases/Release - The Map-first UI.md` | Governing release. Defines overlay pattern, Attendant Rail, Workshop role. |
| Zone - Strategy Studio | `docs/context-library/product/zones/Zone - Strategy Studio.md` | Former parent zone, now dissolved. Workshop is a standalone building. |
| System - Four-Stage Creation | `docs/context-library/product/systems/System - Four-Stage Creation.md` | Current creation flow. Will inform Workshop interior after P1. |
| Capability - Workspace Navigation | `docs/context-library/product/capabilities/Capability - Workspace Navigation.md` | Navigation patterns being reworked for map-first UI. |
| Aesthetic - Sanctuary | `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md` | Visual tone for the Workshop placeholder. |
| Standard - Naming Architecture | `docs/context-library/product/standards/Standard - Naming Architecture.md` | Marvin is a Steward, not an "agent" in user-facing copy. |
