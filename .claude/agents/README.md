# Agent Overview

Four agents operate across the software factory. Each owns a domain. None overlaps.

## The Team

| Agent           | Role              | Station                 | Model   | Invocation               |
| --------------- | ----------------- | ----------------------- | ------- | ------------------------ |
| **George**      | Factory Foreman   | All (reads instruments) | sonnet  | `/george` or Task agent  |
| **Conan**       | Context Librarian | PATCH (quality side)    | sonnet  | `/conan` or Task agent   |
| **Bob**         | Builder           | PATCH + MAKE            | opus    | `/bob` or Task agent     |
| **PR Reviewer** | Code Reviewer     | MAKE (QC gate)          | inherit | Task agent (pr-reviewer) |

## Agent Jobs

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

Assembles context constellations for builders. Grades, audits, and plans library improvements.

**Mode 1: Context Assembly** — Prepares implementation context so builders make aligned decisions.

**Mode 2: Library Maintenance** — 11 jobs for library quality:

| #   | Job               | Skill File                              | When                                    |
| --- | ----------------- | --------------------------------------- | --------------------------------------- |
| 0   | Source Assessment | `skills/conan/job-source-assessment.md` | Audit source material quality           |
| 1   | Inventory         | `skills/conan/job-inventory.md`         | Manifest expected cards                 |
| 2   | Grade             | `skills/conan/job-grade.md`             | Score cards after Bob builds them       |
| 2.5 | Spot-Check        | `skills/conan/job-spot-check.md`        | Verify upstream before dependent cards  |
| 3   | Diagnose          | `skills/conan/job-diagnose.md`          | Trace root causes, blast radius         |
| 4   | Recommend         | `skills/conan/job-recommend.md`         | Prioritize fixes by cascade potential   |
| 5   | Review            | `skills/conan/job-review.md`            | Re-grade after fixes                    |
| 6   | Audit             | `skills/conan/job-audit.md`             | Verify typing, atomicity, conformance   |
| 7   | Surgery           | `skills/conan/job-surgery.md`           | Produce fix plans for Bob               |
| 8   | Health Check      | `skills/conan/job-health-check.md`      | Assess library quality                  |
| 9   | Downstream Sync   | `skills/conan/job-downstream-sync.md`   | Fix meta-files after structural changes |
| 10  | Release Planning  | `skills/conan/job-release-planning.md`  | Write/edit release cards                |

Supporting: `skills/conan/rubrics.md`, `skills/conan/grade-computation.md`

Context assembly skills: `skills/context-constellation/` (retrieval profiles, traversal, protocol, provenance schema)

Conan does NOT: implement code, create or edit library cards (exception: Downstream Sync edits meta-files — agent definitions, skill procedures, retrieval profiles).

### Bob — Builder

Implements features and crafts library cards. Two modes.

**Mode 1: Code Implementation** — Builds features using Context Library guidance and Conan's briefings.

**Mode 2: Library Card Building** — Creates and fixes markdown cards per Conan's instructions.

| #   | Job          | Skill File                    | When                            |
| --- | ------------ | ----------------------------- | ------------------------------- |
| 1   | Create Cards | `skills/bob/card-creation.md` | Build cards from inventory      |
| 2   | Fix Cards    | (inline in agent)             | Address Conan's recommendations |
| 3   | Self-Check   | `skills/bob/self-check.md`    | Validate before handoff         |

Supporting: `skills/bob/decomposition.md`, `skills/bob/link-patterns.md`

Bob also uses the shared context constellation skills (see below) for navigating the library when building cards or self-assembling context without a Conan briefing.

Bob does NOT: grade cards, make architectural decisions without checking the library, skip self-check before handoff.

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
    │       ├── Produces library checklist ──> Conan + Bob
    │       └── Produces release card checklist ──> Conan + Bob
    │
    ▼
Conan assembles context constellation
    │
    ▼
Bob implements (code or cards)
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
| George | Conan + Bob | Library update checklists (exact text)                         | After decision resolution         |
| Conan  | Bob         | Context briefings, inventories, recommendations, surgery plans | Before implementation             |
| Bob    | Conan       | Completed cards for grading                                    | After building                    |
| Human  | George      | `/george propagate` on closed D-issues                         | After making a decision           |
| Human  | Conan       | "Audit the library", "Assemble context for X"                  | When library work needed          |
| Human  | Bob         | "Build this feature", "Fix these cards"                        | When implementation needed        |

### The Conan-Bob Cycle

Library card building follows a tight loop:

```
Conan: Inventory ──> Bob: Create Cards ──> Bob: Self-Check
                                                   │
                                           (passes)│(issues)
                                                   │
Conan: Grade <──────────── Bob: Fix ◄──────────────┘
    │
    ├── (passes) ──> Done
    │
    └── (issues) ──> Conan: Recommend ──> Bob: Fix ──> Conan: Review
```

### George's Safety Nets

George's Jobs 1 and 3 both include a Step 0 that scans for unprocessed decision resolutions. This catches decisions that were closed but never explicitly propagated via `/george propagate`.

### Shared Infrastructure: Context Constellation Skills

The skills at `skills/context-constellation/` are shared infrastructure used by multiple agents:

| File                    | What It Does                                     | Used By                                            |
| ----------------------- | ------------------------------------------------ | -------------------------------------------------- |
| `retrieval-profiles.md` | Per-type rules for what cards to pull            | Conan (assembly), Bob (navigation + self-assembly) |
| `traversal.md`          | Graph navigation patterns (find, follow, search) | Conan (assembly), Bob (navigation)                 |
| `protocol.md`           | CONTEXT_BRIEFING.md format (Conan→Bob contract)  | Conan (writes), Bob (reads)                        |
| `provenance-schema.md`  | constellation-log.jsonl schema                   | Conan, Bob, George (all log)                       |

Conan does the heavy-lift constellation assembly for complex features. Bob uses retrieval profiles and traversal rules directly when self-assembling context or navigating during card building.

### Provenance

All agents log to `docs/context-library/constellation-log.jsonl`:

- Conan logs context assembly sessions
- Bob logs implementation decisions
- George logs decision resolutions

## Quick Reference

**"How's the factory?"** → George (Job 1: Status Report)
**"What should I work on?"** → George (Job 3: Shift Plan)
**"Everything's stuck"** → George (Job 2: Triage)
**"I decided on X" + `/george propagate`** → George (Job 4: Decision Resolution)
**"Assemble context for this feature"** → Conan (Mode 1: Context Assembly)
**"Audit the library"** → Conan (Job 6 or 8)
**"Plan release X"** → Conan (Job 10: Release Planning)
**"Build this"** → Bob (Mode 1 or 2, depending on code vs cards)
**"Review this PR"** → PR Reviewer
