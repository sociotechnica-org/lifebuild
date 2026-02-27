# 045: Ralph Loop Orchestration for Map-first UI Release

## Overview

Autonomous implementation of the Map-first UI release
using a ralph loop pattern where:

- **Bash loop** keeps the cycle alive
  (restarts Claude on exit/crash)
- **Claude** orchestrates
  (reads GitHub state, decides next action, dispatches work)
- **Codex** implements (writes code, opens PRs)
- **GitHub** is the state store
  (issues, PRs, project board, reviews, checks)

## Architecture

```text
┌──────────────────────────────────────────────┐
│  bash: while :; do claude -p PROMPT.md; done │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Claude (orchestrator)                 │  │
│  │                                        │  │
│  │  1. gh: read project board state       │  │
│  │  2. Pick next story based on state     │  │
│  │  3. Dispatch to appropriate phase:     │  │
│  │     - BRIEF: run Conan, attach         │  │
│  │     - PLAN: run Codex for tech plan    │  │
│  │     - IMPLEMENT: run Codex for PR      │  │
│  │     - REVIEW: check PR, fix issues     │  │
│  │     - MERGE: merge PR, close issue     │  │
│  │  4. Update issue state                 │  │
│  │  5. Exit (loop restarts)               │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Story Lifecycle

Phases tracked via GitHub issue labels.

Each user story issue moves through these phases:

```text
ready → briefed → planned → implementing
                                 ↓
                            in-review → merged
                                 ↑    │
                                 └────┘
                                rework
```

| Phase | What Happens | Who |
| ----- | ------------ | --- |
| `ready` | Story written, AC clear | Chip + Jess |
| `briefed` | Context briefing attached | Claude |
| `planned` | Technical plan attached | Codex |
| `implementing` | Code written, PR opened | Codex |
| `in-review` | Reviews + checks monitored | Claude |
| `merged` | PR merged, issue closed | Claude |

## Pre-loop Setup

Done once, before starting the loop.

### 1. Write all user stories as GitHub issues

Each issue needs:

- Title: user story format (per Chip's skill)
- Body: acceptance criteria, affected files/components,
  prototype dependencies
- Labels: `make`, `map-first-ui`, `phase:ready`
- Project board: Board #4, Station: MAKE,
  Flow State: Queued
- Blocked-by: list of issue numbers this depends on

### 2. Establish dependency ordering

Stories must land in order when they have dependencies.
The orchestrator checks:

- Are all `blocked-by` issues in `merged` state?
- If not, skip to the next unblocked story.

### 3. Create the orchestrator prompt

File: `.ralph/PROMPT.md` — the prompt Claude gets
every loop iteration.

### 4. Create the Codex implementation prompt

File: `.ralph/IMPLEMENT.md` — the prompt template
Codex gets for each story.

### 5. Create the Codex tech plan prompt

File: `.ralph/PLAN.md` — the prompt template Codex
gets to write a technical plan.

## The Orchestrator Prompt (`.ralph/PROMPT.md`)

This is what Claude reads every time the bash loop
restarts it.

```markdown
You are the release orchestrator for the LifeBuild
Map-first UI release.

Your job: check the GitHub project board, find the
next piece of work to do, do it, and exit. The bash
loop will restart you.

## How to find work

1. Query GitHub for open issues labeled
   `map-first-ui` + `make`
2. Sort by dependency order (check blocked-by links)
3. Find the first issue whose dependencies are merged
4. Read its labels to determine current phase

## What to do based on phase

### phase:ready → Generate context briefing

- Run Conan context assembly for this story
- Post the briefing as an issue comment
- Update label to `phase:briefed`

### phase:briefed → Generate technical plan

- Invoke Codex with the PLAN.md template
  + story + briefing
- Post the technical plan as an issue comment
- Update label to `phase:planned`

### phase:planned → Kick off implementation

- Invoke Codex with the IMPLEMENT.md template
  + story + briefing + plan
- Codex will create a branch and open a PR
- Link the PR to the issue
- Update label to `phase:implementing`

### phase:implementing → Monitor PR

- Check if PR exists and has been opened
- If PR is still being worked on, exit and retry
- Once PR is open, update label to `phase:in-review`

### phase:in-review → Monitor reviews and checks

