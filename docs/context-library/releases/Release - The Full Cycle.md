# Release 7: The Full Cycle

> **Arc:** The Territory
> **Narrative:** "You declare an appetite. The circuit breaker fires. For the first time, the stewards tell you what they see."

---

## GOAL

The game mechanics reach full depth. Expedition cycles gain appetite declarations (bounded scope) and circuit breakers (graceful endings). Capacity modeling activates — felt experience data and Conan's historical patterns feed steward reasoning so Jarvis can say "I think I may be missing something — my calculations have this at 97% overbooked." Zoom tiers and drag-to-rearrange unlock because the map is finally large enough to need them. Overgrowth detection warns when systems outpace the builder's capacity.

### Success Criteria

- [ ] Builder declares appetite before each expedition ("2-week push on Career Gold")
- [ ] Circuit breaker triggers when appetite expires — work carries forward, not guilt
- [ ] Jarvis reasons about capacity: surfaces honest picture using felt experience + history
- [ ] Overgrowth detection flags when planted systems exceed maintainable capacity
- [ ] Zoom from Horizon View (whole map) to Working View (category) to Detail View (project)
- [ ] Builder can drag-to-rearrange hexes on the map
- [ ] Marvin models task capacity when shaping expeditions using historical data

---

## LADDER POSITIONS

| Bet                | Before                                | After                                                        | Key Advancement                                                                        |
| ------------------ | ------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Spatial Visibility | L3 (Archives zone, history dimension) | L3.5 (zoom tiers, drag-to-rearrange, navigable at scale)     | Full spatial navigation; builder controls layout; information density scales with zoom |
| Superior Process   | L5.7 (history-informed planning)      | L6 (capacity tracking)                                       | Capacity modeling; appetite-driven expeditions; circuit breakers; overgrowth           |
| AI as Teammates    | L4.5 (three-steward coordination)     | L5 (tiered authority — stewards push back on overcommitment) | Jarvis challenges capacity; Marvin models scope; Conan provides evidence               |

---

## FEATURES (Minimum Viable)

### Superior Process

| Feature               | Minimum Viable Implementation                                                                                                  | Full Vision (deferred)                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Appetite declarations | Builder states duration + scope before expedition. Tracked. Jarvis confirms alignment with Charter.                            | Appetite history feeds calibration; system suggests optimal appetite based on patterns    |
| Circuit breakers      | When appetite expires: expedition pauses, remaining work carries forward. Jarvis debriefs partial completion without judgment. | Automatic detection of appetite-exceeding patterns; proactive circuit breaker suggestions |
| Capacity modeling     | Felt experience (R/G/B) history + Conan's estimation data + current WIP → steward reasoning in prompts                         | Full faucet/sink economic model; visual capacity indicators                               |
| Overgrowth detection  | If system maintenance tasks accumulate faster than completion rate → smoke signal + Jarvis mention                             | Rich overgrowth visualization on map; proactive system hibernate suggestions              |

### Spatial Visibility

| Feature           | Minimum Viable Implementation                                                                        | Full Vision (deferred)                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Zoom tiers        | Three zoom levels via controls: Horizon (whole map), Working (category cluster), Detail (single hex) | Smooth semantic zoom; information density transitions; gesture support |
| Drag-to-rearrange | Builder can drag hexes to new positions. Position persists.                                          | Snap-to-grid suggestions; spatial analysis of arrangement              |

### AI as Teammates

| Feature                 | Minimum Viable Implementation                                                                                           | Full Vision (deferred)                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Capacity-aware Jarvis   | Jarvis prompt includes capacity summary (R/G/B trends, WIP count, estimation accuracy). Raises concerns with curiosity. | Deep capacity reasoning with faucet/sink model             |
| History-informed Marvin | Marvin references Conan's estimation data when scoping: "Similar projects took 2x longer than planned"                  | Automated scope adjustment based on historical calibration |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- Declare appetite-bounded expeditions with circuit breakers
- Have Jarvis honestly assess capacity and push back on overcommitment
- See overgrowth warnings when systems outpace maintenance capacity
- Zoom from whole-life to single-project views
- Drag hexes to arrange the map intentionally
- Have Marvin scope work using historical calibration data
- Experience circuit breakers as "the plan working" not failure

**After this release, the builder CANNOT:**

- See personalized generated art on tiles (still using gallery sprites)
- Have seasonal structure (Spring/Summer/Fall/Winter rhythm)
- Experience full capacity economy (Maintain/Invest/Spend model)
- Have The Shift recognized by Jarvis
- See full sanctuary progression (3-stage evolution complete)

**Bottleneck:** No temporal macro-structure. The weekly expedition cycle works well, but there's no seasonal rhythm, no annual reflection, no structural variation in workload across the year. The economy is implicit — stewards reason about capacity but don't model flows.

**Who falls in love here:** Strategic thinkers. Builders who value honest feedback. "Jarvis told me I was overcommitted and he was right." People who've been burned by overplanning tools that never say no.

**Viable scale:** ~30-50 projects, 10-15 systems, full life on the map

---

## AFFECTED LIBRARY CARDS

| Card                                     | How It's Affected                                     |
| ---------------------------------------- | ----------------------------------------------------- |
| [[Loop - Expedition Cycle]]              | Full activation with appetite and circuit breakers    |
| [[System - Capacity Economy]]            | Basic activation (reasoning, not full economic model) |
| [[Capability - Zoom Navigation]]         | Launched (3 zoom tiers)                               |
| [[Standard - Spatial Interaction Rules]] | Drag-to-rearrange activated (reality note removed)    |
| [[System - Overgrowth]]                  | Basic activation (detection + signals)                |
| [[Dynamic - Over-Expansion]]             | Can now be detected and surfaced                      |
| [[Structure - Hex Grid]]                 | Zoom + drag interaction layer added                   |

---

## WHAT'S EXPLICITLY DEFERRED

| Feature                       | Deferred To | Why                                                 |
| ----------------------------- | ----------- | --------------------------------------------------- |
| Image generation              | Release 8   | Next release — visual mastery                       |
| Art evolution (5 stages)      | Release 8   | Needs generation pipeline                           |
| Full capacity economy (M/I/S) | Release 9   | Start with capacity reasoning; add flow model later |
| Seasonal rhythm               | Release 9   | Weekly cycle must mature before seasonal structure  |
| The Shift recognition         | Release 9   | Needs full economy to emerge naturally              |
| Sanctuary full progression    | Release 9   | Capstone                                            |

---

## WHEN: Timeline

- Status: planned
