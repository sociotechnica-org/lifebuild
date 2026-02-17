# Job 10: Release Planning

**Purpose:** Write or edit release cards that map the product's path from current state to full vision, organized around the three strategic bets and minimum viable implementations.

**Trigger:** New release needed, release sequence review, re-prioritization of upcoming work.

## Core Methodology

### The Three Ladders

Every release advances LifeBuild along three independent strategic bets, each with a maturity ladder:

**Plank 1 — Spatial Visibility** (serves Autonomy)
Source: `docs/context-library/rationale/strategies/Strategy - Spatial Visibility.md`

| Level | Name                    | What It Is                                |
| ----- | ----------------------- | ----------------------------------------- |
| 0     | Status Quo              | Lists, databases, inboxes                 |
| 1     | Minimally Viable        | Kanban board + backlogs                   |
| 2     | Placed & Illustrated    | Hexmap Life Map with visual indicators    |
| 3     | Immersive & Navigable   | Zoom tiers, clustering, rich illustration |
| 4     | Hybrid Physical/Digital | AR integration                            |

**Plank 2 — Superior Process** (serves Competence)
Source: `docs/context-library/rationale/strategies/Strategy - Superior Process.md`

| Level | Name                  | What It Is                                |
| ----- | --------------------- | ----------------------------------------- |
| 0     | Status Quo            | Reactive, no system                       |
| 1     | Basic Capture         | Lists, brain dumps                        |
| 2     | Kanban + WIP          | Visual workflow, limit concurrent work    |
| 3     | Bespoke Frameworks    | Bronze/Silver/Gold, The Table as WIP gate |
| 4     | Enterprise Principles | DRI clarity, OODA loops, retrospectives   |
| 5     | Structured Rhythm     | Expedition cycle, weekly planning phases  |
| 6     | Capacity Tracking     | Builder Attributes measured and managed   |
| 7     | Full Orchestrated     | Defined roles, communication protocols    |

**Plank 3 — AI as Teammates** (serves Relatedness)
Source: `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md`

| Level | Name                   | What It Is                                      |
| ----- | ---------------------- | ----------------------------------------------- |
| 0     | Status Quo             | No AI or generic chat                           |
| 1     | Operational Team       | Consolidated agents with defined roles          |
| 2     | Extended to Real World | Agents handle email, calendar, web research     |
| 3     | Jobs and Permissions   | Agents have standing authority, act proactively |
| 4     | Agent Coordination     | Agents hand off to each other                   |
| 5     | Tiered Authority       | Seniority structure, escalation paths           |
| 6     | Learning and Memory    | Agents remember, learn patterns, improve        |
| 7+    | Autonomous Team        | Agents with genuine judgment, minimal oversight |

### Minimum Viable Per Rung

Each release ships the **cheapest implementation that delivers the experience** for its target scale. Releases do NOT fully realize any single bet — they advance all three ladders one rung simultaneously.

**Decision heuristic:** For each feature in a release, ask:

1. What's the simplest version that changes the builder's experience?
2. Can we use pre-built/static assets instead of generated ones?
3. Can we use conversation (Jarvis/Marvin prompts) instead of new UI?
4. Can we store data now and reason about it later?
5. What can we learn by watching builders use a "dumb" version?

### Builder Experience Checkpoint

Every release must pass the **completeness test**:

1. **CAN DO:** What can the builder do after this release that they couldn't before?
2. **CANNOT DO:** What are they still unable to do? (explicitly deferred)
3. **BOTTLENECK:** What's the single biggest limitation on their experience?
4. **WHO STAYS:** What type of builder falls in love at this stage?
5. **SCALE:** How many projects/systems is this release viable for?

### Arc Structure

Releases are grouped into thematic arcs. Each arc has a narrative theme and a primary (but not exclusive) bet it advances:

| Arc            | Theme             | Primary Bet       | Builder Phase |
| -------------- | ----------------- | ----------------- | ------------- |
| First Light    | The world exists  | Spatial           | Arrival       |
| The Settlement | Tool becomes game | All three equally | Building      |
| The Territory  | Team becomes real | AI + Process      | Operating     |
| The Sanctuary  | Full game         | Process + AI      | Thriving      |

## Procedure

### Writing a New Release

1. **Identify position** — Where does this release sit in the sequence? What arc? What comes before and after?

2. **Read adjacent releases** — Read the release before (what the builder can do) and after (what they need to be able to do). The new release bridges that gap.

3. **Read the three strategy cards** — Always re-read the maturity ladders to anchor ladder positions:
   - `docs/context-library/rationale/strategies/Strategy - Spatial Visibility.md`
   - `docs/context-library/rationale/strategies/Strategy - Superior Process.md`
   - `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md`

