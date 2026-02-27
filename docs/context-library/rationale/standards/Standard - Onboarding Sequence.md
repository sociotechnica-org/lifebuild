# Standard - Onboarding Sequence

## WHAT: Definition

The specification for the onboarding experience: what happens in the first five minutes (the portal and wow chain), and how the following days deepen the builder's relationship with the sanctuary, the team, and the map.

## WHERE: Ecosystem

- Conforming: [[Component - Campfire]] -- compression phase
- Conforming: [[Journey - Builder Onboarding]] -- implements this sequence as a wow chain
- Implemented by: [[System - Onboarding]] -- executes the sequence
- Implements: [[Principle - First 72 Hours]] -- makes onboarding sequence testable
- Implements: [[Principle - Action Before Explanation]] -- action precedes explanation at every step
- Implements: [[Principle - Compression and Release]] -- the portal is the first 60 seconds
- Implements: [[Principle - The WOW Chain]] -- surprise beats are sequenced and varied

## WHY: Rationale

- Principle: [[Principle - First 72 Hours]] -- the first 72 hours define the relationship; the first 5 minutes are the critical path
- Principle: [[Principle - Action Before Explanation]] -- without a sequenced spec, the onboarding degenerates into a tutorial
- Principle: [[Principle - The WOW Chain]] -- without a sequenced spec, surprise beats are uncoordinated and deflation follows
- Driver: Without a sequenced spec, the onboarding degenerates into either a tutorial (violating Action Before Explanation) or a blank canvas (violating the WOW Chain).

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-10):** No onboarding sequence exists. No Day 1/2/3 structure, no progressive feature introduction, no Campfire first-contact. New users see the full UI immediately with no guided path.

**Design refinement (2026-02-26):** Rewritten from 3-day progressive disclosure model to "First 5 Minutes + 3-Day Deepening" model. Progressive disclosure applies to DEPTH, not EXISTENCE -- the builder sees the map, team, and hex on day 1. Source: Power of the Portal.

## HOW: Specification

### First 5 Minutes: The Portal

| Step                         | What Happens                                                                                                | Wow Type                | What Builder Learns                          | Emotional Target               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------- | ------------------------------ |
| 1. Compression               | Builder sees intimate space with Jarvis. One question: "What's something you've been meaning to deal with?" | -- (loading the spring) | --                                           | "I'm intrigued."               |
| 2. Action                    | Builder types an answer. ~15 seconds.                                                                       | -- (first action)       | "I can interact with this."                  | "That was easy."               |
| 3. Portal opens              | View expands. Map reveals -- open sky, terrain, sanctuary at center.                                        | Spatial                 | "This is a world. It's spatial."             | "Oh -- there's a world here."  |
| 4. Words become hex          | Builder's input materializes as a hex on the map.                                                           | Personal                | "My words become real here."                 | "That's mine."                 |
| 5. Marvin appears            | Marvin breaks the problem into steps. "Here are three things you could do -- which feels right?"            | Relational              | "I have a team."                             | "Someone is already helping."  |
| 6. Builder places hex        | Builder chooses where the hex goes on the map.                                                              | Agency                  | "I control the space."                       | "I chose where this lives."    |
| 7. Attendant acts (optional) | An attendant picks up a task. "I'll look into that."                                                        | Scalar                  | "Things happen without me doing everything." | "Something is already moving." |

**Constraint:** Steps 1-6 must complete within 5 minutes. The builder must have ACTED (typed, placed, chosen) before any explanation.

### Day 1-3: Deepening

| Day                  | Focus                 | Activities                                                                                                               | Emotional Target               |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Day 1 (after portal) | First project is real | Complete first task. Explore the map. See the hex. Come back and it's still there.                                       | "I did something real."        |
| Day 2                | The team deepens      | Second conversation with Jarvis (now Me/You/Us applies -- they have shared context). Shape a second project with Marvin. | "I have help. They know me."   |
| Day 3                | Rhythm emerges        | First sorting session. Work at Hand selected. The Table shows what's active.                                             | "I know what to do each week." |

### Progressive Disclosure Rules (updated)

| Rule                         | Requirement                                                                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Action before explanation    | Builder acts first. Understanding follows. Never explain a feature before the builder has used it.                                            |
| Wow chain in first 5 minutes | 4-6 varied surprise beats before the builder leaves the first session.                                                                        |
| Depth over existence         | Show the map, team, and hex from minute 1. Deeper features (Sorting Room, Charter, strategic conversations) unlock as the builder needs them. |
| Never on Day 1               | Full priority scoring, system creation, delegation, capacity planning. These require context the builder doesn't have yet.                    |

## Anti-Examples

- **Full feature tour on Day 1** -- Day 1 has one job: portal crossing, wow chain, first hex placed. Showing The Table, Sorting Room, and agent capabilities creates cognitive overload and abandonment.
- **Explaining features before showing them** -- every explanation before an action is friction. The wow chain IS the tutorial.
- **Treating Day 1 as orientation rather than action** -- if the builder leaves the first 5 minutes without having acted on the map, the sequence has failed.
- **Day 1 ending without builder having created something tangible** -- if the first session ends without a visible hex on the map, the tool feels hollow.

### Conformance Test

1. Walk through the first 5 minutes as a new builder. Verify the portal lands (compression -> crossing -> release). Verify the wow chain fires (4+ beats of varied surprise).
2. Verify the builder has ACTED (typed an answer, placed a hex) before any feature is explained.
3. Verify each day has exactly one deepening focus and emotional target.
