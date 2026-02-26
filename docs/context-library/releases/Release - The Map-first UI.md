# Release: The Map-first UI

> **Arc:** First Light
> **Narrative:** "You arrive at a campfire in the dark. By dawn, you can see everything laid out before you — your projects, your purpose, your path. The world is real now."

---

## GOAL

Migrate from the current multi-room UI (Drafting Room, Sorting Room, Life Map, Table) to a map-first experience where the hex map is the sole base layer and all interactions happen through buildings placed on it. This release establishes the spatial foundation that everything else will be built on — onboarding, project management, chartering, and drafting all happen as overlays on the map.

This release deliberately trades process UI sophistication for spatial reality: L3 process features (The Table, three-stream sorting) are removed from the UI, while their underlying data is preserved. The plan is to re-climb the process ladder with spatial-native implementations once the foundation is solid.

### Success Criteria

- [ ] New user arrives at a campfire on a hex map within 30 seconds of first login
- [ ] Jarvis guides user through creating their first project via conversation
- [ ] First project appears as a statue/building on the map
- [ ] Fog-of-war lifts to reveal the full map (sanctuary, workshop, campfire, project)
- [ ] User can click any building to open its overlay interface
- [ ] All overlays are URL-addressable (deep-linkable, back-button works)
- [ ] Marvin is always available via left rail when working on projects
- [ ] Workshop enables drafting multiple projects (Unburdening experience)
- [ ] Sanctuary enables writing a charter (Visioning experience)
- [ ] Task Queue panel shows cross-project task view
- [ ] Table, Sorting Room, Drafting Room, and Kanban columns are fully removed from UI and code

---

## LADDER POSITIONS

| Bet                | Before | After | Key Advancement |
| ------------------ | ------ | ----- | --------------- |
| Spatial Visibility | L1     | L2    | Map is THE view. Projects are placed buildings. Buildings are entry points to all experiences. Fog-of-war reveal. Sprite animations. |
| Superior Process   | L3 (partial) | L2.5  | L3 data preserved (gold/silver/bronze categorization, tiers). UI deliberately presents at L2 — WIP via map slots, task states, subtle tier coloring. Bespoke process frameworks removed from UI, to be re-introduced spatially later. |
| AI as Teammates    | L1     | L1.5  | Jarvis and Marvin both active with defined conversation flows. Marvin observes user edits reactively. Attendants have spatial presence (sprites, walking, notification pips). Still reactive, but noticeably more teammate-like. |

---

## FEATURES (Minimum Viable)

### Spatial Visibility (L1 → L2)

| Feature | Minimum Viable Implementation | Full Vision (deferred) |
| ------- | ----------------------------- | ---------------------- |
| Map as base layer | Hex map is always visible, full-bleed. All other UI layers on top. | Semantic zoom tiers (horizon/working/detail) |
| Building overlays | Centered panel over dimmed map. URL-addressable routes (`/workshop`, `/sanctuary`, `/projects/:id`). Back button works. | Animated open/close transitions |
| Project buildings | Nano Banana generated statues placed on hex cells. Grayed out when completed/archived. Gold/silver/bronze subtle border coloring (unexplained to user). | Drag-to-rearrange, clustering |
| Fixed buildings | Campfire (non-clickable, decorative), Sanctuary (clickable), Workshop (clickable) | Library/Archives building |
| Fog-of-war / reveal | Dark/dawn state for new users. Sunrise effect when onboarding progresses past campfire. | Day/night cycle, weather |
| Attendant sprites | Jarvis and Marvin as sprites that walk between buildings during onboarding. Stand outside their buildings at steady state. | More attendant sprites, idle animations |
| Map slots (WIP) | Fixed number of available hex cells for project placement (use current grid size). Completed/archived projects do NOT consume slots. | Slots grow as user progresses. Unlock mechanic TBD. |

### Superior Process (L3 → L2.5)

