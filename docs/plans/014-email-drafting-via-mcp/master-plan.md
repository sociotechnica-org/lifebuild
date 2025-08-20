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

1. **Multi-Store Server Support**
   - Environment variable configuration for LiveStore instances
   - Server startup to monitor multiple stores

2. **Simple Contact Management**
   - `contacts` table (id, name, email)
   - `project_contacts` junction table
   - Basic UI to add contacts to projects

3. **Recurring Tasks**
   - `recurring_tasks` table with simple interval scheduling
   - UI to create recurring tasks with custom prompts
   - Server-side task execution checking (every 1-5 minutes)

4. **Gmail MCP Server Setup**
   - Configure Gmail MCP server
   - Implement search emails tool (4-hour window)
   - Implement create draft email tool

5. **Backend Agentic Loop**
   - Move agentic execution to server
   - Task execution with customizable prompts
   - Email processing and draft creation workflow

## Key Decisions Made

- **No email caching** - use windowing (last 4 hours) and timestamp tracking
- **Environment variable configuration** - no dynamic store management
- **Simple intervals** - no complex RRULE scheduling
- **Minimal contacts** - just name and email, no metadata
- **Backend execution** - move agentic loop to server for recurring tasks

## Goal

Ship this week with these minimal features that provide real value and can be built upon incrementally.
