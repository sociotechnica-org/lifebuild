# Email Drafting via MCP - Master Plan

## Overview

Build a minimal feature set that enables background agents to check user email via MCP (Model Context Protocol) and create email drafts for replies to emails that are attached to task cards.

## Core User Stories

### Contact Management
- **As a user, I want to add contacts to my Work Squared**
  - Contact entity with name, email, phone, notes
  - Basic CRUD operations
  - Integration with project assignments

- **As a user, I want to add my Work Squared contacts to a project**
  - Many-to-many relationship between contacts and projects
  - Contact selection UI within project context
  - Contact visibility and permissions per project

### Recurring Tasks & Scheduling
- **As a user, I want to create a recurring task**
  - Full Google Calendar-style scheduling features
  - RRULE support for complex recurrence patterns
  - Time zone handling
  - Task templates for recurring instances

- **As a user, I want to list recurring tasks as a lane in the task board**
  - Special lane type for recurring tasks
  - Visual indicators for scheduled vs overdue
  - Quick actions to execute or reschedule

- **As an agent, I want to execute a recurring task on a schedule**
  - Server-side cron-like functionality
  - Task execution queue and error handling
  - Notification system for completed/failed executions

### Email Integration
- **As a user, I want to connect my email account to Work Squared via MCP**
  - OAuth flow for Gmail/Outlook
  - MCP server configuration and credential storage
  - Email account verification and testing

- **As an agent, I want to check a user's email via MCP**
  - Background email polling service
  - Email parsing and content extraction
  - Attachment handling and storage
  - Thread/conversation tracking

- **As an agent, I want to create a draft email in Google via MCP**
  - Draft creation with proper threading
  - Template system for response types
  - Rich text formatting support
  - Attachment handling

### Task Enhancement
- **As a user, I want to add a tag to a task**
  - Tag entity with color coding
  - Many-to-many relationship with tasks
  - Auto-completion for existing tags

- **As a user, I want to filter tasks by tag**
  - Tag-based filtering in task board
  - Multiple tag selection
  - Tag-based search and sorting

## Technical Infrastructure Requirements

### Server-Side Architecture
1. **Multi-Store Support**
   - LiveStore instance per storeId
   - Store isolation and resource management
   - Connection pooling and cleanup

2. **Background Task System**
   - Cron-like recurring task execution
   - Task queue with priority and retry logic
   - Dead letter queue for failed tasks
   - Monitoring and alerting

3. **MCP Integration Layer**
   - MCP server management per user
   - Credential encryption and secure storage
   - Rate limiting and quota management
   - Error handling and fallback strategies

### Data Model Extensions
- `contacts` table with user association
- `project_contacts` junction table
- `recurring_tasks` with RRULE support
- `email_accounts` with encrypted credentials
- `email_threads` for conversation tracking
- `tags` with color and metadata
- `task_tags` junction table

## Open Questions

### Contact Management
- How do we handle contact deduplication across users?
- Should contacts be shareable between projects/users?
- What contact fields are essential vs optional?

### Recurring Tasks
- How do we handle timezone changes for recurring tasks?
- What happens to recurring tasks when the underlying task template changes?
- How do we handle conflicts between recurring task instances?

### Email Integration
- Which email providers should we support initially?
- How do we handle email threading and conversation context?
- What's our strategy for handling large email volumes?
- How do we prevent duplicate processing of emails?

### Agent Behavior
- What triggers should cause an agent to draft an email response?
- How do we ensure draft quality and appropriateness?
- What approval workflow should exist for agent-generated drafts?
- How do we handle agent errors and fallbacks?

### Security & Privacy
- How do we encrypt and store email credentials?
- What audit trail do we need for agent actions?
- How do we handle user consent for agent email access?
- What data retention policies apply to email content?

### Performance & Scalability
- How do we scale the background task system?
- What's our strategy for handling email polling at scale?
- How do we optimize LiveStore performance with multiple instances?

### User Experience
- How do users configure and monitor agent behavior?
- What notifications do users need about agent actions?
- How do we make email drafts discoverable and actionable?

## Implementation Phases

### Phase 1: Foundation
- Contact management system
- Basic tag functionality
- Multi-store server architecture

### Phase 2: Scheduling Infrastructure
- Recurring task creation and management
- Background task execution system
- Task board integration

### Phase 3: Email Integration
- MCP email connection setup
- Email polling and parsing
- Basic draft creation

### Phase 4: Agent Intelligence
- Email-to-task association logic
- Intelligent draft generation
- User approval workflows

## Success Metrics
- Time saved on email management tasks
- User engagement with agent-generated drafts
- System reliability and uptime
- Email processing accuracy and speed

## Risk Mitigation
- Start with read-only email access
- Implement comprehensive logging and monitoring
- Build user controls for agent behavior
- Plan for graceful degradation of services