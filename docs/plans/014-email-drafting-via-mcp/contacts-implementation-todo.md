# Contacts Implementation TODO

## Overview

Implement a minimal contact management system where contacts are simply name + email, and can be associated with projects. This provides the foundation for email filtering in the MCP integration.

Each phase delivers working, QA-able software with a complete vertical slice through all layers.

## Phase 1: Basic Contact Creation & Display

**Goal**: Users can create and view global contacts (shared across all users in the Work Squared instance)

### Backend

- [ ] Add to `packages/shared/src/schema.ts`:
  - `contacts` table (id, name, email, createdAt, updatedAt)
  - `contact.create` event and materializer
  - **Enforce unique email constraint globally**
- [ ] Add to `packages/shared/src/events.ts`:
  - `contact.create` event definition
- [ ] Add to `packages/shared/src/queries.ts`:
  - `getContacts(db): Contact[]`
  - `getContactById(db, id): Contact | null`
  - `getContactByEmail(db, email): Contact | null` (for duplicate checking)

### Frontend

- [ ] Create `packages/web/src/components/contacts/ContactList.tsx`
  - Display list of contacts (name, email)
  - Include empty state
- [ ] Create `packages/web/src/components/contacts/ContactForm.tsx`
  - Name and email input fields
  - Submit button to create contact
  - Basic email validation
  - **Check for duplicate emails before creation**
- [ ] Create `packages/web/src/hooks/useContacts.ts`
  - Subscribe to contacts query
  - Provide create operation
  - Handle duplicate email errors
- [ ] Add "Contacts" tab to main navigation (alongside Projects, Tasks, Documents, Workers)
  - Route to `/contacts`
  - Show ContactList with inline form

### Tests

- [ ] Unit test: contact.create event and materializer
- [ ] Unit test: duplicate email prevention
- [ ] Component test: ContactForm submission
- [ ] E2E test: Create contact and see it in list
- [ ] E2E test: Attempt to create duplicate email shows error

**QA Scenario**: User navigates to Contacts tab, creates a contact with name and email, sees it appear in the list immediately. Attempting to create another contact with the same email shows an error.

**Deliverable**: PR with basic contact creation and display with global unique emails

---

## Phase 2: Contact Detail View & Editing

**Goal**: Users can view contact details, edit, and delete contacts

### Backend

- [ ] Add to `packages/shared/src/events.ts`:
  - `contact.update` event
  - `contact.delete` event
- [ ] Add materializers for update and delete
  - **Delete cascades to remove from all project associations**
  - **Enforce unique email on updates**

### Frontend

- [ ] Create contact detail route `/contacts/:id`
- [ ] Create `packages/web/src/components/contacts/ContactDetail.tsx`
  - Show contact name and email
  - Edit and delete buttons
  - List of associated projects (read-only for now)
- [ ] Create `packages/web/src/components/contacts/ContactItem.tsx`
  - Clickable list item that navigates to detail view
  - Display contact name and email
- [ ] Create `packages/web/src/components/contacts/EditContactModal.tsx`
  - Modal for editing contact details
  - Check for duplicate emails on save
- [ ] Update useContacts hook:
  - Add update and delete operations
  - Handle optimistic updates

### Tests

- [ ] Unit test: update/delete events and materializers
- [ ] Unit test: cascade delete removes project associations
- [ ] Component test: Edit contact flow
- [ ] Component test: Delete contact with confirmation
- [ ] E2E test: Navigate to contact detail, edit, and save
- [ ] E2E test: Delete contact removes it from all projects

**QA Scenario**: User clicks on a contact to view details, can edit name/email (with duplicate check), and delete with confirmation. Deleting a contact removes it from all projects.

**Deliverable**: PR with contact detail view, editing, and deletion

---

## Phase 3: Project-Contact Association

**Goal**: Users can associate contacts with projects from both contact and project views

### Backend

- [ ] Add to `packages/shared/src/schema.ts`:
  - `project_contacts` junction table
  - Materializers for association
- [ ] Add to `packages/shared/src/events.ts`:
  - `project.contact.add` event
  - `project.contact.remove` event
- [ ] Add to `packages/shared/src/queries.ts`:
  - `getProjectContacts(db, projectId): Contact[]`
  - `getContactProjects(db, contactId): Project[]`

### Frontend

- [ ] Update `ContactDetail.tsx`:
  - Add "Add to Project" button
  - Show list of associated projects
  - Remove from project button
- [ ] Create `packages/web/src/components/projects/ProjectContacts.tsx`
  - Display contacts for a project
  - "Add Contact" button
  - Remove contact button
- [ ] Create `packages/web/src/components/contacts/ContactPicker.tsx`
  - Modal with list of all contacts
  - Checkboxes for selection
  - Filter out already-added contacts
- [ ] Create `packages/web/src/components/projects/ProjectPicker.tsx`
  - Modal to add contact to projects from contact detail
- [ ] Update project detail view to include ProjectContacts section
- [ ] Create `packages/web/src/hooks/useProjectContacts.ts`

### Tests

- [ ] Unit test: project-contact association events
- [ ] Component test: ContactPicker selection
- [ ] Component test: ProjectPicker from contact detail
- [ ] E2E test: Add contact to project from project view
- [ ] E2E test: Add contact to project from contact detail
- [ ] E2E test: Remove contact from project

**QA Scenario**: User can add contacts to projects from either the project view or contact detail view. User can see which projects a contact belongs to and remove associations.

**Deliverable**: PR with bidirectional project-contact association

---

## Phase 4: Bulk Import Contacts

**Goal**: Users can bulk import contacts using comma-delimited email addresses

### Backend

- [ ] Create `packages/shared/src/utils/contact-import.ts`:
  - `parseEmailList(input: string): { email: string, name?: string }[]`
  - Handle various formats: "email@example.com" or "Name <email@example.com>"
  - Trim whitespace, validate emails
  - Skip duplicates within import
- [ ] Add batch contact creation support
  - Check for existing emails
  - Return list of created vs skipped contacts

### Frontend

- [ ] Create `packages/web/src/components/contacts/BulkImportModal.tsx`
  - Textarea for comma-delimited email input
  - Support formats: "email1, email2" or "Name1 <email1>, Name2 <email2>"
  - Preview parsed contacts before import
  - Show which emails already exist
- [ ] Add "Bulk Import" button to ContactList
- [ ] Update useContacts hook:
  - Add bulk create operation
  - Handle partial success (some created, some skipped)

### Tests

- [ ] Unit test: Email list parsing
- [ ] Unit test: Various email formats
- [ ] Component test: Bulk import preview
- [ ] E2E test: Import multiple contacts
- [ ] E2E test: Import with some duplicates shows proper feedback

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
