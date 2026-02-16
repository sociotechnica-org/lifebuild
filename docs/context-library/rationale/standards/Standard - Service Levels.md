# Standard - Service Levels

## WHAT: Definition

The specification for the progressive ladder (Levels 0-5) measuring how well the AI team knows a builder. This standard defines what knowledge corresponds to what service quality; the Knowledge Framework and Progressive Knowledge Capture implement the acquisition.

## WHERE: Ecosystem

- Implemented by: [[Standard - Knowledge Framework]] — organizes knowledge
- Implemented by: [[System - Progressive Knowledge Capture]] — acquires knowledge
- Implements: [[Principle - Compound Capability]] — service compounds over time
- Advances: [[Strategy - AI as Teammates]] — relationship depth creates value
- Used by: [[Agent - Jarvis]] — orchestrates progression
- Conforming systems: [[System - Service Level Progression]] — UI for level display and progression
- Related: [[Artifact - The Charter]] — living knowledge store

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — the difference between tool and teammate is knowledge depth
- Principle: [[Principle - Compound Capability]] — month-12 service should be dramatically better than month-1
- Decision: Six levels provide clear progression markers without false precision.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No service level system exists. No tiered progression, no level tracking, no differentiated agent behavior by engagement depth. All users receive the same agent capabilities regardless of usage history.

## HOW: Specification

### Rules

#### The Ladder

| Level | Name            | What's Known                                        | Service Level                              |
| ----- | --------------- | --------------------------------------------------- | ------------------------------------------ |
| 0     | Anonymous       | Nothing                                             | Generic tool — same advice for everyone    |
| 1     | Minimally Known | Per-project basics + weekly capacity + systems list | Priority math works, basic recommendations |
| 2     | Observed        | + behavioral patterns + system completion rates     | Calibrated estimates, pattern detection    |
| 3     | Profiled        | + explicit preferences, support network             | Personalized recommendations               |
| 4     | Deeply Known    | + comprehensive capacity model + health trends      | Strategic partnership, predictive guidance |
| 5     | Fully Mapped    | + integrations, continuous awareness                | Orchestrated life support                  |

#### Progression Mechanism

- Every conversation is an opportunity to learn
- Knowledge acquired through Progressive Knowledge Capture strategies
- Behavioral patterns emerge over time
- Integration sourcing unlocks at higher trust levels

#### Goal

Move every builder up the ladder through thoughtful observation and well-timed questions, not interrogation.

### Examples

**Example 1: Level 1 service — basic recommendations**

- Scenario: New builder has completed onboarding. System knows their projects, weekly capacity estimate, and planted systems.
- Input: Builder asks "What should I work on this week?"
- Correct output: Marvin uses Priority Score math to rank projects within each stream and presents top candidates. Recommendations are score-based only — no personalization, no pattern-based insights. Marvin does NOT say "based on your tendency to..." because behavioral patterns are not yet available at Level 1.

**Example 2: Level 2 service — pattern detection**

- Scenario: Builder has been using LifeBuild for 6 weeks. System has observed behavioral patterns: builder consistently underestimates Gold project effort by 30%.
- Input: Builder creates a new Gold project and estimates Effort as 4.
- Correct output: Conan detects the pattern and Marvin adjusts the recommendation: "Your Gold estimates have been running about 30% under actual effort. Consider whether this is closer to Effort 5-6." This insight is only available at Level 2+ because it requires observed behavioral patterns.

### Anti-Examples

- **Giving personalized recommendations at Level 1** — Level 1 (Minimally Known) supports priority math and basic recommendations only. Personalized recommendations require Level 3 (Profiled), where explicit preferences and support network are known. Jumping ahead produces overconfident advice from insufficient data.
- **Acquiring knowledge through upfront questionnaires** — Knowledge is earned through relationship, not demanded. An onboarding form asking 50 questions violates the Earn Don't Interrogate principle the ladder is built on.
- **Treating all levels as achievable in the same timeframe** — Behavioral Patterns (Level 2) emerge over time through observation. Integration sourcing (Level 5) requires high trust. The ladder is progressive — rushing it produces hollow knowledge.

### Conformance Test

1. At Level 1, verify agent recommendations use only Priority Score math and project basics — no pattern-based insights or personalized advice should appear.
2. At Level 2, verify the system surfaces at least one behavioral pattern observation (e.g., estimation accuracy, preferred work times) that was derived from usage data, not self-report.
3. Confirm that no upfront questionnaire or bulk knowledge-gathering form is presented during onboarding — knowledge acquisition must follow the Progressive Knowledge Capture strategy.
