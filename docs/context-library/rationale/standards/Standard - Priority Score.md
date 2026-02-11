# Standard - Priority Score

## WHAT: Definition

The specification for computing priority ranking within streams: base formula plus stream-specific weightings that encode philosophical commitments about what each stream should prioritize. The Processing Layer implements this calculation.

## WHERE: Ecosystem

- Implemented by: [[System - Processing Layer]] — performs the calculation
- Used in: [[Room - Sorting Room]] — scores displayed during selection
- Used by: [[Agent - Cameron]] — surfaces recommendations based on scores
- Conforming rooms: [[Room - Sorting Room]] — displays scores, respects formula
- Conforming capabilities: [[Capability - Three-Stream Filtering]] — rankings within filtered views
- Implements: [[Principle - Familiarity Over Function]] — score suggests, director decides
- Depends on: [[Capability - Purpose Assignment]] — determines which weighting applies
- Related: [[Standard - Three-Stream Portfolio]] — defines the streams

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — systematic prioritization support
- Driver: Without stream weighting, the formula would rank Gold and Bronze on same criteria. Weightings encode philosophy: Gold amplifies Importance, Bronze amplifies Urgency, Silver rewards Leverage.
- Decision: Formula is hypothesis, not validated algorithm. Expect tuning based on override frequency and director feedback.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Priority scoring is implemented in the Priority Queue Architecture. Projects have urgency, importance, and other attributes that feed scoring. Stream-specific weighting (Gold amplifies importance, Bronze amplifies urgency) is functional. Processing Layer does not exist as a separate system — scoring runs client-side.

## HOW: Specification

### Rules

#### Base Formula

```
Priority Score = (Urgency × Importance) / Effort
```

#### Required Inputs

| Input      | Range           | Description         |
| ---------- | --------------- | ------------------- |
| Urgency    | 1-10            | Time-sensitivity    |
| Importance | 1-10            | How much it matters |
| Effort     | 1-10            | What it costs       |
| Deadline   | Date (optional) | External constraint |

#### Stream Weightings

| Stream | Adjustment              | Rationale                                 |
| ------ | ----------------------- | ----------------------------------------- |
| Gold   | Importance × 1.5        | Transformation chosen for significance    |
| Silver | Score × Leverage Factor | Infrastructure evaluated by future return |
| Bronze | Urgency × 1.5           | Maintenance surfaces time-sensitive first |

#### Override Policy

Director override is sacred. The score is a suggestion, never a mandate. Consistent overrides are data about the formula, not evidence the director is wrong.

### Examples

**Example 1: Gold stream weighting amplifies Importance**

- Scenario: Two Gold project candidates in the Sorting Room — "Write Novel" (Urgency 3, Importance 9, Effort 5) and "Fix Fence" (Urgency 7, Importance 4, Effort 3).
- Input: Base formula applied with Gold stream weighting (Importance x 1.5).
- Correct output: "Write Novel" score = (3 x (9 x 1.5)) / 5 = (3 x 13.5) / 5 = 8.1. "Fix Fence" score = (7 x (4 x 1.5)) / 3 = (7 x 6) / 3 = 14.0. Even with Gold weighting, "Fix Fence" scores higher due to urgency and low effort — but the director can override because the score is a suggestion. If the director consistently overrides toward high-Importance projects, that is calibration data for the formula.

**Example 2: Director override treated as calibration data**

- Scenario: Cameron recommends "Automate Invoicing" as the Silver pick based on score. Director chooses "Build Morning Routine" instead.
- Input: Director overrides the score-based recommendation.
- Correct output: The system accepts the override without friction or justification. The override is logged as calibration data. After 5 similar overrides, the system notes the pattern: "You consistently prioritize habit-building Silver projects over automation — should we adjust the Leverage Factor for routine-type work?"

### Anti-Examples

- **Applying the same weighting across all streams** — Gold amplifies Importance (x1.5), Bronze amplifies Urgency (x1.5), Silver rewards Leverage. Using a single ranking formula lets urgency dominate across all streams, which is exactly what the three-stream model prevents.
- **Treating score as a mandate and blocking director override** — The score suggests; the director decides. Preventing or discouraging override treats the formula as truth rather than hypothesis. Consistent overrides are signal to tune the formula.
- **Omitting Effort from the calculation** — Without dividing by Effort, a high-urgency, high-importance task that takes 40 hours ranks the same as one that takes 30 minutes. Effort keeps the score grounded in feasibility.

### Conformance Test

1. Compute the Priority Score for a project in each stream (Gold, Silver, Bronze) and verify the correct stream-specific weighting is applied (Gold: Importance x 1.5, Silver: Score x Leverage Factor, Bronze: Urgency x 1.5).
2. Override a score-based recommendation and verify no justification dialog appears, the override is accepted immediately, and the override is logged as calibration data.
3. Compare two projects with identical Urgency and Importance but different Effort values — verify the lower-effort project scores higher, confirming Effort is correctly used as a divisor.
