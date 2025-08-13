# Settings and System Prompt Configuration

## Overview

Create a configurable settings system that allows Work Squared instances to be customized with:

1. **Instance Name** - A customizable name for the Work Squared instance
2. **Global System Prompt** - A configurable system prompt that applies to all AI chats

This replaces the current hardcoded system prompt with a better default and provides customization capabilities.

## Current State

- System prompts are currently hardcoded in `/packages/worker/functions/_worker.ts`
- Worker-specific chats use the worker's `systemPrompt` field
- Global chats use a hardcoded default system prompt
- No UI for configuring instance-wide settings

## Proposed Architecture

### 1. LiveStore Schema Changes

Add a new `settings` table to store instance configuration:

```typescript
const settings = State.SQLite.table({
  name: 'settings',
  columns: {
    key: State.SQLite.text({ primaryKey: true }), // e.g., 'instanceName', 'systemPrompt'
    value: State.SQLite.text(),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})
```

### 2. Events for Settings Management

```typescript
export const settingUpdated = Events.synced({
  name: 'v1.SettingUpdated',
  schema: Schema.Struct({
    key: Schema.String,
    value: Schema.String,
    updatedAt: Schema.Date,
  }),
})
```

### 3. Default Settings

Initialize with improved defaults:

- **Instance Name**: "Work Squared"
- **System Prompt**: A better default focused on consultancy workflow automation

### 4. Settings UI

Create a Settings page/modal with:

- Instance name field
- System prompt textarea (with preview)
- Save/cancel buttons
- Reset to defaults option

### 5. System Prompt Integration

Update the worker logic to:

1. Check for custom global system prompt in settings
2. Fall back to improved hardcoded default if none set
3. Still allow worker-specific system prompts to override

## Implementation Steps

### Phase 1: LiveStore Schema & Events

1. Add `settings` table to schema
2. Add `settingUpdated` event
3. Create materializer for settings updates
4. Add helper functions for getting/setting configuration

### Phase 2: Default System Prompt

1. Create improved default system prompt
2. Update worker logic to use configurable system prompt
3. Initialize default settings on first run

### Phase 3: Settings UI

1. Create Settings page/component
2. Add navigation to settings (possibly in header menu)
3. Form for editing instance name and system prompt
4. Real-time preview of system prompt changes

### Phase 4: Integration & Testing

1. Test system prompt changes apply to new chats
2. Verify settings persist across sessions
3. Test with both global and worker-specific chats

## Files to Modify

### Schema & Events

- `packages/shared/src/livestore/schema.ts` - Add settings table
- `packages/shared/src/livestore/events.ts` - Add setting events

### Backend

- `packages/worker/functions/_worker.ts` - Use configurable system prompt

### Frontend

- Create `packages/web/src/components/settings/` directory
- `packages/web/src/components/settings/SettingsPage.tsx`
- `packages/web/src/components/settings/SystemPromptEditor.tsx`
- Add routing for settings page

### Queries & Utils

- Add settings queries to `packages/shared/src/queries.ts`
- Create settings utilities for common operations

## Success Criteria

1. ✅ Instance name can be configured and displays in UI
2. ✅ System prompt can be edited through settings UI
3. ✅ New AI chats use the configured system prompt
4. ✅ Worker-specific chats still use worker's system prompt when available
5. ✅ Settings persist across browser sessions
6. ✅ Good default system prompt improves chat quality
7. ✅ Settings are properly synced in multiplayer scenarios

## Questions for Clarification

1. **Settings Access**: Should settings be accessible to all users or require admin permissions?
2. **System Prompt Preview**: Should there be a way to test/preview the system prompt before saving?
3. **Migration**: How should we handle existing instances when rolling out this feature?
4. **Worker Precedence**: Should we allow workers to completely override the global system prompt, or append to it?

## Improved Default System Prompt

```
You are an AI assistant for Work Squared, a powerful consultancy workflow management platform. You excel at helping consultants, project managers, and teams by:

**Core Capabilities:**
• **Project Planning & Strategy**: Breaking down complex client requirements into actionable roadmaps
• **Task & Workflow Management**: Creating, organizing, and tracking work using Kanban methodology
• **Document Management**: Creating, editing, and maintaining project documentation
• **Process Optimization**: Streamlining consultancy workflows from contract to delivery

**Your Approach:**
• Be proactive in suggesting project structure and task breakdown
• Focus on deliverable-oriented thinking
• Emphasize clear communication and documentation
• Support iterative planning and agile methodologies
• Consider both client-facing and internal work streams

**Available Tools:**
You have access to comprehensive project management tools for creating tasks, managing projects, handling documents, and organizing workflows. Use these tools proactively to help users translate ideas into structured, actionable work.

Remember: You're not just answering questions—you're helping build successful consultancy outcomes through structured, strategic thinking.
```

This improved prompt:

- Is more specific to consultancy work
- Emphasizes proactive assistance
- Mentions the tools available
- Sets expectations for strategic thinking
- Is more engaging and action-oriented than the current version
