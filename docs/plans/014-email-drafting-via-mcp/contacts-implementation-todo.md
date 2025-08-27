# Contacts Implementation TODO

## Overview

Implement a minimal contact management system where contacts are simply name + email, and can be associated with projects. This provides the foundation for email filtering in the MCP integration.

Each phase delivers working, QA-able software with a complete vertical slice through all layers.

## Phase 1: Basic Contact Creation & Display ✅

**Goal**: Users can create and view global contacts (shared across all users in the Work Squared instance)

### Backend

- [x] Add to `packages/shared/src/schema.ts`:
  - `contacts` table (id, name, email, createdAt, updatedAt)
  - `contact.create` event and materializer
  - **Enforce unique email constraint globally**
- [x] Add to `packages/shared/src/events.ts`:
  - `contact.create` event definition
- [x] Add to `packages/shared/src/queries.ts`:
  - `getContacts(db): Contact[]`
  - `getContactById(db, id): Contact | null`
  - `getContactByEmail(db, email): Contact | null` (for duplicate checking)

### Frontend

- [x] Create `packages/web/src/components/contacts/ContactList.tsx`
  - Display list of contacts (name, email)
  - Include empty state
- [x] Create `packages/web/src/components/contacts/ContactForm.tsx`
  - Name and email input fields
  - Submit button to create contact
  - Basic email validation
  - **Check for duplicate emails before creation**
- [x] Create `packages/web/src/hooks/useContacts.ts`
  - Subscribe to contacts query
  - Provide create operation
  - Handle duplicate email errors
- [x] Add "Contacts" tab to main navigation (alongside Projects, Tasks, Documents, Workers)
  - Route to `/contacts`
  - Show ContactList with inline form

### Tests

- [x] Unit test: contact.create event and materializer
- [x] Unit test: duplicate email prevention
- [x] Component test: ContactForm submission
- [x] E2E test: Create contact and see it in list
- [x] E2E test: Attempt to create duplicate email shows error

**QA Scenario**: User navigates to Contacts tab, creates a contact with name and email, sees it appear in the list immediately. Attempting to create another contact with the same email shows an error.

**Deliverable**: PR with basic contact creation and display with global unique emails

---

## Phase 2: Contact Detail View & Editing ✅

**Goal**: Users can view contact details, edit, and delete contacts

### Backend

- [x] Add to `packages/shared/src/events.ts`:
  - `contact.update` event
  - `contact.delete` event
- [x] Add materializers for update and delete
  - **Delete cascades to remove from all project associations**
  - **Enforce unique email on updates**

### Frontend

- [x] Create contact detail route `/contacts/:id`
- [x] Create `packages/web/src/components/contacts/ContactDetail.tsx`
  - Show contact name and email
  - Edit and delete buttons
  - List of associated projects (read-only for now)
- [x] Create `packages/web/src/components/contacts/ContactItem.tsx`
  - Clickable list item that navigates to detail view
  - Display contact name and email
- [x] Create `packages/web/src/components/contacts/EditContactModal.tsx`
  - Modal for editing contact details
  - Check for duplicate emails on save
- [x] Update useContacts hook:
  - Add update and delete operations
  - Handle optimistic updates

### Tests

- [x] Unit test: update/delete events and materializers
- [x] Unit test: cascade delete removes project associations
- [x] Component test: Edit contact flow
- [x] Component test: Delete contact with confirmation
- [x] E2E test: Navigate to contact detail, edit, and save
- [x] E2E test: Delete contact removes it from all projects

**QA Scenario**: User clicks on a contact to view details, can edit name/email (with duplicate check), and delete with confirmation. Deleting a contact removes it from all projects.

**Deliverable**: PR with contact detail view, editing, and deletion

---

## Phase 3: Project-Contact Association ✅

**Goal**: Users can associate contacts with projects from both contact and project views

### Backend

- [x] Add to `packages/shared/src/schema.ts`:
  - `project_contacts` junction table
  - Materializers for association
- [x] Add to `packages/shared/src/events.ts`:
  - `project.contact.add` event
  - `project.contact.remove` event
- [x] Add to `packages/shared/src/queries.ts`:
  - `getProjectContacts(db, projectId): Contact[]`
  - `getContactProjects(db, contactId): Project[]`

### Frontend

- [x] Update `ContactDetail.tsx`:
  - Add "Add to Project" button
  - Show list of associated projects
  - Remove from project button
