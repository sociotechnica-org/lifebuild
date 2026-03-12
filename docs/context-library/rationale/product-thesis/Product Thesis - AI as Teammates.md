# Product Thesis - AI as Teammates

## WHAT: The Thesis

Agents with defined jobs, permissions, and coordination capabilities provide leverage previously available only to people with human staff. This is Plank 3 — the third of three independent bets LifeBuild is built on.

Counter-thesis: The "teammate" framing is anthropomorphic wishful thinking. AI is a tool, and the most effective tools are general-purpose, not role-specialized. Users will prefer one powerful general assistant over a team of specialized agents with limited authority — the coordination overhead of multiple agents exceeds the specialization benefit.

## WHERE: Ecosystem

- Type: Product Thesis (Plank)
- Parent: [[Product Thesis - The Organized Life]]
- Problem: [[Product Thesis - Organizational Life]]
- Implementing principles: [[Principle - Earn Don't Interrogate]], [[Principle - Guide When Helpful]]
- Core team: [[Agent - Jarvis]], [[Agent - Marvin]], [[Agent - Conan]]. Reserve: [[Agent - Mesa]]
- Systems: [[Standard - Service Levels]], [[Standard - Knowledge Framework]], [[System - Processing Layer]]
- Systems: [[System - Progressive Knowledge Capture]], [[System - Smoke Signals]]
- Artifacts: [[Artifact - The Charter]], [[Artifact - The Agenda]]

## WHY: Belief

People are drowning in work they shouldn't be doing themselves. Research, scheduling, coordination, follow-up, routine decisions — these consume hours that could go toward higher-value thinking or actual living. The constraint isn't knowledge or willpower; it's bandwidth.

AI has made delegation radically more accessible. But most people still treat AI as a tool they "use" — a search engine with better answers, a writing assistant they prompt. This captures maybe 10% of the potential.

The real unlock is AI as _teammates_ — agents with defined roles, ongoing responsibilities, and the judgment to act within appropriate bounds. The difference between "tool I use" and "teammate I work with" is the difference between doing everything yourself with occasional assistance versus having a staff that handles work on your behalf.

The bet: if builders have AI agents with defined jobs, appropriate permissions, and the ability to coordinate — teammates rather than tools — they can operate at a level of effectiveness previously available only to people with human staff, while maintaining sovereignty over the decisions that matter.

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-12):** At Level 1 of the maturity ladder — operational team with defined roles, reactive help. Marvin fully active in Drafting Room and Sorting Room. Mesa active on Life Map (reserve status). Jarvis and Conan not started. No proactive behavior, no agent-to-agent coordination.

## HOW: Application

### Maturity Ladder

| Level | Name                   | What It Is                                             |
| ----- | ---------------------- | ------------------------------------------------------ |
| 0     | Status Quo             | No AI or generic chat                                  |
| 1     | Operational Team       | Consolidated agents with defined roles (current state) |
| 2     | Extended to Real World | Agents handle email, calendar, web research            |
| 3     | Jobs and Permissions   | Agents have standing authority, act proactively        |
| 4     | Agent Coordination     | Agents hand off to each other                          |
| 5     | Tiered Authority       | Seniority structure, escalation paths                  |
| 6     | Learning and Memory    | Agents remember, learn patterns, improve over time     |
| 7+    | Autonomous Team        | Agents with genuine judgment, minimal oversight        |

**Current state:** Level 1. Operational team with defined roles, reactive help.

### What Following This Looks Like

- Each agent has defined roles and boundaries: Jarvis counsels on strategy, Marvin manages the full operational cycle, Conan maintains institutional memory. The builder delegates to the right agent by role, not by prompting a generic interface.
- Agents earn trust progressively through demonstrated competence at lower levels before receiving broader authority. A new agent starts reactive and graduates to proactive only after proving reliability.
- The builder maintains sovereignty over high-stakes decisions (choosing Gold projects, reclassifying streams) while agents handle research, coordination, and routine follow-up autonomously within their defined permissions.

### What Violating This Looks Like

- **Treating agents as generic chat interfaces** — Level 0 is "no AI or generic chat." An agent without a defined job, domain, and permissions is just a chatbot. The teammate model requires defined roles and boundaries: Jarvis counsels, Marvin organizes, Conan archives. Generic "ask me anything" violates the entire ladder.
- **Skipping to autonomous behavior without earning trust** — Jumping from Level 1 (specialized, reactive) to Level 5+ (tiered authority) without progressing through jobs-and-permissions and coordination. Trust is earned progressively, not declared.
- **Agents replacing builder judgment instead of empowering it** — Agents that make decisions the builder should make — choosing Gold projects, reclassifying streams, archiving work — violate sovereignty. The strategy is teammates, not replacement managers.

### Decision Heuristic

When choosing between the builder doing work personally and delegating to an agent, delegate — but only within the agent's defined role and earned authority level, never beyond it.

## Validation Criteria

To validate the teammate bet, measure whether role-differentiated agents outperform generic assistance, and whether users develop trust patterns that enable progressive delegation.

- **Role-appropriate delegation:** After 30 days, do users direct operational questions to Marvin and strategic questions to Jarvis, or do they use agents interchangeably? Measure the percentage of interactions that match the agent's defined role. Target: >60% role-matched interactions. If users treat all agents as generic chat, the role differentiation isn't creating value.
- **Acceptance rate by authority level:** Track what percentage of agent suggestions/actions are accepted at each authority tier. Level 1 (reactive help) acceptance should be high (>80%). If users reject most agent output even at the lowest authority level, the trust foundation isn't forming.
- **Permission escalation rate:** What percentage of users voluntarily grant agents expanded permissions (moving from "suggest" to "draft" to "execute") within 90 days? Target: >20% of active users escalate at least once. This is the trust ladder in action — if nobody climbs, the progressive trust model isn't working.
- **Generic reversion test:** Give users access to both role-specific agents and a generic "ask anything" assistant. After 60 days, what percentage of interactions go to role-specific agents vs. the generic option? If generic wins, specialization isn't worth the complexity.
- **Time-to-delegation:** How long after onboarding before a user delegates a task they previously would have done themselves (not just asks a question, but hands off actual work)? Target: within 14 days for at least one task type. If users never cross from "asking for help" to "delegating work," the teammate thesis isn't landing.
- **Invalidation signal:** Users treat agents as interchangeable chat interfaces, don't escalate permissions, or revert to doing work themselves because delegation overhead exceeds the time saved.

## Tensions

- With builder sovereignty — agents must empower, not replace, builder judgment
- With privacy — knowledge acquisition must respect boundaries ([[Principle - Earn Don't Interrogate]])
- Independent from other planks — can succeed or fail independently of Visual and Process bets
