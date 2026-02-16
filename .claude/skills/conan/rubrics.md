# Rubrics

All sections 20% weight. Phase: Vision Capture.

## WHAT

Criteria: Standalone, Specific, Complete

| Grade | Criteria                                                |
| ----- | ------------------------------------------------------- |
| A     | All three met. 2-4 sentences. Reader fully understands. |
| B     | All three met, one weak.                                |
| C     | One criterion missing.                                  |
| D     | Two missing. Reader confused.                           |
| F     | Empty, placeholder, or pointer only.                    |

Failure example: "The settings for Bronze mode." → F (pointer, not definition)

## WHY

Criteria: Strategy linked (with explanation), Rationale present, Driver traced

| Grade | Criteria                                               |
| ----- | ------------------------------------------------------ |
| A     | Full causal chain. Alternatives/tensions acknowledged. |
| B     | Strategy + driver + rationale. No tensions.            |
| C     | Thin explanation OR missing driver.                    |
| D     | Vague strategy reference, no real rationale.           |
| F     | Empty or no strategic connection.                      |

**Trace Test:** Follow strategy links. If upstream is stub → penalize downstream card.

Failure example: "Strategy: [[Visual Work]]" → D (naked link)

## WHERE

Criteria: 3+ links, All contextualized, Bidirectional, Conformance present

| Grade | Criteria                                                                                |
| ----- | --------------------------------------------------------------------------------------- |
| A     | Rich ecosystem map. All categories with context. Conformance links where obligated.     |
| B     | Key relationships present. May miss one category. 3+ links. Conformance present or N/A. |
| C     | Naked links OR one direction only OR <3 links OR missing conformance.                   |
| D     | 1-2 links, mostly naked.                                                                |
| F     | Empty.                                                                                  |

Naked link: `[[Priority Queue]]` → penalize
Contextualized: `[[Priority Queue]] — provides candidate tasks` → credit

**Conformance Check:** Card touches governed domain? → conformance link required.

Missing conformance when obligated = C ceiling for WHERE.

See Library Reference → Conformance Obligations table.

## HOW

Criteria: Sufficient for builder, Examples present, Anti-examples present, Separated (no rationale)

| Grade | Criteria                                                                    |
| ----- | --------------------------------------------------------------------------- |
| A     | Builder could implement. ≥2 examples. ≥1 anti-example. Clear behavior spec. |
| B     | Clear direction. Has examples OR anti-examples but not both.                |
| C     | Vague. Missing examples. Significant clarification needed.                  |
| D     | Restates WHAT, no implementation detail, no examples.                       |
| F     | Empty.                                                                      |

**Examples check:** Concrete input → output? Not abstract descriptions?
**Anti-examples check:** Shows what wrong implementation looks like?

**Enumeration flag:** Table of types/modes in HOW → note AUDIT SIGNAL.

## WHEN (Vision Capture)

Binary pass/fail — structural readiness only.

| Grade    | Criteria                                                                 |
| -------- | ------------------------------------------------------------------------ |
| PASS (A) | Section exists. Temporal status marked. Known predecessors acknowledged. |
| FAIL (F) | Section missing OR ignores known predecessors.                           |

## Misclassification Signals

Flag during grading, don't halt. Complete grade + note AUDIT SIGNAL.

| Signal                                                           | Suggests               |
| ---------------------------------------------------------------- | ---------------------- |
| WHAT says "mechanism," "manages state," "processes"              | System                 |
| WHAT says "specification," "defines values," "must conform"      | Standard               |
| WHAT says "principle," "guides," "judgment-based"                | Principle              |
| Card typed as Room but builders don't navigate TO it             | Structure or Component |
| Card typed as Structure but builders navigate TO it              | Room                   |
| Card typed as Room but is top-level workspace                    | Zone                   |
| Card has no state but constrains other cards                     | Standard               |
| Card typed as Component but is a content object                  | Artifact               |
| Card typed as Component but builders don't consciously invoke it | System                 |
| Card typed as Component but name/description uses action-words   | Capability             |
| Card typed as Component but describes a process/workflow         | Capability             |
| Card typed as Structure but persists across all zones            | Overlay                |
| Card typed as Room but describes an action/workflow              | Capability             |
| Agent card has no Prompt card                                    | Prompt missing         |
| HOW has behavioral types table                                   | Needs decomposition    |
| Missing containment link (Room→Zone, Structure→Room, etc.)       | Structural deficiency  |

## Type-Specific Notes

**Standards:**

- WHERE uses "Conforming:" to list constrained cards (Rooms, Structures, Components, Overlays, Agents)
- WHY must link to Principle (Standards implement Principles)
- HOW contains the specification itself (values, rules, thresholds)
- Must have Anti-Examples section (what violation looks like)

**Principles:**

- WHERE uses "Standards:" to link to implementing Standards
- WHY focuses on belief/evidence, not driver
- Must have "What Violating This Looks Like" section

**Strategies:**

- Must have "What Violating This Looks Like" section
- WHY must have reasoning, not just assertion

**Zones:**

- WHERE must list contained Rooms
- Must describe cognitive mode (planning vs. executing vs. reflecting)
- Must describe navigation pattern (entry/exit points)

**Rooms:**

- WHERE must link to parent Zone (containment)
- WHERE must link to resident Agent (if any)
- Must describe workflow (entry → steps → exit)
- Must list contained Structures, Artifacts, Capabilities

**Overlays:**

- WHERE must specify visibility scope (which zones, or "all")
- Must describe display states and update triggers
- Must explain why it needs cross-zone persistence

**Structures:**

- WHERE must link to parent Room (containment)
- Must describe layout and interaction model
- Must list contained Components

**Components:**

- WHERE must link to parent (Structure, Room, or Overlay)
- Must describe states, interactions, accessibility

**Artifacts:**

- WHERE must link to Room where created/edited
- Must describe lifecycle (created → updated → archived)
- Must describe ownership/permissions if relevant

**Capabilities:**

- WHERE must link to Room(s) where performed
- Must describe trigger → steps → outcome
- Must list what Primitives/Artifacts it operates on

**Agents:**

- WHERE must link to home Room
- Must describe voice/personality, responsibilities, boundaries
- Must link to Prompt card (implementation)
- Must specify handoff relationships with other agents

**Prompts:**

- WHERE must link to parent Agent
- Must include actual prompt text
- Must have version and changelog