- [x] Create `packages/web/src/components/projects/ProjectContacts.tsx`
  - Display contacts for a project
  - "Add Contact" button
  - Remove contact button
- [x] Create `packages/web/src/components/contacts/ContactPicker.tsx`
  - Modal with list of all contacts
  - Checkboxes for selection
  - Filter out already-added contacts
- [x] Create `packages/web/src/components/projects/ProjectPicker.tsx`
  - Modal to add contact to projects from contact detail
- [x] Update project detail view to include ProjectContacts section
- [x] Create `packages/web/src/hooks/useProjectContacts.ts`

### Tests

- [x] Unit test: project-contact association events
- [x] Component test: ContactPicker selection
- [x] Component test: ProjectPicker from contact detail
- [x] E2E test: Add contact to project from project view
- [x] E2E test: Add contact to project from contact detail
- [x] E2E test: Remove contact from project

**QA Scenario**: User can add contacts to projects from either the project view or contact detail view. User can see which projects a contact belongs to and remove associations.

**Deliverable**: PR with bidirectional project-contact association

---

## Phase 4: Bulk Import Contacts ✅

**Goal**: Users can bulk import contacts using comma-delimited email addresses

### Backend

- [x] Create `packages/shared/src/utils/contact-import.ts`:
  - `parseEmailList(input: string): { email: string, name?: string }[]`
  - Handle various formats: "email@example.com" or "Name <email@example.com>"
  - Trim whitespace, validate emails
  - Skip duplicates within import
- [x] Add batch contact creation support
  - Check for existing emails
  - Return list of created vs skipped contacts

### Frontend

- [x] Create `packages/web/src/components/contacts/BulkImportModal.tsx`
  - Textarea for comma-delimited email input
  - Support formats: "email1, email2" or "Name1 <email1>, Name2 <email2>"
  - Preview parsed contacts before import
  - Show which emails already exist
- [x] Add "Bulk Import" button to ContactList
- [x] Update useContacts hook:
  - Add bulk create operation
  - Handle partial success (some created, some skipped)

### Tests

- [x] Unit test: Email list parsing
- [x] Unit test: Various email formats
- [x] Component test: Bulk import preview
- [x] E2E test: Import multiple contacts
- [x] E2E test: Import with some duplicates shows proper feedback

**QA Scenario**: User clicks "Bulk Import", pastes comma-delimited emails, sees preview of what will be imported, imports successfully with feedback on duplicates.

**Deliverable**: PR with bulk contact import functionality

---

## Phase 5: Contact Search & Quick Add

**Goal**: Users can search contacts and quickly create contacts from project view

### Frontend

- [ ] Add search bar to ContactList
  - Search by name or email
  - Real-time filtering
- [ ] Create "Quick Add Contact" in project view
  - Inline form to create and immediately add contact to project
  - Check for duplicate emails
  - Add to project in single operation
- [ ] Update ContactPicker:
  - Add search functionality
  - Filter out already-added contacts
  - Multi-select for bulk add to project
- [ ] Update ContactItem in list:
  - Show project count badge
  - Quick actions on hover

### Tests

- [ ] Component test: Search functionality
- [ ] Component test: Quick add from project
- [ ] E2E test: Search and filter contacts
- [ ] E2E test: Quick add contact to project
- [ ] E2E test: Bulk add contacts to project

**QA Scenario**: User can search contacts by name/email, quickly create and add a new contact from project view, and bulk add multiple contacts to a project.

**Deliverable**: PR with search and quick add functionality

---

## Phase 6: Email Integration Preparation

**Goal**: Contact emails are ready for MCP email filtering

### Backend

- [ ] Create `packages/shared/src/utils/email-matching.ts`:
  - `matchEmailToContacts(email, contacts): Contact[]`
  - `extractEmailDomain(email): string`
  - `normalizeEmail(email): string`
- [ ] Create `packages/shared/src/utils/contacts.ts`:
  - `getProjectEmailList(db, projectId): string[]`
  - `formatContactsForMCP(contacts): MCPContactList`

### Frontend

- [ ] Add email validation indicators
  - Show invalid email warning
  - Suggest corrections for common typos
- [ ] Add "Test Email Match" feature
  - Input email to see which contacts match
  - Useful for debugging email filtering

### Integration Prep

