# Release 8: The Art

> **Arc:** The Sanctuary
> **Narrative:** "Your projects get faces of their own. The illustrations evolve as you work. The map becomes autobiography."

---

## GOAL

The map becomes deeply personal. AI-generated isometric sprites replace the pre-made gallery — "kitchen renovation" gets a kitchen sprite, "learn to sail" gets a harbor scene. Art evolves through five stages as projects progress, giving visual weight to effort. Completed project art becomes decorative elements in the sanctuary area. Systems get health-responsive visual treatment. The map stops being a board and becomes a portrait of the builder's life.

### Success Criteria

- [ ] New projects get AI-generated isometric sprites based on name and description
- [ ] Builder can regenerate or select from alternatives if the first generation misses
- [ ] Art evolves through at least 3 visible stages as projects advance (Sketch → Inked → Finished minimum)
- [ ] Systems show health-responsive visuals (sharp when healthy, faded when struggling)
- [ ] Completed projects contribute decorative art to the sanctuary area of the map
- [ ] Art style is consistent across the map (cohesive isometric aesthetic)
- [ ] Image generation cost is sustainable per builder

---

## LADDER POSITIONS

| Bet                | Before                       | After                                                     | Key Advancement                                                             |
| ------------------ | ---------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Spatial Visibility | L3.5 (zoom, drag, navigable) | L4 (approaching full vision — personalized, evolving art) | Every tile is personal; art tells the story of effort; map is autobiography |
| Superior Process   | L6 (capacity tracking)       | L6.2 (minor — image stages mapped to project states)      | Standard - Image Evolution fully implemented                                |
| AI as Teammates    | L5 (tiered authority)        | L5.5 (attendants handle image tasks)                      | Attendants can regenerate images; image prompts tuned per category          |

---

## FEATURES (Minimum Viable)

### Spatial Visibility

| Feature                 | Minimum Viable Implementation                                                                                            | Full Vision (deferred)                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| AI sprite generation    | On project creation: generate isometric sprite from name + category + description. Cache result. 3 alternatives offered. | Real-time style adaptation; builder-directed art direction                  |
| Art evolution           | 3 stages minimum: Sketch (planning), Inked (active), Finished (completed). Triggered by project state transitions.       | Full 5-stage evolution: Sketch → Clean Pencils → Inked → Colored → Finished |
| System health visuals   | System tiles: sharp/saturated when healthy, faded/desaturated when struggling, dimmed when hibernating                   | Animated health indicators; overgrowth visual treatment                     |
| Completed art placement | Finished project sprites placed as decorative elements near the sanctuary structure                                      | Full gallery system; builder arranges completed art intentionally           |

### AI as Teammates

| Feature                  | Minimum Viable Implementation                                                          | Full Vision (deferred)                                            |
| ------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Image prompt engineering | Category-aware prompt templates. Consistent isometric style. Brand-aligned aesthetics. | Builder preference learning; style customization                  |
| Attendant image tasks    | "Regenerate image" delegatable to attendant                                            | Attendants proactively suggest image updates at state transitions |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- See AI-generated sprites unique to each project's content
- Watch art evolve as projects progress through stages
- See systems visually reflect their health state
- View completed project art decorating the sanctuary area
- Have a map that is uniquely, personally theirs

**After this release, the builder CANNOT:**

- Experience seasonal rhythm (time is flat — no Spring/Summer/Fall/Winter)
- Have the full capacity economy (Maintain/Invest/Spend flows)
- Have The Shift recognized conversationally by Jarvis
- See full sanctuary structure progression complete
- Have agents act with full autonomy

**Bottleneck:** No temporal macro-structure. The map is beautiful and personal, the game mechanics are deep, but time has no shape. No seasons, no annual rhythm, no structural variation. The economy exists implicitly but isn't formalized.

**Who falls in love here:** Everyone, again. The art evolution is the most visible expression of the product's soul. "That kitchen tile evolved from a sketch to a finished illustration as I completed the renovation. My map shows my actual life."

**Viable scale:** ~40-60+ projects, 12-20 systems

---

## AFFECTED LIBRARY CARDS

| Card                               | How It's Affected                                        |
| ---------------------------------- | -------------------------------------------------------- |
| [[Standard - Image Evolution]]     | Fully implemented (3-5 stages)                           |
| [[Standard - Visual Language]]     | Fully expressed — consistent isometric style             |
| [[Component - Hex Tile]]           | Rich rendering with generated art + evolution            |
| [[Strategy - Spatial Visibility]]  | Approaching full vision (L4)                             |
| [[Aesthetic - Accomplishment]]     | Expressed through art evolution — effort becomes visible |
| [[Principle - Visual Recognition]] | Fully expressed — content-depicting, recognizable art    |

---

## WHAT'S EXPLICITLY DEFERRED

| Feature                          | Deferred To               | Why                                                           |
| -------------------------------- | ------------------------- | ------------------------------------------------------------- |
| Full 5-stage evolution           | Post-Release 9 refinement | 3 stages ship first; refine based on what builders respond to |
| Builder art direction control    | Post-Release 9            | Learn from generated defaults before adding customization     |
| Seasonal visual treatments       | Release 9                 | Need seasonal rhythm first                                    |
| Full sanctuary evolution visuals | Release 9                 | Capstone — tied to economic model                             |

---

## WHEN: Timeline

- Status: planned
