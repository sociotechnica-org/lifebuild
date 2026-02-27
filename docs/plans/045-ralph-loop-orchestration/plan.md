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

| Phase          | What Happens               | Who         |
| -------------- | -------------------------- | ----------- |
| `ready`        | Story written, AC clear    | Chip + Jess |
| `briefed`      | Context briefing attached  | Claude      |
| `planned`      | Technical plan attached    | Codex       |
| `implementing` | Code written, PR opened    | Codex       |
| `in-review`    | Reviews + checks monitored | Claude      |
| `merged`       | PR merged, issue closed    | Claude      |

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
  - story + briefing
- Post the technical plan as an issue comment
- Update label to `phase:planned`

### phase:planned → Kick off implementation

- Invoke Codex with the IMPLEMENT.md template
  - story + briefing + plan
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

Template that gets filled per-story. Modeled after
existing plans in `docs/plans/` (e.g., 038, 040, 042).

```markdown
You are writing a technical implementation plan for
a LifeBuild user story. Your plan will be handed to
another agent for implementation, so it must be
concrete and unambiguous.

## User Story

{story_title}
{story_body}

## Context Briefing

{context_briefing}

## Instructions

Read the relevant source files before writing the
plan. Do NOT implement anything — plan only.

Write a plan with these sections:

### 1. Architecture Decisions

For each non-obvious design choice:

- What the decision is
- Options considered
- Chosen approach and why
- State boundaries (LiveStore vs React context
  vs URL state)

### 2. File Changes

Table format:

| Action | File | Description      |
| ------ | ---- | ---------------- |
| modify | path | what changes     |
| create | path | what it contains |
| delete | path | why it's removed |

### 3. Data Model Changes

If events, schema, queries, or materializers change:

- New/modified events with field definitions
- New/modified materializer SQL
- New/modified query definitions
- Migration notes (if any)

### 4. Component Hierarchy

For new UI work, show the component tree
using indented plain text:

    ParentComponent
      ChildA (props: ...)
      ChildB (props: ...)
        GrandchildC (props: ...)

### 5. PR Breakdown

If the story is large enough for multiple PRs,
break it down. For each PR:

- Scope (what it delivers)
- Dependencies (which PRs must land first)
- Success criteria (testable assertions)

For single-PR stories, just list success criteria.

### 6. Test Plan

- Unit tests: what functions/hooks to test
- E2E Playwright tests: user flows to verify
- Storybook stories: for new Presenter components

### 7. Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| ...  | ...    | ...        |

### 8. What's Out of Scope

Explicitly list related work that this story
does NOT cover, to prevent scope creep.

## Key paths

- Events: `packages/shared/src/events.ts`
- Schema: `packages/shared/src/schema.ts`
- Queries: `packages/shared/src/queries.ts`
- Web components: `packages/web/src/components/`
- Routes: `packages/web/src/routes.tsx`
- Hex map: `packages/web/src/components/hex-map/`
- Layout: `packages/web/src/components/layout/`

## Reference

See `docs/plans/` for examples of good plans
(especially 038, 040, 042).
```

## The Codex Implementation Prompt (`.ralph/IMPLEMENT.md`)

Template that gets filled per-story. Includes key
rules from AGENTS.md so Codex follows project
conventions.

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
   - E2E Playwright tests for EVERY user-facing change
   - Storybook stories for new Presenter components
4. Run `pnpm lint-all` and fix any issues
5. Run `pnpm test` and ensure all tests pass
6. Run `CI=true pnpm test:e2e` and ensure e2e pass
7. **Manual QA via browser:** Start the dev server
   (`pnpm dev:web`) and use the Playwright Chrome MCP
   to drive the browser through the user story's
   acceptance criteria. Click through every flow
   described in the story. If anything is broken or
   doesn't match the acceptance criteria, fix it
   before proceeding.
