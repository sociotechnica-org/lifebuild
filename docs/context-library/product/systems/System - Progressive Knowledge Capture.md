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
| Unknown fact              | Builder states explicitly ("Family is my priority")              | Known (high confidence)              | Stored in Knowledge Framework; available to all agents via State Summary       |
| Unknown fact              | Behavioral pattern observed (always pauses projects in December) | Known (medium confidence)            | Stored with observation tag; requires higher threshold before agents act on it |
| Known (medium confidence) | Builder confirms or contradicts in conversation                  | Known (high confidence) or Corrected | Confidence updated; corrected items override previous knowledge                |
| Known fact                | Extended time without reconfirmation                             | Potentially stale                    | Agents may gently re-check during natural conversation                         |
| No knowledge              | Onboarding begins (First 72 Hours)                               | Initial knowledge captured           | Mesa and Jarvis begin building foundational understanding                      |

### Processing Logic

**Capture techniques:**

| Technique                | Example                                            | Context            |
| ------------------------ | -------------------------------------------------- | ------------------ |
| Observe-and-note         | Builder completes Gold -> note preference patterns | Background         |
| Conversational inference | "Sounds like family time is important"             | Strategic sessions |
| Gentle calibration       | "Is this harder than it looks?"                    | Task estimation    |
| Reflection prompt        | "What made that project satisfying?"               | Week-in-Review     |
| Choice observation       | Track what gets selected vs. deferred              | Priority patterns  |

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

**Extraction pipeline:**

Between "a conversation happened" and "knowledge is stored in the Knowledge Framework," there is an extraction layer — the mechanism that converts unstructured conversational signal into structured, domain-tagged knowledge available to all agents.

The extraction pipeline has four components:

1. **Rubric-driven extraction** — Each relational touchpoint has a shared rubric that maps conversation signals to Knowledge Framework domains. A rubric is a set of extraction targets (what to look for) paired with domain mappings (where it goes in the framework). Rubrics are not generic — they are calibrated to the touchpoint's purpose and the builder's current service level.

2. **Touchpoint-specific extraction targets** — Different touchpoints extract different things because different conversations surface different knowledge:

   | Touchpoint                               | Primary Extraction Targets                                   | Knowledge Framework Domains                     |
   | ---------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
   | Campfire (onboarding)                    | Starting state, heavy thing, values, initial capacity        | Identity & Profile, Macro Inside, Macro Outside |
   | Strategic conversation (Council Chamber) | Priority shifts, life changes, support network               | Macro Inside, Macro Outside, Identity & Profile |
   | Project shaping (Drafting Room)          | Per-project requirements, emotional charge, effort estimates | Micro Outside, Micro Inside                     |
   | Weekly review (Week-in-Review)           | Satisfaction signals, energy patterns, capacity shifts       | Macro Inside, Behavioral Patterns               |
   | Passive observation                      | Completion patterns, timing habits, avoidance signals        | Behavioral Patterns, System Health              |

3. **Relational touchpoint triggers** — Extraction runs at defined moments in the builder's rhythm, not continuously. Each trigger initiates a rubric-matched extraction pass over the conversation or observation window:
   - After a campfire conversation completes (onboarding or return)
   - After a strategic conversation in the Council Chamber
   - After project shaping in the Drafting Room
   - After each Week-in-Review cycle
   - On a rolling basis for passive behavioral observation (Processing Layer computes these)

4. **Cross-agent availability** — Extracted knowledge is written to the Knowledge Framework immediately after extraction completes. All agents receive updated knowledge via State Summary refresh before their next interaction. No agent operates on stale knowledge from a previous session when fresher knowledge has been extracted. The availability guarantee is: if extraction ran after touchpoint T, every agent interaction after T reflects the extracted knowledge.

### Examples

- During a Week-in-Review, a builder says "I really enjoyed the meal prep project — it felt like I was building something that keeps working for me." Jarvis captures this as a preference signal: "Builder finds satisfaction in system-building work (Silver stream)." This knowledge, stored with high confidence because it was explicitly stated, later helps Marvin during Weekly Planning: "You've mentioned enjoying projects that keep working for you — this Silver candidate might resonate."
- Over four consecutive weeks, the Processing Layer observes that the builder completes Bronze tasks primarily on Tuesday and Thursday mornings. No one asked; the pattern emerged from behavior. This is stored as a medium-confidence capacity pattern. Mesa doesn't mention it directly but it informs how agents think about the builder's rhythms. If the builder later says "I do my errands on Tuesday mornings," the confidence upgrades to high.
- During a Council Chamber conversation, the builder tells Jarvis "My partner just got a new job — our evenings are going to be chaotic for a while." The extraction pipeline runs the Council Chamber rubric against this conversation. The rubric maps "partner schedule change" to Macro Outside (resources and constraints) and "evenings chaotic" to Macro Inside (capacity state). Both facts are written to the Knowledge Framework with high confidence (explicitly stated). Before Marvin's next interaction, the State Summary refreshes. Marvin now knows to avoid recommending evening work blocks without being told separately — the extraction pipeline bridged the knowledge from Jarvis's conversation to Marvin's context.

### Anti-Examples

- **Presenting a "Tell us about yourself" form during onboarding** — this frontloads interrogation before the builder has experienced any value. Progressive Knowledge Capture means the system earns knowledge through useful interactions, not extracts it through forms.
- **An agent acting on a single behavioral observation as if it were a confirmed preference** — seeing a builder skip Gold work once doesn't mean they dislike Gold projects. Low-confidence inferences need repeated observation or explicit confirmation before agents should adjust recommendations. Acting on thin data feels creepy, not helpful.
- **Extracting the same rubric targets from every touchpoint regardless of context** — the campfire rubric looks for starting state, values, and initial capacity because that is what onboarding surfaces. Applying the campfire rubric to a Week-in-Review conversation would miss satisfaction signals and energy patterns while hunting for "starting state" that was already captured. Touchpoint-specific rubrics exist because different conversations produce different knowledge. Using a single generic rubric degrades extraction quality across all touchpoints.
