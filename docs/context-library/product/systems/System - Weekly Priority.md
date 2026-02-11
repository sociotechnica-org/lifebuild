# System - Weekly Priority

## WHAT: Definition

The mechanism that produces and maintains a director's active weekly commitment — selecting up to one Gold project, up to one Silver project, and a Bronze task stack that together represent "what matters this week." The output appears on The Table.

## WHERE: Scope

- Displayed on: [[Overlay - The Table]] — the UI for weekly commitment
- Selected via: [[Capability - Weekly Planning]] in [[Room - Sorting Room]]
- Agent: [[Agent - Cameron]] — guides selection
- Sources from: [[System - Priority Queue Architecture]] — candidate pool
- Modified by: [[System - Adaptation]] — mid-cycle changes
- Implements: [[Standard - Three-Stream Portfolio]] — three-stream structure
- Implements: [[Principle - Protect Transformation]] — Gold/Silver protected from Bronze overflow

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — weekly commitment creates focus
- Principle: [[Principle - Protect Transformation]] — stream constraints enforced
- Principle: [[Principle - Empty Slots Strategic]] — empty positions are valid choices
- Driver: Directors need clarity on "what am I working on this week?" Weekly Priority answers that question.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** The Table displays active Gold/Silver/Bronze selections. Selection mechanics work via Sorting Room. However, no weekly cadence — no week validity, no Friday-to-Friday cycles, no prompts. Selections are ad-hoc. No Adaptation for mid-week changes.

## HOW: Mechanics

### State

- **Gold position**: 0 or 1 active Gold project (Purpose = "Moving forward")
- **Silver position**: 0 or 1 active Silver project (Purpose = "Building leverage")
- **Bronze position**: Variable task stack controlled by Bronze Operations (mode + active tasks)
- **Week validity**: The planning cycle this commitment belongs to (typically Friday-to-Friday or Sunday-to-Sunday)
- **Position states**: Each position is either filled, empty (intentional), or vacated (mid-week pause)

### Transitions

| From                 | Trigger                                         | To                            | Side Effects                                                                                  |
| -------------------- | ----------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| No weekly commitment | Director completes Weekly Planning with Cameron | Positions filled              | Selected projects appear on The Table; enhanced treatment on Life Map                         |
| Position filled      | Director completes project                      | Position empty (completed)    | Project marked complete; position opens for remainder of week                                 |
| Position filled      | Director pauses project mid-week                | Position vacated              | Project returns to Priority Queue top; director can promote, insert emergency, or leave empty |
| Position vacated     | Director promotes from queue                    | Position filled (new project) | Replacement project moves from Priority Queue to The Table                                    |
| Position vacated     | Director creates emergency                      | Position filled (emergency)   | New project bypasses queue; Jarvis notes for pattern tracking                                 |
| Position vacated     | Director leaves empty                           | Position empty (intentional)  | Empty slot is a valid strategic choice per Empty Slots Strategic principle                    |
| Week ends            | New planning cycle begins                       | All positions reset           | Previous commitments archived; new Weekly Planning session begins                             |

### Processing Logic

**Composition:**

- Gold position: 0-1 expansion projects (Purpose = "Moving forward")
- Silver position: 0-1 capacity projects (Purpose = "Building leverage")
- Bronze position: Variable task stack (controlled by [[System - Bronze Operations]])

**Selection timing:**

- Selected during Weekly Planning (typically Friday or Sunday)
- Valid for one week
- Reselected each planning cycle

**Constraints:**

- Maximum 1 Gold, 1 Silver (hard limit)
- Bronze has no maximum (mode-controlled)
- Cross-stream placement blocked

**State transitions:**

- Project selected -> appears on The Table -> enhanced treatment on Life Map
- Project completed -> leaves The Table -> position opens
- Project paused -> returns to Priority Queue top -> position opens

**The central question:**
Weekly Priority answers "what matters this week?" Everything else is candidate, context, or history.

### Examples

- It's Friday evening. Cameron opens the Sorting Room and shows the director the Priority Queue. Gold stream has "Career transition plan" at the top (score 87). Silver has "Automate bill payments" (score 91). The director selects both and sets Bronze to Target +3. The Table now shows one Gold project, one Silver project, and 3 Bronze tasks. The director enters the weekend knowing exactly what matters. On Monday, they open LifeBuild and The Table tells them immediately what to work on.
- On Wednesday, the director's Gold project "Career transition plan" hits a blocker — they're waiting on a reference letter. They pause it. The Gold position on The Table opens. Cameron asks: "Want to promote your next Gold candidate, create something new, or leave the slot open?" The director says "Leave it open — I want to focus on Silver this week." The empty Gold slot is a strategic choice, not a failure. Weekly Priority respects it.

### Anti-Examples

- **Allowing two Gold projects to be selected simultaneously** — the hard limit of 1 Gold and 1 Silver exists to protect focus. Even if a director insists they can handle two Gold projects, the system enforces the constraint. This is Protect Transformation in action: constraints prevent overcommitment, which is the primary failure mode Weekly Priority is designed to prevent.
- **Auto-filling a vacated position without director input** — when a director pauses a project mid-week, the system should present options (promote, emergency, leave empty) rather than automatically pulling the next candidate from the queue. The director's judgment about how to use the opened slot is the entire point of the Adaptation system.
