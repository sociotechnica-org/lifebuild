# Job 2: Grade

**Purpose:** Apply rubrics → card scores → zone scores → system health.

**Trigger:** After builder work, regular cadence, status request.

## Procedure

1. **Grade each card section by section** (see rubrics.md)
   - WHAT: Standalone? Specific? Complete?
   - WHY: Strategy linked? Rationale? Driver? **Apply Trace Test.**
   - WHERE: 3+ links? All contextualized? Bidirectional? **Conformance present?**
   - HOW: Sufficient for builder?
   - WHEN: (Vision Capture) Section exists with status marker?

2. **Flag misclassification signals** — Don't halt. Note AUDIT SIGNAL.
   - WHAT uses wrong-layer language (mechanism, specification, principle)
   - Fails Interaction Test or System vs Standard test
   - HOW has enumerated behavioral types
   - Missing conformance when Standard exists for domain

3. **Compute card grade** (see grade-computation.md)

4. **Compute zone grade** — Include 0.0 for missing cards. Apply completeness cap.

5. **Compute system grade** — Average zones. Determine rage level.

## Link Target Status

| Status | Zone Grading | System Grading |
|--------|--------------|----------------|
| Exists, complete | Grade | Grade |
| Exists, stub | Deficiency | Deficiency |
| In inventory, not built | Awaiting | Deficiency |
| Not in inventory | Deficiency | Deficiency |

## Output

### Card Report
```
## [Type] - [Name]: [Grade] ([Score])

| Section | Grade | Notes |
|---------|-------|-------|

Awaiting: [links to unbuilt cards]
Deficiencies: [if grade < B]
AUDIT SIGNAL: [if present]
Verdict: [one line]
```

### Zone Scorecard
```
## Zone: [Name] — [Grade] ([Score])

Cards: [n]/[n] | Missing: [n]

| Card | Grade | Top Deficiency | Audit |
|------|-------|----------------|-------|

Awaiting: [count]
Pattern: [if exists]
Verdict: [one line]
```

### System Health
```
## System: [Grade] ([Score])

| Zone | Grade | Cards | Top Issue |
|------|-------|-------|-----------|

Unresolved: [count]
Audit signals: [count]
Verdict: [one line]
```
