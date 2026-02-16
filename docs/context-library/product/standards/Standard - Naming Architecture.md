# Standard - Naming Architecture

## WHAT: Definition

The naming hierarchy for all characters in LifeBuild: **Builder** (the person), **Stewards** (the core advisory team), **Attendants** (the extended execution staff). Each tier has distinct authority, voice, and relationship to the builder. The names carry meaning — they are not arbitrary labels.

## WHERE: Ecosystem

- Applies to: All agent design, all user-facing copy, all documentation
- Relates to:
  - [[Agent - Jarvis]] — Steward (Counselor)
  - [[Agent - Marvin]] — Steward (Manager)
  - [[Agent - Conan]] — Steward (Librarian)
  - [[Room - Roster Room]] — where Attendants are assigned
  - [[Strategy - AI as Teammates]] — the naming embodies the teammate model
- Implements: [[Strategy - AI as Teammates]] — teammates have names, roles, and relationships

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — naming is how the teammate relationship becomes legible
- Driver: The names communicate the social contract. "Builder" says: you are the one who decides what to build. "Stewards" says: we serve and advise, but we do not direct. "Attendants" says: we handle the work you shouldn't be doing yourself. The hierarchy is intentional — it encodes authority, humility, and purpose.

## WHEN: Timeline

**Build phase:** MVP (principle) through all phases
**Implementation status:** Partial
**Reality note (2026-02-12):** "Builder" is used inconsistently (sometimes "user" in code). Steward terminology is not yet adopted in the codebase (agents are called "agents"). Attendants are referenced as the future execution tier but none exist yet. The naming architecture is established in design documents but not fully reflected in the product or codebase.

## HOW: Specification

### The Hierarchy

| Tier           | Name           | Who They Are                                                                                                | Authority Level                                     | Voice                         |
| -------------- | -------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------- |
| Person         | **Builder**    | The user. Brings vision, values, judgment. The irreplaceable element.                                       | Sovereign — always has the final word               | N/A — this is the player      |
| Core Team      | **Stewards**   | Wise, humble, capable advisors. Serve and advise but do not direct. Strategic-level support.                | Advisory — suggests, recommends, pushes back gently | Each has distinct personality |
| Extended Staff | **Attendants** | Specialists in task types: research, scheduling, drafting, coordination. Tactical, execution-level support. | Delegated — executes within assigned scope          | Efficient, specialized        |

### Why These Names

**Builder** — not "user," "player," or "member." The same way the person who owns a construction company is a builder — they decide what to build and oversee it getting built. The Builder is the one who brings the answer to "what is this life FOR?"

**Stewards** — not "advisors," "assistants," or "coaches." Stewards serve and care for something on behalf of its owner. They are wise and capable, but their wisdom is offered, not imposed. The steward relationship is one of service with genuine expertise — humble mastery.

**Attendants** — not "workers," "bots," or "tools." Attendants attend to the work the builder shouldn't be doing themselves. The name carries dignity (attending to, not just executing) while clearly placing them in a support role.

### The Social Contract

- The Builder doesn't lay every brick — but every brick is laid according to the Builder's vision.
- Stewards will suggest, advise, and sometimes push back. They'll tell you when you're overbuilding and underresting. But the final word is always yours.
- Attendants specialize over time. They earn broader scope through demonstrated competence.

### Usage Guidelines

| Context                          | Use                                 | Don't Use                         |
| -------------------------------- | ----------------------------------- | --------------------------------- |
| Referring to the person          | Builder                             | User, player, customer, member    |
| Referring to Jarvis/Marvin/Conan | Stewards, or their individual names | Agents, AIs, bots, assistants     |
| Referring to task executors      | Attendants                          | Workers, bots, tools              |
| In code (pragmatic)              | "user" acceptable in code contexts  | "builder" in all user-facing copy |

### Anti-Examples

- **Calling stewards "AI assistants"** — this reduces the relationship to tool usage. Stewards are teammates with defined roles, not generic helpers.
- **Calling the builder a "user"** — acceptable in technical contexts but never in user-facing copy. "User" implies the product is in control. "Builder" implies the person is.
- **Calling attendants "workers"** — "Worker" is being retired in favor of "Attendant." The latter carries more dignity and better communicates the serving relationship.
