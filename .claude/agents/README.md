# Agent Overview

## Software Factory

Four agents operate across the software factory. Each owns a domain. None overlaps.

| Agent           | Role              | Station                 | Model   | Invocation               |
| --------------- | ----------------- | ----------------------- | ------- | ------------------------ |
| **George**      | Factory Foreman   | All (reads instruments) | sonnet  | `/george` or Task agent  |
| **Conan**       | Context Librarian | PATCH (quality side)    | sonnet  | `/conan` or Task agent   |
| **Sam**         | Scribe            | PATCH                   | opus    | `/sam` or Task agent     |
| **PR Reviewer** | Code Reviewer     | MAKE (QC gate)          | inherit | Task agent (pr-reviewer) |

## Communications Division

Three agents operate the communications division. Separate from product agents.

| Agent      | Role                    | Domain                                | Model | Invocation           |
| ---------- | ----------------------- | ------------------------------------- | ----- | -------------------- |
| **Arvin**  | Strategic Advisor / COO | Strategy, weekly review, consultation | opus  | Agent tool (`arvin`) |
| **Gretta** | PM / Whip               | Production management, deadlines      | —     | Not yet built        |
| **Kelvin** | Analyst                 | Performance analytics, insights       | —     | Not yet built        |

### Arvin Gildencranst — Strategic Advisor & COO

Three modes: Build, Operate, Consult. 11 jobs total.

**Build Mode** — Construct the communications operation from scratch:

| #   | Job                   | Skill File                                  | When                                              |
| --- | --------------------- | ------------------------------------------- | ------------------------------------------------- |
| 1   | Master Strategy       | `skills/arvin/job-master-strategy.md`       | First job. Define the overarching comms strategy. |
| 2   | Division Research     | `skills/arvin/job-division-research.md`     | Deep dive into a specific division.               |
| 3   | Content Pillar Design | `skills/arvin/job-content-pillar-design.md` | Define 3-5 opinionated content themes.            |
| 4   | Channel Strategy      | `skills/arvin/job-channel-strategy.md`      | Research channel-specific strategy.               |
| 5   | Editorial Calendar    | `skills/arvin/job-editorial-calendar.md`    | Design calendar + content backlog.                |
| 6   | Playbook Drafting     | `skills/arvin/job-playbook-drafting.md`     | Draft repeatable procedures.                      |
| 7   | The Right 50          | `skills/arvin/job-right-50.md`              | Build and maintain the acquihire target list.     |

**Operate Mode** — Weekly rhythm and production decisions:

| #   | Job           | Skill File                          | When                                       |
| --- | ------------- | ----------------------------------- | ------------------------------------------ |
| 8   | Weekly Review | `skills/arvin/job-weekly-review.md` | Start of each week. 15 min max.            |
| 9   | Betting Table | `skills/arvin/job-betting-table.md` | Review backlog, decide what gets appetite. |
| 10  | Retrospective | `skills/arvin/job-retrospective.md` | End of cycle. What worked, what didn't.    |

**Consult Mode** — Ad-hoc strategic consultation:

| #   | Job                    | Skill File                                   | When                                     |
| --- | ---------------------- | -------------------------------------------- | ---------------------------------------- |
| 11  | Strategic Consultation | `skills/arvin/job-strategic-consultation.md` | Tricky situation needs thinking through. |

**Supporting skill:** `skills/arvin/job-build-sequence.md` — The full build pipeline with Sam checkpoints (meta-procedure, not a numbered job).

Arvin does NOT: implement code, build library cards (Sam does that), make final decisions (defers to human), draft communications for dispatch without human approval.

### Gretta Von Trapp — PM / Whip (Not Yet Built)

Production management for content pipeline. Enforces deadlines, tracks WIP, reminds the team. Build after the communications operation has enough to manage.

### Kelvin Kiperbelt — Analyst (Not Yet Built)

Performance analytics and insights. Mines content performance, relationship health trends, group dynamics signals. Build after enough data exists to analyze.

