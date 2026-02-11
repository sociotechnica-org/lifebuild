# Capability - Workspace Navigation

## WHAT: Definition

The interface for moving between LifeBuild's three main workspaces — Life Map (execution), Strategy Studio (planning), and Archives (learning). Directors use persistent navigation, keyboard shortcuts, and agent-initiated transitions to move fluidly between zones.

## WHERE: Ecosystem

- Room(s):
  - Global — available throughout the application
- Uses:
  - [[Zone - Life Map]] — execution workspace
  - [[Zone - Strategy Studio]] — planning workspace
  - [[Zone - Archives]] — learning workspace
- Enables:
  - [[Capability - Zoom Navigation]] — spatial navigation within a zone
- Conforms to:
  - [[Standard - Visual Language]] — each workspace has distinct visual treatment

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — workspaces are distinct places
- Principle: [[Principle - Familiarity Over Function]] — movement should feel intuitive
- Driver: Directors need to move between execution, planning, and learning fluidly. Navigation makes that movement effortless.
- Constraints: Navigation connects workspaces without disrupting flow. Transitions preserve all state (zoom, scroll, selection). Three workspaces are peers, not a hierarchy.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** Header navigation in `NewUiShell.tsx` provides links to Life Map, Drafting Room, and Sorting Room. CHORUS_TAG enables agent-initiated navigation to projects and drafting stages. However, the three-zone model (Life Map / Strategy Studio / Archives) is not implemented — rooms are accessed directly as top-level routes, not nested under a Strategy Studio hub. No keyboard shortcuts. No Archives zone. No context preservation across navigation (zoom/scroll state). Deep linking works via URL routing with `preserveStoreIdInUrl()`.

Core feature. Navigation patterns established early, refined based on usage.

## HOW: Implementation

**Three primary zones:**

1. **Life Map** — Execution workspace (default)
2. **Strategy Studio** — Planning workspace
3. **Archives** — Learning workspace

**Navigation methods:**

- Persistent nav bar/menu (always accessible)
- Keyboard shortcuts (L for Life Map, S for Strategy Studio, A for Archives)
- Agent-initiated transitions ("let's move to the Sorting Room")
- Context links (click project in conversation → opens Project Board)

**Context preservation:**

- Leaving a workspace preserves state
- Return to where you were
- Deep links work (URL to specific room/project)

**Strategy Studio sub-navigation:**

- Council Chamber
- Category Studios (8)
- Sorting Room
- Drafting Room
- Roster Room

**Visual distinction:**

- Each workspace has distinct visual treatment
- Current location always clear
- Breadcrumb awareness for nested spaces

### Examples

- Director presses "S" → navigates from Life Map to Strategy Studio hub → sees all rooms listed → clicks Council Chamber → Jarvis greets them with context → when done, presses "L" → returns to Life Map at exact previous zoom level and scroll position.
- Jarvis says "Let's look at your priority candidates — shall we go to the Sorting Room?" → director agrees → navigation transitions to Sorting Room → Cameron takes over with candidate list → agent-initiated navigation feels like a colleague suggesting "let's walk to the conference room."

### Anti-Examples

- **Losing zoom level or scroll position when switching workspaces** — context preservation is fundamental. Directors return to exactly where they were. Resetting state on navigation breaks spatial memory and workflow.
- **Burying Strategy Studio behind multiple menu levels** — all three primary workspaces are one keystroke or one click away. Navigation is flat (three peers), not deep (nested hierarchy).
