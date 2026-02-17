# Room - Council Chamber

## WHAT: Definition

Jarvis's dedicated space in the Strategy Studio — where builders engage in high-level strategic conversation, conduct weekly reviews, maintain their Charter, and discuss life direction. The Council Chamber is the heart of the human-AI strategic partnership.

## WHERE: Ecosystem

- Zone: [[Zone - Strategy Studio]] — planning workspace
- Agent: [[Agent - Jarvis]] — primary occupant
- Artifacts:
  - [[Artifact - The Charter]] — living strategic document
  - [[Artifact - The Agenda]] — session structure
- Adjacent:
  - [[Room - Sorting Room]] — priority selection
  - [[Room - Drafting Room]] — project creation
  - [[Room - Roster Room]] — delegation management
- Conforms to:
  - [[Standard - Planning Calibration]] — strategic conversations frame plans as hypotheses
- Implements: [[Strategy - AI as Teammates]] — deepest advisor relationship
- Implements: [[Principle - Earn Don't Interrogate]] — Jarvis elicits, never interrogates

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — Jarvis is the primary AI relationship
- Principle: [[Principle - Plans Are Hypotheses]] — strategic conversations hold plans lightly
- Driver: Builders need a thinking partner who knows their whole picture. The Council Chamber hosts that partnership.
- Constraints: Council Chamber is the builder's space, not Jarvis's office. The builder controls pace, topic, and depth of conversation. Jarvis guides, never drives.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-17):** No Council Chamber exists in the codebase. D2 resolved: R1 implements Jarvis as an overlay panel/drawer accessible from the map — no dedicated `/council-chamber` route. The route-based Council Chamber is deferred to a future release. Charter and Agenda artifacts remain unbuilt.

### History

> **2026-02-17 — D2: Jarvis UI — route or overlay?**
> Decided: Overlay — panel/drawer accessible from the map. No dedicated `/council-chamber` route in R1. The Council Chamber as a full room with its own route is deferred. Jarvis lives on the map as an overlay for R1.

Core to Strategy Studio design. Council Chamber is where the Jarvis relationship lives.

## HOW: Implementation

**Session types:**

- Weekly check-in — review past week, frame upcoming week
- Quarterly review — deeper Charter work, theme adjustment
- Ad-hoc strategic — major decisions, life changes

**[[Artifact - The Agenda]]:** Each session follows an agenda (customizable). Jarvis guides through it, captures notes, updates Charter.

**[[Artifact - The Charter]]:** Living document maintained here — builder's values, themes, priorities, constraints. Jarvis references it and proposes updates.

**Conversation continuity:** History preserved. Jarvis remembers past discussions, references them, tracks how thinking evolves.

### Examples

- Builder enters Council Chamber on a Tuesday → Jarvis: "Last week you mentioned feeling stretched thin across too many Silver projects. Want to revisit that?" → conversation references two weeks of prior context → builder adjusts strategy → Jarvis updates Charter note.
- Quarterly review session → Jarvis walks through [[Artifact - The Agenda]] → reviews Charter themes with builder → surfaces patterns from past quarter's data → builder updates two themes, removes one → conversation captured for future reference → session complete in 25 minutes.

### Anti-Examples

- **Jarvis initiating a conversation without the builder entering the Council Chamber** — the builder comes to Jarvis, not the other way around. Council Chamber is a place to visit, not a notification to respond to. Push-initiated strategic conversations violate builder agency.
- **Jarvis offering prescriptive advice before the builder has reflected** — "Here's what I think you should do" before "What are you thinking?" Jarvis guides reflection first, offers perspective second.