## Software Factory Agent Jobs

### George — Factory Floor Manager

Reads the instruments, spots problems, tells people where to go.

| #   | Job                 | Skill File                                 | Trigger                                     |
| --- | ------------------- | ------------------------------------------ | ------------------------------------------- |
| 1   | Status Report       | `skills/george/job-status-report.md`       | "How's the floor?", start of session        |
| 2   | Triage              | `skills/george/job-triage.md`              | "Everything's stuck", high blocked count    |
| 3   | Shift Plan          | `skills/george/job-shift-plan.md`          | "What should I work on?", "Plan my session" |
| 4   | Decision Resolution | `skills/george/job-decision-resolution.md` | `/george propagate` comment, manual request |

Supporting: `skills/george/metrics-reference.md`

George does NOT: build code, write library cards, make product decisions, move cards between stations (exception: during Decision Resolution, George updates issue descriptions, comments on cascading decisions, and moves board statuses as factory floor bookkeeping).

### Conan — Context Assembler & Quality Guardian

Assembles context briefings for builders. Grades, audits, and plans library improvements.

**Mode 1: Context Assembly** — Prepares implementation context so builders make aligned decisions.

**Mode 2: Library Maintenance** — 11 jobs for library quality:

| #   | Job               | Skill File                              | When                                    |
| --- | ----------------- | --------------------------------------- | --------------------------------------- |
| 0   | Source Assessment | `skills/conan/job-source-assessment.md` | Audit source material quality           |
| 1   | Inventory         | `skills/conan/job-inventory.md`         | Manifest expected cards                 |
| 2   | Grade             | `skills/conan/job-grade.md`             | Score cards after Sam builds them       |
| 2.5 | Spot-Check        | `skills/conan/job-spot-check.md`        | Verify upstream before dependent cards  |
| 3   | Diagnose          | `skills/conan/job-diagnose.md`          | Trace root causes, blast radius         |
| 4   | Recommend         | `skills/conan/job-recommend.md`         | Prioritize fixes by cascade potential   |
| 5   | Review            | `skills/conan/job-review.md`            | Re-grade after fixes                    |
| 6   | Audit             | `skills/conan/job-audit.md`             | Verify typing, atomicity, conformance   |
| 7   | Surgery           | `skills/conan/job-surgery.md`           | Produce fix plans for Sam               |
| 8   | Health Check      | `skills/conan/job-health-check.md`      | Assess library quality                  |
| 9   | Downstream Sync   | `skills/conan/job-downstream-sync.md`   | Fix meta-files after structural changes |
| 10  | Release Planning  | `skills/conan/job-release-planning.md`  | Write/edit release cards                |

Supporting: `skills/conan/rubrics.md`, `skills/conan/grade-computation.md`

Context assembly skills: `skills/context-briefing/` (retrieval profiles, traversal, protocol, provenance schema)

Conan does NOT: implement code, create or edit library cards (exception: Downstream Sync edits meta-files — agent definitions, skill procedures, retrieval profiles).

### Sam — Scribe

Creates and maintains Context Library cards per Conan's instructions.

| #   | Job          | Skill File                    | When                            |
| --- | ------------ | ----------------------------- | ------------------------------- |
| 1   | Create Cards | `skills/sam/card-creation.md` | Build cards from inventory      |
| 2   | Fix Cards    | (inline in agent)             | Address Conan's recommendations |
| 3   | Self-Check   | `skills/sam/self-check.md`    | Validate before handoff         |

Supporting: `skills/sam/decomposition.md`, `skills/sam/link-patterns.md`

Sam also uses the shared context briefing skills (see below) for navigating the library when building cards or self-assembling context without a Conan briefing.

Sam does NOT: grade cards, write product code, skip self-check before handoff.

### PR Reviewer — Code Quality Gate

Reviews pull requests for correctness, maintainability, and project standards.

