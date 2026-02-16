# System - Adaptation

## WHAT: Definition

The invisible mechanism governing how weekly commitments change after planning. Builders don't consciously "use" Adaptation — they just change their plans. The system manages state transitions when projects are paused, replacements promoted, Bronze mode adjusted, or emergency work inserted. Adaptation ensures these mutations follow consistent rules while feeling effortless.

## WHERE: Scope

- Zones:
  - [[Zone - Life Map]] — adapted plans reflect across the map
- Rooms:
  - [[Room - Project Board]] — pause action originates here
- Capabilities:
  - [[Capability - Weekly Planning]] — adaptation modifies planning outputs
- Primitives:
  - [[Primitive - Project]] — projects transition between states
  - [[Primitive - Task]] — Bronze tasks shift with mode changes
- Implements:
  - [[Standard - Project States]] — pause/promote follow state transition rules
  - [[Standard - Planning Calibration]] — adaptation follows hypothesis framing
  - [[Standard - Visual Language]] — state transitions update visual treatments
- State:
  - Current position assignments on [[Overlay - The Table]]
  - Bronze mode setting (Minimal/Target/Maximal)
  - Priority Queue ordering
- Transitions:
  - Pause Gold/Silver project -> returns to [[System - Priority Queue Architecture]] (top position)
  - Promote from queue -> fills vacated position
  - Emergency insertion -> bypasses queue, goes directly to [[Overlay - The Table]]
  - Bronze mode change -> stack updates immediately
- Processing:
  - [[Agent - Marvin]] — supports transitions, no judgment
- Rationale:
  - [[Principle - Plans Are Hypotheses]] — adaptation is expected
  - [[Strategy - Superior Process]] — structured flexibility

## WHY: Rationale

- Principle: [[Principle - Plans Are Hypotheses]] — plans change; that's leadership, not failure
- Strategy: [[Strategy - Superior Process]] — adaptation has structure, not chaos
- Driver: Life doesn't wait for Friday planning. Builders need to respond to change without guilt or friction.
- Constraints: Adaptation carries no guilt tax. The system never frames mid-week changes as failure. Modification UI feels like adjusting strategy, not editing a failure report.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No adaptation system exists. No mid-week priority adjustments, no capacity sensing, no automatic Table modifications. Builders manually manage all changes via the Sorting Room.

Core system. Adaptation mechanics designed to feel supportive, not punitive.

## HOW: Implementation

**Pause-and-Replace (Gold/Silver positions):**

- Click project on The Table -> Open Project Board
- Click Pause button
- Paused project returns to Priority Queue (top position)
- Slot opens; builder chooses:
  1. Promote from queue — select different project
  2. Create emergency — new project jumps to position
  3. Leave empty — intentional gap for remainder of week

**Mode Change (Bronze position):**

- Click gear icon on Bronze position
- Select new mode (Minimal/Target/Maximal)
- If Target, adjust number
- Stack updates immediately

**Emergency Insertion:**

- Created via [[Room - Drafting Room]] with "urgent" flag
- Skips normal queue positioning
- Can go directly to [[Overlay - The Table]]
- Jarvis notes for pattern tracking

**Tone throughout:**

- Never "you failed to complete"
- Always "circumstances changed"
- Adaptation framed as responsive leadership

### Examples

- Builder's parent falls ill on Tuesday -> builder opens The Table -> pauses Gold project "Career Course" -> slot opens -> builder selects "Leave empty" -> Bronze mode switches to Minimal -> the week reshapes around care without guilt or friction.
- Sprint at work demands unexpected effort -> builder opens Bronze position -> switches from Target +3 to Maximal -> operational tasks surface to match the week's intensity -> no judgment about the change, just responsive adaptation.

### Anti-Examples

- **Requiring a justification when pausing a Gold project** — adaptation is leadership, not deviation. A "reason for change" dialog treats modification as failure requiring explanation. The system should feel like adjusting strategy, not filing an incident report.
- **Displaying "Gold project incomplete" in the end-of-week summary after a deliberate pause** — the project was paused (a strategic choice), not failed. Language must distinguish between "didn't finish" and "chose to redirect."
