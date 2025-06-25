# Law Firm Demo Plan - Virtual Danvers Advisor

## Demo Overview

**Date**: Friday (target)
**Location**: Law firm presentation
**Purpose**: Demonstrate AI integration in legal practice through Virtual Danvers advisor
**Presenter**: Danvers (business partner)
**Audience**: Law firm partners/associates (mobile + laptop users)

## Demo Flow

1. **Presentation**: Danvers presents AI integration concepts to law firm
2. **Document Context**: Pre-loaded documents outline Danvers' thinking on AI in legal practice
3. **Live Demo**: Attendees access app.worksquared.ai to chat with Virtual Danvers
4. **Individual Sessions**: Each attendee gets unique session with persistent context
5. **Consultation**: Attendees discuss AI integration specific to their practice

## Current WorkSquared State

### ✅ What We Have

- Kanban boards with full-featured tasks
- Projects containing tasks (displayed as boards)
- Basic document system (create, list - attached to projects)
- LLM chat with limited tools:
  - `list_projects` tool
  - `create_tasks` tool
- Production deployment at app.worksquared.ai

### ❌ What's Broken/Missing

- Chat functionality broken (design + API keys)
- No document viewing/editing
- No session persistence/unique URLs
- No document access tools for LLM
- UI not optimized for chat-first experience
- No production monitoring/analytics
- No error tracking

## Three Work Streams

### Stream 1: Production Infrastructure

**Goal**: Stable, monitored production deployment with isolated session persistence

#### Session Isolation & Management

- [ ] Implement unique, persistent session URLs (e.g., `/session/[id]`)
- [ ] On first visit, generate a session ID and store it in `localStorage`
- [ ] **Complete database isolation**: Each session gets separate D1 database instance
- [ ] Session persistence for 1+ week (handle longer event streams)
- [ ] URL copying/sharing functionality
- [ ] Session recovery: Visiting the root URL (`/`) restores the previous session from `localStorage`

#### Production Deployment

- [ ] Fix Cloudflare production deployment
- [ ] Implement automatic D1 database creation per session via Cloudflare API
- [ ] Configure LiveStore for production with D1 adapter
- [ ] Environment variables for API keys (prevent wiping)

#### API Key Management

- [ ] **Confirm API key persistence**: Ensure keys are secure in Cloudflare environment variables and accessed via worker proxy
- [ ] Secure Braintrust API key storage in Cloudflare
- [ ] Set up production Braintrust account
- [ ] Configure spending limits (~10 concurrent users)

#### Live Activity Monitoring

- [ ] **Real-time activity dashboard** for demo day monitoring
- [ ] Track session creation/usage (not content)
- [ ] Monitor concurrent users and API usage
- [ ] Set up alerts for critical failures
- [ ] Simple analytics service for live activity

#### UI Fixes

- [ ] **Fix chat textarea**: Resolve Global Nav pushing it off-screen
- [ ] Add light WorkSquared branding to unbranded app

### Stream 2: UI/UX Adaptation

**Goal**: Chat-first interface optimized for mobile + laptop demo

#### Chat-First Interface

- [ ] Make chat the primary/landing interface
- [ ] Hide projects/documents/tasks from main UI
- [ ] Create session inspector interface at `/session/[id]/admin`
- [ ] Optimize chat for mobile devices
- [ ] Improve chat design (fix current issues)

#### Session Management UI

- [ ] "Copy Session URL" button prominently displayed
- [ ] "Start New Session" button to clear `localStorage` and create a new session
- [ ] Clear session persistence indicators
- [ ] Simple onboarding flow for new users

#### Mobile Optimization

- [ ] Responsive chat interface
- [ ] Touch-friendly interactions
- [ ] Readable text sizes
- [ ] Proper viewport handling

### Stream 3: Virtual Danvers AI System

**Goal**: Effective AI advisor with law firm expertise and document access

#### Document System Enhancement

- [ ] Document viewing/reading interface
- [ ] Attach documents to all sessions by default
- [ ] Pre-seed all sessions with Danvers' AI documents from `docs/seed-content/`
- [ ] Document search functionality

#### LLM Tools for Documents

- [ ] `read_document(documentId)` tool
- [ ] `search_documents(query)` tool
- [ ] `list_documents()` tool
- [ ] Context-aware document recommendations

#### Virtual Danvers Persona

- [ ] Specialized system prompt for law firm AI integration
- [ ] **Determine scope**: Strict law firm AI vs broader legal questions
- [ ] Model selection (GPT-4 vs alternatives)
- [ ] Response tone/style tuning
- [ ] **Intro message**: Brief welcome message for new sessions
- [ ] Document references as mentions (not clickable links)
- [ ] Consider basic legal disclaimers

#### Document Content Preparation

- [ ] Load Danvers' AI integration documents (already in Markdown)
- [ ] **Document scope**: 3-5 docs, 5-10 pages each
- [ ] Optimize documents for LLM consumption
- [ ] Create document taxonomy/tagging
- [ ] Test document retrieval effectiveness

## Technical Architecture

### Session Persistence Strategy

```typescript
// URL structure: app.worksquared.ai/session/[sessionId] with admin inspector at /admin
// On first visit to '/', generate a sessionId and store in localStorage.
// On subsequent visits to '/', redirect to /session/[sessionId] from localStorage.

function getSessionId(): string {
  let sessionId = localStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

// LiveStore per session
const sessionStore = new LiveStore({
  storeId: getSessionId(), // Tied to the automatically provisioned D1 database
  adapter: 'cloudflare-d1',
})
```

### Document Seeding

