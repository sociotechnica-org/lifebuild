# First Factory Run — Codex Sessions

**Date:** February 26-27, 2026
**Total Codex sessions:** 54 (1 unrelated, 53 for the Map-first UI release)
**Model:** gpt-5.3-codex
**Effort:** Started at `xhigh`, dropped to `high` after first session

---

## Summary Stats

| Phase                       | Sessions | Issues Covered | Time Span (ET)   |
| --------------------------- | -------- | -------------- | ---------------- |
| Planning (single)           | 1        | #699-#702      | 12:13am - 1:01am |
| Planning (parallel batches) | 18       | #703-#721      | 1:06am - 1:36am  |
| Implementation #699 (pilot) | 3        | #699           | 2:37am - 3:12am  |
| Implementation (batch 1)    | 10       | #700-#703      | 3:21am - 3:38am  |
| Implementation #704         | 3        | #704           | 3:47am - 5:08am  |
| Fix/rebase #704             | 2        | #704/#727      | 5:05am - 5:29am  |
| Implementation (sequential) | 17       | #705-#721      | 5:37am - 10:01am |

**Total Codex compute time:** ~8 hours wall clock, ~6.5 hours of actual Codex execution

---

## Phase 1: Planning — Single Session (12:13am - 1:01am ET)

The first Codex session was a single long planning run at `xhigh` effort. It wrote plans for #699 through #702 before being stopped.

| Time    | Dur   | Issue     | Outcome                                         |
| ------- | ----- | --------- | ----------------------------------------------- |
| 12:13am | 47min | #699-#702 | Wrote plans for 4 issues. Slow at xhigh effort. |

**Learning:** `xhigh` was too slow for planning. Dropped to `high` for all subsequent sessions.

## Phase 2: Planning — Parallel Batches (1:06am - 1:36am ET)

Opus spawned parallel Codex sessions in batches of 4 to write plans for the remaining issues. Each session took 2-7 minutes.

| Time   | Dur  | Issue | Outcome                                                            |
| ------ | ---- | ----- | ------------------------------------------------------------------ |
| 1:06am | 4min | #703  | Plan written                                                       |
| 1:06am | 5min | #707  | Plan written                                                       |
| 1:06am | 4min | #711  | Plan written                                                       |
| 1:06am | 6min | #718  | Plan written                                                       |
| 1:10am | 2min | #712  | Confused by existing plans from other sessions, asked for guidance |
| 1:10am | 4min | #704  | Plan written                                                       |
| 1:11am | 5min | #708  | Plan written                                                       |
| 1:12am | 7min | #719  | Plan written                                                       |
| 1:13am | 4min | #713  | Plan written                                                       |
| 1:15am | 4min | #705  | Plan written                                                       |
| 1:16am | 3min | #709  | Plan written                                                       |
| 1:17am | 3min | #717  | Plan written                                                       |
| 1:19am | 2min | #706  | Plan written                                                       |
| 1:20am | 2min | #710  | Plan written                                                       |
| 1:20am | 5min | #720  | Plan written                                                       |
| 1:26am | 5min | #721  | Plan written                                                       |
| 1:32am | 4min | #712  | Re-run after confused first attempt. Plan written.                 |

