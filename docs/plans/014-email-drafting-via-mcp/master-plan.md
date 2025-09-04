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
   - Port agentic loop from client to server
   - Implement feature flags for gradual rollout
   - Migrate tools to server-side execution
   - Maintain backward compatibility
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

## Progress (as of August 27, 2025)

### ✅ Completed Work

#### Foundation Phase (Infrastructure) - COMPLETE

- **✅ Multi-Store Server Support** (PRs #138, #143)
  - Phase 1: Store management infrastructure with environment variables
  - Phase 2: Per-store event processing with isolation and WebSocket distribution
  - Server can monitor multiple LiveStore instances independently

#### Feature Phase (User-Facing Capabilities) - MAJOR PROGRESS

##### Simple Contact Management - COMPLETE ✅

- **✅ Phase 1**: Basic contact creation & display (PR #136)
- **✅ Phase 2**: Contact detail view & editing (PR #139)
- **✅ Phase 3**: Project-contact associations (PR #146)
- **✅ Phase 4**: Bulk contact import functionality (PR #149)
- **✅ Phase 7**: LLM contacts tools for MCP integration (PR #154 - MERGED)

##### Recurring Tasks - COMPLETE ✅

- **✅ Phase 1**: Basic recurring task creation & display (PR #137)
- **✅ Phase 2**: Task editing, deletion & enable/disable (PR #140)
- **✅ Phase 3**: Manual execution & basic history (PR #141)

### ✅ Recently Completed Work

#### Server-Side Agentic Loop Migration - CORE COMPLETE ✅

- **✅ Core Implementation**: Server-side agentic loop processing
  - Complete move of LLM execution from client to server
  - Event-driven architecture with LiveStore event flow
  - Direct Braintrust integration with proper retry handling
  - Input validation and security measures
  - Tool execution with proper isolation
  - **Status**: Core loop functional but missing multi-store coordination

#### Multi-Store Server Support - COMPLETE FOR TASK SCHEDULING ✅

- **✅ Phase 1-2**: Basic multi-store infrastructure (PRs #138, #143)
  - Store management with environment variables
  - Per-store event processing and isolation 
  - WebSocket distribution per store
- **✅ Phase 3**: Store-scoped agentic execution - **ALREADY EXISTS**
  - `AgenticLoop` class already handles store isolation via constructor
  - No "Agent Manager" needed - was over-architecture
  - Ready for Task Scheduler integration

### 🔄 In Progress Work

_No items currently in progress - ready to start next phase!_

### 📋 Remaining Work

#### Task Scheduler with SQLite Deduplication - READY TO IMPLEMENT ⚠️

- **Prerequisites**: ✅ All infrastructure complete (multi-store + AgenticLoop)
- **Missing**: Simple Task Scheduler using proven patterns:
  - Extend `ProcessedMessageTracker` pattern for task execution deduplication
  - SQLite `processed_task_executions` table with atomic `INSERT OR IGNORE`
  - Integration with existing `EventProcessor` store monitoring loop
  - Use existing `AgenticLoop` class - no new abstractions needed
- **Impact**: Only thing blocking LLM-powered recurring tasks and email processing
- **Priority**: HIGH - Single missing component for full email workflow

#### Recurring Tasks LLM Integration - UNBLOCKED ✅

- **Prerequisites**: ✅ Multi-store + AgenticLoop infrastructure complete
- Connect recurring tasks to existing server-side agentic loop
- Execute prompts with real LLM using `new AgenticLoop(store, llmProvider).run()`
- Handle tool calls and task creation via existing tool system
- **Status**: Ready to implement once Task Scheduler exists

#### Gmail MCP Server Setup - PENDING

- Configure Gmail MCP server
- OAuth flow for Gmail connection
- Implement search emails tool (4-hour window)
- Implement create draft email tool
- Email-to-task conversion

#### Email Processing Workflow - PENDING

- Create recurring task for email checking
- Filter emails by project contacts
- Create tasks from relevant emails
- Generate draft replies via LLM
- Link drafts to tasks

### 🚧 Current Status

**✅ Infrastructure Complete**: Multi-store server + AgenticLoop are done! Only missing the simple Task Scheduler.

### 📊 Overall Progress

- **Foundation Phase**: ✅ 100% Complete  
- **Simple Contact Management**: ✅ 100% Complete
- **Recurring Tasks (Basic UI)**: ✅ 100% Complete
- **Server Agentic Loop**: ✅ 100% Complete
- **Multi-Store Support**: ✅ 100% Complete (for task scheduling needs)
- **Task Scheduler**: ❌ 0% (ONLY MISSING PIECE)
- **Recurring Tasks (LLM)**: ⏳ 0% (Ready once scheduler exists)
- **Gmail MCP Integration**: ❌ 0%
- **Email Processing Workflow**: ❌ 0%

**Total Project Progress: ~80%** (Much closer than previously thought!)

## Goal

Ship a working email draft system, with intermediate value delivered through contacts and recurring tasks features even if LLM integration is delayed.
