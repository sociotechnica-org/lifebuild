# Room - System Board

## WHAT: Definition

The detail overlay that opens when a builder clicks any system tile — a focused view showing system health, configuration, generated tasks, cycle history, and available actions. The System Board is where builders monitor and manage their continuous infrastructure.

## WHERE: Ecosystem

- Zone: [[Zone - Life Map]] — opens as overlay
- Capabilities:
  - [[Capability - System Actions]] — Hibernate, Upgrade, Uproot available here
- Adjacent:
  - [[Room - Project Board]] — same pattern for projects
- Conforms to:
  - [[Standard - Visual Language]] — health indicators, state treatments
- Displays: [[Primitive - System]] — all system details
- Displays: Generated tasks — what the system produces

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — systems need monitoring interface
- Principle: [[Principle - Visibility Creates Agency]] — system health visible, not hidden
- Driver: Builders need to see how their infrastructure is performing. The System Board answers "is this system healthy?"
- Constraints: System Board monitors infrastructure health, not builder productivity. System health reflects cycle adherence and task generation, not how much the builder accomplished. Yellow is attention, Red is concern — neither is judgment.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No System Board exists in the codebase. The System primitive is not implemented — no system tiles, no health indicators, no cycle tracking. No route or UI component for system management.

Core to [[Zone - Life Map]] design. System Board parallels Project Board for the other tool type.

## HOW: Implementation

**Contents:**

- Header: Title, category, health indicator, state
- Task Templates: Recurring items with individual cadences
- Generated Tasks: What this system's templates produce for Bronze
- Cycle History: Recent executions, completions, misses
- Health Metrics: Cycle adherence, task completion rate
- Actions: Hibernate, Upgrade, Uproot, Edit

**Overlay behavior:**

- Opens over [[Zone - Life Map]] (grid visible behind, dimmed)
- Close to return to grid
- Can navigate to related Project Boards

**Health display:**

Health is a snapshot of the system's current state of care — "does the builder need to act right now?" — not a rolling average of historical performance.

- Green: Healthy — current obligations met, system running smoothly
- Yellow: Attention — current cycle has items needing attention
- Red: Struggling — system is significantly behind on current obligations

A system that was poorly maintained for months but was just overhauled shows Green. A system with one overdue task right now shows Yellow even if its historical record is excellent. Health answers "what needs attention now?"

**Smoke Signals:** If system health degrades, [[System - Smoke Signals]] triggers alerts visible from [[Zone - Life Map]].

### Examples

- Builder opens "Morning Routine" system tile → System Board shows: health Green, 12/14 cycles completed this month, 3 Bronze tasks generated this week, next cycle tomorrow → builder sees the system is healthy and producing expected work.
- System Board shows health Yellow for "Weekly Meal Prep" → detail: this week's "prep ingredients" template task is overdue by 2 days → builder clicks "Edit" → adjusts that template's cadence from daily to 3x/week → template reconfigures → current obligations for that template reset → health returns to Green.

### Anti-Examples

- **System Board showing only a health color dot without supporting data** — Green/Yellow/Red must include the data behind the assessment. "Yellow" means nothing without "meal prep task overdue by 2 days." Color without context is useless. Data should reflect current state, not historical averages.
- **Treating Yellow health status as an emergency requiring immediate action** — Yellow is attention, not alarm. The smoke signal surfaces awareness; the builder decides when and whether to investigate. No popup, no forced action.