4. **Set ladder positions** — Where does each bet stand BEFORE this release? Where should it stand AFTER? Use the maturity ladder levels.

5. **List features** — For each ladder advancement, identify the minimum viable features. Apply the "cheapest implementation" heuristic.

6. **Run the builder experience checkpoint** — Write CAN DO / CANNOT DO / BOTTLENECK / WHO STAYS / SCALE.

7. **Identify affected cards** — Which library cards are primarily touched by this release? Which need reality notes?

8. **Identify decisions** — What human decisions are needed before building? Categorize: Quick Call vs Needs Thought.

9. **Write the narrative sentence** — One sentence that captures the emotional beat. Format: "You [verb]. [Something changes]. [Feeling.]"

10. **Cross-check with deferred list** — Read the previous release's CANNOT DO list. Everything there should either appear in this release's features or in a future release's plan.

### Editing an Existing Release

1. **Read the release** — Understand current scope and ladder positions.
2. **Identify the change** — What's being added, removed, or moved?
3. **Re-run the builder experience checkpoint** — Does the change affect what the builder CAN/CANNOT do?
4. **Check ladder coherence** — Does the change affect ladder positions? If features move between releases, do the ladders still advance monotonically?
5. **Check deferred chain** — If something is removed from this release, does it appear in a later release?
6. **Update narrative sentence if needed** — Does the emotional beat still hold?

### Reviewing the Full Sequence

When reviewing the entire release schedule:

1. **Ladder monotonicity** — Each bet's level must never decrease across releases. Verify all three ladders advance (or hold) from release to release.
2. **No orphaned features** — Everything in the library vision should appear in exactly one release's scope.
3. **Scale progression** — Each release should be viable for a larger scale of builder engagement.
4. **Deferred chain completeness** — Every CANNOT DO item in Release N should appear in some Release N+K's features.
5. **Arc coherence** — Releases within an arc should feel thematically unified.
6. **Cheap-first ordering** — Within each arc, features with lower technical cost and fewer unknowns should come in earlier releases.

## Output Format

### Planning Mode (upcoming releases)

Use this format for releases that are being planned but not yet built:

```markdown
# Release [N]: [Title]

> **Arc:** [Arc Name]
> **Narrative:** "[One sentence — the emotional beat]"

---

## GOAL

[2-3 sentences. What this release enables. What changes for the builder.]

### Success Criteria

- [ ] [Observable outcome]
- [ ] [Observable outcome]

---

## LADDER POSITIONS

| Bet                | Before | After  | Key Advancement |
| ------------------ | ------ | ------ | --------------- |
| Spatial Visibility | L[n]   | L[n+x] | [What changes]  |
| Superior Process   | L[n]   | L[n+x] | [What changes]  |
| AI as Teammates    | L[n]   | L[n+x] | [What changes]  |

---

## FEATURES (Minimum Viable)

### [Bet 1 features]

| Feature | Minimum Viable Implementation | Full Vision (deferred) |
| ------- | ----------------------------- | ---------------------- |

### [Bet 2 features]

| Feature | Minimum Viable Implementation | Full Vision (deferred) |
| ------- | ----------------------------- | ---------------------- |

### [Bet 3 features]

| Feature | Minimum Viable Implementation | Full Vision (deferred) |
| ------- | ----------------------------- | ---------------------- |

---

## BUILDER EXPERIENCE CHECKPOINT

**After this release, the builder can:**

- [Concrete capability]

**After this release, the builder CANNOT:**

- [Explicit limitation — must appear in a future release]

**Bottleneck:** [Single biggest limitation on experience]

**Who falls in love here:** [Builder archetype that stays]

**Viable scale:** [N projects, N systems, etc.]

---

## AFFECTED LIBRARY CARDS

| Card | How It's Affected |
| ---- | ----------------- |

---

## DECISIONS NEEDED

### Quick Calls

- **[D-id]:** [Question] — Recommended: [answer]. Unblocks: [what].

### Needs Thought

- **[D-id]:** [Question] — Options: [list]. Unblocks: [what].

---

## WHAT'S EXPLICITLY DEFERRED

| Feature | Deferred To | Why |
| ------- | ----------- | --- |
```

### Retrospective Mode (shipped releases)

After a release ships, convert the planning card to retrospective format by adding:

- Actual ship date
- Decisions made (with outcomes)
- What changed from the plan (captured in History subsection)

## Cross-References

- Release cards live at: `docs/context-library/releases/`
- Naming: `Release - [Title].md` (e.g., `Release - The Campfire.md`)
- Strategy cards: `docs/context-library/rationale/strategies/Strategy - *.md`
- Existing releases: Read all files in `docs/context-library/releases/` before writing new ones
- Builder journey phases: `docs/context-library/experience/journeys/Journey - Sanctuary Progression.md`
