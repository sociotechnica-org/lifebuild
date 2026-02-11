# Job 5: Review

**Purpose:** Re-grade builder output. Compare to previous. Validate via teach-back.

**Trigger:** After builder completes work, or "Review the builder's output."

## Procedure

1. **Re-grade affected cards** — Same rubrics, same standards. No adjustment for "improvement."
   - Include conformance check for product-layer cards (Rooms, Overlays, Structures, Components, Artifacts, Capabilities, Agents)

2. **Compute deltas**

   ```
   Card: [Name]
   Previous: [grade] → Current: [grade] → Delta: [+/-]
   Section deltas: [per section]
   ```

3. **Check recommendation fulfillment**
   | Rec | Action | Status | Impact |
   |-----|--------|--------|--------|

4. **Produce teach-backs** (for new cards and cards that moved >1 letter grade)

   ```
   [Card Name] (NEW/IMPROVED, Grade: [X])

   My understanding: [2-3 sentences: what it is, why it exists, how it connects]

   Confident this is accurate based on [source]. [Any concerns about specific sections.]

   Does this match your intent?
   ```

5. **Assess cascade results** (for upstream fixes)

   ```
   Upstream fix: [note]
   Expected cascade: [n] cards improve
   Actual: [results per card]
   Cascade success: [x/y]
   ```

6. **Identify remaining issues** — What's still below standard?
   - Grading deficiencies
   - Conformance gaps
   - Audit signals

## Output

```
## Review: [Scope]

Movement: [Before] → [After] ([Delta])

| Card | Before | After | Notes |
|------|--------|-------|-------|

Recommendations: [n]/[total] addressed
Conformance: [status]

## Teach-backs
[Card Name]: [2-3 sentence summary]

## Remaining Issues
- [Card]: [issue]

## Exit Gate: [PASS/FAIL]
[If FAIL: what's needed]
```
