# System - Bronze Operations

## WHAT: Definition

The operational workflow governing Bronze stream tasks — mode selection, stack population, auto-replenishment, and completion handling. Bronze Operations manages the mechanics that keep maintenance work flowing without overwhelming transformation work.

## WHERE: Scope

- Displayed in: [[Component - Bronze Position]]
- Configured via: [[Room - Sorting Room]] during [[Capability - Weekly Planning]]
- Agent: [[Agent - Marvin]] — guides mode decisions
- Implements: [[Standard - Three-Stream Portfolio]] — Bronze stream mechanics
- Sources: [[Primitive - Project]] (maintenance tasks), [[Primitive - System]] (generated tasks)
- Implements: [[Standard - Bronze Mode Behaviors]] — mode specifications

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — structured Bronze mechanics prevent ad-hoc maintenance chaos
- System: [[Standard - Three-Stream Portfolio]] — Bronze requires unique mechanics
- Principle: [[Principle - Protect Transformation]] — Bronze stays contained
- Driver: Operational work behaves differently than transformational work. Bronze Operations codifies that difference.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** Bronze mode selection (Minimal/Target/Maximal) exists in `BronzePanel.tsx`. Bronze projects can be added/removed from The Table via `tableBronzeProjects` events. However, auto-replenishment on completion is not confirmed. System-generated tasks don't exist (no System primitive). Bronze sources limited to manually-classified bronze projects.

## HOW: Mechanics

### State

- **Current Bronze mode**: One of Minimal / Target N / Maximal (selected during Weekly Planning or changed mid-week)
- **Active stack**: Ordered list of Bronze tasks currently visible to the builder
- **Stack depth**: Number of tasks populated, governed by mode
- **Completion count**: Tasks completed this cycle

### Transitions

| From                  | Trigger                                   | To                                   | Side Effects                                          |
| --------------------- | ----------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| No mode selected      | Weekly Planning mode choice               | Mode active (Minimal/Target/Maximal) | Stack populated per mode rules                        |
| Task visible in stack | Builder checks off task                   | Task complete                        | Next task auto-replenishes per priority order         |
| Mode = Target N       | Builder clicks gear icon, selects Maximal | Mode = Maximal                       | Stack expands to show all available Bronze tasks      |
| Mode = Maximal        | Builder clicks gear icon, selects Minimal | Mode = Minimal                       | Stack contracts to due-date and critical items only   |
| Stack empty           | No more Bronze tasks available            | Stack empty (idle)                   | No replenishment; Bronze position shows "clear" state |

### Processing Logic

**Mode selection:**

- Initial selection during Weekly Planning
- Can change mid-week via gear icon on Bronze position
- Mode change takes effect immediately

**Stack sources (priority order):**

1. Due-date items (deadline approaching)
2. Critical Responses (urgent flags)
3. System-generated tasks (from planted systems)
4. Quick Task project tasks
5. Decomposed tasks from larger projects

**Completion flow:**

- Check off task -> task marked complete
- Stack updates per mode rules
- Progress visible on Bronze position

**Constraint:** Bronze never blocks Gold/Silver. Even with 100 Bronze tasks queued, builders have independent transformation slots.

### Examples

- A builder selects Target +3 during Weekly Planning. The stack populates with 3 Bronze tasks: a bill payment due Thursday, a dentist-appointment system task, and a quick errand. The builder completes the bill payment; the stack auto-replenishes with the next highest-priority Bronze item (a home maintenance task from a planted system). The builder sees 3 tasks throughout the week without manually searching for what's next.
- Mid-week, a builder's workload spikes at their job. They tap the gear icon on the Bronze position and switch from Target +3 to Minimal. The stack contracts to show only the one item with a hard deadline (car registration due Friday). All other Bronze tasks remain in the queue but stop surfacing. The builder handles only what's urgent and returns to Target mode next week.

### Anti-Examples

- **Bronze mode change blocking Gold/Silver work** — switching Bronze to Maximal should never lock, hide, or reduce capacity for transformation positions. Bronze Operations is explicitly designed so that Bronze cannot crowd out Gold or Silver, regardless of how many Bronze tasks exist.
- **Auto-replenishment pulling tasks from Gold/Silver streams into Bronze** — Bronze stack sources are strictly maintenance-stream items. A Gold project's subtask should never appear in the Bronze stack, even if it looks small or operational. Stream boundaries are enforced.
