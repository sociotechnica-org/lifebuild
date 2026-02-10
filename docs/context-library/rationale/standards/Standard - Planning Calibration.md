# Standard - Planning Calibration

## WHAT: Definition

The specification for how planning interfaces frame plans as hypotheses, how agents communicate about plan changes, and how the system measures planning quality through calibration accuracy rather than completion rate.

## WHERE: Ecosystem

- Conforming: [[System - Adaptation]] — mid-week modification follows hypothesis framing
- Conforming rooms: [[Room - Sorting Room]] — priority rankings treated as testable predictions
- Conforming rooms: [[Room - Council Chamber]] — strategic conversations frame plans as hypotheses
- Conforming capabilities: [[Capability - Week-in-Review]] — review measures calibration accuracy, not completion
- Implements: [[Principle - Plans Are Hypotheses]] — makes hypothesis framing testable

## WHY: Rationale

- Principle: [[Principle - Plans Are Hypotheses]] — a weekly plan is a bet, not a commitment
- Driver: Without this spec, planning interfaces default to completion-tracking patterns that create guilt cycles and discourage adaptation.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No calibration tracking exists. No plan-vs-reality comparison, no estimation accuracy metrics, no hypothesis framing in the UI. Depends on Weekly Priority cadence and Week-in-Review capability, neither of which exist.

## HOW: Specification

### Rules

#### Framing Rules

| Context | Correct Framing | Wrong Framing |
|---------|-----------------|---------------|
| Plan modification | "Adjusting strategy" | "Editing failure report" |
| Weekly review | "Testing hypothesis" | "Measuring compliance" |
| Incomplete plan | "Calibration data" | "Underperformance" |
| Mid-week change | "Engaged leadership" | "Deviation from plan" |

#### Metrics

| Metric | Role | Notes |
|--------|------|-------|
| Calibration accuracy | **Primary** | How well plans predict reality. Tracked over time. |
| Estimation trend | Secondary | Are estimates getting more accurate week-over-week? |
| Completion rate | **Never primary** | May be tracked but never headlined or guilt-inducing |

#### Agent Tone Rules

- Jarvis never says "you didn't complete your Gold this week"
- Correct framing: "your Gold hypothesis was tested — what did you learn?"
- Language shapes whether directors avoid planning or embrace it
- Adaptation is presented as engaged leadership, not failure

#### Pause-and-Replace Pattern

- Mid-week plan modification is a legitimate strategy adjustment
- No justification dialog or "reason for change" field required
- Modification UI should feel like adjusting a strategy, not editing a failure report
- Changes logged for calibration data, not for accountability

### Examples

**Example 1: Weekly review framed as calibration**
- Scenario: Director planned 3 Gold tasks for the week and completed 2. The weekly review surfaces.
- Input: 2 of 3 Gold tasks completed. One was replaced mid-week with a different priority.
- Correct output: Week-in-Review says "Your calibration improved this week — estimates were closer to reality than last week. The mid-week adjustment to swap Task C for Task D shows engaged leadership." It does NOT say "You completed 67% of your plan" or "1 Gold task was not completed."

**Example 2: Mid-week plan modification without justification**
- Scenario: Director realizes Wednesday that their Silver project needs to be swapped for a more urgent one.
- Input: Director drags a new project into the Silver slot, replacing the current one.
- Correct output: The swap happens immediately with no "reason for change" dialog. The UI feels like adjusting a strategy board. The change is logged silently for calibration data. Cameron does not ask why the change was made.

### Anti-Examples

- **Jarvis saying "you completed 60% of your plan this week"** — frames plan as contract with a compliance score. Correct: "your calibration improved — estimates were 15% closer to reality this week."
- **Requiring a reason field when modifying Work at Hand** — treats adaptation as deviation requiring justification. Modification should feel like strategy adjustment, not failure documentation.
- **Dashboard showing completion percentage as the primary planning metric** — rewards rigidity over learning. Calibration accuracy and estimation trend should headline the planning dashboard.

### Conformance Test

1. Review the Week-in-Review output and verify it headlines calibration accuracy and estimation trend — not completion rate or percentage.
2. Modify a Work at Hand selection mid-week and confirm no justification dialog or "reason for change" prompt appears.
3. Check all agent-generated text about plan changes for hypothesis framing language ("adjusting strategy," "calibration data," "engaged leadership") and confirm no compliance language ("failed to complete," "deviation," "underperformance") is used.