No skill files. Procedures are self-contained in the agent definition. Checks LiveStore patterns, component architecture, test coverage, and monorepo structure.

## How They Work Together

### The Factory Flow

```
DECIDE ──> PATCH ──> MAKE ──> (shipped)
(human)    (AI)      (AI)
               │
             SHAPE (iterative, feeds back to DECIDE or MAKE)
             (human + AI)
```

### Handoff Patterns

```
Human resolves decision
    │
    ├──> George (Job 4: Decision Resolution)
    │       ├── Updates GitHub issues (direct)
    │       ├── Produces library checklist ──> Conan + Sam
    │       └── Produces release card checklist ──> Conan + Sam
    │
    ▼
Conan assembles context briefing
    │
    ▼
Sam builds library cards
    │
    ▼
PR Reviewer reviews code changes
    │
    ▼
Human reviews and ships
```

### Key Interactions

| From   | To          | What Passes                                                    | When                              |
| ------ | ----------- | -------------------------------------------------------------- | --------------------------------- |
| George | Human       | Status reports, shift plans, triage findings                   | Start/end of sessions, when stuck |
| George | Conan + Sam | Library update checklists (exact text)                         | After decision resolution         |
| Conan  | Sam         | Context briefings, inventories, recommendations, surgery plans | Before card building              |
| Sam    | Conan       | Completed cards for grading                                    | After building                    |
| Human  | George      | `/george propagate` on closed D-issues                         | After making a decision           |
| Human  | Conan       | "Audit the library", "Assemble context for X"                  | When library work needed          |
| Human  | Sam         | "Build these cards", "Fix these cards"                         | When card building needed         |

### The Conan-Sam Cycle

Library card building follows a tight loop:

```
Conan: Inventory ──> Sam: Create Cards ──> Sam: Self-Check
                                                   │
                                           (passes)│(issues)
                                                   │
Conan: Grade <──────────── Sam: Fix ◄──────────────┘
    │
    ├── (passes) ──> Done
    │
    └── (issues) ──> Conan: Recommend ──> Sam: Fix ──> Conan: Review
```

### George's Safety Nets

George's Jobs 1 and 3 both include a Step 0 that scans for unprocessed decision resolutions. This catches decisions that were closed but never explicitly propagated via `/george propagate`.

### Shared Infrastructure: Context Briefing Skills

The skills at `skills/context-briefing/` are shared infrastructure used by multiple agents:

| File                    | What It Does                                     | Used By                                            |
| ----------------------- | ------------------------------------------------ | -------------------------------------------------- |
| `retrieval-profiles.md` | Per-type rules for what cards to pull            | Conan (assembly), Sam (navigation + self-assembly) |
| `traversal.md`          | Graph navigation patterns (find, follow, search) | Conan (assembly), Sam (navigation)                 |
| `protocol.md`           | CONTEXT_BRIEFING.md format (Conan→Sam contract)  | Conan (writes), Sam (reads)                        |
| `provenance-schema.md`  | provenance-log.jsonl schema                      | Conan, Sam, George (all log)                       |

Conan does the heavy-lift briefing assembly for complex features. Sam uses retrieval profiles and traversal rules directly when self-assembling context or navigating during card building.

### Provenance

All agents log to `docs/context-library/provenance-log.jsonl`:

- Conan logs context assembly sessions
- Sam logs card-building decisions
- George logs decision resolutions

## Quick Reference

**"How's the factory?"** → George (Job 1: Status Report)
**"What should I work on?"** → George (Job 3: Shift Plan)
**"Everything's stuck"** → George (Job 2: Triage)
**"I decided on X" + `/george propagate`** → George (Job 4: Decision Resolution)
**"Assemble context for this feature"** → Conan (Mode 1: Context Assembly)
**"Audit the library"** → Conan (Job 6 or 8)
**"Plan release X"** → Conan (Job 10: Release Planning)
**"Build these cards"** → Sam
**"Review this PR"** → PR Reviewer
