# Plan: Remove the Sorting Room (#700)

## 1. Architecture Decisions

### Decision: Remove Sorting Room UI surfaces only, preserve three-stream portfolio state
Options considered: remove Sorting Room UI and also delete backlog/stream semantics from the data model; remove only UI/routes/nav and keep lifecycle stream data intact.  
Chosen approach: remove only UI/routes/nav and keep data semantics intact.  
Why: the story explicitly requires preserving gold/silver/bronze classification while removing the room and its components.  
State boundaries: LiveStore keeps `projects.projectLifecycleState` (`status`, `stage`, `stream`) unchanged; React no longer has Sorting Room components; URL no longer exposes Sorting Room destinations.

### Decision: Replace Stage 3 handoff target with Life Map
Options considered: redirect Stage 3 completion to project detail, to Drafting Room, or to Life Map.  
Chosen approach: navigate to `generateRoute.lifeMap()` after Stage 3 save-and-advance.  
Why: map-first layout is the current primary surface; it avoids sending users to a removed route and keeps flow consistent with existing top-level navigation.  
State boundaries: LiveStore still commits lifecycle transition to `stage: 4` and `status: 'backlog'`; React CTA text and navigation logic in `Stage3Form` changes; URL target becomes `/life-map`.

### Decision: Remove all Sorting Room entry points, keep a legacy path redirect
Options considered: hard-delete `/sorting-room` path support (404 behavior), or keep a lightweight redirect from `/sorting-room/*` to `/life-map`.  
Chosen approach: remove Sorting Room routes/constants/nav and add a legacy redirect route in `Root.tsx`.  
Why: preserves old bookmarks/deep links while ensuring no Sorting Room UI can render.  
State boundaries: URL state accepts legacy `/sorting-room/*` only as redirect alias; no Sorting Room component mounts; React backlog affordances no longer navigate to Sorting Room.

### Decision: Keep server table tools out of scope for #700
Options considered: remove server-side table tools/schemas now; leave backend tools unchanged and remove only UI-facing room integration.  
Chosen approach: keep backend tools unchanged in this issue.  
Why: #700 is scoped to UI removal; backend tool cleanup is a separate concern and should be handled in a dedicated follow-up to avoid mixed-risk changes.  
State boundaries: server tool registry remains; web routes/nav/components for Sorting Room are removed.

## 2. File Changes

| Action | File | Description |
| ------ | ---- | ----------- |
| delete | packages/web/src/components/sorting-room/SortingRoom.tsx | Remove Sorting Room page component. |
| delete | packages/web/src/components/sorting-room/GoldSilverPanel.tsx | Remove gold/silver stream sorting panel. |
| delete | packages/web/src/components/sorting-room/BronzePanel.tsx | Remove bronze sorting panel. |
| delete | packages/web/src/components/sorting-room/SortableProjectCard.tsx | Remove sortable card used only by Sorting Room. |
| delete | packages/web/src/components/sorting-room/TableDropZone.tsx | Remove sorting-only drop zone. |
| delete | packages/web/src/components/sorting-room/TableConfirmDialog.tsx | Remove sorting-only confirmation dialog. |
| delete | packages/web/src/components/sorting-room/SortingRoom.stories.tsx | Remove Sorting Room stories. |
| delete | packages/web/src/components/sorting-room/BronzePanel.stories.tsx | Remove Bronze panel stories tied to Sorting Room. |
| modify | packages/web/src/Root.tsx | Remove `SortingRoom` and `SORTING_ROOM` imports; remove Sorting Room route mounts; add legacy `/sorting-room/*` redirect to `/life-map`. |
| modify | packages/web/src/constants/routes.ts | Remove `ROUTES.SORTING_ROOM`, `ROUTES.SORTING_ROOM_STREAM`, and `generateRoute.sortingRoom`. |
| modify | packages/web/src/components/layout/NewUiShell.tsx | Remove Sorting Room nav link. |
| modify | packages/web/src/components/drafting-room/Stage3Form.tsx | Replace Sorting Room navigation with Life Map navigation; rename CTA copy from “Add to Sorting” to non-sorting language. |
| modify | packages/web/src/components/drafting-room/DraftingRoom.tsx | Update comments/assumptions that reference Sorting Room as Stage 4 destination. |
| modify | packages/web/src/components/life-map/CategoryCard.tsx | Remove Sorting Room backlog link; render backlog count as non-link informational UI. |
| modify | packages/web/src/components/life-map/LifeMap.tsx | Remove stale Sorting Room-specific comments. |
| modify | packages/web/src/hooks/useNavigationContext.ts | Remove Sorting Room route detection text. |
| modify | packages/shared/src/rooms.ts | Remove `SORTING_ROOM_PROMPT`, `SORTING_ROOM`, and `getRoomDefinitionByRoomId('sorting-room')` mapping; update MESA/Marvin prompt text that points to Cameron/Sorting Room. |
| modify | packages/web/README.md | Remove Sorting Room analytics section and page-view event reference. |
| modify | packages/web/src/components/README.md | Remove `sorting-room/` directory entry. |
| modify | packages/web/e2e/workflow.spec.ts | Remove Sorting Room navigation/assertions; update end-to-end flow for post-Stage3 behavior. |
| modify | packages/web/e2e/life-map-placement.spec.ts | Remove Sorting Room activation step and adapt setup to post-Stage3/Life Map flow. |

