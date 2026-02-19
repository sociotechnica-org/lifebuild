# System - Service Level Progression

## WHAT: Definition

The invisible state machine governing how AI capabilities evolve based on builder engagement over time. Builders don't interact with Service Level Progression directly — they simply use LifeBuild, and the system tracks depth of relationship to trigger transitions between service levels. The system determines when to advance, what capabilities to unlock, and how to notify the builder of progression.

## WHERE: Scope

- Zones:
  - [[Zone - Life Map]] — level affects quality of agent interactions across the map
- Rooms:
  - [[Room - Council Chamber]] — Jarvis discusses progression and capability growth
- Capabilities:
  - [[Capability - Week-in-Review]] — review data feeds level calculation
- Primitives:
  - [[Primitive - Builder]] — level is a property of the builder's account
- Implements:
  - [[Standard - Service Levels]] — defines level thresholds, knowledge requirements, and service quality tiers
  - [[Standard - Visual Language]] — level indicators and progress display render per spec
- State:
  - Current level (0-5): computed from engagement metrics
  - Progress toward next level threshold
  - Engagement metrics: weeks of consistent use, behavioral patterns observed, historical data accumulated
- Transitions:
  - Level advancement triggers based on engagement depth thresholds (defined in Standard - Service Levels)
  - Never regresses — levels reflect cumulative relationship, not recent activity
  - Transition events fire when engagement metrics cross thresholds
  - Notification of advancement surfaces in Council Chamber
- Processing:
  - [[Agent - Conan]] — historical data feeds level calculation
  - [[Agent - Jarvis]] — announces level progression, explains new capabilities
  - Agent quality scales with level — higher levels yield better recommendations, deeper pattern recognition
- Rationale:
  - [[Principle - Compound Capability]] — visible compounding of system intelligence
  - [[Strategy - AI as Teammates]] — agents improve with levels

## WHY: Rationale

- System: [[Standard - Service Levels]] — levels need visibility to motivate
- Principle: [[Principle - Compound Capability]] — seeing progress reinforces investment
- Driver: Builders should see their relationship with LifeBuild deepening. Progression makes the invisible visible.
- Constraints: Progression reflects system capability growth, not builder achievement scores. No badges, no leaderboards, no feature locks. Levels are honest about what the system can and cannot yet do.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No Service Level system exists. No tiered progression, no engagement-based advancement, no differentiated agent behavior by level.

Core system. Progression develops as Service Level mechanics mature.

## HOW: Implementation

**State machine mechanics:**

The system tracks engagement metrics defined in [[Standard - Service Levels]] and fires transition events when thresholds are crossed. Thresholds are specified in the Standard, not here — this System implements the transition mechanism.

When engagement data indicates threshold crossing:
1. Transition event fires
2. Current level state updates
3. New capabilities become available
4. Jarvis receives notification to announce progression

**Advancement notification:**

When a level transition fires, Jarvis announces the progression in Council Chamber and explains what new capabilities are now available. The notification connects engagement to service quality — "With more history, I can see patterns..." — making the relationship depth tangible.

**Agent quality scaling:**

Higher levels unlock better agent performance:
- Better recommendations (personalized vs. generic)
- Deeper pattern recognition (behavioral insights vs. simple priority math)
- Predictive guidance (anticipating needs vs. reactive responses)

The specific service quality tiers are defined in [[Standard - Service Levels]]. This System implements the mechanism that delivers differentiated service based on level state.

**Not gamification:** Levels reflect genuine capability growth, not arbitrary points. No badges, no leaderboards, no feature locks — just honest representation of what the system can do for the builder at this stage of the relationship.

### Examples

- New builder creates account → system initializes at Level 0 → completes first week of planning and review → system detects "first week complete" threshold crossed (as defined in Standard - Service Levels) → fires Level 1 transition → Jarvis announces: "With a week of history, I can start noticing basic patterns in your preferences" → capability connection made visible.
- Builder at Level 3 for three months → system has observed 12 weeks of planning data → sufficient behavioral patterns accumulated → Jarvis: "I've seen 12 weeks of your planning now. Your calibration is improving — estimates are 20% closer to reality than month one" → the relationship depth is tangible.

### Anti-Examples

- **Awarding badges for arbitrary engagement metrics** — "You viewed your Life Map 10 times!" is gamification. Progression reflects genuine system capability growth (better predictions, deeper pattern recognition), not click counts. The state machine transitions on meaningful engagement thresholds, not vanity metrics.
- **Gatekeeping features behind level requirements** — Levels describe what the system can do for the builder, not what the builder is allowed to do. All features are available from Day 1. Higher levels unlock better quality, not access. The state machine gates service quality, not feature availability.
- **Duplicating threshold specifications in the System card** — Thresholds ("first week complete," "consistent weekly rhythm," etc.) are specification content and belong in [[Standard - Service Levels]]. The System card describes the state machine and transition mechanism only. If threshold definitions appear here, they should be removed and consolidated into the Standard.