- Run `gh pr checks` and `gh pr reviews` on the PR
- If checks fail: read failure, invoke Codex to fix
- If review has requested changes: read comments,
  invoke Codex to address, push
- If checks pass AND reviews approve: merge
- On merge: update label to `phase:merged`, close

### All stories merged → Exit

- If no open issues remain with `map-first-ui` +
  `make` labels, exit.
- Output: EXIT_SIGNAL: true

## Rules

- Do ONE phase transition per iteration.
  Don't go from ready → merged in one shot.
- Always exit after completing one phase transition.
- If something is stuck (same phase for 3+
  iterations), post a comment on the issue describing
  the blocker and add label `phase:blocked`. Exit.
- Never force-merge a PR with failing checks.
- Never skip code review.
```

## The Codex Plan Prompt (`.ralph/PLAN.md`)

Template that gets filled per-story:

```markdown
You are writing a technical implementation plan for
a LifeBuild user story.

## User Story

{story_title}
{story_body}

## Context Briefing

{context_briefing}

## Instructions

Write a technical plan that covers:

1. **Files to modify** — list every file that needs
   changes, with a brief description of the change
2. **Files to create** — any new files needed
3. **Files to delete** — any files being removed
4. **Data model changes** — event/schema/query changes
5. **Test plan** — what tests to write
   (unit, integration, e2e Playwright)
6. **Risk areas** — anything tricky or likely to break
7. **Order of operations** — what order to make changes

Reference the existing codebase. Read files before
planning changes. Do NOT implement anything.

## Key paths

- Events: packages/shared/src/events.ts
- Schema: packages/shared/src/schema.ts
- Queries: packages/shared/src/queries.ts
- Web components: packages/web/src/components/
- Routes: packages/web/src/routes.tsx
```

## The Codex Implementation Prompt (`.ralph/IMPLEMENT.md`)

Template that gets filled per-story:

```markdown
You are implementing a LifeBuild user story. Create a
feature branch, implement the changes, write tests,
and open a pull request.

## User Story

{story_title}
{story_body}

## Context Briefing

{context_briefing}

## Technical Plan

{technical_plan}

## Instructions

1. Create a branch: `make/{issue_number}-{short-desc}`
2. Implement the changes in the technical plan
3. Write tests:
   - Unit tests for new logic
   - E2E Playwright tests for user-facing changes
4. Run `pnpm lint-all` and fix any issues
5. Run `pnpm test` and ensure all tests pass
6. Run `CI=true pnpm test:e2e` and ensure e2e pass
7. Open a PR with:
   - Title matching the user story title
   - Body containing:
     - ## Summary (what changed)
     - ## Test plan (how to verify)
     - Closes #{issue_number}

## Rules

- Do NOT modify files outside the technical plan scope
- Do NOT add features beyond what the story specifies
- Do NOT skip tests
- If blocked, document it in a PR comment and open
  the PR as draft

## Key paths

- Events: packages/shared/src/events.ts
- Schema: packages/shared/src/schema.ts
- Queries: packages/shared/src/queries.ts
- Web components: packages/web/src/components/
- Routes: packages/web/src/routes.tsx
- E2E tests: packages/web/e2e/
```

## The Bash Loop (`.ralph/loop.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

MAX_ITERATIONS=100
SLEEP_BETWEEN=30
iteration=0

echo "Starting Map-first UI ralph loop"

while [ $iteration -lt $MAX_ITERATIONS ]; do
  iteration=$((iteration + 1))
  echo ""
  echo "======================================="
  echo "  Iteration $iteration / $MAX_ITERATIONS"
  echo "  $(date)"
  echo "======================================="

  # Run Claude with the orchestrator prompt
  output=$(claude -p "$(cat .ralph/PROMPT.md)" \
    --allowedTools \
    "Bash(gh:*),Bash(codex:*),Read,Glob,Grep,Write,Edit" \
    2>&1) || true

  echo "$output"

  # Check for exit signal
  if echo "$output" | grep -q "EXIT_SIGNAL: true"; then
    echo ""
    echo "All stories complete. Exiting loop."
    break
  fi

  # Check for blocked signal
  if echo "$output" | grep -q "BLOCKED:"; then
    echo ""
    echo "Orchestrator hit a blocker."
    echo "$output" | grep "BLOCKED:"
    break
  fi

  echo "Sleeping ${SLEEP_BETWEEN}s..."
  sleep $SLEEP_BETWEEN
