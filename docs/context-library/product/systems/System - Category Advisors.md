# System - Category Advisors

## WHAT: Definition

The mechanism that assigns one domain-specialist AI agent per Life Category, providing specialized expertise in dedicated Strategy Studio rooms and in-context within projects. This card documents WHY there's one-per-category and HOW the assignment mechanism works. The 8 individual agents (Maya, Atlas, Brooks, etc.) have their own Agent cards.

## WHERE: Scope

- Zones:
  - [[Zone - Strategy Studio]] — Category Studios are rooms within Strategy Studio
- Rooms:
  - [[Room - Category Studios]] — dedicated rooms for each advisor
  - [[Room - Project Board]] — in-context consultation
  - [[Room - System Board]] — in-context consultation
- Capabilities:
  - [[Capability - System Actions]] — advisors can be invoked from system context
- Primitives:
  - [[Primitive - Director]] — each director gets their own advisor instances
- Implements:
  - [[Standard - Life Categories]] — one advisor per default category
  - [[Standard - Knowledge Framework]] — domain-specific knowledge capture
- Instances:
  - [[Agent - Maya]] — Health & Well-Being
  - [[Agent - Atlas]] — Purpose & Spirituality
  - [[Agent - Brooks]] — Financial Resources
  - [[Agent - Grace]] — Relationships
  - [[Agent - Reed]] — Home & Environment
  - [[Agent - Finn]] — Community & Contributions
  - [[Agent - Indie]] — Leisure & Lifestyle
  - [[Agent - Sage]] — Personal Growth & Learning
- Rationale:
  - [[Strategy - AI as Teammates]] — specialized expertise
  - [[Principle - Guide When Helpful]] — available when relevant

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — specialists complement generalists; domain expertise is the differentiator between a chatbot and a teammate
- Principle: [[Principle - Compound Capability]] — advisors learn director's domain-specific context over time
- Driver: Different life domains have different challenges, language, and resources. Generic advice fails because it lacks domain sensitivity. A health conversation requires different expertise than a financial one.
- Constraints: Advisors provide domain expertise, not directive advice. They never prescribe medical, financial, or legal decisions — they help directors think through their own.

## WHEN: Timeline

Core system. Individual advisors become more valuable as they accumulate domain-specific knowledge about each director's situation. Advisor coverage for custom categories is a deferred decision (see [[Standard - Life Categories]]).

## HOW: Implementation

### Behavior

**Dual availability:**

1. **Strategy Studio** — dedicated room for category-level strategic planning
2. **In-context** — subtle indicator on [[Room - Project Board]] and [[Room - System Board]] when relevant advisor available

**Conversation continuity:** History from in-project consultations logs to advisor's Studio thread. Unified record regardless of where conversation originated.

**Domain expertise:** Each advisor specializes in their category's typical concerns, language, resources, and frameworks.

**Customization note:** When directors rename or replace default categories, the associated advisor pauses until the system evolves to support custom category coverage.

### Examples

- A director working on a Health project opens the [[Room - Project Board]]. Maya's indicator appears. They click to consult Maya about structuring a fitness routine — Maya draws on health-specific frameworks and the director's prior health conversations.
- A director enters the Purpose Studio in [[Zone - Strategy Studio]]. Atlas helps them plan a career transition strategy, referencing their stated values and previous purpose-related projects.

### Anti-Examples

- **Generic AI giving same advice regardless of life domain** — A director asks about managing a home renovation and gets the same generic project-management advice they'd get for a fitness goal. Category Advisors exist precisely because domain context changes everything about the advice.
- **Advisor making decisions for the director** — Brooks telling a director to invest in index funds instead of helping them think through their financial priorities. Advisors empower decisions, they don't make them.
