# Gmail MCP Implementation TODO

## Overview

Implement Gmail integration via MCP (Model Context Protocol) to enable email checking and draft creation. Uses a 4-hour windowing approach with timestamp tracking to avoid reprocessing emails.

## Phase 1: MCP Server Setup

### Environment Setup

#### 1.1 Install MCP Dependencies

- [ ] Add MCP server dependencies to `packages/server/package.json`:
  ```json
  "@modelcontextprotocol/server-gmail": "latest",
  "@modelcontextprotocol/sdk": "latest"
  ```
- [ ] Configure environment variables for Gmail OAuth

#### 1.2 Gmail OAuth Configuration

- [ ] Set up Google Cloud Project
- [ ] Enable Gmail API
- [ ] Create OAuth 2.0 credentials
- [ ] Configure redirect URIs
- [ ] Document setup process in README

### MCP Server Configuration

#### 1.3 Create MCP Server Manager

- [ ] Create `packages/server/src/services/mcp-manager.ts`:
  ```typescript
  class MCPServerManager {
    startGmailServer(userId: string, credentials: OAuthCredentials): Promise<MCPServer>
    stopServer(userId: string): Promise<void>
    getServer(userId: string): MCPServer | null
  }
  ```

#### 1.4 Implement Server Lifecycle

- [ ] Start MCP server per user on demand
- [ ] Handle server crashes and restarts
- [ ] Implement connection pooling
- [ ] Add health checks

### Authentication Flow

#### 1.5 OAuth Flow Implementation

- [ ] Create `packages/server/src/services/gmail-auth.ts`
- [ ] Implement OAuth authorization URL generation
- [ ] Handle OAuth callback and token exchange
- [ ] Store refresh tokens securely
- [ ] Implement token refresh logic

#### 1.6 Credential Storage

- [ ] Add to `packages/shared/src/schema.ts`:
  ```typescript
  email_accounts: {
    id: string
    userId: string
    email: string
    provider: 'gmail'
    accessToken: string // Encrypted
    refreshToken: string // Encrypted
    expiresAt: number
    lastSyncedAt: number | null
    createdAt: number
  }
  ```

### Tests

#### 1.7 MCP Server Tests

- [ ] Test server startup/shutdown
- [ ] Test credential handling
- [ ] Test error recovery
- [ ] Mock OAuth flow for testing

**Deliverable**: PR with MCP server setup and OAuth flow

---

## Phase 2: Email Tools Implementation

### Search Emails Tool

#### 2.1 Create Email Search Tool

- [ ] Create `packages/server/src/tools/search-emails.ts`:

  ```typescript
  interface SearchEmailsParams {
    projectId: string
    sinceHours: number  // Default 4 hours
    maxResults?: number
  }

  searchEmails(params: SearchEmailsParams): Promise<Email[]>
  ```

#### 2.2 Implement Email Filtering

- [ ] Filter by project contacts (from contacts system)
- [ ] Use 4-hour sliding window by default
- [ ] Support custom time windows
- [ ] Handle pagination for large result sets

#### 2.3 Email Parsing

- [ ] Extract sender, subject, body
- [ ] Parse email threads/conversations
- [ ] Handle HTML and plain text
- [ ] Extract relevant metadata

### Create Draft Tool

#### 2.4 Create Draft Email Tool

- [ ] Create `packages/server/src/tools/create-draft.ts`:

  ```typescript
  interface CreateDraftParams {
    to: string
    subject: string
    body: string
    inReplyTo?: string  // For threading
    attachments?: Attachment[]
  }

  createDraft(params: CreateDraftParams): Promise<Draft>
  ```

#### 2.5 Implement Draft Creation

- [ ] Create draft via Gmail API
- [ ] Handle reply threading
- [ ] Support rich text formatting
- [ ] Add signature/footer

### Email Tracking

#### 2.6 Implement Tracking System

- [ ] Add to `packages/shared/src/schema.ts`:
  ```typescript
  email_tracking: {
    id: string
    emailAccountId: string
    lastSeenMessageId: string
    lastSeenTimestamp: number
    processedMessageIds: string[]  // Recent window
  }
  ```