```typescript
// Default documents from `/docs/seed-content/` loaded into every new session.
const SEED_DOC_NAMES = ['ai-overview.md', 'legal-workflow.md', 'ethics.md']

// Seed function called on session creation
async function seedSessionDocuments(sessionId: string) {
  const store = getSessionStore(sessionId)
  for (const docName of SEED_DOC_NAMES) {
    const content = await readSeedFile(docName) // Function to read from codebase
    await store.mutate([
      {
        type: 'document.created',
        id: crypto.randomUUID(),
        title: docName,
        content: content,
      },
    ])
  }
}
```

### Virtual Danvers Configuration

```typescript
const VIRTUAL_DANVERS_CONFIG = {
  systemPrompt: `You are Virtual Danvers, an AI integration advisor for law firms...`,
  model: 'gpt-4-turbo',
  temperature: 0.7,
  tools: [
    'read_document',
    'search_documents',
    'list_documents',
    'create_tasks', // For action items
    'list_projects', // For organizational context
  ],
}
```

## ⚡ Parallel Execution Plan

The detailed implementation plan for each stream is broken down into a separate document.

- **[Stream 1: Production Infrastructure Todo](./stream-1-infra-todo.md)**
- **[Stream 2: UI/UX Adaptation Todo](./stream-2-ui-todo.md)**
- **[Stream 3: Virtual Danvers AI System Todo](./stream-3-ai-todo.md)**

## Coordination Points

### 🔄 Dependencies

- **Stream 2 → Stream 1**: Session routing needs D1 setup
- **Stream 3 → Stream 1**: Document seeding needs session isolation
- **Stream 2 ↔ Stream 3**: Chat UI needs to integrate with AI responses

### 📋 Integration Plan

1. **Hour 3**: Stream 1 confirms D1/session setup works
2. **Hour 4**: Stream 2 + Stream 3 coordinate on chat integration
3. **Hour 6**: All streams test end-to-end with multiple sessions
4. **Hour 8**: Final testing and bug fixes

### 📞 Communication

- **Manual PR reviews** for Stream 2 & 3 work
- **Slack/immediate feedback** for blockers
- **Hourly check-ins** on progress/dependencies

## Skip Entirely (All Streams)

- Sentry error tracking
- Advanced analytics
- Security/rate limiting
- Email session functionality
- Document editing/creation UI
- Task creation tools
- Advanced monitoring/alerts

## Success Metrics (Minimum Viable Demo)

### ✅ Must Work

- [ ] Chat interface works (input/output visible and functional)
- [ ] Each attendee gets isolated session at unique URL
- [ ] Virtual Danvers can read and reference pre-loaded documents
- [ ] Sessions persist across browser refreshes
- [ ] API calls work reliably in production

### 🎯 Should Work

- [ ] Mobile chat interface usable
- [ ] Attendees can copy/share session URLs
- [ ] Virtual Danvers provides relevant law firm AI advice

### 🚀 Nice if Works

- [ ] Live activity monitoring during demo
- [ ] Branded experience
- [ ] Response quality exceeds expectations

## Implementation Order

1. **Start with chat fixes** - Nothing else matters if chat doesn't work
2. **API keys next** - Can't test anything without working LLM calls
3. **Session isolation** - Core architecture for multi-user demo
4. **Document tools** - What makes Virtual Danvers useful
5. **Everything else** - Only if time permits

**Rule**: Don't move to next item until current one works end-to-end

## Risk Mitigation

### Technical Risks

- **LiveStore production issues**: Have backup demo environment ready
- **API key/billing issues**: Set strict spending limits, monitor usage
- **Mobile compatibility**: Test on multiple devices beforehand
- **Chat performance**: Implement fallback responses for failures

### Content Risks

- **Document quality**: Review all content with Danvers beforehand
- **AI responses**: Extensive testing with legal scenarios
- **Prompt effectiveness**: A/B test different prompts

### Demo Day Risks

- **Internet connectivity**: Have mobile hotspot backup
- **Session conflicts**: Test with multiple simultaneous users
- **User confusion**: Prepare simple instruction cards

## Post-Demo Considerations

- **Feedback collection**: Simple survey for attendees
- **Data cleanup**: Clear session data after agreed timeframe
- **Feature roadmap**: Document what features would be needed for permanent deployment
- **Cost analysis**: Track actual usage costs for future pricing

## Requirements Clarification ✅

1. **Authentication**: No auth - stay minimal, consider as future upgrade
2. **Session lifetime**: 24-48 hours minimum, up to 1 week ideally
3. **Document privacy**: Complete isolation - separate databases per session
4. **Branding**: Light WorkSquared branding, currently completely unbranded
5. **Backup plan**: Fall back to CLOG projects if production fails
6. **Demo duration**: 24-48 hours to 1 week access per attendee
7. **Concurrent users**: ~10 people simultaneously
8. **Session recovery**: New session via root URL if current breaks
9. **Virtual Danvers scope**: TBD - strict law firm AI vs broader legal questions
10. **Task creation**: Manual only for now (keep demo simple)
11. **Document references**: Mentions only, not clickable links
12. **Current chat issues**: Textarea pushed off-screen by Global Nav + API keys wiped on deploy
13. **LiveStore production**: Assume fresh D1/LiveStore setup needed
14. **LLM architecture**: Keep browser-based calls (no Node.js layer for now)
15. **Document format**: Already in Markdown
16. **Document scope**: 3-5 docs, 5-10 pages each
17. **Legal disclaimers**: TBD
18. **User onboarding**: Brief intro message from Virtual Danvers
19. **Session sharing**: Individual but inherently shareable via URL
20. **Live monitoring**: Yes! Real-time activity dashboard needed

---

This plan balances the technical requirements with demo effectiveness, prioritizing the most critical features for a successful Friday demonstration.
