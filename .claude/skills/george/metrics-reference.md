# Factory Metrics Reference

Six metrics. Three are snapshot metrics (computable now). Three need historical data (accumulate over time).

---

## Snapshot Metrics (always available)

### 1. WIP Balance

**What:** Distribution of work-in-progress across stations.

**Source:** Dashboard → WIP BALANCE section.

| Rating    | Criteria                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| HEALTHY   | Items at each station, MAKE slightly larger. No station empty while others are full. |
| WATCH     | One station has 2x+ another. Or a non-MAKE station is the largest.                   |
| UNHEALTHY | 10+ items at one station, zero at another. The factory isn't flowing.                |

**Diagnostic questions when UNHEALTHY:**

- Is DECIDE overloaded? → Decision starvation. Human bottleneck.
- Is MAKE empty? → Nothing to build. Upstream isn't feeding.
- Is SHAPE overloaded? → Prototypes piling up without resolution.
- Is PATCH empty with MAKE blocked? → Library is stale, builders can't proceed.

### 2. Blocked Count

**What:** Items in "Blocked (Andon)" flow state.

**Source:** Dashboard → BLOCKED (ANDON) section.

| Rating    | Criteria                                       |
| --------- | ---------------------------------------------- |
| HEALTHY   | 0-1 blocked items. Quick resolution.           |
| WATCH     | 2-3 blocked items. Look for shared root cause. |
| UNHEALTHY | 5+ blocked items. Systemic problem.            |

**Diagnostic questions when UNHEALTHY:**

- Are they all waiting on the same decision? → That decision is the bottleneck.
- Are they all waiting on the same build? → That build is the critical path.
- Are they spread across different blockers? → Multiple independent problems.
- Is the blocked count growing over time? → System is getting worse, not better.

### 3. Takt Load

**What:** Work distribution across people/resources.

**Source:** Dashboard → TAKT LOAD section.

| Rating    | Criteria                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------- |
| HEALTHY   | Work distributed proportionally to capacity. AI has most MAKE items. Humans have DECIDE/SHAPE.            |
| WATCH     | One person has 3x+ another's load. Or someone is assigned work at a station that isn't their strength.    |
| UNHEALTHY | One person is the bottleneck for 80%+ of items. Or AI has nothing to build while humans have full queues. |

---

## Historical Metrics (need accumulated snapshots)

### 4. Decision Velocity

**What:** Decisions resolved per week at DECIDE.

**Source:** History → DECISION VELOCITY section.

**Requires:** 2+ snapshots across different days.

| Rating    | Criteria                                                                              |
| --------- | ------------------------------------------------------------------------------------- |
| HEALTHY   | 5-6 decisions/week. Quick calls cleared in a session, deeper ones get dedicated time. |
| WATCH     | 2-3 decisions/week. Queue is growing but still moving.                                |
| UNHEALTHY | 0-1 decisions/week. Factory is starving. Everything downstream is idle.               |

**This is the master metric.** If velocity is healthy, other problems are local. If velocity is unhealthy, everything downstream suffers.

### 5. First-Pass Yield

**What:** Percentage of items that ship on first review without rework.

**Source:** Requires tracking items that enter "Rework" flow state vs those that go straight to "Shipped."

**Not yet tracked in dashboard.** To compute manually: count items that moved from QC Gate/Review directly to Shipped vs those that went through Rework.

| Rating    | Criteria                                                           |
| --------- | ------------------------------------------------------------------ |
| HEALTHY   | 70-80%. Most things ship clean.                                    |
| WATCH     | 50-70%. Notable rework rate. Check spec clarity.                   |
| UNHEALTHY | <50%. More rework than first-pass. Fix upstream: DECIDE and PATCH. |

**Key insight:** The fix for low first-pass yield is never "build better." It's "specify better." Rework means DECIDE or PATCH didn't do enough work.

### 6. ECO Rate

**What:** Percentage of reviewed items where the spec was wrong (not just the build).

**Source:** Requires labeling rework items as "spec was wrong" vs "build was wrong."

**Not yet tracked in dashboard.** Requires human judgment to classify each rework instance.

| Rating    | Criteria                                                                |
| --------- | ----------------------------------------------------------------------- |
| HEALTHY   | 10-15%. Some discoveries are inevitable.                                |
| WATCH     | 20-30%. Specs are frequently wrong. More SHAPE work needed.             |
| UNHEALTHY | 40%+. Nearly half of specs are wrong. Use SHAPE to iterate before MAKE. |

### 7. Cycle Time

**What:** Average elapsed time from "Queued" to "Shipped."

**Source:** History → requires tracking flow state transition timestamps.

**Partially available:** Dashboard snapshots record item states over time. With daily snapshots, you can estimate when items changed state.

| Rating    | Criteria                                                               |
| --------- | ---------------------------------------------------------------------- |
| HEALTHY   | 2-4 days for MAKE items. Longer for SHAPE (iterative).                 |
| WATCH     | 5-8 days. Items sitting somewhere. Check flow state breakdown.         |
| UNHEALTHY | 12+ days. Items are stuck. Combine with flow state data to find where. |

---

## Metric Interactions

These metrics don't exist in isolation. They form a diagnostic chain:

```
Decision Velocity low?
    └─► WIP piles at DECIDE
        └─► Blocked count rises (downstream waiting)
            └─► Cycle time increases (items sit)

First-Pass Yield low?
    └─► Rework count rises
        └─► Cycle time increases
            └─► WIP backs up (items recirculate)

ECO Rate high?
    └─► Specs are wrong
        └─► Need more SHAPE before MAKE
            └─► Slower but higher quality

Blocked Count high?
    └─► Check: shared root cause or independent?
        └─► Shared → one fix unblocks many (high leverage)
        └─► Independent → multiple smaller problems
```

## Reading the Dashboard

When the dashboard runs, read sections in this order:

1. **Blocked count first.** This is the alarm. Is the factory stopped?
2. **WIP balance second.** Where is work piling up?
3. **Highest-leverage moves third.** What single action has the most impact?
4. **Decision queue fourth.** Are decisions moving?
5. **Takt load last.** Is work distributed well?
