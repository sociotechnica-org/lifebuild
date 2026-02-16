# Job 1: Status Report

**Purpose:** Run the factory instruments, interpret the readings, and brief the team.

**Trigger:** "How's the floor?", "Status report", "What's the factory state?", or start of a work session.

## Procedure

### Step 1: Run instruments

```bash
./scripts/factory-dashboard
```

If `.context/factory-snapshots.jsonl` has 2+ entries:

```bash
./scripts/factory-history
```

### Step 2: Capture the numbers

From the dashboard output, record:

| Metric         | Value                | Rating                    |
| -------------- | -------------------- | ------------------------- |
| WIP Balance    | [per-station counts] | [HEALTHY/WATCH/UNHEALTHY] |
| Blocked Count  | [n/total (pct)]      | [HEALTHY/WATCH/UNHEALTHY] |
| Decision Queue | [resolved/total]     | [HEALTHY/WATCH/UNHEALTHY] |
| Takt Load      | [per-person counts]  | [HEALTHY/WATCH/UNHEALTHY] |

If history is available, add:

| Metric            | Value    | Trend                        |
| ----------------- | -------- | ---------------------------- |
| Decision Velocity | [n/week] | [improving/stable/declining] |
| Blocked Trend     | [delta]  | [improving/stable/worsening] |

Rate each metric using thresholds in `metrics-reference.md`.

### Step 3: Identify the headline

What's the single most important thing? Pick one:

- **Floor is clear.** No blockers, work flowing, everything healthy.
- **Floor is stalled.** High blocked count, decisions not moving.
- **Floor is imbalanced.** One station overloaded, others empty.
- **Floor is churning.** Items moving but rework rate is high.
- **Floor is healthy but slow.** Everything works, velocity just needs to increase.

### Step 4: Draft recommendations

1-3 specific actions. Format: "[Who] should [action] on [item #number] because [reason]."

Priority order:

1. Unblock decisions that have the highest cascade (from Highest-Leverage Moves)
2. Start builds that are ready with no blockers
3. Advance SHAPE items that are stalled
4. Redistribute overloaded takt assignments

### Step 5: Flag risks

Note anything that could get worse if ignored:

- Growing blocked count
- Decision items sitting at Ready for multiple days
- Single person as bottleneck for multiple stations

## Output Format

```
# Factory Status Report

**Date:** [date]
**Headline:** [one sentence]

## Gauges

| Metric | Value | Rating |
|--------|-------|--------|
| WIP Balance | DECIDE: n, PATCH: n, MAKE: n, SHAPE: n | [rating] |
| Blocked Count | n/total (pct%) | [rating] |
| Decisions | n/total decided | [rating] |
| Takt Load | [summary] | [rating] |

## What's Working

- [thing that's going well]

## What Needs Attention

- [issue]: [one sentence why] → [specific action]

## Next Moves

1. **[Person]:** [Item #number] — [action]. [Why this first.]
2. **[Person]:** [Item #number] — [action].
3. **AI:** [Item #number] — [action]. [No blockers, start now.]

## Risks

- [risk if ignored]
```

## Principles

- Lead with the headline. Don't bury the finding.
- Specific over general. "#593 D5" not "some decisions."
- One sentence per issue. If it takes more, it's two issues.
- Recommendations are assignments, not suggestions.
- If the floor is healthy, say so and keep it short. Don't manufacture problems.