#### 2.7 Tracking Logic

- [ ] Track last seen message ID per account
- [ ] Maintain sliding window of processed IDs
- [ ] Prevent reprocessing within window
- [ ] Clean up old tracking data

### Tests

#### 2.8 Tool Tests

- [ ] Test email search with filters
- [ ] Test draft creation
- [ ] Test threading logic
- [ ] Test tracking system
- [ ] Mock Gmail API calls

**Deliverable**: PR with email search and draft creation tools

---

## Phase 3: Task Integration

### Email to Task Conversion

#### 3.1 Create Email Task Creator

- [ ] Create `packages/server/src/services/email-task-creator.ts`:
  ```typescript
  class EmailTaskCreator {
    createTaskFromEmail(email: Email, projectId: string): Promise<Task>
    attachEmailToTask(taskId: string, email: Email): Promise<void>
    linkDraftToTask(taskId: string, draftId: string): Promise<void>
  }
  ```

#### 3.2 Email Metadata Storage

- [ ] Add to `packages/shared/src/schema.ts`:
  ```typescript
  task_emails: {
    id: string
    taskId: string
    emailId: string  // Gmail message ID
    emailSubject: string
    emailFrom: string
    emailBody: string  // Truncated
    emailDate: number
    draftId?: string  // Associated draft
  }
  ```

### Task Board Integration

#### 3.3 Email Indicator on Tasks

- [ ] Add email icon to task cards with emails
- [ ] Show email count badge
- [ ] Display email preview on hover
- [ ] Link to full email view

#### 3.4 Draft Status Display

- [ ] Show draft indicator on tasks
- [ ] Display draft status (created/sent)
- [ ] Quick action to view/edit draft
- [ ] Link to Gmail draft

### Events

#### 3.5 Define Email Events

- [ ] Add to `packages/shared/src/events.ts`:
  - `email.processed` - Email checked and processed
  - `email.task.created` - Task created from email
  - `email.draft.created` - Draft created for email
  - `email.draft.sent` - Draft was sent

### Tests

#### 3.6 Integration Tests

- [ ] Test email to task conversion
- [ ] Test task-email association
- [ ] Test draft linking
- [ ] Test UI updates

**Deliverable**: PR with email-task integration

---

## Phase 4: LLM Tool Integration

### Tool Definitions

#### 4.1 Add Tools to LLM Context

- [ ] Update `packages/worker/functions/_worker.ts`:
  - Add `check_emails` tool definition
  - Add `create_email_draft` tool definition
  - Add `get_email_contacts` tool definition

#### 4.2 Tool Execution Handlers

- [ ] Update `packages/server/src/services/agentic-loop.ts`:
  - Implement email tool execution
  - Handle tool parameters
  - Return formatted results

### Prompt Engineering

#### 4.3 Email Processing Prompts

- [ ] Create `packages/server/src/prompts/email-prompts.ts`:
  - Email triage prompt
  - Draft generation prompt
  - Email summarization prompt
  - Contact extraction prompt

#### 4.4 Context Injection

- [ ] Include project contacts in context
- [ ] Add recent email history
- [ ] Include task context
- [ ] Add user preferences

### Tool Orchestration

#### 4.5 Email Workflow Implementation

- [ ] Check emails → Filter by contacts
- [ ] Analyze email → Determine action
- [ ] Create task → Generate draft
- [ ] Link artifacts → Return results

### Tests

#### 4.6 LLM Tool Tests

- [ ] Test tool parameter validation
- [ ] Test execution flow
- [ ] Test error handling
- [ ] Mock LLM responses

**Deliverable**: PR with LLM tool integration

---

## Phase 5: UI Components

### Email Connection UI

#### 5.1 Create Gmail Connection Component

- [ ] Create `packages/web/src/components/email/GmailConnection.tsx`
- [ ] OAuth authorization button
- [ ] Connection status display
- [ ] Disconnect option
- [ ] Last sync timestamp

#### 5.2 Email Account Settings

