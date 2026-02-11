# Standard - Knowledge Framework

## WHAT: Definition

The specification for organizing everything the AI team learns about a director — structured across two dimensions (Inside World / Outside World) and two scales (Macro / Micro). This standard defines the schema; Progressive Knowledge Capture and Processing Layer implement acquisition and computation.

## WHERE: Ecosystem

- Implemented by: [[System - Progressive Knowledge Capture]] — acquires knowledge
- Implemented by: [[System - Processing Layer]] — computes patterns
- Implements: [[Principle - Earn Don't Interrogate]] — acquisition philosophy
- Advances: [[Strategy - AI as Teammates]] — knowledge enables relationship depth
- Feeds: [[Standard - Service Levels]] — knowledge depth determines service quality
- Used by: [[Agent - Jarvis]] — orchestrates knowledge gathering
- Conforming: [[Artifact - The Charter]] — content maps to knowledge domains
- Conforming rooms: [[Room - Category Studios]] — category-specific knowledge capture
- Conforming systems: [[System - Category Advisors]] — domain-specific knowledge application

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — teammates know you, tools don't
- Principle: [[Principle - Earn Don't Interrogate]] — knowledge earned through relationship, not demanded upfront
- Decision: Seven domains capture comprehensive understanding without overwhelming complexity.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No knowledge framework exists. No structured knowledge schema, no cross-agent knowledge sharing, no director profile persistence beyond conversation context. Agents operate with ephemeral context per session — no cumulative learning or knowledge domains.

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

### Examples

**Example 1: Capturing knowledge across dimensions for a single project**

- Scenario: Director is working on a "Home Renovation" project. Through conversation, Jarvis learns several facts.
- Input: Director mentions: "I have a $15K budget" (Micro Outside), "I'm excited but anxious about the timeline" (Micro Inside), "My contractor is available weekends only" (Macro Outside).
- Correct output: Each fact is stored in its correct domain — budget in Micro Outside (per-project requirements), emotional state in Micro Inside (per-project psychology), contractor availability in Macro Outside (resources and constraints). Not flattened into a single profile entry.

**Example 2: Behavioral Patterns overriding stated preferences**

- Scenario: Director states they prefer working on Gold projects Monday mornings. Over 8 weeks, observation shows they consistently do their best Gold work on Thursday evenings.
- Input: Stated preference (Identity & Profile): "I work best Monday mornings." Observed pattern (Behavioral Patterns): Thursday evening Gold sessions are 3x more productive.
- Correct output: Both are stored — stated preference in Identity & Profile, observed pattern in Behavioral Patterns. When making recommendations, the Behavioral Pattern data takes precedence because it is derived from observation, not self-report.

### Anti-Examples

- **Storing all knowledge in a single flat profile** — The two-dimension, two-scale structure exists because per-project psychology (Micro Inside) is categorically different from stable characteristics (Identity & Profile). Flattening loses the distinction.
- **Treating Behavioral Patterns as director-stated preferences** — Behavioral Patterns are derived from observation, not self-report. A director who says they prefer morning work but consistently ships at midnight has a behavioral pattern that overrides the stated preference.
- **Ignoring the Macro/Micro distinction when computing feasibility** — A director with high macro capacity but overwhelming micro commitments on a specific project will fail. Both scales must factor into recommendations.

### Conformance Test

1. For a given director, verify that knowledge is stored across the correct domains (not flattened) — check that per-project data lives in Micro domains and general data lives in Macro domains.
2. Verify that Behavioral Patterns are populated from observation data (session logs, completion patterns) rather than director self-report only.
3. Confirm the feasibility calculation uses both Macro capacity and Micro commitments, not just one scale.