## 3. Data Model Changes

No event, schema, query, or materializer changes are planned for #700.

Data preserved explicitly:
- `ProjectLifecycleState.stream` (`gold`/`silver`/`bronze`) remains unchanged.
- Stage/backlog semantics remain (`status: 'backlog'`, `stage: 4`).
- Existing table-related and stream-related event history remains untouched.

Migration notes:
- No migrations.
- No data backfill.

## 4. Component Hierarchy

Removed:

```
Root Routes
  /sorting-room
    RoomLayout(room=SORTING_ROOM)
      SortingRoom
        GoldSilverPanel
          SortableProjectCard
          TableDropZone
          TableConfirmDialog
        BronzePanel
```

Removed from app chrome:

```
NewUiShell
  nav
    Sorting Room link
```

Remaining (updated):

```
Root Routes
  /life-map
    RoomLayout(room=LIFE_MAP_ROOM)
      LifeMap
  /drafting-room
    RoomLayout(room=DRAFTING_ROOM)
      DraftingRoom / Stage forms
Stage3Form
  save-and-advance -> /life-map
```

## 5. PR Breakdown

Single PR success criteria:
1. Sorting Room route mounts are removed and old `/sorting-room/*` URLs redirect to `/life-map`.
2. Sorting Room nav entry is removed from the shell.
3. All Sorting Room components/stories listed in scope are deleted.
4. Stage 3 completion no longer navigates to Sorting Room and UI copy no longer references sorting.
5. No remaining `generateRoute.sortingRoom` or `ROUTES.SORTING_ROOM*` usages.
6. Build and tests pass without runtime/import errors.

## 6. Test Plan

Unit tests:
- Add/update `Stage3Form` test coverage for continue action: lifecycle commit to backlog stage and navigation to `/life-map`.
- Add/update `NewUiShell` test coverage to assert Sorting Room nav link is absent.
- Add/update `CategoryCard` test coverage to ensure backlog UI does not link to `/sorting-room`.

E2E Playwright tests:
- Update `packages/web/e2e/workflow.spec.ts`:
  - Remove Sorting Room interactions.
  - Validate Stage 3 completion lands on Life Map and core workflow still completes.
  - Update “navigate through all pages” flow to Drafting Room <-> Life Map only.
- Update `packages/web/e2e/life-map-placement.spec.ts`:
  - Remove helper steps that depend on Sorting Room activation.
  - Keep placement/removal assertions intact.
- Add/adjust a route-compat assertion that `/sorting-room` redirects to `/life-map`.

Storybook:
- Delete Sorting Room stories and verify Storybook index/build still succeeds.
- No new presenter stories required for this removal.

## 7. Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Stage 4 backlog has no dedicated management UI after removal | Users lose an existing prioritization surface | Update Stage 3 copy/destination clearly; call out this intentional gap in PR notes and track replacement in a separate issue. |
| Legacy `/sorting-room` bookmarks fail | Broken navigation/deep links | Keep explicit `/sorting-room/*` redirect to `/life-map`. |
| Stale prompt references to Cameron/Sorting Room remain | Chat guidance points users to a removed room | Update relevant prompt text in `packages/shared/src/rooms.ts` as part of this PR. |
| Hidden route/string references survive deletion | Runtime import/build failures or stale UX text | Run repo-wide `rg` checks for sorting-room symbols before merge. |
| Analytics docs drift from code after component deletion | Tracking documentation becomes inaccurate | Remove Sorting Room analytics entries from `packages/web/README.md` in same PR. |

## 8. What's Out of Scope

- Re-introducing sorting as a map-native/spatial experience.
- Removing three-stream portfolio classification from the data layer.
- Removing Table/event-sourcing data structures (handled by #699 scope decisions).
- Removing Drafting Room (`#701`).
- Removing server table tools and related LLM tool schemas (follow-up cleanup issue).
