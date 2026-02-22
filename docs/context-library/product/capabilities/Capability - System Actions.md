# Capability - System Actions

## WHAT: Definition

The three operations available for planted systems: Hibernate (pause temporarily), Upgrade (spawn improvement project), and Uproot (end deliberately). System Actions give builders control over their infrastructure lifecycle.

## WHERE: Ecosystem

- Room(s):
  - [[Room - System Board]] — where actions are performed
- Uses:
  - [[Primitive - System]] — the entity being acted on
  - [[Primitive - Project]] — Upgrade spawns a Silver project
  - [[Zone - Archives]] — Uproot moves history here
- Enables:
  - [[System - Smoke Signals]] — hibernating systems don't trigger missed-cycle signals
- Conforms to:
  - [[Standard - Three-Stream Portfolio]] — Upgrade spawns Silver stream projects

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — infrastructure needs lifecycle management
- Principle: [[Principle - Plans Are Hypotheses]] — systems can be adjusted as life changes
- Driver: Systems are long-lived but not permanent. Builders need ways to pause, improve, or end them.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No System Actions exist. Depends entirely on the System primitive and System Board, neither of which are implemented. No Hibernate, Upgrade, or Uproot functionality.

Core to system entity. Actions available from System Board for any planted system.

## HOW: Implementation

**Hibernate** — Pause temporarily

- Use case: "I'm traveling for a month — pause hot tub maintenance"
- Configuration preserved, no outputs generated
- Can reactivate anytime
- Different from Uproot: builder expects to return

**Upgrade** — Improve the system

- Use case: "Oil changes are too frequent — research and optimize"
- Spawns a Silver project to improve the system
- System continues running during upgrade work
- Completed upgrade modifies system's task templates, cadences, or configuration

**Uproot** — End deliberately

- Use case: "Sold the car — don't need car maintenance anymore"
- Full history preserved in Archives
- System removed from Life Map
- Permanent action (can create new system later if needed)