| Feature | Minimum Viable Implementation | Full Vision (deferred) |
| ------- | ----------------------------- | ---------------------- |
| Task list project interface | Replace kanban columns with a task list. Tasks have toggleable states: to-do, doing, review, done. Same underlying data — presentation change only. | Task dependencies, subtasks |
| Task Queue panel | Persistent collapsible panel in top-right. Aggregated view of tasks across all projects. Appears when second project is placed on map. | Filtering, sorting, smart prioritization |
| Remove Table | Delete Table components, TableBar, TableSlot, table-related hooks. Gold/silver/bronze queue data becomes inert. No migration needed. | Re-introduce WIP limits via spatial mechanic |
| Remove Sorting Room | Delete SortingRoom, GoldSilverPanel, BronzePanel, all sorting components and routes. | Re-introduce sorting as spatial-native experience |
| Remove Drafting Room | Delete DraftingRoom, Stage1/2/3 Forms, PlanningQueueCard, all drafting routes. Drafting rebuilt inside Workshop. | Progressive drafting stages in Workshop |
| Remove Kanban | Delete ProjectKanban, ProjectKanbanColumn, drag-and-drop column logic. | N/A — replaced by task list |
| Preserve tier data | Projects retain gold/silver/bronze categorization and tier computation. Surfaced only through subtle visual treatment (border color on buildings). | Re-introduce explicit tier UI when process ladder re-climbs to L3 |

### AI as Teammates (L1 → L1.5)

| Feature | Minimum Viable Implementation | Full Vision (deferred) |
| ------- | ----------------------------- | ---------------------- |
| Left rail with avatars | Vertical rail on left edge with circular avatar icons for Jarvis and Marvin. Click to expand chat panel. Hidden during campfire, fades in during reveal. Always visible after reveal. | More attendants in rail, status indicators |
| Notification pips | Small indicator on attendant avatar when they have something to say. Marvin pips when you open a project he can help with. | Urgency levels, unread counts |
| Chat decoupled from buildings | Can chat with either attendant from any context (bare map, any overlay). Navigating to Sanctuary auto-selects Jarvis. Chat can contain navigation shortcuts ("go to Workshop"). | Context-aware conversation switching |
| Marvin on projects | Marvin always present when a project overlay is open. Observes user edits (task creation, state changes) and responds. Can create tasks on user's behalf. | Proactive suggestions, learning from patterns |
| Jarvis at sanctuary | Jarvis available for charter/visioning work when Sanctuary overlay is open. | Proactive check-ins, charter evolution |
| Remove Mesa | Remove Mesa agent from map and codebase. Jarvis and Marvin are the two active attendants for this release. | Mesa returns in a future role |

---

## ONBOARDING SEQUENCE

The onboarding is a 4-beat sequence that introduces the map, the attendants, and the core interactions:

### Beat 1: The Campfire

- User sees a small hex map at center, fog-of-war/darkness surrounding it
- A campfire burns at the center of the grid
- Left rail is hidden, Task Queue is hidden
- Jarvis sprite walks to the campfire
- Jarvis initiates conversation (appears as chat — how exactly TBD, since rail is hidden at this point)
- Conversation guides user to name and describe their first project
- Jarvis creates the project with sample tasks

### Beat 2: The Reveal

- Jarvis sprite walks from campfire to sanctuary
- Project appears as a statue/building on a hex cell
- Fog-of-war lifts — sunrise/dawn lighting effect
- Map reveals: campfire, sanctuary (Jarvis standing outside), workshop (Marvin standing outside), first project building
- Left rail fades in with Jarvis and Marvin avatars
- Marvin's avatar gets a notification pip

### Beat 3: The First Project

- User clicks on the project building (prompted by Marvin waiting there, pip on avatar)
- Project overlay opens — new task list interface with sample tasks from Beat 1
- Marvin's chat opens (user clicks pip or it auto-opens first time only)
- Marvin offers to help shape the tasks
- User can manually add/edit tasks; Marvin observes and responds
- User closes overlay — Marvin sprite walks to the workshop

### Beat 4: The Unburdening (optional, either order with Beat 5)

- User clicks on the Workshop building (Marvin standing outside)
- Workshop overlay opens — the drafting experience for creating new projects
- Marvin guides the user through drafting multiple projects via conversation
- Projects exist as sketches inside the Workshop until placed on the map
- If user hasn't done the Visioning yet, Marvin nudges them toward the Sanctuary at the end
- After completing: user has multiple project sketches ready for placement

