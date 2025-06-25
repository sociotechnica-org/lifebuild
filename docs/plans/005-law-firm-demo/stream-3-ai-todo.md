# Stream 3: Virtual Danvers AI System Todo

**Owner**: Claude Code #2
**Parent Plan**: [Law Firm Demo Plan](./law-firm-demo-plan.md)

This document outlines the tasks for building the Virtual Danvers AI, including document access tools and persona configuration.

## Must Have

### 1. Document Tools for LLM

**Goal**: Implement tools that allow the LLM to read, search, and list documents from the LiveStore.

- [ ] **Location**: Add new tool definitions in `src/utils/llm-tools.ts`.
- [ ] **`list_documents()` tool**:
  - [ ] Create a new query in `src/livestore/queries.ts` to select all document titles and IDs.
  - [ ] The tool function will call this query and return a formatted list of available documents.
- [ ] **`read_document(documentId)` tool**:
  - [ ] Create a query to select the content of a single document by its ID.
  - [ ] The tool function will take a `documentId` and return the document's content as a string.
- [ ] **`search_documents(query)` tool**:
  - [ ] This is more complex. For the demo, a simple search will suffice. Implement a query that performs a `LIKE '%query%'` search on the document content in SQLite.
  - [ ] The tool function will take a search string and return a list of matching document snippets and their IDs.
- [ ] **Integration**: Register these new tools with the LLM provider in the chat implementation.

### 2. Document Seeding

**Goal**: Pre-load 3-5 of Danvers' documents into each new session.

- [ ] **Content**: Create a new directory, `docs/seed-content/`, and place the 3-5 final Markdown documents there.
- [ ] **Seeding Logic**: This task depends on the session creation mechanism from Stream 1. Once a new session and its store are created, a seeding function should be triggered.
- [ ] **Implementation**: The `seedSessionDocuments` function sketched in the main plan should be implemented. It will iterate through the default documents (reading them from the new directory) and emit a `document.created` event for each one using the LiveStore `mutate` API.
- [ ] **Event Schema**: Ensure the `document.created` event in `src/livestore/events.ts` and the `documents` table schema in `src/livestore/schema.ts` can store all necessary information (e.g., `id`, `title`, `content`).

### 3. Basic Virtual Danvers Persona

**Goal**: Configure the LLM with a system prompt for a law firm AI integration advisor.

- [ ] **System Prompt**: Finalize the system prompt. The draft is: `You are Virtual Danvers, an AI integration advisor for law firms...` This should be refined to include instructions on tone, purpose, and how to use its tools.
- [ ] **Configuration**: Update the LLM provider configuration (`VIRTUAL_DANVERS_CONFIG` from the plan) with the system prompt, model (`gpt-4-turbo`), and temperature (`0.7`).
- [ ] **Tool Registration**: Ensure the newly created document tools are included in the `tools` array for the configuration.

## Should Have

### 1. Intro Message System

**Goal**: Display a brief welcome message in new sessions.

- [ ] **Mechanism**: When a new session is created, after seeding the documents, emit a `chat.message.created` event with a welcome message from the `assistant`.
- [ ] **Content**: The message should briefly introduce Virtual Danvers and suggest what the user can ask. For example: "Welcome. I'm Virtual Danvers, your AI integration advisor. You can ask me about the pre-loaded documents on AI in legal practice."
- [ ] **Implementation**: This can be part of the `seedSessionDocuments` function.

### 2. Response Optimization

**Goal**: Test and refine the quality of the AI's responses.

- [ ] **Testing**: After the core features are built, conduct several test conversations covering expected user questions.
- [ ] **Scenarios**: Test document retrieval, summarization, and questions about AI integration.
- [ ] **Refinement**: Based on test results, tweak the system prompt, tool descriptions, or even the document content to improve response quality.

### 3. Legal Disclaimers

**Goal**: Include a basic legal disclaimer.

- [ ] **Content**: Draft a short, clear disclaimer. E.g., "I am an AI assistant and not a lawyer. My responses are for informational purposes only and do not constitute legal advice."
- [ ] **Placement**: The disclaimer can be included as part of the initial welcome message or as a static piece of text in the UI near the chat interface. Placing it in the welcome message is likely sufficient for the demo.
