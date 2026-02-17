# Release 4: The First Expedition

> **Arc:** The Settlement
> **Narrative:** "Jarvis asks: what are you doing this week? You shape it. You run it. You come back and debrief."

---

## GOAL

The game loop turns on. Builders move from ad-hoc task completion to a structured rhythm: assess the sanctuary, commit to a bounded focus, execute, and return for a debrief. The expedition cycle gives work shape and ending — not an infinite treadmill but bounded pushes with reflection. Felt experience capture (Red/Gray/Blue) begins storing data for future capacity reasoning.

### Success Criteria

- [ ] Jarvis initiates weekly expedition cycle: "What are you focusing on this week?"
- [ ] Builder can declare a focus (1 Gold or Silver + Bronze tending) for the week
- [ ] Daily check-in surfaces active work from The Table on the map
- [ ] At week's end, Jarvis conducts a debrief: "How did it go? What did you learn?"
- [ ] Week-in-review summary shows completions, systems tended, territory changes
- [ ] Felt experience prompt appears once per session (Red/Gray/Blue) — data stored, not yet used for reasoning
- [ ] Territory phase borders update in real-time as hexes are added

---

## LADDER POSITIONS

| Bet                | Before                               | After                                        | Key Advancement                                                                 |
| ------------------ | ------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------- |
| Spatial Visibility | L2.7 (smoke signals, system visuals) | L2.8 (real-time territory feedback)          | Territory phases update live; map reflects weekly rhythm                        |
| Superior Process   | L3.5 (systems, basic infrastructure) | L5 (structured rhythm — big jump)            | Expedition cycle: ASSESS→COMMIT→EXECUTE→RETURN; felt experience data collection |
| AI as Teammates    | L2.5 (system-aware, Charter)         | L3 (agents have standing roles in the cycle) | Jarvis facilitates assess/debrief; Marvin helps shape expedition scope          |

---

## FEATURES (Minimum Viable)

### Superior Process

| Feature                 | Minimum Viable Implementation                                                                                    | Full Vision (deferred)                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Expedition cycle        | Weekly cadence. Jarvis asks "What are you focusing on?" Builder picks focus. End of week = debrief conversation. | Appetite-driven duration (3 days to 6 weeks). Circuit breakers. Multiple expedition types. |
| Week-in-review          | Simple summary: tasks completed, systems tended, new hexes, streak count. Jarvis narrates.                       | Rich analytics with trends, comparison to previous weeks, pattern insights                 |
| Felt experience capture | Once per session: "How are you feeling? 🔴🔘🔵" Stored as LiveStore event. No reasoning yet.                     | Feeds capacity economy; stewards reason about Red/Gray/Blue patterns                       |
| Daily check-in          | Builder opens app → sees active work on Table → picks a task → completes → tile updates                          | Hex tile visual feedback on completion (progress ring, art advancement)                    |

### AI as Teammates

| Feature                        | Minimum Viable Implementation                                                                             | Full Vision (deferred)                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Jarvis expedition facilitation | Assess phase: Jarvis presents map state + Charter themes. Return phase: debrief questions. Prompt-driven. | Capacity-aware assessment; pattern-informed debrief with Conan data            |
| Marvin expedition shaping      | Marvin helps scope the week's focus: "For [Gold project], here are the tasks that fit this week."         | Marvin models task capacity, suggests realistic scope based on historical data |

### Spatial Visibility

| Feature                    | Minimum Viable Implementation                                             | Full Vision (deferred)                                       |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Live territory updates     | Territory phase (Frontier/Outpost/Settlement) recalculates on hex changes | Smooth transitions, visual celebrations on phase advancement |
| Sanctuary phase reflection | Sanctuary sprite reflects builder's current journey phase                 | Full 3-stage sanctuary evolution with rich detail            |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- Run a weekly expedition cycle: assess → commit → execute → debrief
- Get a week-in-review summary from Jarvis
- Record their felt experience (Red/Gray/Blue) each session
- See territories update in real-time as they build
- Have Jarvis and Marvin play defined roles in the planning rhythm

**After this release, the builder CANNOT:**

- Delegate any work to AI attendants (still doing everything alone)
- Access historical patterns or archives (no Conan)
- Have stewards reason about their capacity (felt experience stored but unused)
- Declare appetite bounds or trigger circuit breakers
- Zoom in/out on the map or drag-rearrange hexes

**Bottleneck:** Doing all work alone. Systems generate tasks, the rhythm gives structure, but the builder tends every system and executes every task personally. No delegation, no institutional memory, no capacity awareness.

**Who falls in love here:** Rhythm seekers. Builders who thrive with structure. "The plan→execute→reflect cycle is exactly what I needed." People who liked the weekly review concept but never had a tool that did it.

**Viable scale:** ~15-20 projects, 3-8 systems

---

## AFFECTED LIBRARY CARDS

| Card                                | How It's Affected                                             |
| ----------------------------------- | ------------------------------------------------------------- |
| [[Loop - Expedition Cycle]]         | Core feature — basic activation                               |
| [[Loop - Daily Check-In]]           | Basic activation (survey → pick → execute → complete)         |
| [[Capability - Weekly Planning]]    | Activated via expedition commit phase                         |
| [[Capability - Week-in-Review]]     | Basic activation (summary + debrief)                          |
| [[Capability - Felt Experience]]    | Data capture only — not feeding into reasoning                |
| [[Agent - Jarvis]]                  | Prompt updated for expedition facilitation (assess + debrief) |
| [[Agent - Marvin]]                  | Prompt updated for expedition scoping                         |
| [[Standard - Planning Calibration]] | Reality note: basic weekly cadence only, no appetite          |

---

## WHAT'S EXPLICITLY DEFERRED

| Feature               | Deferred To | Why                                                       |
| --------------------- | ----------- | --------------------------------------------------------- |
| Appetite declarations | Release 7   | Start with fixed weekly cadence; learn what builders need |
| Circuit breakers      | Release 7   | Need appetite bounds first                                |
| Capacity reasoning    | Release 7   | Need historical data + felt experience patterns           |
| Attendant delegation  | Release 5   | Next arc — "The Territory"                                |
| Conan / Archives      | Release 6   | Need enough history to be meaningful                      |
| Seasonal rhythm       | Release 9   | Expedition cycle must work at weekly level first          |

---

## WHEN: Timeline

- Status: planned