### Beat 5: The Visioning (optional, either order with Beat 4)

- User clicks on the Sanctuary building (Jarvis standing outside)
- Sanctuary overlay opens — the chartering experience
- Jarvis guides the user through writing a life charter that spells out what's most important
- If user hasn't done the Unburdening yet, Jarvis nudges them toward the Workshop at the end
- After completing both Beats 4 and 5: user is at steady state — a fully functioning map-first UI

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder CAN:**

- Arrive at a spatial world (hex map) and be guided through onboarding by Jarvis at the campfire
- Create their first project through conversation with Jarvis
- See projects as placed buildings/statues on the map
- Click buildings to open overlay experiences (project, workshop, sanctuary)
- Manage tasks within projects via a simple task list with state toggling (to-do, doing, review, done)
- Work with Marvin on any project — he's always present in the left rail
- Draft new projects in the Workshop with Marvin (Unburdening)
- Write a life charter in the Sanctuary with Jarvis (Visioning)
- See all tasks across projects via the Task Queue panel
- Place projects from workshop to map via placement cursor
- Chat with Jarvis or Marvin from any context via the left rail

**After this release, the builder CANNOT:**

- Drag or rearrange projects on the map
- Use zoom tiers (horizon/working/detail view)
- See systems on the map (only projects)
- Delegate tasks to attendant agents
- Run a weekly planning rhythm or expedition cycle
- Access the Library/Archives
- Move completed projects somewhere meaningful (they just gray out in place)
- Have agents act proactively (still reactive, user-initiated)
- Discover what gold/silver/bronze means through UI explanation

**Bottleneck:** What happens when the builder has more projects than map slots? The growth/unlock mechanic is undefined. Without it, the map becomes a constraint rather than a canvas.

**Who falls in love here:** Someone overwhelmed by their life who wants to *see* it laid out in front of them — and who responds to the warmth of guided AI conversations rather than blank-slate productivity apps. The "I've tried everything and nothing sticks" person.

**Viable scale:** 5-10 projects, 1 charter, dozens of tasks across projects.

---

## PROTOTYPES NEEDED

These prototypes must be completed (or at least explored enough to unblock implementation) before their related features can be built. Each prototype is a separate shaping exercise.

| ID | Prototype | What It Resolves | Owner |
|----|-----------|-----------------|-------|
| P1 | Workshop / Unburdening Flow | How does the drafting experience work inside the Workshop? Progressive sketches? Conversation-driven? | Jess |
| P2 | Project Placement Flow | How does a project move from Workshop sketch to placed building on the map? Cursor mechanic, flourish/fanfare. | Jess |
| P3 | Statue & Sketch Generation | Nano Banana pipeline for generating project visuals — both sketches (in workshop) and statues (on map). Consistency between the two. | Jess |
| P4 | Task Queue Panel | Cross-project task view in top-right. Interaction model — click a task to open its project? Filtering? | Jess |
| P5 | Project Interface | Task list with state toggling replacing kanban. Task editing modal. Marvin integration points. | Jess |
| P6 | Campfire Conversation | Jarvis onboarding script — posture sequence, tone, how it leads to first project creation. | Danvers |
| P7 | Unburdening Conversation | Marvin workshop script — how he guides multi-project drafting, what questions he asks. | Danvers |
| P8 | Visioning Conversation | Jarvis charter script — how the visioning/chartering experience flows. | Danvers |

---

## AFFECTED LIBRARY CARDS

