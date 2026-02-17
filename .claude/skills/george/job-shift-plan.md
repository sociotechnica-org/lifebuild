# Job 3: Shift Plan

**Purpose:** Given who's available and the current factory state, build a concrete plan for the next work session.

**Trigger:** "What should I work on?", "Plan my session", "What's next?", or start of a work day.

## Procedure

### Step 0: Check for pending propagation

Before planning work, scan for decisions that were resolved but never propagated. Stale propagation is Priority 0 — it outranks everything, even unblocking decisions. Downstream items may be building against wrong specs.

1. Search for `/george propagate` comments on closed D-issues:

   ```bash
   gh search issues --repo sociotechnica-org/lifebuild "george propagate" --json number,title,state
   ```

2. Check for recently-closed D-issues:

   ```bash
   gh issue list -R sociotechnica-org/lifebuild --state closed --search "D" --json number,title,closedAt
   ```

3. Cross-reference against `docs/context-library/constellation-log.jsonl` for `"task_type": "resolution"` entries. Any closed D-issue without a matching entry is unprocessed.

4. **If unprocessed resolutions found:** Insert as Priority 0 in the shift plan — run Decision Resolution (Job 4) before anything else. Format:

   > **PRIORITY 0 — Pending Propagation**
   > D[N] resolved but not propagated. Run `Job 4: Decision Resolution` on D[N] first.
   > Downstream items (#[n], #[n]) may be building against stale specs.

### Step 1: Get current state

```bash
./scripts/factory-dashboard
```

### Step 2: Determine available resources

Ask or infer:

- **Who is available?** Check Takt field. Common resources: Danvers (product/design), Jess (architecture), AI (Conductor workspaces).
- **How much time?** Quick session (1-2 hours), half day (3-4 hours), full day (6+ hours).
- **Any constraints?** "I can only do decisions today", "I want to focus on SHAPE work", etc.

### Step 3: Apply the priority algorithm

Work through in order. Stop when available capacity is filled.

#### Priority 1: Unblock the highest-leverage decision

Read the "Highest-Leverage Moves" section. The decision that unblocks the most items goes first.

- If the decision is Ready → assign to the right person
- If the decision is itself Blocked → trace what blocks it, assign that
- If the decision needs input from someone unavailable → skip to Priority 2

#### Priority 2: Start PATCH items

Library patches must land before MAKE builds that depend on them. If any PATCH items are Ready:

- Assign to AI (Conan → Bob pipeline)
- These can run in parallel with human DECIDE work

#### Priority 3: Start free MAKE builds

Any MAKE item that is Ready with all blockers resolved:

- Assign to AI
- These can run in parallel with everything else
- Multiple MAKE items can run simultaneously (parallel Conductor workspaces)

#### Priority 4: Advance SHAPE items

If the human has capacity after decisions, SHAPE items are next:

- SHAPE work is iterative — good for remaining time after decisions
- Often generates new decisions → feeds back into DECIDE

#### Priority 5: Clear the review queue

Any items in QC Gate or Review flow state:

- Assign review to appropriate person
- Quick wins — moving items to Shipped clears WIP

### Step 4: Build the plan

For each available resource, create a prioritized task list.

Format:

```
## [Person/Resource]

1. [Item #number] — [specific action] ([estimated time])
   Why first: [reason — leverage, blocking, ready to go]

2. [Item #number] — [specific action] ([estimated time])

If time remains:
3. [Item #number] — [action]
```

### Step 5: Identify parallel tracks

What can run simultaneously?

- DECIDE (human) + MAKE (AI) always parallel
- Multiple MAKE items can run in parallel (separate Conductor workspaces)
- PATCH (AI) can run while human does DECIDE
- SHAPE and DECIDE can alternate in the same session

### Step 6: Set expectations

For each assigned item, note:

- **Happy path:** What done looks like
- **Watch for:** What might block or slow it
- **If stuck:** What to do (skip to next item, escalate, take a different approach)

### Step 7: End-of-shift checkpoint

Recommend running the dashboard again at end of session:

```bash
./scripts/factory-dashboard
```

Compare snapshot to pre-session state. Did blocked count go down? Did items ship? This feeds the history for velocity tracking.

## Output Format

```
# Shift Plan

**Date:** [date]
**Available:** [who] for [how long]
**Factory state:** [one-sentence summary from dashboard]

## Plan

### [Person] — [station focus]

1. **#[number]** — [action] (~[time])
   [Why this is highest priority]

2. **#[number]** — [action] (~[time])

If time remains:
3. **#[number]** — [action]

### AI — parallel builds

Launch in Conductor:
1. **#[number]** — [build description]
   Context: [what constellation to pull, what to watch for]

2. **#[number]** — [build description]

## Parallel Track Summary

| Track | Resource | Items | Station |
|-------|----------|-------|---------|
| 1 | [person] | #[n], #[n] | DECIDE |
| 2 | AI | #[n] | MAKE |
| 3 | AI | #[n] | PATCH |

## End-of-Shift Target

- Blocked count: [current] → [target]
- Items shipped: [target]
- Decisions made: [target]

## Risks

- [risk] → [mitigation]
```

## Session Templates

### Quick Decision Session (1-2 hours)

Focus: Clear the DECIDE queue.

1. Run dashboard
2. Pick highest-leverage decisions
3. Make calls, update issues
4. Run dashboard again — verify blocked count dropped

### Build Sprint (half day)

Focus: Ship MAKE items.

1. Run dashboard
2. Launch AI builds on all Ready MAKE items
3. Human reviews as builds complete
4. Ship what passes, rework what doesn't

### Full Factory Day (6+ hours)

Focus: Move items across all stations.

1. Decisions first (1-2 hours)
2. Launch PATCH + MAKE in parallel
3. SHAPE work while builds run
4. Review completed builds
5. End-of-day dashboard snapshot

## Principles

- Decisions before builds. Always. Decisions are the constraint.
- Parallel over serial. If two things can run at once, run them at once.
- Small batches. Better to ship 3 small items than half-finish 6 big ones.
- Plan for interruptions. Leave 20% slack in time estimates.
- End with a snapshot. Data compounds. Every snapshot makes the next plan better.
