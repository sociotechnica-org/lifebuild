# Release 5: The Attendants

> **Arc:** The Territory
> **Narrative:** "Someone handles the research. Someone drafts the email. You start to delegate."

---

## GOAL

The builder stops doing everything alone. Attendant agents — specialist AI workers with defined task types — join the team. Bronze tasks and system maintenance can be delegated. The Roster Room activates as the management interface. This is the unlock that makes systems sustainable: infrastructure that generates tasks now has staff to handle them.

### Success Criteria

- [ ] Builder can assign Bronze tasks to attendant agents from any project or system
- [ ] At least 3 attendant specializations available (research, drafting, scheduling)
- [ ] Roster Room shows all attendants with their current assignments and capacity
- [ ] Delegated tasks show visual indicator on hex tiles ("someone is working on it")
- [ ] System delegation profiles configurable: which recurring tasks can attendants handle
- [ ] Attendants complete tasks and report back with results
- [ ] Builder's personal task load measurably decreases

---

## LADDER POSITIONS

| Bet                | Before                                   | After                                                  | Key Advancement                                                     |
| ------------------ | ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| Spatial Visibility | L2.8 (live territory, expedition rhythm) | L2.9 (delegation visible on tiles)                     | Delegated work shows on map; Roster Room spatial presence           |
| Superior Process   | L5 (expedition cycle, weekly rhythm)     | L5.5 (delegation reduces maintenance load)             | System maintenance can be delegated; Bronze workload shared         |
| AI as Teammates    | L3 (agents with standing roles)          | L3.5 (agents with standing authority — attendants act) | Attendants have defined jobs and permissions; execute within bounds |

---

## FEATURES (Minimum Viable)

### AI as Teammates

| Feature                    | Minimum Viable Implementation                                                                                                                      | Full Vision (deferred)                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Attendant agents           | 3 specialists: Researcher (web research, summaries), Drafter (text drafts, outlines), Scheduler (calendar coordination). Pre-defined capabilities. | Dynamic specialization; attendants learn builder preferences; unlimited task types |
| Delegation flow            | Builder marks task as "delegate" → picks attendant type → attendant works → returns result for review                                              | Proactive delegation suggestions; attendants claim tasks within authority          |
| Roster Room                | List view: attendants, their specializations, current assignments, completed work                                                                  | Full management interface with performance tracking, authority adjustments         |
| System delegation profiles | Per-system setting: which recurring task types can be auto-delegated to attendants                                                                 | Auto-delegation with learning; attendants improve over time                        |

### Spatial Visibility

| Feature              | Minimum Viable Implementation                                                         | Full Vision (deferred)                                 |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Delegation indicator | Small icon on hex tile when attendant is working on a task within that project/system | Rich delegation visualization showing who's doing what |

### Superior Process

| Feature                  | Minimum Viable Implementation                                           | Full Vision (deferred)                                 |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| Reduced maintenance load | Bronze tasks on systems delegate to attendants; builder reviews results | Attendants handle full maintenance cycles autonomously |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- Assign Bronze tasks to specialist AI attendants
- Have system maintenance partially handled by attendants
- See who's working on what via the Roster Room
- Configure which system tasks can be auto-delegated
- Focus more on Gold/Silver decisions while routine work gets handled

**After this release, the builder CANNOT:**

- Access historical patterns or archives (no institutional memory)
- Have stewards learn from past performance (no Conan)
- Have capacity-aware expedition planning (no capacity modeling)
- Zoom or drag-rearrange the map
- Have attendants act proactively (delegation is builder-initiated)

**Bottleneck:** No institutional memory. The team executes well this week but can't learn from last quarter. Patterns repeat without being surfaced. Stewards can't reference historical data to improve advice.

**Who falls in love here:** Delegation dreamers. Overwhelmed builders who feel immediate relief. "I assigned the research task and it came back done. I have STAFF."

**Viable scale:** ~20-30 projects, 5-10 systems

---

## AFFECTED LIBRARY CARDS

| Card                               | How It's Affected                         |
| ---------------------------------- | ----------------------------------------- |
| [[Room - Roster Room]]             | Core feature — launched                   |
| [[Standard - Naming Architecture]] | Attendant tier fully activated            |
| [[Strategy - AI as Teammates]]     | Advancing to L3.5 — agents with authority |
| [[Standard - Service Levels]]      | Attendant-level service activated         |
| [[Primitive - System]]             | Extended with delegation profiles         |

---

## WHAT'S EXPLICITLY DEFERRED

| Feature                            | Deferred To | Why                                                       |
| ---------------------------------- | ----------- | --------------------------------------------------------- |
| Proactive delegation               | Release 7   | Attendants need to earn trust through reactive work first |
| Attendant specialization over time | Release 9   | Need Conan's historical data to track improvement         |
| Agent-to-agent coordination        | Release 6+  | Conan needs to exist before the full pipeline works       |
| Performance tracking               | Release 6   | Need Archives to store and surface performance data       |

---

## WHEN: Timeline

- Status: planned
