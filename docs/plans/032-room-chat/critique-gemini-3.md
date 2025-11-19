# Critique of Room Chat Plan (032)

This document contains a critique of the [Room Chat Plan (032)](./plan.md). Overall, the plan is excellent: it's well-structured, detailed, and follows sound software engineering principles like incremental development and clear scoping. The following points are intended to strengthen it further.

### Summary of Strengths

*   **Clear Goals & Non-Goals:** The strict scoping is a major strength, preventing scope creep and focusing the effort on the core deliverables.
*   **Incremental Rollout Strategy:** The horizontal PR breakdown is logical, delivering end-to-end value at each stage and reducing integration risk.
*   **Grounded in Existing Code:** The plan demonstrates a deep understanding of the current codebase and leverages existing patterns and components effectively.
*   **Proactive Risk Assessment:** Key technical risks are identified with sensible mitigations proposed.

### Suggestions for Improvement

Here are four areas where the plan could be enhanced to improve robustness, reduce risk, and create a better user experience.

#### 1. Reconsider the Conversation Sharing Model

The plan specifies that all conversations are shared workspace-wide. While this is appropriate for collaborative rooms like Projects, it presents a significant user experience risk for personal rooms.

*   **Critique:** A user chatting with a Health or Life Map coach will likely assume the conversation is private. Making it visible to the entire workspace could violate user expectations and trust.
*   **Suggestion:** Introduce a `scope` for conversations (e.g., a new column on the `conversations` table).
    *   **`scope: 'user'`**: For personal rooms like Life Map and Categories. The conversation would be unique to the user within that room.
    *   **`scope: 'workspace'`**: For collaborative rooms like Projects. The conversation is shared by everyone in the workspace.
    *   This change would make the feature safer and more intuitive, even if it adds slight complexity to the data model in PR1.

#### 2. Add Detail to the Project Worker Lifecycle

The plan correctly identifies the need to manage workers for archived/deleted projects but is vague on the details.

*   **Critique:** Terms like "mark workers inactive" are ambiguous. A more detailed lifecycle is needed to prevent orphaned records and ensure correct behavior when projects are restored.
*   **Suggestion:** Specify the lifecycle logic in PR4:
    *   **On Project Archive:** Mark the worker and conversation as `archived` (e.g., via a status flag). The UI should prevent further interaction.
    *   **On Project Un-archive:** The worker and conversation status should be restored to `active`.
    *   **On Project Delete:** Trigger a hard delete of the worker and conversation, or implement a soft-delete with a defined garbage-collection strategy.

#### 3. Clarify the Prompt Templating Mechanism

The plan includes a prompt template (`"You are the project guide for {{projectName}}..."`) without specifying how the templating works.

*   **Critique:** This leaves ambiguity for the developer. Is it a client-side or server-side responsibility?
*   **Suggestion:** Explicitly state the implementation within the scope for PR4. A simple, client-side string replacement before the worker creation event is likely the most straightforward approach and avoids unnecessary backend complexity for this stage.

#### 4. Split the First Pull Request

PR1, as scoped, is very large. It combines backend schema changes, data layer queries, new frontend hooks, and new UI components.

*   **Critique:** Such a large PR can be a bottleneck for review, increasing the risk of errors and slowing down development.
*   **Suggestion:** Divide PR1 into smaller, more focused pull requests.
    *   **PR1a (Backend & Data):** Focus on schema changes, `rooms.ts` definitions, and LiveStore queries.
    - **PR1b (Frontend Infrastructure):** Introduce the reusable hooks (`useRoomAgent`, `useRoomConversation`) and the unstyled UI components, built on the data layer from PR1a.

By incorporating this feedback, the already strong plan will become even more robust, user-centric, and likely to be delivered smoothly.
