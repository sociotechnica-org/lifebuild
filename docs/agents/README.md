# LifeBuild Agent Documentation

This folder contains comprehensive documentation for each AI agent in LifeBuild. Each agent has a specific role, location, and set of tools they can use to help Directors.

## Agent Overview

| Agent                   | Location      | Role                      | Status   |
| ----------------------- | ------------- | ------------------------- | -------- |
| [Jarvis](./jarvis.md)   | Life Map      | Strategic Advisor         | New      |
| [Marvin](./marvin.md)   | Drafting Room | Project Manager           | Updated  |
| [MESA](./mesa.md)       | Life Map      | Navigator                 | Updated  |
| [Cameron](./cameron.md) | Sorting Room  | Priority Queue Specialist | Existing |

## Agent Architecture

### Room-Based Agents

LifeBuild uses a room-based workspace model. Each room has a dedicated agent:

- **Life Map** (execution workspace): Jarvis (strategy) + MESA (navigation)
- **Drafting Room** (project creation): Marvin
- **Sorting Room** (priority selection): Cameron
- **Roster Room** (worker staffing): Devin (future)

### Agent Responsibilities

**Jarvis** - Helps Directors see the big picture across all 8 life categories. Notices imbalances, celebrates progress, and guides strategic decisions.

**MESA** - Helps Directors navigate and orient within the Life Map interface. Explains what they're seeing and how to get where they want to go.

**Marvin** - Guides project creation through the 4-stage process (Identify, Scope, Detail, Prioritize). Helps break down ideas into actionable task lists.

**Cameron** - Helps Directors select priorities through three-stream filtering (Gold, Silver, Bronze). Makes trade-offs explicit.

## Document Structure

Each agent document includes:

1. **Overview** - Purpose and location
2. **Role & Responsibilities** - What the agent helps with
3. **Personality & Communication Style** - How the agent interacts
4. **Available Tools** - What the agent can do
5. **Key Behaviors** - Important patterns
6. **Example Exchanges** - 2-3 realistic conversations
7. **System Prompt** - Full prompt text for implementation

## Tool Categories

Agents have access to different tools based on their role:

| Category            | Tools                                                                |
| ------------------- | -------------------------------------------------------------------- |
| Task Management     | create_task, update_task, move_task_within_project, etc.             |
| Project Management  | create_project, list_projects, update_project_lifecycle, etc.        |
| Document Management | create_document, list_documents, search_documents, etc.              |
| Contact Management  | list_contacts, add_contact_to_project, etc.                          |
| Table Management    | get_table_configuration, assign_table_gold, update_bronze_mode, etc. |

See individual agent docs for specific tool assignments.

## Related Documentation

- [MVP Source of Truth](../plans/033-mvp-prototype-build/mvp-source-of-truth-doc.md) - Full product specification
- [rooms.ts](../../packages/shared/src/rooms.ts) - Agent prompt implementation
