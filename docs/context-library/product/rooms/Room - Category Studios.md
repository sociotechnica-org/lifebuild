# Room - Category Studios

## WHAT: Definition

Domain-specific planning spaces within the Strategy Studio — one studio for each Life Category where directors engage their Category Advisor for specialized strategic conversation. All studios share identical structure; differentiation is domain expertise and advisor personality.

## WHERE: Ecosystem

- Zone: [[Zone - Strategy Studio]] — planning workspace
- Agents:
  - [[Agent - Maya]] — Health & Well-Being
  - [[Agent - Atlas]] — Purpose & Spirituality
  - [[Agent - Brooks]] — Financial Resources
  - [[Agent - Grace]] — Relationships
  - [[Agent - Reed]] — Home & Environment
  - [[Agent - Finn]] — Community & Contributions
  - [[Agent - Indie]] — Leisure & Lifestyle
  - [[Agent - Sage]] — Personal Growth & Learning
- Adjacent:
  - [[Room - Council Chamber]] — strategic conversation with Jarvis
  - [[Room - Sorting Room]] — priority selection
  - [[Room - Project Board]] — in-context advisor access available
- Conforms to:
  - [[Standard - Life Categories]] — one studio per default category
  - [[Standard - Knowledge Framework]] — category-specific knowledge
- Implements: [[Strategy - AI as Teammates]] — domain specialists
- Implements: [[System - Progressive Knowledge Capture]] — advisors learn domain context

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — specialized advisors for specialized domains
- Principle: [[Principle - Compound Capability]] — advisors learn director's domain context over time
- Driver: Life categories have different challenges requiring different expertise. Category Studios provide focused strategic support.
- Constraints: Category Studios are domain-specific. Each advisor stays in their lane — cross-category synthesis comes from Jarvis, not from individual advisors. Customization limited to supported category structures.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** All 8 category agents are defined in `rooms.ts` with room IDs (`category:health`, `category:relationships`, etc.), prompts, and personality names. However, there are no routes in `routes.ts` for Category Studios — directors cannot navigate directly to them. The agents are infrastructure-ready but lack a UI entry point. They shipped in the original room chat foundation commit (Nov 2025) but may be legacy from the prototype.

Core to Strategy Studio design. Individual advisor personalities develop as system matures.

## HOW: Implementation

**Studio structure (identical across all eight):**

- Conversation thread with category advisor
- Category-level overview (projects, systems in this category)
- Strategic notes and decisions
- History preserved across sessions

**The eight studios:**

| Category                   | Studio               | Advisor            |
| -------------------------- | -------------------- | ------------------ |
| Health & Well-Being        | Health Studio        | [[Agent - Maya]]   |
| Purpose & Spirituality     | Purpose Studio       | [[Agent - Atlas]]  |
| Financial Resources        | Finances Studio      | [[Agent - Brooks]] |
| Relationships              | Relationships Studio | [[Agent - Grace]]  |
| Home & Environment         | Home Studio          | [[Agent - Reed]]   |
| Community & Contributions  | Community Studio     | [[Agent - Finn]]   |
| Leisure & Lifestyle        | Leisure Studio       | [[Agent - Indie]]  |
| Personal Growth & Learning | Growth Studio        | [[Agent - Sage]]   |

**Dual access:** Directors reach advisors here OR in-context on Project Boards. History syncs regardless of entry point.

**Customization note:** If director renames or replaces default categories, associated studio pauses until system evolves to support custom coverage.

### Examples

- Director enters Health Studio → Maya: "Last time we talked about your running routine falling off after that knee issue. How's recovery going?" → conversation picks up with full context from their last session two weeks ago → Maya has domain-specific memory.
- Director works on a financial project in [[Room - Project Board]] → Brooks's indicator appears (subtle, non-intrusive) → director clicks → asks about budgeting approach for a home renovation → Brooks responds with financial framing → conversation logs to Finances Studio thread → continuity preserved regardless of entry point.

### Anti-Examples

- **Studios losing conversation history when the director hasn't visited in weeks** — advisor value grows with memory. An advisor that forgets past conversations is just another chatbot. History persists indefinitely.
- **An advisor from one studio commenting on another category's domain** — Maya (Health) doesn't weigh in on financial decisions. Domain boundaries matter. Cross-category insights come from Jarvis (the generalist), not from domain advisors.
