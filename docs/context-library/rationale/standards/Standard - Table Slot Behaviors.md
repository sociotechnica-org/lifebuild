# Standard - Table Slot Behaviors

## WHAT: Definition

The specification for visual treatment and interaction behavior of empty Gold and Silver slots on The Table — distinguishing between "not yet selected" (planning incomplete) and "intentionally empty" (strategic choice), with rules for agent behavior around empty slots.

## WHERE: Ecosystem

- Conforming overlay: [[Overlay - The Table]] — renders empty slot visual states
- Conforming capabilities: [[Capability - Weekly Planning]] — slot selection includes intentional-empty option
- Conforming components: [[Component - Gold Position]] — Gold empty state behavior
- Conforming components: [[Component - Silver Position]] — Silver empty state behavior
- Implements: [[Principle - Empty Slots Strategic]] — makes intentional emptiness testable

## WHY: Rationale

- Principle: [[Principle - Empty Slots Strategic]] — an empty slot can be a deliberate choice
- Driver: Without explicit spec, empty slots default to "incomplete" visual treatment that pressures directors to fill them, undermining the capacity-first philosophy.

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-10):** Gold/Silver/Bronze slots on The Table are implemented with empty and filled states. However, no visual distinction between "not yet selected" and "intentionally empty." No agent awareness of empty-slot intent. The empty state exists but isn't differentiated by intent.

## HOW: Specification

### Rules

#### Empty Slot States

| State | Visual Treatment | Meaning | Affordance |
|-------|-----------------|---------|------------|
| Not selected yet | Subtle outline, gentle prompt | Planning incomplete — director hasn't chosen | Action affordance present |
| Intentionally empty | Calm, solid, distinct visual | Strategic choice — director chose restraint | No action prompt |

#### Visual Requirements

- "Not selected yet" may include a subtle action affordance (e.g., "Select Gold project")
- "Intentionally empty" must look calm and intentional, not alarming
- No red borders, exclamation marks, or warning indicators on intentionally-empty slots
- Both states must be visually distinct from each other
- Intentionally-empty uses a calm, warm visual — not absence but presence of rest

#### Interaction Rules

| Rule | Requirement |
|------|-------------|
| Setting intentional-empty | One deliberate action, not multi-step |
| Agent check | Agents check intent once when slot is empty, then accept |
| Repeat prompting | Prohibited for intentionally-empty slots |
| Metrics | Do not penalize weeks with intentionally-empty slots |

#### Agent Behavior

- Cameron checks intent once: "Taking a lighter week?" — accepts response
- No follow-up: "are you sure you don't want a Gold project?"
- Jarvis frames empty weeks as strategic: "investing in capacity" not "missing Gold"
- Weekly summary recognizes intentional restraint, does not report "0/1 Gold completed"

### Examples

**Example 1: Director intentionally leaves Gold slot empty**
- Scenario: Director has a demanding Silver infrastructure project this week and decides not to take on a Gold transformation project.
- Input: During weekly planning, director selects "intentionally empty" for the Gold slot.
- Correct output: Gold slot renders with a calm, solid visual — warm presence of rest, not an alarming gap. Cameron asks once "Taking a lighter week?" and accepts the response. No further prompts about the Gold slot appear during the week. Weekly summary at week's end says "Strategic rest week — capacity invested in Silver infrastructure" rather than "0/1 Gold projects completed."

**Example 2: Distinguishing "not yet selected" from "intentionally empty"**
- Scenario: Director opens The Table on Monday morning but hasn't done weekly planning yet.
- Input: Gold and Silver slots are empty because planning hasn't occurred.
- Correct output: Both slots show "not yet selected" visual treatment — subtle outline with a gentle action affordance ("Select Gold project"). This is visually distinct from the "intentionally empty" calm solid visual. When the director taps a slot, they can either choose a project OR mark the slot as intentionally empty with a single action.

### Anti-Examples

- **Red border or exclamation mark on an empty Gold slot** — treats emptiness as error. Intentionally-empty slots should feel calm and intentional, communicating strategic restraint.
- **Cameron asking "are you sure you don't want a Gold project?" after director chose intentional rest** — agent already checked intent and should accept the choice. Repeated prompting undermines director autonomy.
- **Weekly summary showing "0/1 Gold projects completed" for intentionally-empty weeks** — frames strategic rest as zero performance. The metric should recognize intentional restraint as a valid outcome.

### Conformance Test

1. Set a Gold slot to "intentionally empty" and verify the visual treatment is calm and warm (no red borders, exclamation marks, or warning indicators) and visually distinct from the "not yet selected" state.
2. After setting a slot to intentionally empty, verify that agents check intent exactly once and do not prompt again during the week about filling the slot.
3. Complete a week with an intentionally-empty Gold slot and verify the weekly summary frames the choice as strategic ("capacity invested") rather than as a deficit ("0/1 Gold completed").
