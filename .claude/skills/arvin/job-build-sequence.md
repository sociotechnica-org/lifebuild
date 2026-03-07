# Build Sequence

The ordered process for constructing the communications division from scratch. Each phase produces source documents. At defined checkpoints, Sam converts accumulated sources into library cards.

This is Arvin's equivalent of Conan's inventory → grade → recommend cycle. Arvin builds the source material; Sam builds the cards; Conan grades them.

## Prerequisites

Before starting:

- The acquihire brief must exist (`sources/acquihire-brief-2026-03.md`) ✓
- The socialization vision must exist (`sources/socialization-factory-vision-2026-03-07.md`) ✓
- The operations research must exist (`sources/communications-operations-research-2026-03.md`) ✓
- The inventory must exist (`communications/INVENTORY.md`) ✓
- New types (Division, Playbook) must be added to `reference.md`

---

## Phase 1: Strategy Foundation

**Goal:** Establish the strategic frame everything else hangs on.

| Step | Job                          | Output                                             | Depends On                        |
| ---- | ---------------------------- | -------------------------------------------------- | --------------------------------- |
| 1.1  | Job 1: Master Strategy       | `sources/master-communications-strategy-[date].md` | Acquihire brief, vision, research |
| 1.2  | Job 3: Content Pillar Design | `sources/content-pillars-[date].md`                | Master strategy                   |
| 1.3  | Job 7: The Right 50          | `.context/arvin-sessions/right-50.md`              | Master strategy, acquihire brief  |

**Checkpoint A — Sam builds:**

- Strategy - Socialization as Infrastructure
- Strategy - Content Factory Model
- Principle - Division Separation
- Principle - Inbound Priority
- Principle - Human Approval Gate
- Principle - Strategy Before Factory

**Source material available:** Master strategy + content pillars + acquihire brief + vision

---

## Phase 2: Standards & Systems

**Goal:** Define the testable specs and invisible mechanisms.

| Step | Job                        | Output                       | Depends On                        |
| ---- | -------------------------- | ---------------------------- | --------------------------------- |
| 2.1  | Human + Arvin consultation | Privacy rules decisions      | Master strategy                   |
| 2.2  | Human + Arvin consultation | Relationship health criteria | Division vision                   |
| 2.3  | Human + Arvin consultation | Content type definitions     | Content pillars                   |
| 2.4  | Human + Arvin consultation | Editorial cadence decisions  | Content pillars, channel strategy |

**Note:** Standards require human judgment — they're testable specs, not research outputs. Arvin facilitates the conversation (Job 11: Strategic Consultation) but the human defines the rules.

**Checkpoint B — Sam builds:**

- Standard - Communications Privacy Rules
- Standard - Relationship Health Criteria
- Standard - Content Type Definitions
- Standard - Editorial Cadence Rules
- System - Editorial Calendar
- System - Relationship Health Tracking
- System - Content Production Pipeline
- System - Contact Classification

**Source material available:** Master strategy + consultation session notes

---

## Phase 3: Division Operating Models

**Goal:** Document how each division actually operates.

| Step | Job                               | Output                                       | Depends On                 |
| ---- | --------------------------------- | -------------------------------------------- | -------------------------- |
| 3.1  | Job 2: Division Research (1:1)    | `sources/division-research-1to1-[date].md`   | Standards, master strategy |
| 3.2  | Job 2: Division Research (Groups) | `sources/division-research-groups-[date].md` | Standards, master strategy |
| 3.3  | Job 2: Division Research (1:Many) | `sources/division-research-1many-[date].md`  | Standards, content pillars |

**Checkpoint C — Sam builds:**

- Division - 1:1 Relationship Management
- Division - Groups
- Division - 1:Many

---

## Phase 4: Channel & Production

**Goal:** Stand up the first channel and the production system.

| Step | Job                                                       | Output                                        | Depends On                        |
| ---- | --------------------------------------------------------- | --------------------------------------------- | --------------------------------- |
| 4.1  | Job 4: Channel Strategy (first channel — likely LinkedIn) | `sources/channel-strategy-linkedin-[date].md` | Content pillars, master strategy  |
| 4.2  | Job 5: Editorial Calendar & Backlog                       | `sources/editorial-calendar-design-[date].md` | Channel strategy, content pillars |

**Checkpoint D — Sam builds Channel cards (if type approved) and updates agent cards:**

- Agent - Jarvis (no — these are different agents: Arvin, Gretta, Kelvin)
- Note: Agent cards for Arvin, Gretta, Kelvin in the context library (not the Claude Code agent definitions, which already exist)

---

## Phase 5: Playbooks

**Goal:** Document repeatable patterns for common scenarios.

| Step | Job                                      | Output                                             | Depends On        |
| ---- | ---------------------------------------- | -------------------------------------------------- | ----------------- |
| 5.1  | Job 6: Playbook (Inbound Triage)         | `sources/playbook-inbound-triage-[date].md`        | Division - 1:1    |
| 5.2  | Job 6: Playbook (Content Briefing)       | `sources/playbook-content-briefing-[date].md`      | Division - 1:Many |
| 5.3  | Job 6: Playbook (Group Event)            | `sources/playbook-group-event-[date].md`           | Division - Groups |
| 5.4  | Job 6: Playbook (Relationship Follow-Up) | `sources/playbook-relationship-followup-[date].md` | Division - 1:1    |

**Checkpoint E — Sam builds:**

- Playbook - Inbound Triage
- Playbook - Content Briefing
- Playbook - Group Event
- Playbook - Relationship Follow-Up

---

## Phase 6: Go Live

**Goal:** Switch from Build mode to Operate mode.

| Step | Action                         | Output                       |
| ---- | ------------------------------ | ---------------------------- |
| 6.1  | Arvin switches to Operate mode | First Weekly Review (Job 8)  |
| 6.2  | Content backlog seeded         | First Betting Table (Job 9)  |
| 6.3  | First content produced         | Through the factory pipeline |

---

## The Full Pipeline

```
Arvin (Build)                Sam (Cards)              Conan (Quality)
─────────────                ───────────              ───────────────
Source documents ──────────> Library cards ──────────> Grade + Audit
                Checkpoint                  Review
```

Each checkpoint is a handoff. Arvin produces source material with enough depth for Sam to build cards. Sam builds cards following the templates in reference.md. Conan grades the cards after Sam builds them.

---

## Tracking Progress

After each phase, update `communications/INVENTORY.md` with:

- Which cards were built
- Which source documents fed them
- What's next in the sequence
