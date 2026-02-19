# Standard - Knowledge Framework

## WHAT: Definition

The specification for organizing everything the AI team learns about a builder — structured across two dimensions (Inside World / Outside World) and two scales (Macro / Micro). This standard defines the schema; Progressive Knowledge Capture and Processing Layer implement acquisition and computation.

## WHERE: Ecosystem

- Implemented by: [[System - Progressive Knowledge Capture]] — acquires knowledge
- Implemented by: [[System - Processing Layer]] — computes patterns
- Implements: [[Principle - Earn Don't Interrogate]] — acquisition philosophy
- Advances: [[Strategy - AI as Teammates]] — knowledge enables relationship depth
- Feeds: [[Standard - Service Levels]] — knowledge depth determines service quality
- Used by: [[Agent - Jarvis]] — orchestrates knowledge gathering
- Conforming: [[Artifact - The Charter]] — content maps to knowledge domains

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — teammates know you, tools don't
- Principle: [[Principle - Earn Don't Interrogate]] — knowledge earned through relationship, not demanded upfront
- Decision: Seven domains capture comprehensive understanding without overwhelming complexity.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No knowledge framework exists. No structured knowledge schema, no cross-agent knowledge sharing, no builder profile persistence beyond conversation context. Agents operate with ephemeral context per session — no cumulative learning or knowledge domains.

## HOW: Specification

### Rules

#### Two Fundamental Dimensions

| Dimension     | Contains                              |
| ------------- | ------------------------------------- |
| Inside World  | Energy, emotions, motivations, values |
| Outside World | Constraints, resources, circumstances |

#### Two Scales

| Scale | Scope                                                         |
| ----- | ------------------------------------------------------------- |
| Macro | General state (overall capacity, life situation)              |
| Micro | Per-project (specific requirements, feelings about this work) |

#### Seven Domains

| Domain              | Description                   |
| ------------------- | ----------------------------- |
| Micro Outside       | Per-project requirements      |
| Micro Inside        | Per-project psychology        |
| Macro Inside        | Capacity state                |
| Macro Outside       | Resources and constraints     |
| Identity & Profile  | Stable characteristics        |
| Behavioral Patterns | Derived from observation      |
| System Health       | Planted infrastructure status |

#### Priority Equation

| Question                  | Formula                                            |
| ------------------------- | -------------------------------------------------- |
| What should they work on? | Priority Score (see [[Standard - Priority Score]]) |
| Can they actually do it?  | Feasibility = Capacity / Commitments               |

#### Extraction-to-Schema Pipeline

The Knowledge Framework is a schema — it defines where knowledge lives. But a schema without an ingestion mechanism is inert. The extraction-to-schema pipeline specifies how unstructured conversational signal arrives in the correct domain.

**Pipeline stages:**

| Stage          | Input                                       | Output                                                  | Responsibility                             |
| -------------- | ------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| Conversation   | Builder interacts with an agent             | Raw transcript or observation data                      | Agent (conducts the conversation)          |
| Extraction     | Raw transcript + touchpoint-specific rubric | Structured facts with domain tags and confidence levels | Extraction layer (runs post-conversation)  |
| Domain routing | Structured facts with domain tags           | Facts written to correct Knowledge Framework domain     | Extraction layer (applies rubric mappings) |
| Availability   | Facts in Knowledge Framework domains        | Updated State Summary available to all agents           | Processing Layer (refreshes summaries)     |

**Rubric-to-domain mapping rules:**

- Each extraction rubric target maps to exactly one primary Knowledge Framework domain. A single conversational signal may produce facts in multiple domains (e.g., "I'm overwhelmed by my renovation budget" maps to both Micro Inside and Micro Outside), but each fact is routed to one domain.
- Domain routing respects the Macro/Micro distinction: signals about a specific project route to Micro domains; signals about general life state route to Macro domains. Ambiguous signals default to Macro and may be refined to Micro when project context is available.
- Confidence levels are assigned during extraction, not during storage. The extraction rubric specifies confidence rules: explicitly stated facts receive high confidence, conversational inferences receive medium confidence, and single behavioral observations receive low confidence. The Knowledge Framework stores the confidence level as assigned.

**Cross-agent contract:**

The extraction pipeline guarantees that knowledge extracted from any agent's conversation is available to every agent before that agent's next builder interaction. This is the cross-agent availability contract. Without it, knowledge stays siloed in individual conversation histories and the Knowledge Framework is a schema with no data.

### Examples

**Example 1: Capturing knowledge across dimensions for a single project**

- Scenario: Builder is working on a "Home Renovation" project. Through conversation, Jarvis learns several facts.
- Input: Builder mentions: "I have a $15K budget" (Micro Outside), "I'm excited but anxious about the timeline" (Micro Inside), "My contractor is available weekends only" (Macro Outside).
- Correct output: Each fact is stored in its correct domain — budget in Micro Outside (per-project requirements), emotional state in Micro Inside (per-project psychology), contractor availability in Macro Outside (resources and constraints). Not flattened into a single profile entry.

**Example 2: Behavioral Patterns overriding stated preferences**

- Scenario: Builder states they prefer working on Gold projects Monday mornings. Over 8 weeks, observation shows they consistently do their best Gold work on Thursday evenings.
- Input: Stated preference (Identity & Profile): "I work best Monday mornings." Observed pattern (Behavioral Patterns): Thursday evening Gold sessions are 3x more productive.
- Correct output: Both are stored — stated preference in Identity & Profile, observed pattern in Behavioral Patterns. When making recommendations, the Behavioral Pattern data takes precedence because it is derived from observation, not self-report.

**Example 3: Extraction pipeline routing a single conversation to multiple domains**

- Scenario: Builder finishes a Week-in-Review with Jarvis. During the conversation, the builder says: "The renovation project stressed me out this week, but I finally got the permit approved. Also, I realized I really enjoy the design phase more than the execution phase."
- Input: The Week-in-Review rubric runs against this transcript. Three extraction targets match: (1) emotional state about a specific project, (2) a concrete project milestone, (3) a preference pattern.
- Correct output: Three facts are written to the Knowledge Framework — "stressed about renovation" routes to Micro Inside (per-project psychology) with high confidence, "permit approved" routes to Micro Outside (per-project requirements) with high confidence, "enjoys design more than execution" routes to Identity & Profile (stable characteristics) with medium confidence (single statement, not yet a confirmed pattern). All three are available in the next State Summary refresh.

### Anti-Examples

- **Storing all knowledge in a single flat profile** — The two-dimension, two-scale structure exists because per-project psychology (Micro Inside) is categorically different from stable characteristics (Identity & Profile). Flattening loses the distinction.
- **Treating Behavioral Patterns as builder-stated preferences** — Behavioral Patterns are derived from observation, not self-report. A builder who says they prefer morning work but consistently ships at midnight has a behavioral pattern that overrides the stated preference.
- **Ignoring the Macro/Micro distinction when computing feasibility** — A builder with high macro capacity but overwhelming micro commitments on a specific project will fail. Both scales must factor into recommendations.
- **Relying on agents to manually write knowledge to the framework during conversation** — If each agent is responsible for identifying, classifying, and storing knowledge while simultaneously conducting a conversation, extraction quality degrades and agent context windows are consumed by bookkeeping instead of empathy. The extraction pipeline runs post-conversation as a separate pass, using a rubric designed for extraction rather than conversation. Agents focus on the builder; the pipeline focuses on the knowledge.

### Conformance Test

1. For a given builder, verify that knowledge is stored across the correct domains (not flattened) — check that per-project data lives in Micro domains and general data lives in Macro domains.
2. Verify that Behavioral Patterns are populated from observation data (session logs, completion patterns) rather than builder self-report only.
3. Confirm the feasibility calculation uses both Macro capacity and Micro commitments, not just one scale.
4. For a given relational touchpoint (campfire, strategic conversation, weekly review), verify that a touchpoint-specific extraction rubric exists, that each rubric target maps to a Knowledge Framework domain, and that extraction output is available in State Summaries before the next agent interaction.
