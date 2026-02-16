# System - Progressive Knowledge Capture

## WHAT: Definition

The knowledge acquisition mechanism agents use to learn about builders over time — gathering information through natural conversation, behavioral observation, and gentle calibration rather than upfront interrogation.

## WHERE: Scope

- Used by: All agents, especially [[Agent - Jarvis]], [[Agent - Mesa]]
- Implements: [[Principle - Earn Don't Interrogate]]
- Implements: [[Strategy - AI as Teammates]]
- Feeds: [[Standard - Knowledge Framework]] — where captured knowledge lives
- Feeds: [[Artifact - The Charter]] — strategic knowledge captured here

## WHY: Rationale

- Principle: [[Principle - Earn Don't Interrogate]] — Progressive Knowledge Capture is how agents honor this principle
- Strategy: [[Strategy - AI as Teammates]] — teammates learn organically, not via forms
- Driver: Upfront questionnaires create friction and capture stale data. Progressive capture builds living, contextual knowledge through natural interaction.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No structured knowledge capture exists. Agent conversations persist in `chatMessages` table, but there is no Knowledge Framework, no confidence-leveled fact store, no cross-agent knowledge sharing. Agents operate with system prompt + conversation history only.

## HOW: Mechanics

### State

- **Knowledge store per builder**: Accumulated facts, preferences, patterns, and context across all categories
- **Confidence levels**: Each captured item has implicit confidence (explicitly stated > observed pattern > single inference)
- **Knowledge freshness**: Timestamp of last confirmation or observation for each item
- **Capture source**: Which agent or observation method contributed each piece of knowledge

### Transitions

| From                      | Trigger                                                          | To                                   | Side Effects                                                                   |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Unknown fact              | Builder states explicitly ("Family is my priority")             | Known (high confidence)              | Stored in Knowledge Framework; available to all agents via State Summary       |
| Unknown fact              | Behavioral pattern observed (always pauses projects in December) | Known (medium confidence)            | Stored with observation tag; requires higher threshold before agents act on it |
| Known (medium confidence) | Builder confirms or contradicts in conversation                 | Known (high confidence) or Corrected | Confidence updated; corrected items override previous knowledge                |
| Known fact                | Extended time without reconfirmation                             | Potentially stale                    | Agents may gently re-check during natural conversation                         |
| No knowledge              | Onboarding begins (First 72 Hours)                               | Initial knowledge captured           | Mesa and Jarvis begin building foundational understanding                      |

### Processing Logic

**Capture techniques:**

| Technique                | Example                                             | Context            |
| ------------------------ | --------------------------------------------------- | ------------------ |
| Observe-and-note         | Builder completes Gold -> note preference patterns | Background         |
| Conversational inference | "Sounds like family time is important"              | Strategic sessions |
| Gentle calibration       | "Is this harder than it looks?"                     | Task estimation    |
| Reflection prompt        | "What made that project satisfying?"                | Week-in-Review     |
| Choice observation       | Track what gets selected vs. deferred               | Priority patterns  |

**What gets captured:**

- Values and priorities
- Capacity patterns
- Preference patterns
- Relationship context
- Domain knowledge
- Historical patterns

**Capture moments:**

- During onboarding (First 72 Hours)
- During strategic conversations (Council Chamber)
- During project creation (Drafting Room)
- During planning and review (Weekly rhythm)
- Passively through usage patterns

**Explicit vs. implicit:**

- Some knowledge stated directly ("family is priority")
- Some knowledge inferred from behavior (always pauses projects in December)
- Both valid; inferred requires higher confidence threshold

**Never interrogate:**

- No upfront questionnaires
- No mandatory profile completion
- No blocking on information capture

### Examples

- During a Week-in-Review, a builder says "I really enjoyed the meal prep project — it felt like I was building something that keeps working for me." Jarvis captures this as a preference signal: "Builder finds satisfaction in system-building work (Silver stream)." This knowledge, stored with high confidence because it was explicitly stated, later helps Marvin during Weekly Planning: "You've mentioned enjoying projects that keep working for you — this Silver candidate might resonate."
- Over four consecutive weeks, the Processing Layer observes that the builder completes Bronze tasks primarily on Tuesday and Thursday mornings. No one asked; the pattern emerged from behavior. This is stored as a medium-confidence capacity pattern. Mesa doesn't mention it directly but it informs how agents think about the builder's rhythms. If the builder later says "I do my errands on Tuesday mornings," the confidence upgrades to high.

### Anti-Examples

- **Presenting a "Tell us about yourself" form during onboarding** — this frontloads interrogation before the builder has experienced any value. Progressive Knowledge Capture means the system earns knowledge through useful interactions, not extracts it through forms.
- **An agent acting on a single behavioral observation as if it were a confirmed preference** — seeing a builder skip Gold work once doesn't mean they dislike Gold projects. Low-confidence inferences need repeated observation or explicit confirmation before agents should adjust recommendations. Acting on thin data feels creepy, not helpful.