- [ ] Create `packages/web/src/components/settings/EmailSettings.tsx`
- [ ] List connected accounts
- [ ] Add/remove accounts
- [ ] Configure sync preferences
- [ ] Test connection button

### Email History View

#### 5.3 Create Email History Component

- [ ] Create `packages/web/src/components/email/EmailHistory.tsx`
- [ ] Display processed emails
- [ ] Show created tasks
- [ ] Display draft status
- [ ] Filter by date/status

#### 5.4 Email Detail Modal

- [ ] Create `packages/web/src/components/email/EmailDetailModal.tsx`
- [ ] Show full email content
- [ ] Display associated task
- [ ] Show/edit draft
- [ ] Action buttons

### Hooks

#### 5.5 Create Email Hooks

- [ ] Create `packages/web/src/hooks/useEmailAccounts.ts`
- [ ] Create `packages/web/src/hooks/useEmailHistory.ts`
- [ ] Handle connection state
- [ ] Subscribe to email events

### Tests

#### 5.6 Component Tests

- [ ] Test connection flow
- [ ] Test email history display
- [ ] Test detail modal
- [ ] Test error states

**Deliverable**: PR with email UI components

---

## Phase 6: Production Readiness

### Rate Limiting

#### 6.1 Implement Rate Limiting

- [ ] Add Gmail API rate limiting
- [ ] Implement exponential backoff
- [ ] Queue requests when rate limited
- [ ] Monitor quota usage

### Error Handling

#### 6.2 Comprehensive Error Handling

- [ ] Handle OAuth errors gracefully
- [ ] Recover from API failures
- [ ] Handle invalid credentials
- [ ] User-friendly error messages

### Security

#### 6.3 Security Hardening

- [ ] Encrypt tokens at rest
- [ ] Implement token rotation
- [ ] Add audit logging
- [ ] Validate all inputs

### Performance

#### 6.4 Performance Optimization

- [ ] Implement email caching strategy
- [ ] Optimize batch operations
- [ ] Add request deduplication
- [ ] Monitor API latency

### Monitoring

#### 6.5 Add Monitoring

- [ ] Track API usage metrics
- [ ] Monitor sync performance
- [ ] Alert on failures
- [ ] Dashboard for email stats

### Documentation

#### 6.6 User Documentation

- [ ] Setup guide for Gmail connection
- [ ] Troubleshooting guide
- [ ] API documentation
- [ ] Security best practices

**Deliverable**: PR with production hardening

---

## Clarifying Questions

### Gmail API

1. What Gmail scopes do we need (read-only vs modify)?
2. Should we support multiple Gmail accounts per user?
3. How do we handle Gmail API quotas?
4. Should we cache email content locally?

### Email Processing

1. How far back should we look for emails initially?
2. Should we process all emails or just unread?
3. How do we handle email attachments?
4. Should we support other email providers?

### Draft Creation

1. Should drafts be created automatically or require approval?
2. What formatting should drafts support (HTML, plain text)?
3. Should we support email templates?
4. How do we handle draft signatures?

### Privacy & Security

1. What email data should we store vs fetch on-demand?
2. How long should we retain email data?
3. What audit trail is needed for email access?
4. How do we handle sensitive email content?

### UX

1. Where should email settings live in the UI?
2. How much email content should we show in task cards?
3. Should email checking be manual or automatic?
4. How do we notify users of new emails/drafts?

## Success Criteria

- [ ] Gmail account can be connected via OAuth
- [ ] Emails are checked using 4-hour window
- [ ] Only emails from project contacts are processed
- [ ] Tasks can be created from emails
- [ ] Email drafts can be generated via LLM
- [ ] No duplicate processing of emails
- [ ] Clear audit trail of email operations
- [ ] Graceful handling of API errors and limits

## Technical Notes

- Use official Gmail MCP server where possible
- Implement minimal caching to reduce API calls
- Keep email content storage minimal for privacy
- Use existing task creation infrastructure
- Leverage server-side agentic loop for processing
- Ensure all tokens are encrypted and rotated
