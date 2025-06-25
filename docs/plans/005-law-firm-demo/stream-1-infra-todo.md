# Stream 1: Production Infrastructure Todo

**Owner**: Gemini
**Parent Plan**: [Law Firm Demo Plan](./law-firm-demo-plan.md)

This document outlines the tasks for setting up the production infrastructure for the Virtual Danvers Advisor demo.

## Must Have

### 1. Fix API Key Persistence

**Goal**: Configure Cloudflare environment variables to prevent API keys from being wiped on deployment.

- [ ] Access the Cloudflare dashboard for the `worksquared` project.
- [ ] Navigate to `Workers & Pages` -> `worksquared` -> `Settings` -> `Environment Variables`.
- [ ] Add the following secrets for the production environment, which will be accessible under `env` in the worker:
  - `BRAINTRUST_API_KEY`: The Braintrust API key.
- [ ] Verify that the application code reads the keys from the worker environment. The browser-based LLM calls may need a dedicated endpoint on the worker to proxy requests and attach the key securely, rather than exposing keys to the client.

### 2. Session Isolation Setup

**Goal**: Implement a mechanism where each user session gets its own isolated D1 database.

- [ ] **Strategy**: The Cloudflare Worker will manage session creation and database provisioning automatically.
- [ ] **Database Provisioning**: The worker will use the Cloudflare API to dynamically provision a new D1 database for each new session.
  - [ ] Research and implement the necessary Cloudflare API calls within the worker to create a new D1 database.
  - [ ] Research and implement the necessary calls to dynamically bind the newly created database to the worker instance for the given session.
  - [ ] This will be a collaborative effort to ensure the API permissions and logic are correct.
- [ ] **Session Worker Logic** (in `functions/_worker.ts`):
  - [ ] On a request to `/`, the worker will check `localStorage` for an existing `sessionId`. If found, it will redirect to `/session/[sessionId]`.
  - [ ] If no `sessionId` is found, the worker will generate a new ID, provision the D1 database, and then redirect the user to `/session/[new_session_id]`.
  - [ ] The worker handling requests for `/session/:sessionId/*` will extract the `sessionId` and use the corresponding D1 database binding.

### 3. Production Deployment Fixes

**Goal**: Get the application at `app.worksquared.ai` stable.

- [ ] Review the current Cloudflare Pages and Workers deployment configurations.
- [ ] Execute `pnpm build` to build the frontend assets.
- [ ] Execute `pnpm wrangler:deploy` to deploy the worker, as specified in `AGENTS.md`.
- [ ] Test the full deployment flow by accessing `https://app.worksquared.ai` and verifying that a new session is created and the application loads correctly.

### 4. LiveStore D1 Configuration

**Goal**: Connect LiveStore to the session-specific D1 database.

- [ ] In `functions/_worker.ts`, configure the LiveStore platform adapter for Cloudflare Workers, using the D1-binding for the current session. Reference [LiveStore Cloudflare Workers docs](https://docs.livestore.dev/reference/syncing/sync-provider/cloudflare/).
- [ ] The `storeId` for the LiveStore instance will be tied to the `sessionId`.
- [ ] On the client-side (`src/Root.tsx`), ensure LiveStore connects to the correct WebSocket URL, which will include the session ID (e.g., `wss://app.worksquared.ai/session/[sessionId]`).

## Should Have

### 1. Live Monitoring Setup

**Goal**: Create a real-time activity dashboard for monitoring the demo.

- [ ] Utilize Cloudflare's built-in Worker analytics to monitor requests, CPU time, and errors.
- [ ] Create a basic dashboard in the Cloudflare console to view key metrics for the production worker.

### 2. Basic Analytics Tracking

**Goal**: Track session creation and usage.

- [ ] In the session creation logic within the worker, add a `console.log` or a call to the Analytics Engine API to record when a new session is created.
- [ ] This will provide a simple, real-time feed of new users joining the demo. Focus on event counts, not user content.