- [ ] Document email matching rules
- [ ] Add email normalization (lowercase, trim)
- [ ] Handle email aliases and plus addressing

### Tests

- [ ] Unit test: Email matching logic
- [ ] Unit test: Domain extraction
- [ ] Unit test: Email normalization
- [ ] Integration test: Project email list generation
- [ ] Test various email formats

**QA Scenario**: System correctly matches emails to contacts, handles various email formats, and provides email list for MCP tools

**Deliverable**: PR with email integration utilities

---

## Phase 7: LLM Contacts Tools

**Goal**: Provide LLM tools for interacting with contacts and project-contact associations via MCP

### Backend Tools

- [ ] Create `packages/shared/src/mcp/contacts-tools.ts`:
  - `listContacts()`: Get all contacts with basic info
  - `getContact(id)`: Get detailed contact information
  - `searchContacts(query)`: Search contacts by name or email
  - `createContact(name, email)`: Create new contact with duplicate checking
  - `updateContact(id, updates)`: Update contact details
  - `deleteContact(id)`: Delete contact and all associations

### Project-Contact Tools

- [ ] Add to contacts tools:
  - `getProjectContacts(projectId)`: Get all contacts for a project
  - `getContactProjects(contactId)`: Get all projects for a contact
  - `addContactToProject(contactId, projectId)`: Associate contact with project
  - `removeContactFromProject(contactId, projectId)`: Remove association
  - `getProjectEmailList(projectId)`: Get formatted email list for a project

### Integration & Utilities

- [ ] Create `packages/shared/src/mcp/email-tools.ts`:
  - `findContactsByEmail(emails[])`: Match email addresses to contacts
  - `getProjectContactEmails(projectId)`: Get contact emails for project filtering
  - `validateEmailList(emails[])`: Validate and normalize email addresses
  - `suggestContactsFromEmails(emails[])`: Suggest creating contacts for unknown emails

### Error Handling & Validation

- [ ] Implement comprehensive error handling:
  - Contact not found errors
  - Duplicate email prevention
  - Invalid email format validation
  - Project association conflicts
  - Proper error messages for LLM consumption

### Documentation

- [ ] Document MCP tools with examples:
  - Tool schemas and parameter validation
  - Common usage patterns for email workflows
  - Integration examples with email drafting
  - Best practices for contact management via LLM

### Tests

- [ ] Unit tests for all MCP tools
- [ ] Integration tests with LiveStore
- [ ] Error handling test cases
- [ ] Email matching and validation tests
- [ ] Tool schema validation tests

**QA Scenario**: LLM can discover contacts, search by email, create missing contacts from email threads, associate contacts with projects, and retrieve project contact lists for email filtering - all through well-defined MCP tools.

**Use Cases**:

- Email drafting: Get project contact list for To/CC suggestions
- Email filtering: Match incoming emails to project contacts
- Contact discovery: Create contacts from email participants
- Project management: Associate new contacts with relevant projects

**Deliverable**: PR with comprehensive LLM contacts tools for MCP integration

---

## Design Decisions

Based on requirements discussion:

- **Global contacts**: Shared across all users in the Work Squared instance
- **Unique emails**: Enforced globally, no duplicate emails allowed
- **Navigation**: Contacts get their own tab in main navigation
- **Contact detail view**: Each contact has a show/edit route for managing projects
- **Bulk import**: Simple comma-delimited email list, no complex CSV parsing
- **No merging**: Enforce unique emails instead of deduplication
- **Cascade delete**: Deleting a contact removes it from all projects
- **No groups/tags**: Keep it simple for now
- **Expected scale**: Dozens of contacts per project, no pagination needed
- **No indexing**: Performance optimization not needed at this scale

## Success Criteria

- [ ] Contacts can be created with just name and email
- [ ] Contacts can be associated with multiple projects
- [ ] Projects can have multiple contacts
- [ ] Contact emails are easily accessible for MCP tools
- [ ] UI provides simple CRUD operations
- [ ] All changes sync in real-time across clients
- [ ] Tests cover all critical paths
- [ ] Performance remains good with 100+ contacts

## Technical Notes

- Follow existing LiveStore patterns from projects/tasks
- Use existing modal and form components where possible
- Maintain consistency with current UI/UX patterns
- Keep email validation simple but effective
- Contacts are global to the store, not user-specific
- Email uniqueness enforced at the event handler level
- No need for complex attribution tracking initially
