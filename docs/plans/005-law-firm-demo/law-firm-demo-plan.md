# Law Firm Demo Plan - Virtual Danvers Advisor

## Demo Overview

**Date**: Friday (target) - ❌ CANCELLED
**Location**: Law firm presentation
**Purpose**: Demonstrate AI integration in legal practice through Virtual Danvers advisor
**Presenter**: Danvers (business partner)
**Audience**: Law firm partners/associates (mobile + laptop users)

**Final Outcome**: The law firm demo was cancelled as they ultimately did not need the live demo presentation.

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

For detailed task breakdowns and final status, see the individual stream documentation:

- **[Stream 1: Production Infrastructure](./stream-1-infra-todo.md)** - Session isolation, deployments, API keys, monitoring
- **[Stream 2: UI/UX Adaptation](./stream-2-ui-todo.md)** - Chat-first interface, session management, mobile optimization
- **[Stream 3: Virtual Danvers AI System](./stream-3-ai-todo.md)** - Document tools, seeding, AI persona configuration

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

## Final Project Outcomes

### ✅ Successfully Completed

- **Production Infrastructure**: API key persistence, stable deployments, CloudFlare logging
- **Session Management**: Session isolation using storeId, localStorage persistence, URL-based sessions
- **Document Tools**: Implemented `list_documents`, `read_document`, `search_documents` tools for LLM
- **Mobile Optimization**: Chat interface works well on mobile devices
- **URL Management**: Session restoration and storeId override from URL parameters

### ⚠️ Partially Completed

- **Session Isolation**: Uses shared D1 database with storeId-based isolation (not full database per session)
- **Monitoring**: Basic CloudFlare logging available, but not comprehensive demo monitoring

### ❌ Not Completed (No Reversion Needed)

- **Virtual Danvers Persona**: Never implemented or committed to codebase
- **Branding**: WorkSquared branding not implemented

### 🔄 Completed Cleanup (2025-06-26)

- **Document Seeding**: ✅ Reverted - Law firm-specific content and seeding logic removed
- **Chat-First Interface**: ✅ Reverted - Nested admin routes removed, restored original Projects List layout
- **Code References**: ✅ Cleaned - All law firm-specific references removed
- **Documentation**: ✅ Updated - All project docs reflect final state
- **Testing**: ✅ Updated - E2E tests fixed for new routing structure

### 🔄 Useful Work for Future

- Document tools are valuable for future advisor/assistant features
- Session management patterns established
- Mobile-optimized chat interface
- Production deployment stability improvements

**Key Insight**: While the specific law firm demo was cancelled, much of the foundational work on sessions, document tools, and production stability provides valuable infrastructure for future Work Squared features.

## Project Status: ✅ COMPLETED

**Final Status**: All cleanup work completed successfully. The codebase has been restored to its original Projects List layout while preserving valuable infrastructure improvements. Law firm-specific content has been fully removed, and the application is ready for future development.

**Cleanup Branch**: `cleanup/revert-law-firm-demo` (merged)  
**Documentation**: All stream docs and plan documents updated to reflect final state
