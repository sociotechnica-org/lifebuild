# LifeBuild Agent Documentation

This folder contains comprehensive documentation for each AI agent in LifeBuild. Each agent has a specific role, location, and set of tools they can use to help Directors.

## Agent Overview

| Agent                   | Location      | Role                      |
| ----------------------- | ------------- | ------------------------- |
| [Marvin](./marvin.md)   | Drafting Room | Project Manager           |
| [Cameron](./cameron.md) | Sorting Room  | Priority Queue Specialist |
| [MESA](./mesa.md)       | Life Map      | Navigator                 |

## Agent Architecture

### Room-Based Agents

LifeBuild uses a room-based workspace model. Each room has a dedicated agent:

- **Drafting Room** (project creation): Marvin
- **Sorting Room** (priority selection): Cameron
- **Life Map** (execution workspace): MESA (navigation)
- **Roster Room** (worker staffing): Devin (future)

### Agent Responsibilities

**Marvin** - Guides project creation through the 4-stage process (Identify, Scope, Detail, Prioritize). Helps break down ideas into actionable task lists.

**Cameron** - Helps Directors select priorities through three-stream filtering (Gold, Silver, Bronze). Makes trade-offs explicit.

**MESA** - Helps Directors navigate and orient within the Life Map interface. Explains what they're seeing and how to get where they want to go.

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
