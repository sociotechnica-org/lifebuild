# Plan 017: Deployment Separation Migration

## Overview

Migrate Work Squared from a mixed deployment (web + worker together) to properly separated deployments using Cloudflare Pages for the frontend and dedicated Cloudflare Workers for backend services.

## Context & Problem Statement

Prior to the LiveStore v0.4.0 upgrade, Work Squared deployed both the React frontend (`packages/web`) and the WebSocket sync server (`packages/worker`) as a single Cloudflare Worker deployment. This configuration was causing issues with the LiveStore upgrade and violates the separation of concerns principle.

**Previous Mixed Configuration** (removed in commit `aafc60c`):

```json
// packages/worker/wrangler.jsonc
{
  "assets": {
    "directory": "../web/dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },
  "build": {
    "command": "VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev pnpm --filter @work-squared/web build",
    "watch_dir": ["./src", "./functions", "../web/src", "../shared/src"]
  }
}
```

**Issues with Mixed Deployment**:

- Complexity in deployment and debugging
- Resource competition between static assets and worker code
- Deployment coupling (changes require redeploying both)
- LiveStore v0.4.0 compatibility issues
- Violates single responsibility principle

## Target Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│ CF Worker       │────▶│ Node.js Server  │
│  (CF Pages)     │     │ (WebSocket)     │     │ (Render.com)    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • UI Components │     │ • Event relay   │     │ • Event process │
│ • User actions  │     │ • WebSocket hub │     │ • LLM calls     │
│ • Real-time UI  │     │ • JWT validation│     │ • Tool execution│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │               ┌───────▼───────┐               │
         │               │  Auth Worker  │               │
         └──────────────▶│ (CF Worker)   │               │
                         ├───────────────┤               │
                         │ • User mgmt   │               │
                         │ • JWT tokens  │               │
                         │ • Signup/Login│               │
                         └───────────────┘               │
                                 │                       │
                                 └───────────────────────┘
```

### Service Separation

1. **Cloudflare Pages** - `packages/web`
   - React frontend application
   - Static asset hosting with CDN
   - Automatic builds from git
   - SPA routing support

2. **Cloudflare Worker** - `packages/worker`
   - WebSocket sync server only
   - Durable Objects for connection state
   - No static asset serving

3. **Auth Worker** - `packages/auth-worker` (already separated)
   - JWT authentication service
   - User management

4. **Node.js Server** - `packages/server`
   - Backend event processing
   - LLM integration

## Migration Plan (Phased Approach)

### Phase 1: Configure Cloudflare Pages

1. **Create Pages Configuration**

   ```bash
   # Add pages configuration to web package
   cd packages/web
   ```

2. **Update Web Package Scripts**

   ```json
   // packages/web/package.json
   {
     "scripts": {
       "deploy": "wrangler pages deploy dist --project-name work-squared-web",
       "deploy:preview": "wrangler pages deploy dist --project-name work-squared-web --compatibility-date 2024-05-12"
     }
   }
   ```

3. **Create Pages Project**

   ```bash
   cd packages/web
   # Build with final production URLs
   VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev VITE_LIVESTORE_SYNC_URL=wss://app.worksquared.ai pnpm build

   wrangler pages project create work-squared-web
   wrangler pages deploy dist --project-name work-squared-web
   ```

4. **Test Pages Deployment**
   - Verify static assets load correctly
   - Test basic routing (should fail on WebSocket until domain configured)

### Phase 2: Configure Custom Domains

1. **Set up Pages Custom Domain**

   ```bash
   # Add custom domain to Pages
   wrangler pages domain add work-squared-web app.worksquared.ai
   ```

2. **DNS Configuration** (Manual Step)
   - Configure DNS for `app.worksquared.ai` to point to Cloudflare Pages
   - Configure DNS for `worker.worksquared.ai` (if using custom domain for worker)
   - May require Cloudflare dashboard configuration

3. **Update CORS Configuration**
   - Worker: Allow `app.worksquared.ai` origin
   - Auth Worker: Allow `app.worksquared.ai` origin

### Phase 3: Configure Environment Variables

1. **Set Production Environment Variables for Pages**

   ```bash
   # Set environment variables for Pages project (Note: Pages uses env vars at build time)
   # These will be set during the build command, not as secrets
   ```

2. **Update Build Configuration**
   - Pages builds will include environment variables at build time
   - Worker configurations remain separate

### Phase 4: Test Integration

1. **Verify Worker Deployment**

   ```bash
   cd packages/worker
   pnpm deploy
   # Test WebSocket endpoint availability
   ```

2. **Deploy Web to Pages with Custom Domain**

   ```bash
   cd packages/web
   # Build with production URLs pointing to custom domain
   VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev VITE_LIVESTORE_SYNC_URL=wss://app.worksquared.ai pnpm build
   pnpm deploy
   ```

3. **End-to-End Testing**
   - Test WebSocket connections from `app.worksquared.ai` to worker
   - Verify authentication flow with Auth Worker
   - Test real-time sync functionality
   - Test all core features (projects, tasks, chat, documents)

### Phase 5: Update CI/CD Pipeline

1. **Update GitHub Workflow**
   - Add Pages deployment step
   - Handle environment variables for build process
   - Remove dependency on old mixed deployment

2. **Separate Deployment Commands**

   ```json
   // Root package.json
   {
     "scripts": {
       "deploy:worker": "pnpm --filter @work-squared/worker deploy",
       "deploy:web": "pnpm --filter @work-squared/web build && pnpm --filter @work-squared/web deploy",
       "deploy:auth": "pnpm --filter @work-squared/auth-worker deploy",
       "deploy:all": "pnpm deploy:auth && pnpm deploy:worker && pnpm deploy:web"
     }
   }
   ```

3. **Update Documentation**
   - CLAUDE.md deployment section
   - README deployment instructions
   - Architecture documentation

### Phase 5: DNS & Domain Configuration

1. **Custom Domain Setup**

   ```bash
   # Configure custom domain for Pages
   wrangler pages domain add work-squared-web app.worksquared.ai

   # Optional: Configure custom domain for Worker (requires zone management)
   # worker.worksquared.ai -> may need dashboard configuration
   ```

2. **Update CORS Configuration**
   - Worker must allow requests from `app.worksquared.ai`
   - Auth Worker must allow requests from `app.worksquared.ai`
   - Update WebSocket origin validation

## Secrets & Environment Variables Strategy

### Current State (Before Migration)

The old mixed deployment used build-time environment variables in the worker's build command:

```json
// packages/worker/wrangler.jsonc (removed in LiveStore upgrade)
"build": {
  "command": "VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev pnpm --filter @work-squared/web build"
}
```

### New Strategy (After Migration)

**Environment variables will be handled in GitHub Actions workflow:**

1. **Development (Local)**
   - Continue using `.env` files in `packages/web/`
   - Local values for development testing

2. **Production (GitHub Actions)**
   - Environment variables set in GitHub Actions workflow
   - Build command includes all required VITE\_ variables
   - No secrets needed (all URLs are public)

3. **Production Values**
   ```bash
   VITE_REQUIRE_AUTH=true
   VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev
   VITE_LIVESTORE_SYNC_URL=wss://work-squared.jessmartin.workers.dev
   ```

**Key Point:** These are NOT secrets - they're public configuration URLs that get baked into the client-side bundle.

## Implementation Steps (Execution Order)

### Step 0: Verify Local Development Works

**CRITICAL: Test local development before any deployment changes**

```bash
# Ensure the current setup works locally
cd /Users/jessmartin/Documents/code/worksquared-main

