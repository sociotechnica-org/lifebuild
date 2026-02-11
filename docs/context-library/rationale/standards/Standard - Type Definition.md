# Standard - Type Definition

## WHAT: Definition

A Standard is an implementation specification that constrains how features and components are built. Standards have no runtime state and perform no computation — they define what implementations must conform to.

Standards sit between Principles (what guides decisions) and Features/Components (how things are built). A Principle says "directors should recognize elements instantly." A Standard says "Jarvis is cobalt blue #2B5C9E, 10-30 strokes, rounded endpoints."

## WHERE: Ecosystem

- Upstream: [[Principle]] cards — Standards implement Principles
- Downstream: [[Feature]] and [[Component]] cards — must conform to Standards
- Sibling types: [[System]] (has state, computes), [[Feature]] (directors interact)

## WHY: Rationale

- Driver: The "Angry Birds problem" — agents building without specification constraints produce technically correct but wrong outputs (blue bird instead of red bird)
- Decision: Standards are a distinct type because specifications require different treatment than mechanisms. A builder reads Standards to know what to produce; a builder reads Systems to understand how things work.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** This is a meta-card defining the Standard type within the context library taxonomy. The type definition is active and used — all Standard cards in the library conform to this classification. This is documentation infrastructure, not runtime code.

## HOW: Classification

### Rules

#### Decision Tree Position

```
WHAT exists?
├─ Directors consciously interact? → FEATURE/COMPONENT
├─ NO + foundational mechanism (has state, computes) → SYSTEM
└─ NO + implementation specification (constrains, no state) → STANDARD
```

#### Interaction Test

| Question                    | System    | Standard         |
| --------------------------- | --------- | ---------------- |
| Has runtime state?          | Yes       | No               |
| Processes inputs?           | Yes       | No               |
| Other things conform to it? | Sometimes | Always           |
| Changes require code?       | Yes       | No (spec update) |
| Builder reads to implement? | Rarely    | Always           |

#### Card Structure

Standards use the same five sections (WHAT/WHERE/WHY/HOW/WHEN) with these adaptations:

- **WHAT:** What this standard specifies
- **WHERE:** What features/components must conform to it
- **WHY:** Which principles it implements
- **HOW:** The specification itself (values, rules, constraints)
- **WHEN:** Stability status, change history

### Examples

**Example 1: Correctly classifying a specification card**

- Scenario: A card defines the color palette for all life categories — Health is vibrant green, Finances is gold/amber, etc.
- Input: The card has no runtime state, processes no inputs, and multiple components must conform to it.
- Correct output: Type = Standard. The card passes all five interaction test questions on the Standard column (no state, no processing, always conformed to, spec update not code, builders read it).

**Example 2: Distinguishing Standard from System**

- Scenario: A card specifies the formula for computing priority scores: (Urgency x Importance) / Effort with stream-specific weightings.
- Input: The card defines the formula but does not execute the calculation itself. The Processing Layer implements the calculation.
- Correct output: Type = Standard (defines the spec). A separate System card (Processing Layer) has the runtime state and performs the computation. The formula card is read by builders to implement correctly.

### Anti-Examples

- **Classifying a specification card as a System because it "feels foundational"** — Systems have runtime state and process inputs. A card that defines visual colors, interaction rules, or scoring formulas is a Standard, not a System. The test: does it compute anything? If no, it's a Standard.
- **Creating a Standard with no conforming Features or Components** — Standards constrain implementations. A Standard that nothing conforms to is either mistyped (should be a Principle or guideline) or missing its conformance wiring. Every Standard should have at least one conforming downstream card.
- **Writing a Standard's HOW section as behavioral description instead of specification** — Standards specify what implementations must produce, not how they behave at runtime. "The system calculates priority scores" is System language. "Priority scores are computed as: importance x 0.4 + urgency x 0.3 + momentum x 0.3" is Standard language.

### Conformance Test

1. Apply the five-question interaction test to the card: Does it have runtime state? Does it process inputs? Do other things conform to it? Do changes require code or spec update? Do builders read it to implement? Confirm all answers match the Standard column.
2. Verify the card has at least one conforming downstream card listed in its WHERE section.
3. Check the HOW section uses specification language ("X must be Y", "computed as", "defined as") rather than behavioral language ("the system does X").
