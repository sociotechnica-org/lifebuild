# Phase 1.2 Document System - User Stories

> Purpose: To build a document management system that integrates with projects, allowing users and future AI workers to create, manage, and collaborate on written content.

This phase introduces documents as a core feature, laying the groundwork for content creation, organization, and search. It follows the principles of progressive enhancement, starting with the simplest viable features and building from there.

---

## Story 1 – View project-specific documents list

**User story**: _As a user, I want to see a list of documents associated with a project inside the project workspace so I can easily access project-related materials._

**Context**: This integrates documents directly into the project workspace, creating a unified area for all project-related assets.

### Tasks

- [ ] UI: Add a "Documents" tab to the `ProjectWorkspace` component (alongside the existing "Tasks" tab).
- [ ] UI: Inside the "Documents" tab, create a list view to display documents.
- [ ] Schema: Implement `documents` and `documentProjects` tables in LiveStore.
- [ ] Query: Create a `getDocumentsForProject$` query to fetch all documents linked to a specific `projectId`.
- [ ] DoD: A project's workspace has a "Documents" tab that shows a (currently empty) list, ready for documents to be added.

### Implementation Notes

- **Future-Ready UI**: Establishes the tabbed interface in the project workspace.
- **Data Foundation**: Sets up the necessary database schema for all subsequent stories.

---

## Story 2 – Create a document from within a project

**User story**: _As a user, I want to create a new document from within a project so that it's automatically organized with my other project work._

**Dependencies**: Story 1

### Tasks

- [ ] Events: Define `document.created` and `document.addedToProject` events.
- [ ] UI: Add a "Create Document" button within the project's "Documents" tab.
- [ ] UI: The button should open a simple modal with fields for `title` and a plain `textarea` for `content`.
- [ ] Logic: On form submission, fire a `document.created` event, followed by a `document.addedToProject` event to link it to the current project.
- [ ] DoD: A user can create a document from a project's document tab, and it immediately appears in that project's document list.

### Implementation Notes

- **Atomic Events**: Firing two separate events keeps the system's state changes granular and easy to trace.
- **Simplicity First**: Using a standard `<textarea>` is sufficient for the initial implementation.

---

## Story 3 – View and Edit a Document

**User story**: _As a user, I want to view and edit a document's content so I can read and update information._

**Dependencies**: Story 2

### Tasks

- [ ] Routing: Create a `/document/:id` route for viewing/editing individual documents.
- [ ] UI: Create a `DocumentPage` component. It should display the document `title` as a header and its `content` within a simple `<textarea>`.
- [ ] UI: Add a "Save" button.
- [ ] Event: Define the `document.updated` event.
- [ ] Logic: Clicking a document in any list should navigate to its `DocumentPage`. Clicking "Save" fires the `document.updated` event with the new content.
- [ ] DoD: Users can navigate to a document, see its title and content, make changes in the textarea, and save them.

---

## Story 4 – Create an orphaned document

**User story**: _As a user, I want a central place to create documents that don't belong to any project so I can capture notes and ideas quickly._

**Dependencies**: Story 3

### Tasks

- [ ] Navigation: Add a "Documents" link to the main global navigation bar.
- [ ] Routing: Create a `/documents` route that leads to a central document page.
- [ ] UI: Add a "Create New Document" button on the `/documents` page.
- [ ] Logic: This creation flow fires only the `document.created` event, without a `projectId`. The user should be redirected to the new document's page (`/document/:id`) upon creation.
- [ ] DoD: A user can navigate to a central documents area and create a document that is not tied to any project.

---

## Story 5 – View all documents in a central list

**User story**: _As a user, I want to view a list of all my documents in one place so I can find anything I've written, regardless of project._

**Dependencies**: Story 4

### Tasks

- [ ] Query: Create an `getAllDocuments$` query to fetch all non-archived documents.
- [ ] UI: The `/documents` page should display a list of all documents, showing their titles.
- [ ] DoD: Visiting the `/documents` page shows a comprehensive list of every document in the system.

---

## Story 6 – Associate an existing document with a project

**User story**: _As a user, I want to add an existing document to a project so I can organize my work without duplicating content._

**Dependencies**: Story 5

### Tasks

- [ ] UI: In the project's "Documents" tab, add an "Add Existing Document" button.
- [ ] UI: This button should open a modal containing a searchable list/combobox of all existing, non-archived documents.
- [ ] Logic: Selecting a document from the modal and confirming will fire the `document.addedToProject` event.
- [ ] DoD: A user can attach any existing document to a project, and it will then appear in that project's document list.

---

## Story 7 – Archive a document

**User story**: _As a user, I want to archive a document that is no longer relevant so it doesn't clutter my workspace._

**Dependencies**: Story 3

### Tasks

- [ ] Schema: Add an `archivedAt?: number` field to the `documents` table.
- [ ] Event: Rename `document.deleted` to `document.archived` and update its payload to `{ id, archivedAt }`.
- [ ] UI: Add an "Archive" button on the `DocumentPage`.
- [ ] Logic: Clicking "Archive" fires the `document.archived` event.
- [ ] Queries: Update `getAllDocuments$` and `getDocumentsForProject$` to filter out documents where `archivedAt` is not null.
- [ ] DoD: Archiving a document removes it from all visible lists (central and project-specific).

### Implementation Notes

- **Soft Deletion**: Archiving preserves data and history, which is safer than permanent deletion. The document remains in the database.

---

## Story 8 – Global document search

**User story**: _As a user, I want to search across all my documents by title and content so I can find information quickly._

**Dependencies**: Story 5

### Tasks

- [ ] UI: Add a search input field on the central `/documents` page.
- [ ] Backend: Set up SQLite Full-Text Search (FTS) on the `documents` table, indexing the `title` and `content` fields.
- [ ] Query: Create a `searchDocuments$` query that uses the FTS index.
- [ ] Logic: The document list on the `/documents` page should filter its results based on the text entered in the search field.
- [ ] DoD: A user can type a query on the documents page and see a real-time filtered list of matching documents.

### Implementation Notes

- **Performance**: FTS is efficient for this use case. A slight delay is acceptable for the initial implementation.

---

## ⏳ Deferred Stories

### Story 9 – Remove a document from a project

- **Reason**: Less critical than adding documents. Disassociation can be added once the core organization is in place.

### Story 10 – Rich text editor

- **Reason**: A simple textarea is sufficient for Phase 1. Upgrading to a rich editor like CodeMirror is a significant piece of work that can be its own feature epic later.

---

## Technical Implementation Notes

### Database Schema

```typescript
// /src/livestore/schema.ts

documents: {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  archivedAt?: number // For soft deletes
}

documentProjects: {
  // Junction table for many-to-many relationship
  documentId: string
  projectId: string
}
```

### Event System

```typescript
// /src/livestore/events.ts

type DocumentEvent =
  | { type: 'document.created'; id: string; title: string; content: string }
  | { type: 'document.updated'; id: string; updates: Partial<{ title: string; content: string }> }
  | { type: 'document.archived'; id: string; archivedAt: number }
  | { type: 'document.addedToProject'; documentId: string; projectId: string }
  | { type: 'document.removedFromProject'; documentId: string; projectId: string }
```

### Testing Strategy

- **Unit Tests**: Focus on event handlers, query logic, and individual component rendering.
- **Integration Tests**: Test the flow of creating a document and seeing it appear in lists.
- **E2E Tests**: A full workflow test: create project, create document within it, edit document, archive document.

This plan provides a clear, incremental path to building the document system, ensuring each step delivers value.