# Start local development
pnpm dev

# In another terminal, verify all services:
# 1. Web app: http://localhost:60001 (or configured port)
# 2. Worker: http://localhost:8787
# 3. Auth worker: http://localhost:8788 (if running separately)

# Test core functionality:
# - Authentication (login/signup)
# - Project creation
# - Real-time sync between browser tabs
# - Chat functionality
# - Document management

# Only proceed with migration if local dev is working correctly
```

**If local development has issues:**

- Fix them first before proceeding with deployment migration
- Local development is the foundation for production deployments

### Step 1: Update Package Scripts

```bash
# Add deployment script to web package
cd packages/web
npm pkg set scripts.deploy="wrangler pages deploy dist --project-name work-squared-web"
```

### Step 2: Create Pages Project

```bash
# Navigate to web package
cd packages/web

# Build the application with production URLs
VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev VITE_LIVESTORE_SYNC_URL=wss://app.worksquared.ai pnpm build

# Create Pages project
wrangler pages project create work-squared-web --compatibility-date 2024-05-12

# Initial deployment to Pages
wrangler pages deploy dist --project-name work-squared-web
```

### Step 3: Configure Custom Domain for Pages

```bash
# Add custom domain to Pages project
wrangler pages domain add work-squared-web app.worksquared.ai

# Verify domain setup
wrangler pages project get work-squared-web
```

### Step 4: DNS Configuration (Manual)

**Manual steps in Cloudflare Dashboard:**

1. Ensure `worksquared.ai` domain is managed by Cloudflare
2. Create CNAME record: `app.worksquared.ai` → `work-squared-web.pages.dev`
3. Optional: Create CNAME record: `worker.worksquared.ai` → `work-squared.jessmartin.workers.dev`
4. Wait for DNS propagation (check with `dig app.worksquared.ai`)

### Step 5: Update CORS Configuration

```bash
# Review and update CORS settings in worker and auth-worker
# to allow app.worksquared.ai origin
cd ../worker
# Review functions/_worker.ts for origin validation
cd ../auth-worker
# Review src/index.ts for origin validation
```

### Step 6: Final Deployment Test

```bash
# Ensure worker is deployed with CORS updates
cd ../worker
pnpm deploy

