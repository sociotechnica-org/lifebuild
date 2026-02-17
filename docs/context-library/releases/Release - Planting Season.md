# Release 3: Planting Season

> **Arc:** The Settlement
> **Narrative:** "Your first Silver project finishes. Something takes root. It generates work without you asking."

---

## GOAL

Introduce the System primitive — the second core entity alongside Projects. When a Silver project completes, the builder can "plant" it as a system that generates recurring tasks indefinitely. Systems live on the hex map with distinct visual treatment and basic health indicators. Smoke signals surface when things need attention. The product shifts from "project management tool" to "something where infrastructure compounds."

### Success Criteria

- [ ] Silver project completion offers a "plant as system" option
- [ ] Planted systems appear on hex tiles with distinct visual treatment (looping icon, health dots)
- [ ] Systems generate recurring tasks on their configured cadence
- [ ] Basic System Board shows all planted systems with status
- [ ] Smoke signals appear on tiles: project untouched 14+ days = warm tint, task overdue = subtle pulse
- [ ] Builder can Hibernate, Upgrade, or Uproot a system
- [ ] Jarvis advises on system investments aligned with Charter priorities

---

## LADDER POSITIONS

| Bet                | Before                               | After                                             | Key Advancement                                                                  |
| ------------------ | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Spatial Visibility | L2.5 (illustrated, territory phases) | L2.7 (living map — smoke signals, system visuals) | Map communicates health; systems have distinct tile treatment                    |
| Superior Process   | L3 (Table, G/S/B, Pipeline)          | L3.5 (systems exist, infrastructure compounds)    | System primitive introduced; Silver→planted lifecycle                            |
| AI as Teammates    | L2 (Charter, Agenda)                 | L2.5 (system-aware advice)                        | Marvin helps configure systems; Jarvis advises on Silver investments via Charter |

---

## FEATURES (Minimum Viable)

### Spatial Visibility

| Feature                       | Minimum Viable Implementation                                                          | Full Vision (deferred)                                |
| ----------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| System tile visual            | Distinct sprite treatment + small looping icon; health shown as filled/unfilled dots   | Rich health animations, overgrowth visual treatment   |
| Smoke signals                 | Two signals: staleness tint (14-day untouched) and overdue pulse. CSS-only treatments. | Full signal taxonomy with priority, dismissal, snooze |
| System vs project distinction | Different border treatment or icon overlay on system tiles                             | Distinct sprite families for systems vs projects      |

### Superior Process

| Feature                   | Minimum Viable Implementation                                                                      | Full Vision (deferred)                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| System primitive          | New data entity: planted from Silver completion. Has purpose, pattern (cadence), and basic health. | Full 6-component systems with controls, inputs, outputs, delegation profiles |
| Recurring task generation | System generates tasks on a configured schedule (daily/weekly/monthly)                             | Pattern-based generation with conditional triggers                           |
| System Board              | List view of all planted systems with name, cadence, health status, last-generated task            | Full System Board with health dashboard, trend data                          |
| System lifecycle          | Three actions: Hibernate (pause), Upgrade (spawn Silver), Uproot (archive)                         | Rich lifecycle with state machine, transition effects                        |

### AI as Teammates

| Feature                 | Minimum Viable Implementation                                    | Full Vision (deferred)                         |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| System configuration    | Marvin helps set cadence and initial tasks during planting       | Marvin configures full 6-component system spec |
| Strategic system advice | Jarvis references Charter to recommend Silver→system investments | Jarvis models capacity impact of new systems   |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- Complete a Silver project and plant it as a running system
- See systems on the map with health indicators
- Have systems generate recurring tasks automatically
- Notice smoke signals when projects or systems need attention
- Hibernate, upgrade, or uproot systems from the System Board
- Get Jarvis's advice on which Silver investments align with their Charter

**After this release, the builder CANNOT:**

- Delegate work to AI attendants (tending all systems personally)
- Run structured expedition cycles (work is still ad-hoc, no plan→execute→debrief)
- Have the AI reason about their capacity
- Access historical patterns or archives
- Have the AI track their felt experience

**Bottleneck:** The builder does ALL maintenance and execution themselves. Systems generate tasks, but nobody else picks them up. No rhythm — work is reactive. The Factorio curve is starting but there's no delegation.

**Who falls in love here:** Systems thinkers. Infrastructure builders. The "I want things to run" crowd. Anyone who has ever set up a recurring reminder and wished it was smarter.

**Viable scale:** ~10-15 projects, 2-5 systems

---

## AFFECTED LIBRARY CARDS

| Card                                   | How It's Affected                                     |
| -------------------------------------- | ----------------------------------------------------- |
| [[Primitive - System]]                 | Core feature — activated (basic)                      |
| [[Capability - System Actions]]        | Hibernate/Upgrade/Uproot activated                    |
| [[Room - System Board]]                | Launched (basic list view)                            |
| [[System - Smoke Signals]]             | Basic activation (2 signal types)                     |
| [[Standard - Smoke Signal Thresholds]] | Reality note: only staleness and overdue thresholds   |
| [[Standard - Project States]]          | Extended to include system planting transition        |
| [[Agent - Marvin]]                     | Prompt updated for system configuration assistance    |
| [[Agent - Jarvis]]                     | Prompt updated to advise on Silver→system investments |

---

## WHAT'S EXPLICITLY DEFERRED

| Feature                    | Deferred To | Why                                            |
| -------------------------- | ----------- | ---------------------------------------------- |
| Full smoke signal taxonomy | Release 7   | Start with 2 signals, learn what builders need |
| System delegation profiles | Release 5   | Need attendants first                          |
| Overgrowth detection       | Release 7   | Need capacity modeling to detect overextension |
| System health trending     | Release 6   | Need Conan/Archives for historical data        |
| Expedition cycle           | Release 4   | Next release                                   |
| Capacity tracking          | Release 7   | Systems must exist before capacity matters     |

---

## WHEN: Timeline

- Status: planned
