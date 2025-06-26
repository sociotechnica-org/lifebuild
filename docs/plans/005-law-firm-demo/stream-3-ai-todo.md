# Stream 3: Virtual Danvers AI System Todo

**Owner**: Claude Code #2
**Parent Plan**: [Law Firm Demo Plan](./law-firm-demo-plan.md)

This document outlines the tasks for building the Virtual Danvers AI, including document access tools and persona configuration.

## Must Have

### 1. Document Tools for LLM ✅ COMPLETED

**Goal**: Implement tools that allow the LLM to read, search, and list documents from the LiveStore.

- [x] **Location**: Add new tool definitions in `src/utils/llm-tools.ts`.
- [x] **`list_documents()` tool**:
  - [x] Create a new query in `src/livestore/queries.ts` to select all document titles and IDs.
  - [x] The tool function will call this query and return a formatted list of available documents.
- [x] **`read_document(documentId)` tool**:
  - [x] Create a query to select the content of a single document by its ID.
  - [x] The tool function will take a `documentId` and return the document's content as a string.
- [x] **`search_documents(query)` tool**:
  - [x] This is more complex. For the demo, a simple search will suffice. Implement a query that performs a `LIKE '%query%'` search on the document content in SQLite.
  - [x] The tool function will take a search string and return a list of matching document snippets and their IDs.
- [x] **Integration**: Register these new tools with the LLM provider in the chat implementation.

### 2. Document Seeding ⚠️ NEEDS REVERSION

**Goal**: Pre-load 3-5 of Danvers' documents into each new session.

- [x] **Content**: Create a new directory, `docs/seed-content/`, and place the 3-5 final Markdown documents there.
- [x] **Seeding Logic**: This task depends on the session creation mechanism from Stream 1. Once a new session and its store are created, a seeding function should be triggered.
- [x] **Implementation**: The `seedSessionDocuments` function sketched in the main plan should be implemented. It will iterate through the default documents (reading them from the new directory) and emit a `document.created` event for each one using the LiveStore `mutate` API.
- [x] **Event Schema**: Ensure the `document.created` event in `src/livestore/events.ts` and the `documents` table schema in `src/livestore/schema.ts` can store all necessary information (e.g., `id`, `title`, `content`).

**Reversion Needed**: Document seeding was implemented but needs to be reverted since the Virtual Danvers demo is not needed. The seeding logic and law firm-specific content should be removed.

### 3. Basic Virtual Danvers Persona ❌ NOT COMPLETED

**Goal**: Configure the LLM with a system prompt for a law firm AI integration advisor.

- [ ] **System Prompt**: Finalize the system prompt. The draft is: `You are Virtual Danvers, an AI integration advisor for law firms...` This should be refined to include instructions on tone, purpose, and how to use its tools.
- [ ] **Configuration**: Update the LLM provider configuration (`VIRTUAL_DANVERS_CONFIG` from the plan) with the system prompt, model (`gpt-4-turbo`), and temperature (`0.7`).
- [ ] **Tool Registration**: Ensure the newly created document tools are included in the `tools` array for the configuration.

**Final State**: Virtual Danvers persona configuration was never implemented or committed to the codebase, so no reversion is needed.

## Final Status

### Virtual Danvers Work Not Merged
The Virtual Danvers AI advisor work was not merged into the main branch since the live demo was ultimately not needed.

### Document Work Status
- Document tools (`list_documents`, `read_document`, `search_documents`) were successfully implemented and are useful for future features
- Document seeding functionality was implemented but should be reverted since it contains law firm-specific content
- Virtual Danvers persona was never implemented in code, so no reversion needed

### Future Potential
This work could be pivoted into a general purpose "advisors" feature where users can create specialized AI assistants for different domains, but that's outside the current scope.