done

echo ""
echo "Ralph loop finished after $iteration iterations."
```

## Dependency Graph for User Stories

Stories created in this order with explicit
blocked-by links:

```text
Phase 1: Demolition (no deps, can parallel)
  S1:  Remove the Table
  S2:  Remove the Sorting Room
  S3:  Remove the Drafting Room
  S4:  Remove Mesa references
  S5:  Remove Kanban, replace with task list

Phase 2: Foundation (depends on Phase 1)
  S6:  Map as full-bleed base layer
       [blocked-by: S1, S2, S3]
  S7:  Building overlay pattern + routing
       [blocked-by: S6]
  S8:  Map navigation (zoom/pan)
       [blocked-by: S6]

Phase 3: New UI (depends on Phase 2)
  S9:  Left rail with attendant avatars
       [blocked-by: S7]
  S10: Project interface as building overlay
       [blocked-by: S5, S7]

Phase 4: Prototype-dependent
  S11: Workshop overlay shell
       [blocked-by: S7, P1]
  S12: Sanctuary overlay shell
       [blocked-by: S7]
  S13: Task Queue panel
       [blocked-by: S10, P4]
  S14: Project placement flow
       [blocked-by: S11, P2]
  S15: Onboarding sequence (mechanical)
       [blocked-by: S9, S10, S11, S12]
  S16: Campfire conversation
       [blocked-by: S15, P6]
  S17: Unburdening conversation
       [blocked-by: S11, P7]
  S18: Visioning conversation
       [blocked-by: S12, P8]
  S19: Statue/sketch generation
       [blocked-by: S14, P3]
```

Note: S12 (Sanctuary shell) is NOT blocked on a
prototype — the overlay is just a container for
the charter + Jarvis chat. The conversation content
(S18) is blocked on P8, but the shell can be built
now.

## Temp Decisions

Stories in Phase 4 that are blocked on prototypes
can be unblocked with temp decisions. Each temp
decision is documented in the story with:

> **TEMP DECISION:** This implements a placeholder
> for [X]. When prototype P[N] resolves, a follow-up
> story will replace this with the shaped version.

Examples:

- **Workshop interior (P1):** Shell overlay with
  "drafting coming soon" + Marvin chat. Wired to
  route, left rail auto-selects Marvin. Interior
  filled in after P1.
- **Task Queue interaction (P4):** Flat task list,
  click navigates to project. No fancy filtering
  or direct completion. Refined after P4.
- **Conversations (P6-P8):** Placeholder scripts
  with the right structure (posture sequence,
  handoff triggers) but generic content. Real
  scripts after Danvers finishes prototypes.
- **Project placement (P2):** Simple "click hex
  to place" without flourish. Fanfare after P2.
- **Statues (P3):** Colored placeholder buildings
  (category color). Nano Banana art after P3.

## What Needs to Happen Before Starting the Loop

- [ ] Chip agent created with user story skill
- [ ] User stories written for all ~19 stories
- [ ] Stories created as GitHub issues on Board #4
  with correct labels and dependencies
- [ ] `.ralph/PROMPT.md` finalized
- [ ] `.ralph/PLAN.md` finalized
- [ ] `.ralph/IMPLEMENT.md` finalized
- [ ] `.ralph/loop.sh` tested with a dry run
- [ ] Codex CLI configured and authenticated
- [ ] Context briefings generated for Phase 1
  (can be done by the loop itself)
- [ ] PATCH station work started (library cards)
  — can run in parallel with MAKE

## Open Questions

1. **Which Codex model?** codex-5.3 was mentioned.
   Confirm.
2. **Review policy:** Do we want human review on
   every PR, or only on certain stories? AI review
   (Cursor + Codex) was mentioned — is that
   sufficient for auto-merge?
3. **Parallelism:** Phase 1 stories have no
   dependencies on each other. Do we run multiple
   ralph loops in parallel or sequential?
4. **Codex invocation:** What's the exact CLI
   command? `codex -p "..."` or something else?
5. **Rate limits:** How many Codex calls can we
   make per hour? Affects loop timing.
