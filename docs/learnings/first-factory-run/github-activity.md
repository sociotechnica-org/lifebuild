# First Factory Run — GitHub Activity

**Date:** February 27, 2026
**Issues:** 20 (all closed)
**PRs:** 20 (all merged)
**Time span:** 3:16am - 10:08am ET (first PR created to last PR merged)

---

## All Issues — Final Status

All 20 ralph-labeled issues were closed:

| Issue | Title                                                       | Closed (ET) |
| ----- | ----------------------------------------------------------- | ----------- |
| #699  | Remove the Table                                            | 3:16am      |
| #700  | Remove the Sorting Room                                     | 4:28am      |
| #701  | Remove the Drafting Room                                    | 5:04am      |
| #702  | Remove Mesa from the map                                    | 4:03am      |
| #703  | Remove Kanban, replace with task list                       | 4:08am      |
| #704  | Map as full-bleed base layer                                | 5:36am      |
| #705  | Building overlay pattern and routing                        | 6:22am      |
| #706  | Map navigation: zoom and pan                                | 6:36am      |
| #707  | Attendant Rail with attendant avatars                       | 7:04am      |
| #708  | Project interface as building overlay                       | 7:34am      |
| #709  | Workshop overlay with coming soon sign                      | 7:46am      |
| #710  | Sanctuary overlay shell                                     | 7:57am      |
| #711  | Task Queue panel                                            | 8:28am      |
| #712  | Project placement flow                                      | 8:28am      |
| #713  | Onboarding sequence                                         | 9:39am      |
| #717  | Statue sprites on placed projects                           | 8:53am      |
| #718  | Campfire conversation: Jarvis guides first project creation | 10:08am     |
| #719  | Workshop first visit: Marvin greets and guides Unburdening  | 9:32am      |
| #720  | Sanctuary first visit: Jarvis guides Visioning              | 9:19am      |
| #721  | First project open: Marvin offers to help                   | 9:11am      |

---

## All PRs — Merge Timeline (ET)

| PR   | Issue | Created | Merged  | Time to Merge | Author     |
| ---- | ----- | ------- | ------- | ------------- | ---------- |
| #722 | #699  | 2:57am  | 3:16am  | 19min         | jessmartin |
| #723 | #702  | 3:25am  | 4:03am  | 38min         | jessmartin |
| #724 | #700  | 3:29am  | 4:28am  | 59min         | jessmartin |
| #725 | #701  | 3:40am  | 5:04am  | 84min         | jessmartin |
| #726 | #703  | 3:46am  | 4:08am  | 22min         | jessmartin |
| #727 | #704  | 3:57am  | 5:36am  | 99min         | jessmartin |
| #728 | #705  | 5:50am  | 6:22am  | 32min         | jessmartin |
| #729 | #706  | 6:28am  | 6:36am  | 8min          | jessmartin |
| #730 | #707  | 6:47am  | 7:04am  | 17min         | jessmartin |
| #731 | #708  | 7:21am  | 7:34am  | 13min         | jessmartin |
| #732 | #709  | 7:41am  | 7:46am  | 5min          | jessmartin |
| #733 | #710  | 7:52am  | 7:57am  | 5min          | jessmartin |
| #734 | #712  | 8:14am  | 8:28am  | 14min         | jessmartin |
| #735 | #711  | 8:20am  | 8:28am  | 8min          | jessmartin |
| #736 | #721  | 8:44am  | 9:11am  | 27min         | jessmartin |
| #737 | #717  | 8:46am  | 8:53am  | 7min          | jessmartin |
| #738 | #720  | 8:52am  | 9:19am  | 27min         | jessmartin |
| #739 | #719  | 9:23am  | 9:32am  | 9min          | jessmartin |
| #740 | #713  | 9:33am  | 9:39am  | 6min          | jessmartin |
| #741 | #718  | 9:56am  | 10:08am | 12min         | jessmartin |

