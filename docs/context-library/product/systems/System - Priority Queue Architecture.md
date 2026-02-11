# System - Priority Queue Architecture

## WHAT: Definition

The ordered repository of all fully-planned work ready for activation, organized by purpose-based streams with stream-specific priority scoring. The Priority Queue is what directors draw from when selecting Work at Hand.

## WHERE: Scope

- Zone: [[Room - Drafting Room]] — visible in Strategy Studio
- Implements: [[Standard - Three-Stream Portfolio]] — organized by Gold/Silver/Bronze
- Implements: [[Standard - Priority Score]] — items ordered by score within streams
- Depends on: [[System - Pipeline Architecture]] — receives projects completing Stage 4
- Governs: [[Capability - Three-Stream Filtering]] — how directors view the queue
- Governs: [[Room - Sorting Room]] — where selection from queue happens
- Related: [[System - Planning Queue]] — upstream source of projects

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — structured prioritization replaces reactive decision-making
- Principle: [[Principle - Protect Transformation]] — stream organization prevents Bronze from crowding Gold/Silver
- Decision: Separating Planning Queue from Priority Queue creates psychological safety — capture ideas quickly without immediately prioritizing.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Priority Queue exists as backlog projects (`status: 'backlog'`, `stage: 4`) in Sorting Room. Organized by stream via `GoldSilverPanel.tsx` and `BronzePanel.tsx`. Drag-to-table selection. Cameron assists with prioritization.

## HOW: Mechanics

### State

- **Gold candidates**: Ordered list of projects with Purpose = "Moving forward," ranked by importance-weighted priority score
- **Silver candidates**: Ordered list of projects with Purpose = "Building leverage," ranked by leverage-weighted priority score
- **Bronze candidates**: Ordered list of tasks with Purpose = "Maintenance," ranked by urgency-weighted priority score
- **Paused projects**: Projects previously Live that were paused mid-week, pinned to top of their stream

### Transitions

| From                     | Trigger                                   | To                              | Side Effects                                                            |
| ------------------------ | ----------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Planning Queue (Stage 3) | Director completes Stage 4 prioritization | Enters Priority Queue           | Project receives stream-specific priority score; placed in stream order |
| In Priority Queue        | Director selects during Weekly Planning   | Work at Hand (on The Table)     | Project exits queue; fills weekly position                              |
| Active on The Table      | Director pauses project mid-week          | Returns to Priority Queue (top) | Appears at top of its stream as paused                                  |
| In Priority Queue        | Director abandons                         | Archived                        | Removed from queue                                                      |
| In Priority Queue        | Priority attributes change                | Re-scored in queue              | Position may shift based on new score                                   |

### Processing Logic

**Queue contents:**

- Planned projects (Stage 4 complete, never activated)
- Paused projects (were Live, temporarily stopped — appear at top)
- Bronze candidates (ready tasks from various sources)

**Three-stream filters:**

- Gold Candidates: Purpose = "Moving forward" — typically 2-8 projects
- Silver Candidates: Purpose = "Building leverage" — typically 5-15 projects
- Bronze Candidates: Purpose = "Maintenance" — typically 20-100+ items

**Ordering within streams:**

- Gold: Importance-weighted priority score
- Silver: Leverage-weighted priority score
- Bronze: Urgency-weighted priority score

### Examples

- During Weekly Planning, Cameron shows the director the Priority Queue filtered to Gold. Three projects are listed: "Career transition plan" (score 87), "Family vacation planning" (score 72), and "Side business launch" (score 65). A paused project "Write novel chapter" appears pinned at the top from last week's mid-week pause. The director sees their options clearly ranked and selects "Career transition plan" as this week's Gold. It moves from the queue to The Table.
- A director has been adding Silver projects steadily. The Silver stream now shows 12 candidates. During planning, Cameron notes: "Your top Silver candidate is 'Automate bill payments' with a leverage score of 91 — that's significantly higher than the rest." The director selects it. The remaining 11 stay in the queue, maintaining their relative order, ready for future weeks.

### Anti-Examples

- **Mixing streams in a single ranked list** — showing Gold, Silver, and Bronze projects in one combined priority list defeats the purpose of stream separation. A high-urgency Bronze task (score 95) should never visually compete with a Gold project (score 72) because they serve fundamentally different purposes. Streams stay separate.
- **Allowing a project to enter the Priority Queue without completing Stage 4** — the queue contains only fully-planned work. A Stage 2 project with no task list cannot be executed even if selected. The pipeline ensures readiness before queue entry.
