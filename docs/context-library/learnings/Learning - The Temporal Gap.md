# Learning - The Temporal Gap

## Divergence

**Vision:** LifeBuild runs on a weekly cadence. Directors complete Weekly Planning (typically Friday or Sunday), commit to Gold/Silver/Bronze for the week, execute against that plan, then review via Week-in-Review. Plans are hypotheses tested against reality. Calibration accuracy is tracked over time. Mid-week Adaptation is a structured system for modifying commitments.

**Reality:** No weekly cadence exists. Selections on The Table are ad-hoc — directors can assign/unassign projects at any time with no temporal boundaries. No week start, no week end, no planning sessions, no review sessions, no calibration tracking, no Adaptation system.

## Scale

This affects the entire "Superior Process" strategy layer. Without temporal structure, several foundational concepts cannot function:

- [[System - Weekly Priority]] — Partial. Positions work, but no week validity or planning cycle.
- [[Capability - Weekly Planning]] — Partial. Mechanics exist, no cadence.
- [[Capability - Week-in-Review]] — Not started. Nothing to review without weeks.
- [[System - Adaptation]] — Not started. No mid-week if there's no week.
- [[Standard - Planning Calibration]] — Not started. No plan-vs-reality comparison.
- [[Principle - Plans Are Hypotheses]] — Cannot be evaluated without temporal structure to test hypotheses.

## Why It Exists

Weekly cadence requires: (1) a concept of "week" in the data model, (2) a trigger mechanism (time-based prompt or agent-initiated session), (3) state transitions (week start, week end, archive), and (4) review infrastructure. The MVP focused on the spatial-primitive mechanics (projects, tasks, priority queue) and deferred the temporal layer. The Table works as a persistent commitment display; adding weekly boundaries is an additive change.

## Implications

- Builders should not reference "this week's plan" or "weekly commitment" as if it exists in code. The Table shows current selections, not week-scoped commitments.
- Any feature that requires "week end" or "new planning cycle" logic needs the temporal layer first.
- The current ad-hoc selection model is not a bug — it's a simpler starting point. But it means the Plans Are Hypotheses principle is aspirational, not operational.
- Cameron's Sorting Room guidance currently helps with selection, not with weekly commitment framing.

## When This Closes

When [[System - Weekly Priority]] gains week validity (start/end dates, planning cycle triggers, archive on week end). This enables Weekly Planning cadence, which enables Week-in-Review, which enables Planning Calibration.