# Ensure auth worker is deployed
cd ../auth-worker
pnpm deploy

# Rebuild and redeploy web with final configuration
cd ../web
VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev VITE_LIVESTORE_SYNC_URL=wss://app.worksquared.ai pnpm build
pnpm deploy

# Test the complete application at https://app.worksquared.ai
```

### Step 7: Update GitHub Actions Workflow

**Update `.github/workflows/deploy.yml`:**

```yaml
# Add after "Deploy Main Worker" step:
- name: Build and Deploy Web App to Pages
  run: |
    cd packages/web
    VITE_REQUIRE_AUTH=true VITE_AUTH_SERVICE_URL=https://work-squared-auth.jessmartin.workers.dev VITE_LIVESTORE_SYNC_URL=wss://work-squared.jessmartin.workers.dev pnpm build
    pnpm deploy

# Update success notification:
- name: Deployment Success Notification
  if: success()
  run: |
    echo "✅ Deployment successful!"
    echo "Auth Worker: https://work-squared-auth.jessmartin.workers.dev"
    echo "Sync Worker: https://work-squared.jessmartin.workers.dev"
    echo "Web App: https://app.worksquared.ai"
```

**Key Changes:**

1. Add web app build and deploy step with production env vars
2. Update success notification to show all service URLs
3. Ensures automated deployments include the frontend

## Post-Migration Verification

### Functional Testing

1. **Authentication Flow**
   - Login/signup from Pages app
   - JWT token validation via Auth Worker
   - User session management

2. **Real-time Sync**
   - WebSocket connection from Pages to Worker
   - Multi-client synchronization
   - Event streaming via Durable Objects

3. **Core Features**
   - Project management
   - Kanban boards
   - Chat functionality
   - Document management

### Performance Testing

- Pages loading speed
- WebSocket connection latency
- Cross-origin request handling

## Benefits of Separation

### Development Benefits

- **Independent deployments**: Change web or worker without affecting the other
- **Clearer debugging**: Issues isolated to specific services
- **Better scaling**: Pages CDN for static content, Workers for compute
- **LiveStore compatibility**: Follows recommended deployment patterns

### Operational Benefits

- **Cost optimization**: Pages pricing for static content, Workers for compute
- **Global performance**: Pages CDN vs single worker deployment
- **Reliability**: Service isolation reduces single points of failure
- **Monitoring**: Separate metrics and logs per service

### Maintenance Benefits

- **Simpler configuration**: Each service has focused configuration
- **Easier updates**: Update LiveStore or other dependencies independently
- **Testing**: Test web and worker deployments separately

## Hard Cutover Strategy

Since there are no active users and downtime is acceptable:

1. **Complete Migration in One Session**
   - Execute all phases in sequence
   - Test each phase before proceeding
   - No rollback plan needed (hard cutover)

2. **Verification Checklist**
   - [ ] Local development verified working
   - [ ] Pages deployment successful
   - [ ] Custom domain configured
   - [ ] WebSocket connections working
   - [ ] Authentication flow working
   - [ ] All core features functional
   - [ ] Performance acceptable
   - [ ] GitHub Actions workflow updated and tested

3. **DNS Propagation**
   - DNS changes may take time to propagate
   - Test from multiple locations/networks
   - Use DNS lookup tools to verify propagation

## Documentation Updates Required

1. **CLAUDE.md**
   - Update deployment commands
   - Add Pages-specific instructions

2. **docs/architecture.md**
   - Update deployment architecture diagram
   - Document new service boundaries

3. **Package READMEs**
   - Update web package README with Pages deployment
   - Update worker package README to clarify scope

4. **Root README.md**
   - Update deployment section
   - Add separated deployment instructions

## Timeline Estimate

- **Phase 1-3**: 2-3 hours (setup and basic deployment)
- **Phase 4**: 1 hour (CI/CD updates)
- **Phase 5**: 1 hour (DNS/domain configuration)
- **Documentation**: 1 hour
- **Testing & Verification**: 1-2 hours

**Total: 6-8 hours** (including local dev verification and testing)

## Success Criteria

- ✅ React frontend deployed to Cloudflare Pages
- ✅ Worker focused only on WebSocket sync
- ✅ Auth Worker remains independent
- ✅ All real-time features working correctly
- ✅ Independent deployment capability
- ✅ Documentation updated
- ✅ No functionality regression
- ✅ Improved deployment simplicity

## References

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler Pages Commands](https://developers.cloudflare.com/workers/wrangler/commands/#pages)
- [LiveStore v0.4.0 Deployment Patterns](https://docs.livestore.dev/deployment)
- [Work Squared Architecture](../architecture.md)
