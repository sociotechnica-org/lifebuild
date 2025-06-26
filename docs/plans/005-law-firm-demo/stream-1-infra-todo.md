# Stream 1: Production Infrastructure Todo

**Owner**: Jess
**Parent Plan**: [Law Firm Demo Plan](./law-firm-demo-plan.md)

This document outlines the tasks for setting up the production infrastructure for the Virtual Danvers Advisor demo.

## Must Have

### 1. Fix API Key Persistence ✅ COMPLETED

**Goal**: Configure Cloudflare environment variables to prevent API keys from being wiped on deployment.

- [x] Access the Cloudflare dashboard for the `worksquared` project.
- [x] Navigate to `Workers & Pages` -> `worksquared` -> `Settings` -> `Environment Variables`.
- [x] Add the following secrets for the production environment, which will be accessible under `env` in the worker:
  - `BRAINTRUST_API_KEY`: The Braintrust API key.
- [x] Verify that the application code reads the keys from the worker environment. The browser-based LLM calls may need a dedicated endpoint on the worker to proxy requests and attach the key securely, rather than exposing keys to the client.

**Final State**: API keys are now properly persisted in Cloudflare environment variables and survive deployments.

### 2. Session Isolation Setup ✅ PARTIALLY COMPLETED

**Goal**: Implement a mechanism where each user session gets its own isolated D1 database.

- [x] **Strategy**: The Cloudflare Worker manages session creation.
- [x] **Session Worker Logic** (in `functions/_worker.ts`):
  - [x] Session IDs are generated and managed by the client application.
  - [x] URLs follow the pattern `/session/[sessionId]`.
  - [x] Sessions share a single D1 database but are isolated by sessionId/storeId.

**Final State**: Session isolation is implemented at the application level using storeId. All sessions share a single D1 database, with events filtered by storeId. Session IDs are currently guessable (UUIDs), which means anyone with a session URL can access that session's data. Full database isolation per session was not implemented but could be added in future deployments.

### 3. Production Deployment Fixes ✅ COMPLETED

**Goal**: Get the application at `app.worksquared.ai` stable.

- [x] Review the current Cloudflare Pages and Workers deployment configurations.
- [x] Execute `pnpm build` to build the frontend assets.
- [x] Execute `pnpm wrangler:deploy` to deploy the worker, as specified in `AGENTS.md`.
- [x] Test the full deployment flow by accessing `https://app.worksquared.ai` and verifying that a new session is created and the application loads correctly.

**Final State**: Production deployments are stable and working correctly. The application is accessible at app.worksquared.ai and handles session creation properly.

### 4. LiveStore D1 Configuration ✅ COMPLETED

**Goal**: Connect LiveStore to the session-specific D1 database.

- [x] In `functions/_worker.ts`, configure the LiveStore platform adapter for Cloudflare Workers, using the D1-binding for the current session. Reference [LiveStore Cloudflare Workers docs](https://docs.livestore.dev/reference/syncing/sync-provider/cloudflare/).
- [x] The `storeId` for the LiveStore instance is tied to the `sessionId`.
- [x] On the client-side (`src/Root.tsx`), LiveStore connects to the correct WebSocket URL based on the session.

**Final State**: LiveStore is properly configured with D1 and WebSocket sync. Each session uses its storeId for data isolation within the shared D1 database.

## Should Have

### 1. Live Monitoring Setup ✅ COMPLETED

**Goal**: Create a real-time activity dashboard for monitoring the demo.

- [x] Utilize Cloudflare's built-in Worker analytics to monitor requests, CPU time, and errors.
- [x] Basic monitoring available through Cloudflare dashboard.

**Final State**: Logging is available in Cloudflare for production, specifically for the worker. Real-time monitoring can be accessed through the Cloudflare dashboard.

### 2. Basic Analytics Tracking ✅ PARTIALLY COMPLETED

**Goal**: Track session creation and usage.

- [x] Basic logging exists for worker operations.
- [ ] Specific session creation tracking not implemented.

**Final State**: Basic analytics are available through Cloudflare's built-in logging, though specific session creation events are not explicitly tracked.