**Learning:** Parallel planning works great. 4 at a time, ~4min each. One session (#712) got confused by seeing plans from concurrent sessions — worktree isolation helps here.

## Phase 3: Implementation — Pilot (#699) (2:37am - 3:12am ET)

First implementation attempt. #699 was the pilot that had to succeed before parallelizing.

| Time   | Dur   | Issue | Outcome                                             |
| ------ | ----- | ----- | --------------------------------------------------- |
| 2:37am | 14min | #699  | Hit sandbox/npm issues, couldn't fully complete     |
| 2:53am | 1min  | #699  | Type error fix — told to run locally, couldn't push |
| 3:02am | 9min  | #699  | Fixed 3 failing e2e tests, all 26 passed, pushed    |

**Learning:** Codex hit sandbox constraints (npm install, git worktree metadata). Needed 3 sessions to get #699 green. The fix-up sessions were fast once the problem was scoped.

## Phase 4: Implementation — First Parallel Batch (#700-#703) (3:21am - 3:38am ET)

After #699 succeeded, Opus launched 4 parallel implementations in worktrees. These required multiple Codex sessions each as they timed out or hit issues.

| Time   | Dur   | Issue | Outcome                                                             |
| ------ | ----- | ----- | ------------------------------------------------------------------- |
| 3:21am | 1min  | #700  | Started, exploring code                                             |
| 3:21am | 1min  | #701  | Started, exploring code                                             |
| 3:21am | 12min | #702  | Running e2e, waiting for completion                                 |
| 3:21am | 2min  | #703  | Started, reading files                                              |
| 3:22am | 5min  | #700  | Re-run with explicit branch instruction. Tests running.             |
| 3:22am | 0min  | #701  | Re-run with explicit branch instruction. Reading files.             |
| 3:22am | 14min | #702  | Re-run. Playwright suite still running.                             |
| 3:22am | 6min  | #703  | Re-run. Starting file edits.                                        |
| 3:26am | 3min  | #700  | Lint passed, tests passing through packages.                        |
| 3:29am | 8min  | #701  | Cleaning up tests, converting removed-flow tests to fixme coverage. |

**Learning:** The first batch of 4 parallel implementations was messy. Sessions were short-lived, needed re-launching. The explicit "you are on branch X, do NOT create a new branch" instruction was added after Codex tried to create new branches in worktrees.

## Phase 5: Implementation #704 — Map Full-Bleed (3:47am - 5:29am ET)

This was the foundational layout change. Required multiple sessions including a rebase after merging earlier PRs.

| Time   | Dur   | Issue | Outcome                                                 |
| ------ | ----- | ----- | ------------------------------------------------------- |
| 3:47am | 0min  | #704  | Started, found file path mismatch with plan             |
| 3:48am | 6min  | #704  | Implemented. Lint + test + build passed.                |
| 5:05am | 3min  | #704  | Rebased onto main after prior PRs merged. Force-pushed. |
| 5:14am | 15min | #727  | Fixed 3 e2e failures after rebase. All 22 passed.       |

**Learning:** Plans can have stale file paths if the codebase changed since planning. Codex handled the mismatch by searching for the actual files. Rebase + fix was handled cleanly by scoping the task tightly.

## Phase 6: Implementation — Sequential (#705-#721) (5:37am - 10:01am ET)

After the foundation was merged, remaining issues were implemented largely sequentially (some in parallel pairs). Most produced PRs successfully.

| Time   | Dur   | Issue    | PR   | Outcome                                    |
| ------ | ----- | -------- | ---- | ------------------------------------------ |
| 5:37am | 13min | #705     | #728 | PR opened, review requested                |
| 5:56am | 6min  | #728 fix | —    | Fixed 4 e2e failures                       |
| 6:09am | 4min  | #728 fix | —    | Fixed remaining 2 smoke test failures      |
| 6:23am | 6min  | #706     | #729 | PR opened, all passing                     |
| 6:37am | 24min | #707     | #730 | PR opened, all checks passing              |
| 7:05am | 26min | #708     | #731 | PR opened                                  |
| 7:35am | 10min | #709     | #732 | PR opened, CI passing                      |
| 7:46am | 10min | #710     | #733 | PR opened, all passing                     |
| 7:58am | 27min | #711     | #735 | PR opened, CI passing                      |
| 7:58am | 31min | #712     | —    | PR created but e2e still failing on remote |
| 8:30am | 1min  | #713     | —    | Started, still exploring code              |
| 8:30am | 22min | #717     | #737 | PR opened, all passing                     |
| 8:31am | 4min  | #719     | —    | Started, reading overlay/chat code         |
| 8:31am | 40min | #720     | —    | Implemented, e2e passed locally            |
| 8:31am | 39min | #721     | #736 | PR opened, CI passing                      |
| 9:10am | 23min | #713     | #740 | PR opened                                  |
| 9:10am | 13min | #719     | #739 | PR opened                                  |
| 9:40am | 20min | #718     | —    | Implemented, e2e pending on CI             |

---

## Key Observations

### What Worked

1. **Planning is fast and parallelizable.** 18 plans in ~30 minutes with 4-way parallelism.
2. **Scoped fix-up sessions are efficient.** When Codex hits a failure, a new session scoped to just "fix these 3 e2e tests" completes in minutes.
3. **Explicit branch/worktree instructions prevent confusion.** "You are on branch X, do NOT create a new branch" is essential.
4. **Plans + context briefings give Codex enough context** to implement without asking questions.
5. **Sequential implementation after a foundation** (layout, routing) was cleaner than full parallelism.

### What Didn't Work

1. **First parallel batch was chaotic.** Sessions died quickly, needed re-launching with better instructions.
2. **`xhigh` effort was wasteful for planning.** `high` was sufficient and 10x faster.
3. **File path mismatches in plans.** Concurrent merges made plan references stale.
4. **Sandbox constraints.** Codex couldn't do npm install or manage git worktree metadata, requiring manual intervention.
5. **Long e2e waits.** Playwright suites took 5-10 minutes, eating session time.

### Session Duration Distribution

- Planning sessions: 2-7 minutes (median ~4 min)
- Clean implementations: 6-26 minutes (median ~13 min)
- Complex implementations: 27-40 minutes
- Fix-up sessions: 1-15 minutes (median ~5 min)

### PRs Produced

At least 14 PRs were opened during this run:

- #727 (#704), #728 (#705), #729 (#706), #730 (#707), #731 (#708)
- #732 (#709), #733 (#710), #735 (#711), #736 (#721), #737 (#717)
- #739 (#719), #740 (#713)
- Plus PRs for #718, #720 (numbers not captured in output)

### Total Codex Cost

- 54 sessions x ~800KB average = ~42MB of session data
- Model: gpt-5.3-codex at `high` effort
- Estimated tokens: very high (each session reads codebase files extensively)
