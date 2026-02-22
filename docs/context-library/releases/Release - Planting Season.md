# Release 3: Planting Season

> **Arc:** The Settlement
> **Narrative:** "You plant your first system. Something takes root. It generates work without you asking."

---

## GOAL

Introduce the System primitive — the second core entity alongside Projects. The Drafting Room's first screen presents a binary entity type choice (Project or System). Systems use a 3-stage creation flow with system-specific fields, where Stage 2 defines recurring task templates each with their own cadence. Once planted, systems generate tasks on per-template schedules indefinitely. Systems live on the hex map with distinct visual treatment and snapshot-based health indicators. Smoke signals surface when things need attention. The product shifts from "project management tool" to "something where infrastructure compounds."

### Success Criteria

- [ ] Drafting Room first screen presents binary entity type choice (Project or System) before any conversation with Marvin
- [ ] Systems use 3-stage creation flow: Identify (quick capture), Scope (purpose + task templates with per-template cadences), Detail (health metrics, delegation — lightweight)
- [ ] Planted systems appear on hex tiles with distinct visual treatment (looping icon, health dots)
- [ ] Systems generate recurring tasks per individual task-template cadences (time-based: daily/weekly/monthly/quarterly/annually)
- [ ] Basic System Board shows all planted systems with snapshot-based health status
- [ ] Smoke signals appear on tiles: staleness = sepia overlay (14+ days), overdue = candle flicker
- [ ] Builder can Hibernate, Upgrade, or Uproot a system
- [ ] Jarvis advises on when and where to create systems, aligned with Charter priorities

---

## LADDER POSITIONS

| Bet                | Before                               | After                                             | Key Advancement                                                                                    |
| ------------------ | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Spatial Visibility | L2.5 (illustrated, territory phases) | L2.7 (living map — smoke signals, system visuals) | Map communicates health; systems have distinct tile treatment                                      |
| Superior Process   | L3 (Table, G/S/B, Pipeline)          | L3.5 (systems exist, infrastructure compounds)    | System primitive introduced as first-class entity; Drafting Room creates both projects and systems |
| AI as Teammates    | L2 (Charter, Agenda)                 | L2.5 (system-aware advice)                        | Marvin guides system creation in Drafting Room; Jarvis advises on system investments via Charter   |

---

## FEATURES (Minimum Viable)

### Spatial Visibility

| Feature                       | Minimum Viable Implementation                                                                                   | Full Vision (deferred)                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| System tile visual            | Distinct sprite treatment + small looping icon; health shown as filled/unfilled dots                            | Rich health animations, overgrowth visual treatment   |
| Smoke signals                 | Two signals: staleness (sepia overlay, 14+ days untouched) and overdue (candle flicker). Ambient, not alarming. | Full signal taxonomy with priority, dismissal, snooze |
| System vs project distinction | Different border treatment or icon overlay on system tiles                                                      | Distinct sprite families for systems vs projects      |

### Superior Process

| Feature                   | Minimum Viable Implementation                                                                                                                      | Full Vision (deferred)                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| System primitive          | New data entity: first-class, created in Drafting Room. Has purpose, recurring task templates (each with own cadence), and snapshot-based health.  | Full 6-component systems with controls, inputs, outputs, delegation profiles |
| Recurring task generation | Each task template generates tasks on its own cadence (daily/weekly/monthly/quarterly/annually). Non-time triggers use estimated time equivalents. | Pattern-based generation with conditional triggers, non-time trigger types   |
| System Board              | List view of all planted systems with name, task template count, health status, last-generated task                                                | Full System Board with health dashboard, trend data                          |
| System lifecycle          | Three actions: Hibernate (pause), Upgrade (spawn Silver), Uproot (archive)                                                                         | Rich lifecycle with state machine, transition effects                        |

### AI as Teammates

| Feature                 | Minimum Viable Implementation                                                                                               | Full Vision (deferred)                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| System creation         | Marvin guides 3-stage system creation flow; helps define per-template cadences in Stage 2; supports mid-cycle status button | Marvin configures full 6-component system spec |
| Strategic system advice | Jarvis advises on when to create systems, aligned with Charter                                                              | Jarvis models capacity impact of new systems   |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- Choose "System" on the Drafting Room's first screen and create it with per-template cadences
- See systems on the map with snapshot-based health indicators
- Have systems generate recurring tasks automatically
- Notice smoke signals when projects or systems need attention (sepia for staleness, candle flicker for overdue)
- Hibernate, upgrade, or uproot systems from the System Board
- Get Jarvis's advice on when and where to create systems, aligned with their Charter

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

| Card                                   | How It's Affected                                   |
| -------------------------------------- | --------------------------------------------------- |
| [[Primitive - System]]                 | Core feature — activated (basic)                    |
| [[Capability - System Actions]]        | Hibernate/Upgrade/Uproot activated                  |
| [[Room - System Board]]                | Launched (basic list view)                          |
| [[System - Smoke Signals]]             | Basic activation (2 signal types)                   |
| [[Standard - Smoke Signal Thresholds]] | Reality note: only staleness and overdue thresholds |
| [[Standard - Project States]]          | Verified: no system planting transition needed      |
| [[Agent - Marvin]]                     | Prompt updated for system creation in Drafting Room |
| [[Agent - Jarvis]]                     | Prompt updated to advise on system creation timing  |

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
