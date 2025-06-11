# LLM Chat Implementation - User Stories

This document organizes the LLM Chat implementation into incremental user stories. Each story builds on the previous ones to ensure we're always building the minimal viable thing.

## Architecture Overview

Based on the technical design document, the LLM Chat system will:

- Use LiveStore's event-sourcing architecture with events flowing through the event stream
- Implement LLM calls through a Cloudflare Worker
- Use a sync worker that watches the event stream for incoming chat messages
- Maintain live queries on chat messages to route them to appropriate conversations
- Start with one global user and one global LLM (no user management initially)

## User Stories (Implementation Order)

### Story 1: Start a New Chat with an LLM
**As a user, I want to start a new chat with an LLM.**

**Acceptance Criteria:**
- I can click a "New Chat" button or similar UI element
- A new conversation is created with a unique conversation ID
- The chat interface appears ready for input
- The conversation is persisted in LiveStore
- Events are emitted for conversation creation

**Technical Implementation:**
- Add `conversation.created` event type to LiveStore events
- Add `conversations` table to LiveStore schema
- Create ChatInterface component with conversation management
- Set up basic UI with conversation selector
- Implement conversation creation flow

**Dependencies:** None (foundational story)

---

### Story 2: Send a Chat Message to an LLM
**As a user, I want to send a chat message to an LLM.**

**Acceptance Criteria:**
- I can type a message in the chat input
- I can send the message by pressing Enter or clicking Send
- My message appears in the chat interface immediately
- The message is persisted with the correct conversation ID
- Events are emitted for message creation

**Technical Implementation:**
- Add `chat.message` event type with conversation ID
- Add `chatMessages` table with conversation foreign key
- Implement message input component
- Add message display component
- Set up event emission for user messages

**Dependencies:** Story 1 (needs conversation context)

---

### Story 3: LLM Responds to Chat Messages
**As an LLM, I want to respond to the user's chat message by using one or more tools, if appropriate.**

**Acceptance Criteria:**
- The system detects new user messages in a conversation
- LLM processes the message and generates a response
- LLM response appears in the chat interface
- Response is persisted with the conversation
- Tool usage is indicated when tools are called

**Technical Implementation:**
- Set up Cloudflare Worker for LLM API calls
- Create sync worker that watches chat message events
- Implement conversation-aware message routing
- Add LLM response generation and event emission
- Set up tool calling infrastructure (for future stories)
- Add loading states and streaming response UI

**Dependencies:** Story 2 (needs user messages to respond to)

---

### Story 4: LLM Creates Tasks (Kanban Cards)
**As an LLM, I want to use a tool to create some tasks (kanban cards).**

**Acceptance Criteria:**
- LLM can create tasks when appropriate based on conversation context
- Tasks are created with title, description, and board assignment
- Task creation is confirmed in the chat interface
- Tasks appear in the Kanban interface
- Events are emitted for task creation

**Technical Implementation:**
- Add task creation tool to LLM tool set
- Implement `task.created` event handling
- Connect task creation to existing Kanban system
- Add task creation confirmation in chat interface
- Display tool call results in chat messages

**Dependencies:** Story 3 (needs LLM response capability), existing Kanban system

---

### Story 5: LLM Lists Tasks (Kanban Cards)
**As an LLM, I want to use a tool to list tasks (kanban cards).**

**Acceptance Criteria:**
- LLM can query and list existing tasks when asked
- Task lists include relevant details (title, status, board)
- LLM can filter tasks by board, status, or other criteria
- Task information is presented clearly in chat responses
- Tool call results are shown in chat messages

**Technical Implementation:**
- Add task listing tool to LLM tool set
- Implement task querying from LiveStore
- Add task filtering and search capabilities
- Format task information for LLM responses
- Display tool call results in chat interface

**Dependencies:** Story 4 (needs tasks to exist), Story 3 (needs LLM tool capability)

---

### Story 6: LLM Lists Projects (Kanban Boards)
**As an LLM, I want to use a tool to list projects (kanban boards).**

**Acceptance Criteria:**
- LLM can query and list existing boards/projects when asked
- Board lists include relevant details (name, task count, status)
- LLM can provide board overviews and summaries
- Board information is presented clearly in chat responses
- Tool call results are shown in chat messages

**Technical Implementation:**
- Add board listing tool to LLM tool set
- Implement board querying from LiveStore
- Add board summary and statistics generation
- Format board information for LLM responses
- Display tool call results in chat interface

**Dependencies:** Story 5 (builds on task management), existing Kanban system

---

## Infrastructure Considerations

### Event-Driven Architecture
- All interactions flow through LiveStore event stream
- Sync worker monitors events and triggers LLM responses
- Conversation-aware event routing ensures messages reach correct context

### Cloudflare Worker Integration
- LLM API calls handled through Cloudflare Worker
- Async processing to avoid blocking UI
- Error handling and retry logic for robustness

### Tool System
- Extensible tool interface for LLM capabilities
- Tool calls and results displayed in chat interface
- Clear separation between tool definition and execution

### Simplifying Assumptions
- Single global user (no authentication initially)
- Single global LLM context
- No user management or permissions
- Focus on core functionality over scalability

## Implementation Notes

1. **Build Incrementally**: Each story should be fully functional before moving to the next
2. **Event-First**: All actions should emit events, even if not immediately consumed
3. **Test Coverage**: Each story should include appropriate unit and integration tests
4. **Tool Visibility**: All LLM tool usage should be visible in the chat interface
5. **Error Handling**: Graceful degradation when tools fail or LLM is unavailable

## Future Considerations

- Activity log panel for detailed event stream visibility
- User management and multi-tenant support
- Advanced tool capabilities (task editing, board management)
- Integration with external services (Trello, Obsidian)
- Conversation history and context management
- Model selection and configuration options