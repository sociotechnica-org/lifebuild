# Standard - Bronze Mode Behaviors

## WHAT: Definition

The specification for three Bronze stack operating modes — Minimal, Target, and Maximal — each defining different stack population and replenishment behaviors. Builders select mode during planning; System - Bronze Operations implements the behavior.

## WHERE: Ecosystem

- Implemented by: [[System - Bronze Operations]] — executes mode behavior
- Selected in: [[Room - Sorting Room]]
- Displayed on: [[Component - Bronze Position]]
- Implements: [[Standard - Three-Stream Portfolio]] — Bronze stream mechanics

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — operational work managed with flexible controls
- Principle: [[Principle - Protect Transformation]] — modes let builders constrain Bronze expansion
- Driver: Different weeks need different operational engagement. Modes provide that flexibility.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-10):** No Bronze mode selection exists. The Bronze stack shows tasks but has no Minimal/Target/Maximal mode controls. Bronze Operations is partial (stack display works) but mode behaviors are not implemented.

## HOW: Specification

### Rules

#### Mode Definitions

| Mode      | Behavior                                                                                                                 | Best For                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Minimal   | Only due-date tasks, critical responses, and system-generated items. Stack shrinks as tasks complete (no replenishment). | High Gold/Silver commitment weeks, recovery periods |
| Target +X | Minimal tasks + X discretionary. Auto-replenishes to maintain count.                                                     | Normal weeks, steady operational cadence            |
| Maximal   | Continuous pull from queue. As tasks complete, next candidate immediately surfaces.                                      | Catch-up weeks, administrative clearing             |

#### Stack Sources (Priority Order)

1. Due-date items (deadline approaching)
2. Critical Responses (urgent flags)
3. System-generated tasks (from planted systems)
4. Quick Task project tasks
5. Decomposed tasks from larger projects

#### Mode Selection Rules

- Initial selection during Weekly Planning
- Can change mid-week via gear icon on Bronze position
- Mode change takes effect immediately

### Examples

**Example 1: Minimal mode during a high-Gold week**

- Scenario: Builder has a critical Gold project deadline this week and wants to minimize Bronze distractions.
- Input: Builder selects Minimal mode during weekly planning. Bronze stack starts with 3 due-date items and 1 critical response.
- Correct output: Stack shows 4 items. As each is completed, the stack shrinks (no replenishment). By mid-week, if all 4 are done, Bronze stack is empty. No new items surface unless a new due-date or critical response arrives.

**Example 2: Mid-week switch from Target to Maximal**

- Scenario: Builder finishes Gold work early on Wednesday and wants to clear operational backlog.
- Input: Builder taps gear icon on Bronze position, switches from Target +3 to Maximal.
- Correct output: Mode change takes effect immediately. As the builder completes each Bronze task, the next candidate surfaces from the queue in priority order (due-dates first, then critical responses, then system-generated, etc.). Stack never empties while queue has items.

### Anti-Examples

- **Replenishing in Minimal mode** — Minimal stack shrinks as tasks complete. Auto-filling new tasks defeats the purpose of constraining Bronze during high Gold/Silver weeks.
- **Ignoring stack source priority** — Surfacing discretionary tasks before due-date items or critical responses. Due dates and critical responses always come first regardless of mode.
- **Preventing mid-week mode changes** — Builders must be able to switch modes when the week's shape changes. Locking mode to planning time removes flexibility the spec exists to provide.

### Conformance Test

1. Set Bronze to Minimal mode, complete all items, and verify no new items are auto-replenished (stack shrinks to zero or only mandatory items remain).
2. In Target +3 mode, verify that when an item is completed, a replacement surfaces to maintain the target count, and that replacements follow the stack source priority order.
3. Switch modes mid-week via the gear icon and verify the change takes effect immediately without requiring a new planning session.
