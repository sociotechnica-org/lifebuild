# Job 2: Triage

**Purpose:** Something is wrong on the factory floor. Find the root cause, classify it, and prescribe the fix.

**Trigger:** Blocked count > 3, velocity at zero, rework piling up, or "everything's stuck."

Triage is not a status report. A status report reads the gauges. Triage investigates when the gauges are red.

## Procedure

### Step 1: Establish the symptom

Run the dashboard:

```bash
./scripts/factory-dashboard
```

Name the presenting symptom. One sentence. Examples:

- "7 of 15 items are blocked."
- "Zero decisions have shipped in two weeks."
- "MAKE has 10 items, DECIDE has zero."
- "Three items went through rework in a row."

### Step 2: Classify the symptom

| Symptom                              | Category                    | Investigate                                                              |
| ------------------------------------ | --------------------------- | ------------------------------------------------------------------------ |
| High blocked count, shared blockers  | Decision starvation         | Which decisions are blocking? Why aren't they decided?                   |
| High blocked count, diverse blockers | Multiple independent issues | List each blocker, triage individually                                   |
| WIP piled at DECIDE                  | Input overload              | Too many items entered DECIDE? Or decisions aren't moving?               |
| WIP piled at MAKE, high rework       | Quality problem             | PATCH or DECIDE producing bad specs?                                     |
| WIP piled at MAKE, items sitting     | Build paralysis             | AI needs clearer instructions? Context constellation incomplete?         |
| Empty downstream stations            | Starvation                  | Upstream isn't feeding. Why?                                             |
| Velocity zero                        | Systemic stop               | Is it DECIDE (no decisions), MAKE (no builds), or SHAPE (no prototypes)? |

### Step 3: Trace the dependency chain

For blocked items, read the "Highest-Leverage Moves" section of the dashboard. Then:

1. For each high-leverage decision, read the issue:
   ```bash
   gh issue view <number> -R sociotechnica-org/lifebuild
   ```
2. Check: Is it Ready but undecided? → Human action needed.
3. Check: Is it Blocked by another decision? → Trace further.
4. Check: Is the decision genuinely hard (needs more info)? → Flag as needing SHAPE work.

For build dependencies:

1. Are upstream builds (like Hex Grid) blocking downstream builds?
2. Are those upstream builds themselves blocked? → Trace to the decision.
3. Or are they Ready but not started? → Resource allocation issue.

### Step 4: Find the root cause

The root cause is the single thing that, if fixed, resolves the most symptoms. It's almost always one of:

| Root Cause              | Signal                                                     | Fix                         |
| ----------------------- | ---------------------------------------------------------- | --------------------------- |
| **Undecided decisions** | Multiple items blocked by the same D-number                | Make the decision           |
| **Missing context**     | Builders blocked because they don't know what to build     | Run Conan → Bob (PATCH)     |
| **Wrong sequencing**    | Items started before their dependencies were ready         | Re-sequence the board       |
| **Resource mismatch**   | One person is the bottleneck, others are idle              | Redistribute or pair        |
| **Scope creep**         | Items growing beyond original spec, never finishing        | Split the item              |
| **Decision debt**       | Quick decisions deferred too long, now blocking everything | Schedule a decision session |

### Step 5: Prescribe

State the root cause. State the fix. Be specific.

Format:

```
ROOT CAUSE: [one sentence]
FIX: [specific action]
WHO: [person]
UNBLOCKS: [list of items that will move]
```

If there are multiple root causes, rank by cascade (how many items each fix unblocks).

### Step 6: Check for systemic patterns

After the immediate triage, look for patterns that suggest recurring problems:

- Are the same types of decisions repeatedly blocking? → DECIDE station needs a different process.
- Is the same person always the bottleneck? → Capacity or delegation issue.
- Are library patches always needed before builds? → Build PATCH into the default flow.
- Are blocked counts trending up over time? → The system itself is the problem.

Flag systemic issues with `**SYSTEMIC:**` prefix. These need human judgment, not just a fix.

## Output Format

```
# Triage Report

**Date:** [date]
**Symptom:** [one sentence]
**Severity:** [Critical / Significant / Minor]

## Root Cause

[One sentence description]

## Evidence

- [data point 1]
- [data point 2]
- [data point 3]

## Prescription

### Immediate (do now)

| Action | Who | Item | Unblocks |
|--------|-----|------|----------|
| [action] | [person] | #[number] | [n] items |

### Short-term (this week)

- [action]

### Systemic (if pattern)

- **SYSTEMIC:** [pattern description] — needs [process change / capacity change / structural fix]

## Cascade Forecast

If prescription is followed:
- [n] items unblocked immediately
- [n] items unblocked within [timeframe] (dependent on builds completing)
- Projected blocked count after fix: [n]
```

## Severity Levels

| Level       | Criteria                                                           |
| ----------- | ------------------------------------------------------------------ |
| Critical    | >50% items blocked, velocity at zero, no clear path forward        |
| Significant | 30-50% items blocked, velocity below target, root cause identified |
| Minor       | <30% items blocked, velocity close to target, isolated issue       |

## Principles

- Root cause, not symptom. "7 items blocked" is the symptom. "D5 undecided" is the cause.
- One root cause if possible. Multiple root causes = probably haven't traced far enough.
- Fix the constraint, not the symptom. Don't shuffle items around a blocked decision.
- Cascade matters more than count. One fix that unblocks 5 items > five fixes that unblock 1 each.
- Flag systemic issues separately. Immediate triage fixes today. Systemic fixes prevent tomorrow.
