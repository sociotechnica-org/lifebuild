# Standard - Onboarding Sequence

## WHAT: Definition

The specification for the day-by-day first 72 hours experience: what happens each day, which features unlock when, which agents appear in what order, and the progressive disclosure rules that prevent overwhelm while building momentum.

## WHERE: Ecosystem

- Conforming: [[Artifact - The Charter]] — initial version created during Day 2
- Conforming components: [[Component - Campfire]] — Day 1 first-contact point
- Implemented by: [[System - Onboarding]] — executes the sequence
- Implements: [[Principle - First 72 Hours]] — makes onboarding sequence testable

## WHY: Rationale

- Principle: [[Principle - First 72 Hours]] — the first 72 hours define the relationship
- Driver: Without a sequenced spec, features compete for attention during onboarding, creating cognitive overload and abandonment.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-10):** No onboarding sequence exists. No Day 1/2/3 structure, no progressive feature introduction, no Campfire first-contact. New users see the full UI immediately with no guided path.

### History

**2026-02-17 — #614: Mesa → Jarvis in onboarding**
D4 resolved: category room agents removed for R1. Mesa references in onboarding sequence replaced with Jarvis. Jarvis handles all agent interactions in R1.

## HOW: Specification

### Rules

#### Day 1: Welcome & Orient

| Step             | Actor                        | Outcome                      |
| ---------------- | ---------------------------- | ---------------------------- |
| Warm greeting    | Jarvis at Campfire           | Builder feels welcomed       |
| Spatial metaphor | Life Map introduction        | "This is a map of your life" |
| First project    | Builder creates (low stakes) | "I made something"           |

**Emotional target:** "I made something."
**Constraint:** Only Campfire, Life Map basics, and project creation are available.

#### Day 2: Meet the Team

| Step                 | Actor                   | Outcome                           |
| -------------------- | ----------------------- | --------------------------------- |
| Jarvis introduction  | Council Chamber unlocks | Builder meets planning advisor    |
| Charter conversation | Jarvis guides           | Values and current focus captured |
| Second project       | Marvin in Drafting Room | "I have help"                     |

**Emotional target:** "I have help."
**Constraint:** Strategy Studio unlocks. Sorting Room not yet available.

#### Day 3: Establish Rhythm

| Step                   | Actor                          | Outcome                            |
| ---------------------- | ------------------------------ | ---------------------------------- |
| Sorting Room visit     | Marvin guides                  | Builder prioritizes for first time |
| Work at Hand selection | Builder chooses (even minimal) | First weekly commitment            |
| Table populated        | System displays selections     | "I know what to do each week"      |

**Emotional target:** "I know what to do each week."
**Constraint:** Full feature set now available. Progressive disclosure complete.

#### Progressive Disclosure Rules

| Rule                | Requirement                                      |
| ------------------- | ------------------------------------------------ |
| Feature unlock      | Features unlock as relevant, not all at once     |
| Day 1 scope         | Campfire + Life Map + project creation only      |
| Never show on Day 1 | The Table, Sorting Room, full agent capabilities |
| Each day            | One primary emotional outcome                    |
| Framing             | "You can explore more later" throughout          |
| Tone                | Warm, patient, encouraging                       |

### Examples

**Example 1: Successful Day 1 completion**

- Scenario: New builder opens LifeBuild for the first time.
- Input: Builder arrives at the app with no prior context.
- Correct output: Jarvis greets at Campfire. Builder sees the Life Map with the spatial metaphor introduction. Builder creates a low-stakes first project (e.g., "Organize Desk"). The Table, Sorting Room, and agent capabilities are hidden. Session ends with the builder having created a visible artifact on their Life Map. Emotional outcome: "I made something."

**Example 2: Day 2 progressive unlock**

- Scenario: Builder returns for second session.
- Input: Builder has completed Day 1 (first project created).
- Correct output: Council Chamber unlocks. Jarvis introduces himself and guides a Charter conversation to capture values and current focus. Drafting Room becomes available with Marvin. Builder creates a second project with Marvin's help. Sorting Room remains locked. Builder leaves feeling "I have help" — the AI team is capable and supportive.

### Anti-Examples

- **Full feature tour on Day 1** — Day 1 has one job: spatial metaphor + first project + "I made something." Showing The Table, Sorting Room, and agent capabilities creates cognitive overload and abandonment.
- **Requiring profile completion before first project creation** — every field between arrival and first "I made something" moment is friction. Builders should create their first project within minutes.
- **Day 1 ending without builder having created something tangible** — if the first session ends without a visible artifact, the tool feels hollow. The first project (low stakes, quick win) establishes that LifeBuild produces, not just organizes.

### Conformance Test

1. Walk through Day 1 as a new builder and verify that only Campfire, Life Map basics, and project creation are available — The Table, Sorting Room, and full agent capabilities must be hidden.
2. Verify that each day has exactly one primary emotional target and that the UI/agent interactions are designed to produce that outcome ("I made something" / "I have help" / "I know what to do each week").
3. On Day 2, confirm the Sorting Room remains locked and only unlocks on Day 3 when the builder is ready to prioritize.