8. Open a PR with:
   - Title matching the user story title
   - Body with ## Summary, ## Test plan, ## Changelog
   - Include `Closes #{issue_number}`
   - Include a ## QA section describing what you
     clicked through and verified in the browser

## Architecture (from AGENTS.md)

- LiveStore event-sourced state with SQLite
  materialized views
- Web app: React 19 + TypeScript (`packages/web`)
- Sync backend: Cloudflare Worker + Durable Objects
  (`packages/worker`)
- Client persistence: OPFS + SharedWorker

## Critical Gotchas (from AGENTS.md)

- Worker errors do not auto-propagate to main thread;
  bridge explicitly.
- React Error Boundaries do not catch all
  worker/defect paths by default.
- LiveStore adapter instances must be memoized
  (`useMemo`) to avoid reconnect loops.
- Use `networkStatus.disconnectedSince` for
  offline-duration calculations.
- Serialize `Date` values to ISO strings in API
  responses.

## Rules

- Do NOT modify files outside the technical plan
- Do NOT add features beyond the story scope
- E2E Playwright tests are MANDATORY, not optional
- Manual QA via Playwright Chrome MCP is MANDATORY
- Do NOT skip tests
- Add a `## Changelog` section for user-facing changes
- Create Storybook stories for new UI components
  (see `packages/web/AGENTS.md` for patterns)
- Keep the PR small and focused
- If blocked, document in a PR comment and open
  as draft

## Key paths

- Events: `packages/shared/src/events.ts`
- Schema: `packages/shared/src/schema.ts`
- Queries: `packages/shared/src/queries.ts`
- Web components: `packages/web/src/components/`
- Routes: `packages/web/src/routes.tsx`
- Hex map: `packages/web/src/components/hex-map/`
- Layout: `packages/web/src/components/layout/`
- E2E tests: `packages/web/e2e/`
- Storybook: `packages/web/src/stories/`
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

Phase 4: Buildings + Integration
  S11: Workshop overlay (coming soon)
       [blocked-by: S7]
  S12: Sanctuary overlay shell
       [blocked-by: S7]
  S13: Task Queue panel
       [blocked-by: S10]
  S14: Project placement flow
       [blocked-by: S11]
  S15: Onboarding sequence (mechanical)
       [blocked-by: S9, S10, S11, S12]
  S16: Campfire conversation
       [blocked-by: S15]
  S17: Unburdening conversation
       [blocked-by: S11]
  S18: Visioning conversation
       [blocked-by: S12]
  S19: Statue sprite on placed projects
       [blocked-by: S14]
```

With temp decisions resolved, Phase 4 is no longer
blocked on prototypes. All stories can proceed
sequentially without waiting for shaping work.

## Temp Decisions

Stories in Phase 4 that are blocked on prototypes
can be unblocked with temp decisions. Each temp
decision is documented in the story with:

> **TEMP DECISION:** This implements a placeholder
> for [X]. When prototype P[N] resolves, a follow-up
> story will replace this with the shaped version.

Resolved temp decisions:

- **Workshop interior (P1):** "Coming soon" sign
  inside the overlay + Marvin chat. Wired to route,
  left rail auto-selects Marvin. Real drafting
  experience filled in after P1 prototype.
- **Task Queue (P4):** Tasks grouped by project
  (standard group-by). Click a task to navigate to
  its project. Refined after P4 prototype.
- **Task states:** Four states cycled by clicking
  the checkbox: `[ ]` todo, `[i]` in progress,
  `[r]` review, `[x]` done. Each click advances
  to the next state.
- **Conversations (P6-P8):** Generic prompt for
  each attendant. Jarvis gets a welcoming/coaching
  prompt, Marvin gets a project-helper prompt. Real
  scripts after Danvers finishes prototypes.
- **Project placement (P2):** Simple "click hex to
  place" — no flourish or fanfare. Enhanced after
  P2 prototype.
- **Statues (P3):** Single static PNG sprite
  reused for all projects. Nano Banana generated
  unique art comes after P3 prototype.

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
