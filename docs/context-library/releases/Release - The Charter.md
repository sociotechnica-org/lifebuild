# Release 2: The Charter

> **Arc:** The Settlement
> **Narrative:** "Jarvis writes down what he thinks he knows about you. The gallery opens. Every conversation changes."

---

## GOAL

The product earns strategic depth and expands its visual richness in one move. R1 delivered an illustrated hex map with a starter sprite set; R2 opens the full gallery. Builders browse an expanded collection of sprites organized by life category and pick visuals for each project. Simultaneously, Jarvis proposes a Charter -- a living document of the builder's values, themes, priorities, and constraints -- transforming every future conversation from generic advice to strategic counsel. Agenda templates give sessions structure. Territory phases make the map reflect how much the builder has invested in each area of life.

### Success Criteria

- [ ] Builder selects a sprite for each project from a curated gallery
- [ ] Gallery contains at least 20-30 sprites across life categories
- [ ] Territory phases (Frontier/Outpost/Settlement) are visually distinct based on hex count per category
- [ ] Sanctuary structure sprite evolves at threshold (e.g., 5 projects → visual upgrade)
- [ ] Jarvis proposes a Charter after sufficient interaction (~3-5 sessions)
- [ ] Builder can edit Charter content (values, themes, priorities, constraints)
- [ ] Jarvis references Charter in all subsequent conversations
- [ ] Agenda templates available for weekly check-in, quarterly review, and ad-hoc strategic sessions

---

## LADDER POSITIONS

| Bet                | Before                            | After                                     | Key Advancement                                                                              |
| ------------------ | --------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| Spatial Visibility | L2.3 (hex map, illustrated tiles) | L2.5 (expanded gallery, territory phases) | Full sprite gallery across all categories, sanctuary evolution, territory visual progression |
| Superior Process   | L3 (Table, G/S/B, Pipeline)       | L3 (holds)                                | No new process features — existing frameworks carry over                                     |
| AI as Teammates    | L1.5 (Jarvis + Marvin active)     | L2 (strategic depth)                      | Charter gives Jarvis strategic context; Agenda structures sessions                           |

---

## FEATURES (Minimum Viable)

### Spatial Visibility

| Feature             | Minimum Viable Implementation                                                                                     | Full Vision (deferred)                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Tile illustrations  | Builder picks from an expanded gallery of sprites organized by life category; 30+ sprites across all 8 categories | AI-generated sprites from project content                        |
| Territory phases    | Border/background treatment changes at hex-count thresholds per category                                          | Full Frontier -> Flourishing progression with rich visual detail |
| Sanctuary evolution | Sanctuary visual upgrades at project-count thresholds (Humble Studio -> Growing Workshop)                         | Continuous evolution tied to 7 maturity dimensions               |

### AI as Teammates

| Feature                     | Minimum Viable Implementation                                                                                     | Full Vision (deferred)                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| The Charter                 | Text document: values, themes, priorities, constraints. Jarvis proposes, builder edits. Persists across sessions. | Versioned, with historical diffing; feeds capacity modeling            |
| Agenda templates            | 3 session types (weekly, quarterly, ad-hoc) with default question sequences in Jarvis's prompt                    | Builder-customizable templates; Jarvis adapts to preferences over time |
| Charter-aware conversations | Jarvis system prompt includes Charter content; references it naturally                                            | Deep Charter reasoning across all agents                               |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- Browse an expanded gallery of sprites organized by life category and pick visuals for each project
- See territory phases that reflect how much they have built in each category
- Watch their sanctuary structure evolve as they build
- Have Jarvis reference their stated values and priorities in every conversation
- Run structured weekly check-ins and strategic sessions with Agenda templates

**After this release, the builder CANNOT:**

- Plant systems (Silver projects just complete, nothing takes root)
- See health signals on the map (no smoke signals)
- Delegate any work to AI attendants
- Run structured expedition cycles (work is still ad-hoc)
- Have the AI reason about their capacity
- Access historical patterns or archives

**Bottleneck:** Everything is still projects. Nothing runs on its own. No recurring infrastructure, no rhythm. The map is beautiful and the AI is strategic, but the product is still a project management tool.

**Who falls in love here:** Visual thinkers who want to SEE their life. Builders who value the AI partnership — "Jarvis gets me."

**Viable scale:** ~5-10 projects

---

## AFFECTED LIBRARY CARDS

| Card                                | How It's Affected                                       |
| ----------------------------------- | ------------------------------------------------------- |
| [[Artifact - The Charter]]          | Core feature — fully activated                          |
| [[Artifact - The Agenda]]           | Core feature — basic activation                         |
| [[Agent - Jarvis]]                  | Prompt updated to reference Charter; Agenda integration |
| [[Standard - Visual Language]]      | Reality note: pre-made sprites, not generated           |
| [[Standard - Image Evolution]]      | Reality note: static sprites, no evolution yet          |
| [[Component - Hex Tile]]            | Sprite rendering instead of colored borders             |
| [[Journey - Sanctuary Progression]] | Territory phases partially implemented                  |

---

## WHAT'S EXPLICITLY DEFERRED

| Feature                  | Deferred To | Why                                                               |
| ------------------------ | ----------- | ----------------------------------------------------------------- |
| Image generation         | Release 8   | Requires art direction, API pipeline, prompt engineering          |
| Art evolution (5 stages) | Release 8   | Needs generation pipeline first                                   |
| Zoom tiers               | Release 7   | Map isn't large enough to need them yet                           |
| Drag-to-rearrange        | Release 7   | Algorithmic placement fine at this scale                          |
| System primitive         | Release 3   | Next release — this one establishes visual + strategic foundation |
| Smoke signals            | Release 3   | Need systems before health signals matter                         |

---

## WHEN: Timeline

- Status: planned
- **2026-02-24:** Sprite gallery work is a curation and selection task, not a rendering challenge. The focus is building the gallery browsing experience and expanding the sprite set across all life categories.