**Average time from PR creation to merge:** 25 minutes
**Fastest:** 5 minutes (#732 Workshop, #733 Sanctuary — simple placeholders)
**Slowest:** 99 minutes (#727 Map full-bleed — needed rebase after 4 prior PRs merged)

---

## Code Review Analysis

### Who reviewed?

All code reviews were done by **Codex** (`chatgpt-codex-connector[bot]`) via `@codex pls review` comments. All review requests came from **jessmartin** (posted by Opus acting through Jess's GitHub credentials).

No human reviewed any PR before merge.

### Review Coverage

| PR   | Issue | Codex Review? | Review Finding                                        | Severity    |
| ---- | ----- | ------------- | ----------------------------------------------------- | ----------- |
| #722 | #699  | Yes           | "No major issues"                                     | Clean       |
| #723 | #702  | Yes           | P2: Keep life-map worker ID stable                    | Minor       |
| #724 | #700  | Yes           | P1: Preserve storeId on redirect (x2)                 | Significant |
| #725 | #701  | Yes           | P1: Restore Sorting Room routes                       | Significant |
| #726 | #703  | Yes           | P1: Update e2e assertions; P1: Add Storybook coverage | Significant |
| #727 | #704  | Yes           | P1: Reinstate planning routes; P1: Preserve storeId   | Significant |
| #728 | #705  | Yes           | P1: Escape key handling; P1: Restore RoomLayout       | Significant |
| #729 | #706  | Yes           | P2: Disable arrow keys when overlays open             | Minor       |
| #730 | #707  | No            | (no `@codex pls review` posted)                       | —           |
| #731 | #708  | Yes           | "No major issues"                                     | Clean       |
| #732 | #709  | Yes           | "No major issues"                                     | Clean       |
| #733 | #710  | Yes (x2)      | "No major issues" (both times)                        | Clean       |
| #734 | #712  | Yes           | P1: Seed Workshop stories through LiveStore           | Significant |
| #735 | #711  | Yes           | "No major issues"                                     | Clean       |
| #736 | #721  | Yes           | P2: Recompute first-open banner state                 | Minor       |
| #737 | #717  | Yes           | "No major issues"                                     | Clean       |
| #738 | #720  | Yes           | P2: Delay first-visit completion                      | Minor       |
| #739 | #719  | Yes           | P1: Recheck completion setting                        | Significant |
| #740 | #713  | Yes           | P2: Gate onboarding UI; P2: Include archived projects | Minor       |
| #741 | #718  | Yes           | P1: Remove client-time gate                           | Significant |

### Review Summary

- **19 of 20 PRs** got Codex code review (PR #730 was missed)
- **7 PRs** came back clean ("No major issues")
- **8 PRs** got P1 (significant) findings
- **5 PRs** got P2 (minor) findings
- **0 review findings were addressed before merge** — all PRs were merged as-is

---

## Manual QA Analysis (Opus via Playwright MCP)

Opus did manual QA by driving a Chrome browser via Playwright MCP. QA was done from the main worktree after merging each PR's branch into main and running `pnpm dev`.

### QA Coverage

| PR   | Issue | QA Performed? | QA Method           | Notes                                                                                                            |
| ---- | ----- | ------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| #722 | #699  | Yes           | Full browser QA     | Navigated all routes, took screenshot, confirmed Table gone. "QA PASS."                                          |
| #723 | #702  | Yes           | Browser QA          | Checked Mesa removal                                                                                             |
| #724 | #700  | Yes           | Browser QA          | Verified sorting room redirect preserves query params                                                            |
| #725 | #701  | Yes           | Browser QA          | Verified drafting room redirect                                                                                  |
| #726 | #703  | Partial       | CI-based            | CI green deemed sufficient                                                                                       |
| #727 | #704  | Yes           | Browser QA          | Verified map is full-bleed, sorting room redirect works                                                          |
| #728 | #705  | Yes           | Browser QA          | Verified overlay opens/closes                                                                                    |
| #729 | #706  | Yes           | Full browser QA     | Tested zoom in, zoom out, pan. Took screenshots for each. Pan initially appeared broken, then confirmed working. |
| #730 | #707  | Partial       | CI-based            | Dispatched to Codex for implementation, CI green                                                                 |
| #731 | #708  | Partial       | CI-based            | CI green                                                                                                         |
| #732 | #709  | No            | CI-only             | "Small change, CI green is sufficient"                                                                           |
| #733 | #710  | No            | CI-only             | "Simple placeholder like #709"                                                                                   |
| #734 | #712  | Partial       | Browser but limited | Map loaded with 0 projects, couldn't fully test placement flow                                                   |
| #735 | #711  | Partial       | Browser but limited | Requires 2+ placed projects to show, "CI green, QA passed"                                                       |
| #736 | #721  | No            | CI-only             | Merged after CI green                                                                                            |
| #737 | #717  | No            | CI-only             | Merged after CI green                                                                                            |
| #738 | #720  | No            | CI-only             | Merged after CI green                                                                                            |
| #739 | #719  | No            | CI-only             | Merged after rebase, CI green                                                                                    |
| #740 | #713  | No            | CI-only             | Merged after CI green                                                                                            |
| #741 | #718  | No            | CI-only             | Merged after CI green                                                                                            |

### QA Summary

- **5 PRs** got thorough browser QA with screenshots (#699, #700, #704, #705, #706)
- **4 PRs** got partial browser QA (#701, #703, #712, #711)
- **11 PRs** were merged with CI-only (no manual QA)
- QA degraded over time: early PRs got thorough QA, later ones were "CI green is sufficient"

---

## Who Did What: Opus vs Codex

### Codex (gpt-5.3-codex) — Implementation Agent

- Wrote all 20 technical plans
- Implemented all 20 features
- Fixed its own e2e failures (dispatched by Opus with scoped fix instructions)
- Performed code review on 19/20 PRs
- Handled some rebases when dispatched

### Opus (claude-opus-4-6) — Orchestrator

- Created all GitHub issues and project board
- Generated context briefings via Conan subagents
- Dispatched Codex sessions with prompts
- Managed worktree lifecycle (create, cleanup)
- Resolved merge conflicts (did most rebases itself, dispatched some to Codex)
- Performed manual QA via Playwright MCP
- Merged all PRs
- Updated GitHub Project Board #8 status
- Requested code reviews via `@codex pls review`

### Opus Direct Code Work

Opus did NOT write implementation code. Its direct interventions were:

1. **Merge conflict resolution** — resolved conflicts during rebases for #700, #701, #719, #720, #713
2. **E2e test fixes** — dispatched Codex for these rather than fixing directly
3. **Worktree management** — created and cleaned up worktrees
4. **Review feedback fixing** — for Phase 1 PRs (#722-#726), Opus addressed some review comments before merging

### The Rebase Problem

The biggest time sink was **rebasing**. Because PRs merged sequentially into main, each subsequent PR needed rebasing. This caused:

- Multiple CI re-runs per PR (some PRs had 3-4 push cycles)
- Merge conflicts that needed manual resolution
- PRs like #725 (#701) took 84 minutes despite the implementation being done quickly

---

## Comprehensive Per-Issue Scorecard

| Issue     | Title                 | Codex Sessions         | Codex Time | Session Data | Code Review | Review Findings                         | Manual QA    | Who Worked | PR         | PR Merge Time |
| --------- | --------------------- | ---------------------- | ---------- | ------------ | ----------- | --------------------------------------- | ------------ | ---------- | ---------- | ------------- |
| #699      | Remove the Table      | 4 (1 plan, 3 fix)      | 71min      | 6.8MB        | Yes - Clean | None                                    | Full browser | Codex+Opus | #722       | 19min         |
| #700      | Remove Sorting Room   | 3 (3 impl/fix)         | 9min       | 2.0MB        | Yes - P1x2  | Preserve storeId on redirect            | Full browser | Codex+Opus | #724       | 59min         |
| #701      | Remove Drafting Room  | 3 (3 impl/fix)         | 9min       | 2.2MB        | Yes - P1    | Restore Sorting Room routes             | Full browser | Codex+Opus | #725       | 84min         |
| #702      | Remove Mesa           | 2 (2 impl)             | 26min      | 2.0MB        | Yes - P2    | Keep worker ID stable                   | Full browser | Codex+Opus | #723       | 38min         |
| #703      | Remove Kanban         | 3 (1 plan, 2 impl)     | 12min      | 2.1MB        | Yes - P1x2  | Update e2e; add Storybook               | Partial      | Codex+Opus | #726       | 22min         |
| #704      | Map full-bleed        | 4 (1 plan, 3 impl/fix) | 13min      | 2.4MB        | Yes - P1x2  | Reinstate routes; preserve storeId      | Full browser | Codex+Opus | #727       | 99min         |
| #705      | Building overlay      | 2 (1 plan, 1 impl)     | 17min      | 2.0MB        | Yes - P1x2  | Escape handling; RoomLayout             | Full browser | Codex      | #728       | 32min         |
| #706      | Zoom and pan          | 2 (1 plan, 1 impl)     | 8min       | 1.3MB        | Yes - P2    | Arrow keys vs overlays                  | Full browser | Codex      | #729       | 8min          |
| #707      | Attendant Rail        | 2 (1 plan, 1 impl)     | 29min      | 2.9MB        | No          | —                                       | Partial (CI) | Codex      | #730       | 17min         |
| #708      | Project overlay       | 2 (1 plan, 1 impl)     | 31min      | 2.6MB        | Yes - Clean | None                                    | Partial (CI) | Codex      | #731       | 13min         |
| #709      | Workshop coming soon  | 2 (1 plan, 1 impl)     | 13min      | 1.5MB        | Yes - Clean | None                                    | CI-only      | Codex      | #732       | 5min          |
| #710      | Sanctuary shell       | 2 (1 plan, 1 impl)     | 12min      | 1.3MB        | Yes - Clean | None                                    | CI-only      | Codex      | #733       | 5min          |
| #711      | Task Queue            | 2 (1 plan, 1 impl)     | 31min      | 2.5MB        | Yes - Clean | None                                    | Partial      | Codex      | #735       | 8min          |
| #712      | Project placement     | 3 (2 plan, 1 impl)     | 37min      | 3.1MB        | Yes - P1    | Seed stories via LiveStore              | Partial      | Codex      | #734       | 14min         |
| #713      | Onboarding sequence   | 3 (1 plan, 2 impl)     | 28min      | 3.2MB        | Yes - P2x2  | Gate UI on readiness; archived projects | CI-only      | Codex+Opus | #740       | 6min          |
| #717      | Statue sprites        | 2 (1 plan, 1 impl)     | 25min      | 2.0MB        | Yes - Clean | None                                    | CI-only      | Codex      | #737       | 7min          |
| #718      | Campfire conversation | 2 (1 plan, 1 impl)     | 26min      | 3.1MB        | Yes - P1    | Remove client-time gate                 | CI-only      | Codex      | #741       | 12min         |
| #719      | Workshop first visit  | 3 (1 plan, 2 impl)     | 24min      | 3.5MB        | Yes - P1    | Recheck completion setting              | CI-only      | Codex+Opus | #739       | 9min          |
| #720      | Sanctuary first visit | 2 (1 plan, 1 impl)     | 45min      | 3.3MB        | Yes - P2    | Delay first-visit completion            | CI-only      | Codex+Opus | #738       | 27min         |
| #721      | First project open    | 2 (1 plan, 1 impl)     | 44min      | 2.9MB        | Yes - P2    | Recompute banner state                  | CI-only      | Codex      | #736       | 27min         |
| **TOTAL** |                       | **53 sessions**        | **535min** | **55MB**     | **19/20**   | **24 findings**                         | **9/20**     |            | **20 PRs** | **Avg 25min** |

### Token Usage

Token counts were not reliably logged in Codex session data (fields are null). One data point from Claude's orchestration log:

- **#704 (Map full-bleed) implementation:** 188K tokens for a single Codex session (136 additions, 713 deletions, 15 files)
- **Rate limit hit:** 1M TPM (tokens per minute) for gpt-5.3-codex was exceeded when running 4-5 parallel sessions, confirming each session uses 200K+ tokens

Rough estimate: 53 sessions x ~200K tokens/session = **~10.6M tokens** of Codex (gpt-5.3-codex) usage.

### Rate Limiting Incidents

1. **1:06am ET** — 4 parallel planning sessions: worked fine (planning uses fewer tokens)
2. **~8:24am ET** — 4 parallel impl sessions: hit 1M TPM limit, sessions reconnected/failed
3. **~8:41am ET** — 5 parallel impl sessions: hit TPM again, 3 survived with retries, 2 failed with no commits
4. Resolution: dropped to 2 parallel max for remaining work

---

## Key Metrics

| Metric                                 | Value                    |
| -------------------------------------- | ------------------------ |
| Issues closed                          | 20/20 (100%)             |
| PRs merged                             | 20/20 (100%)             |
| PRs with code review                   | 19/20 (95%)              |
| Review findings addressed before merge | 0/24 (0%)                |
| PRs with manual QA                     | 9/20 (45%)               |
| PRs with thorough QA                   | 5/20 (25%)               |
| Human intervention                     | 0 (Jess was asleep)      |
| Wall clock time                        | ~7 hours (3am - 10am ET) |
| Average PR merge time                  | 25 minutes               |
| Merge conflicts resolved               | ~10-12                   |
| Codex sessions total                   | 53                       |
| Codex compute time                     | 535 minutes (~9 hours)   |
| Codex session data                     | 55MB                     |
| Estimated Codex tokens                 | ~10.6M                   |
| Rate limit incidents                   | 3                        |
