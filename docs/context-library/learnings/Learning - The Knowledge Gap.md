# Learning - The Knowledge Gap

## Divergence

**Vision:** Agents accumulate knowledge about the director over time. The Charter is a living strategic document. The Knowledge Framework organizes everything the AI team learns across seven domains. Service Levels (0-5) reflect relationship depth. Agents reference past patterns, calibrate recommendations, and improve with use. The Compound Capability principle drives this: month-12 service should be dramatically better than month-1.

**Reality:** Agent conversations are ephemeral. No Charter exists. No Knowledge Framework. No Service Levels. No cross-session memory. No pattern detection over time. Each agent interaction starts fresh with only the system prompt and current conversation context. A director who has used LifeBuild for six months gets the same quality of agent response as a brand-new user.

## Scale

This is the gap that most affects the "AI as Teammates" strategy. Teammates remember you; tools don't.

- [[Artifact - The Charter]] — Not started. The core knowledge store.
- [[Artifact - The Agenda]] — Not started. Session structure.
- [[Standard - Knowledge Framework]] — Not started. Knowledge schema.
- [[System - Progressive Knowledge Capture]] — Not started. Acquisition mechanism.
- [[System - Service Level Progression]] — Not started. Progression UI.
- [[Standard - Service Levels]] — Not started. Level definitions.
- [[Agent - Jarvis]] — Not started. Depends on Charter and knowledge infrastructure.
- [[Agent - Conan]] — Not started. Depends on Archives and historical data.

## Why It Exists

Persistent agent knowledge requires: (1) a structured storage layer for director knowledge, (2) a retrieval mechanism that feeds relevant context into agent prompts, (3) an acquisition pipeline that captures knowledge during natural interactions, and (4) a progression system that tracks relationship depth. This is a significant infrastructure investment. The MVP prioritized getting agents functional with domain-specific prompts before adding memory.

## Implications

- Builders should not assume agents "know" anything about the director beyond what's in the current conversation and the project/task data model.
- Any feature that references agent pattern detection ("Cameron notices you've avoided this three weeks running") is future state.
- The event-sourced architecture (LiveStore) provides the raw data layer — all events are persisted. But no intelligence layer reads that history to inform agent behavior.
- Closing this gap is prerequisite for Jarvis (strategic advisor who knows the director deeply) and Conan (knowledge manager who surfaces historical patterns).

## When This Closes

Incrementally. The Charter is the natural starting point — a persistent document that captures director values, priorities, and context. Knowledge Framework provides the schema. Progressive Knowledge Capture provides the acquisition pipeline. Each piece adds to agent quality.