| Card | How It's Affected |
| ---- | ----------------- |
| [[Zone - Life Map]] | Becomes the sole zone — all other zones fold into it as building overlays |
| [[Structure - Hex Grid]] | Elevated from sub-component to the primary canvas |
| [[Component - Hex Tile]] | Now represents project buildings/statues, not just colored tiles |
| [[Component - Campfire]] | Origin point for onboarding, non-interactive at steady state |
| [[Overlay - The Table]] | **Removed from UI.** Data layer preserved. Card needs WHEN update. |
| [[Room - Drafting Room]] | **Removed as standalone room.** Rebuilt inside Workshop building. |
| [[Room - Sorting Room]] | **Removed entirely.** Card needs WHEN update. |
| [[Room - Project Board]] | Kanban replaced with task list. Major rework. |
| [[Agent - Jarvis]] | Activated — campfire onboarding, sanctuary visioning, left rail presence |
| [[Agent - Marvin]] | Expanded — project assistance, workshop unburdening, left rail presence |
| [[Agent - Mesa]] | **Removed.** Card needs WHEN update. |
| [[System - Four-Stage Creation]] | Stages may be reworked for Workshop flow. Depends on P1 prototype. |
| [[System - Pipeline Architecture]] | Table-based pipeline removed. Needs re-evaluation. |
| [[Standard - Three-Stream Portfolio]] | Data preserved, UI removed. Tier coloring is subtle/hidden. |
| [[Artifact - The Charter]] | Now created in Sanctuary building via Jarvis conversation. |

---

## DECISIONS NEEDED

### Resolved

#### D1: Existing user data migration

No migration needed. Data layer stays intact — task states, project properties, tier categorization all preserved. Table queue data becomes inert. Kanban → task list is a presentation change only. Few existing users; grandfather approach.

**Status:** Resolved — no action needed.

### Needs Prototyping

All remaining decisions (D2-D11) are deferred to the prototype workstreams listed above. Each prototype will surface implementation decisions that can be resolved as part of that shaping work.

Key questions the prototypes will answer:

- **P1:** How do progressive sketches work? What information is captured at each stage? How does Marvin participate?
- **P2:** What's the placement cursor mechanic? What fanfare/animation accompanies placement? Can you cancel mid-placement?
- **P3:** What art style for statues and sketches? How consistent across projects? Performance implications?
- **P4:** What interactions does the Task Queue support? Can you complete tasks from the queue directly?
- **P5:** How does state toggling work UX-wise? How does Marvin's reactive observation manifest in the UI?
- **P6-P8:** What are the conversation postures, branching points, and handoff triggers between attendants?

---

## WHAT'S EXPLICITLY DEFERRED

| Feature | Deferred To | Why |
| ------- | ----------- | --- |
| Zoom tiers (horizon/working/detail) | Future spatial release | Need L2 foundation first |
| Drag-to-rearrange projects on map | Future spatial release | Placement mechanic comes first |
| Systems on the map | Future release | Projects only for now |
| Library/Archives building | Future release (Conan) | Completed project destination |
| Map slot growth/unlock mechanic | Future release | Fixed slots for now; prototype needed |
| Weekly planning rhythm / Expeditions | Future process release | Process ladder re-climb |
| Task delegation to attendants | Future AI release | Agents are reactive for now |
| Proactive agent behavior | Future AI release | Trust earned progressively |
| Explicit tier UI (gold/silver/bronze explanation) | Future process release | Let users discover through subtle coloring |
| Agent-to-agent coordination | Future AI release | Jarvis and Marvin operate independently |

---

## REMOVALS (Implementation Detail)

These components, routes, and data structures should be fully removed from the codebase:

### Components to Delete
- `packages/web/src/components/sorting-room/` — entire directory
- `packages/web/src/components/drafting-room/` — entire directory
- `packages/web/src/components/projects/ProjectKanban.tsx` and `ProjectKanbanColumn.tsx`
- `packages/web/src/components/layout/TableBar.tsx` and `TableSlot.tsx`
- `packages/web/src/components/life-map/LifeMap.tsx` — replaced by new map-first layout
- Mesa agent references throughout

### Routes to Remove
- `/drafting-room` and all sub-routes
- `/sorting-room` and all sub-routes

### Hooks / State to Clean Up
- `useTableState` hook
- Table-related queries and materializers
- Any sorting room specific queries

### Data to Preserve
- Project properties (all fields including tier, category, status)
- Task data (all fields including status/state)
- Gold/silver/bronze tier computation logic
- Charter data
- Hex placement coordinates
