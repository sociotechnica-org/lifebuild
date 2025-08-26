# Email Drafting via MCP - Master Plan (MINIMAL VERSION)

## Overview

Build the absolute minimal feature set to enable background agents to check user email via MCP and create email drafts for replies. Focus on shipping quickly with simple abstractions that can be built upon.

## Minimal Core Features

### Simple Contact Management

- **Contacts are just name + email**
- **Projects have a list of contacts** (many-to-many)
- **Purpose**: Tell the system which email addresses to look for in MCP email checking
- **No complex CRUD, permissions, or metadata - just the basics**

### Recurring Tasks (Simplified)

- **As a user, I want to create a recurring task**
  - Simple scheduling interface (every X hours/days)
  - Customizable prompt for task execution
  - No complex RRULE - just basic intervals

- **As an agent, I want to execute recurring tasks on schedule**
  - Server checks recurring tasks every minute/5 minutes
  - Execute tasks in their execution window
  - Move agentic loop to backend for task execution

### Gmail MCP Integration

- **Set up Gmail MCP server**
- **Email search tool** - check emails from last 4 hours (windowing approach)
- **Draft creation tool** - create draft replies
- **Email tracking** - use "last seen" timestamp to avoid reprocessing

### Multi-Store Server Support

- **Environment variable controls which LiveStore instances to monitor**
- **Simple startup configuration - no dynamic control system**
- **Easy to add new stores by updating env var**

## Technical Implementation (Minimal)

### Server Architecture

1. **Multi-Store Support**
   - Read LiveStore instances from environment variable on startup
   - Monitor all configured stores
   - No dynamic add/remove - restart required

2. **Background Task Execution**
   - Simple interval checking (every 1-5 minutes)
   - Read all recurring tasks across all stores
   - Execute if in execution window
   - Separate agentic loop for task execution

3. **Gmail MCP Setup**
   - Gmail MCP server configuration
   - Search emails tool (last 4 hours window)
   - Create draft email tool
   - Last seen timestamp tracking (no email caching)

### Data Model (Minimal)

- `contacts` table: id, name, email
- `project_contacts` junction table
- `recurring_tasks` table: simple interval scheduling
- Email tracking: timestamp-based, no local email storage

### Tools Required

- **Search emails tool** (via MCP)
- **Create draft email tool** (via MCP)
- **Task creation** (existing)
- **Customizable prompts** for task execution

## Implementation Steps (In Order)

### Foundation Phase (Critical Infrastructure)

1. **Multi-Store Server Support** ⚠️ CRITICAL DEPENDENCY
   - Environment variable configuration for LiveStore instances
   - Server startup to monitor multiple stores
   - Store isolation and event routing
   - **Must complete before moving agentic loop to server**

2. **Server-Side Agentic Loop Migration** ⚠️ CRITICAL DEPENDENCY
   - Port agentic loop from client to server (EventProcessor pattern)
   - **Event-driven architecture**: No REST APIs, pure LiveStore events
   - User message → EventProcessor detects → Agentic loop → LLM responses as events
   - Tool execution creates normal LiveStore events (task.created, etc.)
   - **Required for recurring task LLM execution**

### Feature Phase (User-Facing Capabilities)

3. **Simple Contact Management**
   - `contacts` table (id, name, email) - global to store
   - `project_contacts` junction table
   - Basic UI to add contacts to projects
   - Bulk import via comma-delimited emails
   - Contact detail views with project associations

4. **Recurring Tasks (Frontend + Mock Execution)**
   - `recurring_tasks` table with simple interval scheduling
   - UI to create/edit recurring tasks with custom prompts
   - Manual trigger with mock execution
   - Basic execution history display
   - Server-side checking (mock execution only initially)

5. **Recurring Tasks (LLM Integration)**
   - **Prerequisites**: Multi-store + Server agentic loop complete
   - Connect recurring tasks to server-side agentic loop
   - Execute prompts with real LLM
   - Handle tool calls and task creation
   - Error handling and retries

6. **Gmail MCP Server Setup**
   - Configure Gmail MCP server
   - OAuth flow for Gmail connection
   - Implement search emails tool (4-hour window)
   - Implement create draft email tool
   - Email-to-task conversion

7. **Email Processing Workflow**
   - Create recurring task for email checking
   - Filter emails by project contacts
   - Create tasks from relevant emails
   - Generate draft replies via LLM
   - Link drafts to tasks

## Key Decisions Made

- **No email caching** - use windowing (last 4 hours) and timestamp tracking
- **Environment variable configuration** - no dynamic store management
- **Simple intervals** - no complex RRULE scheduling
- **Minimal contacts** - just name and email, no metadata
- **Backend execution** - move agentic loop to server for recurring tasks
- **Infrastructure first** - Multi-store and agentic loop migration before LLM features
- **Feature flags** - Gradual rollout of server-side execution
- **Mock execution** - Recurring tasks work without LLM initially

## Implementation Risks & Mitigations

### Critical Risk: Breaking Production LLM

- **Risk**: Moving agentic loop to server without multi-store breaks existing chat
- **Mitigation**: Complete multi-store first, use feature flags, maintain client fallback

### High Risk: Complex Dependencies

- **Risk**: Features blocked waiting for infrastructure
- **Mitigation**: Build features with mock execution first, add LLM later

### Medium Risk: Delayed Value Delivery

- **Risk**: Infrastructure work delays user-facing features
- **Mitigation**: Ship contacts and recurring tasks UI early with mock backends

## Goal

Ship a working email draft system, with intermediate value delivered through contacts and recurring tasks features even if LLM integration is delayed.
