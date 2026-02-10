# Deployment Guide

This document covers deployment setup and processes for LifeBuild.

## Automatic Deployment

LifeBuild uses GitHub Actions for automatic deployment to Cloudflare Workers when code is merged to the `main` branch. Deployments typically complete within 2-3 minutes after push.

### GitHub Secrets Setup

The deployment workflow requires the following GitHub secrets to be configured:

#### Required Secrets

1. **`CLOUDFLARE_API_KEY`** - Your Cloudflare Global API Key
2. **`CLOUDFLARE_EMAIL`** - Your Cloudflare account email address

### Setting up Cloudflare Global API Key

> **Note:** Due to limitations with Cloudflare's API token system and the `/memberships` endpoint,
> we use the Global API Key instead of scoped API tokens for automated deployments.

1. Go to [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Scroll down to the **"API Keys"** section (not API Tokens)
3. Click **"View"** next to **"Global API Key"**
4. Enter your Cloudflare account password
5. Copy the entire Global API Key (should be 37 characters)

### Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add the first secret:
   - Name: `CLOUDFLARE_API_KEY`
   - Secret: (paste your Global API Key)
   - Click **Add secret**
5. Add the second secret:
   - Name: `CLOUDFLARE_EMAIL`
   - Secret: (your Cloudflare account email)
   - Click **Add secret**

## PR Preview Deployments

Internal pull requests deploy preview environments via:

- `.github/workflows/pr-preview.yml`
- `.github/workflows/pr-preview-cleanup.yml`

Each PR gets:

- Auth preview worker (`lifebuild-auth-pr-<PR_NUMBER>`)
- Sync preview worker (`lifebuild-sync-pr-<PR_NUMBER>`)
- Cloudflare Pages branch preview (`pr-<PR_NUMBER>`)
- Render preview URL (resolved from GitHub Deployments when Render reports status)

Preview resources are cleaned up when the PR closes. Cleanup may be asynchronous for Pages/Render and does not need to be immediate.

### Required Preview Secrets

Configure these repository secrets for preview deployments:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN`
- `CLOUDFLARE_PREVIEW_D1_DATABASE_ID`
- `CLOUDFLARE_PREVIEW_D1_DATABASE_NAME`
- `CLOUDFLARE_PREVIEW_KV_NAMESPACE_ID`
- `CLOUDFLARE_PREVIEW_R2_BUCKET_NAME`

Optional preview secrets:

- `CLOUDFLARE_PREVIEW_ACCOUNT_ID` (auto-resolved from the Cloudflare accounts API when omitted)
- `CLOUDFLARE_PREVIEW_KV_PREVIEW_ID` (defaults to `CLOUDFLARE_PREVIEW_KV_NAMESPACE_ID`)
- `CLOUDFLARE_PREVIEW_R2_PREVIEW_BUCKET_NAME` (defaults to `CLOUDFLARE_PREVIEW_R2_BUCKET_NAME`)
- `PREVIEW_JWT_SECRET` (generated as a secure random value when omitted)
- `PREVIEW_SERVER_BYPASS_TOKEN` (generated as a secure random value when omitted)
- `PREVIEW_WEBHOOK_SECRET`
- `PREVIEW_SERVER_WEBHOOK_URL`

Preview data-plane secrets must point at non-production D1/KV/R2 resources.

### Preview Policy Notes

- Forked PRs do not auto-deploy previews (secrets are protected).
- PostHog analytics are intentionally disabled in preview environments.
- Preview D1/KV/R2 resources should be shared preview resources (separate from production).
- Render preview URL in the PR comment may lag briefly until Render posts deployment status to GitHub.

## Manual Deployment

For manual deployment, use these commands:

```bash
# Authenticate with Cloudflare (one-time setup)
wrangler auth login

# Deploy auth worker
pnpm --filter @lifebuild/auth-worker run deploy

# Deploy PostHog analytics proxy worker
pnpm --filter @lifebuild/posthog-worker run deploy

# Deploy main worker (WebSocket sync)
pnpm --filter @lifebuild/worker run deploy

# Deploy web app to Cloudflare Pages
pnpm --filter @lifebuild/web run deploy
```

### Workspace Claims KV Namespace

Workspace membership versions are stored in a shared Cloudflare KV namespace so the sync worker can reject stale JWTs instantly.

- **Local development:** Miniflare automatically provisions a local KV store (persisted under each package’s `.wrangler/state/...` directory) when you run `pnpm dev`, so no additional setup is required.
- **Staging/production:** Create the namespace once per environment and copy the generated IDs into both `packages/auth-worker/wrangler.toml` and `packages/worker/wrangler.jsonc`:

```bash
wrangler kv:namespace create WORKSPACE_CLAIMS_VERSION
wrangler kv:namespace create WORKSPACE_CLAIMS_VERSION --preview
```

## Deployment Architecture

LifeBuild consists of multiple Cloudflare Workers and a Pages deployment:

### 1. Auth Worker

- **Purpose**: Handles user authentication, signup, login, token management
- **URL**: `https://auth.lifebuild.me`
- **Deploy command**: `pnpm --filter @lifebuild/auth-worker run deploy`
- **Configuration**: `packages/auth-worker/wrangler.toml`

### 2. PostHog Analytics Worker

- **Purpose**: Reverse proxy for PostHog analytics (first-party domain)
- **URL**: `https://coconut.lifebuild.me`
- **Deploy command**: `pnpm --filter @lifebuild/posthog-worker run deploy`
- **Configuration**: `packages/posthog-worker/wrangler.toml`
- **Details**: Routes analytics to PostHog via first-party domain to bypass ad blockers and privacy filters

### 3. Sync Worker

- **Purpose**: WebSocket sync server for real-time event relay
- **URL**: `https://sync.lifebuild.me` (WebSocket)
- **Deploy command**: `pnpm --filter @lifebuild/worker run deploy`
- **Configuration**: `packages/worker/wrangler.jsonc`

### 4. Web App

- **Purpose**: React frontend application
- **URL**: `https://app.lifebuild.me`
- **Deploy command**: `pnpm --filter @lifebuild/web run deploy`
- **Deployed to**: Cloudflare Pages

## Environment Variables

### Production Environment Variables

Both workers are configured for production with:

- `REQUIRE_AUTH=true` - Enforces JWT authentication
- `VITE_REQUIRE_AUTH=true` - Frontend requires authentication
- `ENVIRONMENT=production` - Production mode

### Development Environment Variables

For local development:

- `REQUIRE_AUTH=false` - Allows development without auth
- `VITE_REQUIRE_AUTH=false` - Frontend allows unauthenticated access

## Deployment Process

GitHub Actions automatically executes the following steps on every push to `main`:

1. **Trigger**: Push or merge to `main` branch
2. **Install**: Install dependencies for all packages
3. **Pre-deployment**:
   - Run unit tests (`pnpm test`)
   - Run linting and typecheck (`pnpm lint-all`)
4. **Deploy Services** (in order):
   - Deploy Auth Worker (`@lifebuild/auth-worker`)
   - Deploy PostHog Analytics Worker (`@lifebuild/posthog-worker`)
   - Deploy Sync Worker (`@lifebuild/worker`)
   - Deploy Web App to Pages (`@lifebuild/web`)
5. **Verification**: GitHub Actions reports success/failure

## PostHog Analytics Worker Deployment

The PostHog worker is deployed as part of the standard pipeline. Key details:

**Configuration** (`packages/posthog-worker/wrangler.toml`):

```toml
name = "lifebuild-posthog"
main = "src/index.ts"
route = "coconut.lifebuild.me/*"
zone_name = "lifebuild.me"

[env.production]
name = "lifebuild-posthog-prod"
route = "coconut.lifebuild.me/*"
zone_name = "lifebuild.me"
```

**Frontend Configuration** (set by GitHub Actions):

- `VITE_PUBLIC_POSTHOG_HOST=https://coconut.lifebuild.me`

**CSP Headers** (`packages/web/public/_headers`):

- Added `coconut.lifebuild.me` to `connect-src` directive
- PostHog API calls now route through first-party domain

**How It Works**:

1. Browser requests analytics → `coconut.lifebuild.me/decide`
2. PostHog Worker receives request at first-party domain
3. Worker strips cookies, validates request
4. Forwards to `us.i.posthog.com`
5. Response cached and returned to browser

This approach allows analytics to work in privacy-focused browsers (Brave, Arc) that block third-party analytics domains.

## Troubleshooting

### Common Issues

**Authentication Errors**

- Verify `CLOUDFLARE_API_KEY` and `CLOUDFLARE_EMAIL` are set correctly in GitHub secrets
- Ensure you're using the Global API Key (37 characters), not an API token
- The Global API Key can be found in Dashboard > My Profile > API Keys section

**Build Failures**

- Check that all tests pass locally before pushing
- Verify dependencies are correctly specified in `package.json`

**Deployment Timeouts**

- Check Cloudflare status page for service issues
- Verify worker configuration in `wrangler.toml` / `wrangler.jsonc`

**PostHog Analytics Not Working**

- Verify PostHog worker is deployed: check `https://coconut.lifebuild.me/status` (should return CloudFlare error, not 502)
- Check browser console for blocked analytics requests
- Verify CSP headers allow `coconut.lifebuild.me` in `connect-src`
- Check that `VITE_PUBLIC_POSTHOG_KEY` secret is set
- Verify `VITE_PUBLIC_POSTHOG_HOST` env var is set to `https://coconut.lifebuild.me` in GitHub Actions

**Analytics Blocked in Brave/Arc**

- If analytics still blocked despite proxy: ad blocker may have been updated with `coconut` in blocklist
- Solution: Change subdomain in `wrangler.toml` to different random name (e.g., `pineapple`, `mushroom`)
- Update frontend env var and redeploy

### Debug Commands

```bash
# Check wrangler authentication
wrangler auth whoami

# Test deployment locally
wrangler deploy --dry-run

# View worker logs
wrangler tail <worker-name>

# Test PostHog proxy endpoint (development)
pnpm --filter @lifebuild/posthog-worker dev
# Then: curl http://localhost:8787/decide (should proxy to PostHog)

# Check PostHog analytics in production
# Open DevTools Network tab and filter for "coconut.lifebuild.me"
# Should see POST requests to /decide endpoint with 200 response
```

## Node.js Server Deployment (Render.com)

The `packages/server` backend service is deployed separately to Render.com. See [ADR 002: Node.js Hosting Platform](adrs/002-nodejs-hosting-platform.md) for the architecture decision.

The server now maintains parity with the Auth Worker via two mechanisms:

- **Webhooks** provision stores immediately when workspaces are created or deleted.
- **Workspace reconciliation** (default every 5 minutes) polls the Auth Worker to repair any drift that may result from missed webhooks.

Ensure both services share the same `SERVER_BYPASS_TOKEN`, and configure `AUTH_WORKER_INTERNAL_URL` so the server can access the internal workspace listing endpoint.

### Required Environment Variables (Render.com)

Configure these in your Render service dashboard:

**Required:**

- `NODE_ENV=production`
- `STORE_IDS` - Comma-separated workspace IDs to monitor
- `AUTH_TOKEN` - Authentication token for LiveStore
- `LIVESTORE_SYNC_URL` - WebSocket URL (e.g., `wss://sync.lifebuild.me`)
- `SERVER_BYPASS_TOKEN` - Token for internal worker communication
- `AUTH_WORKER_INTERNAL_URL` - Base URL for the Auth Worker (used for webhook reconciliation)

**Sentry (Optional but Recommended):**

- `SENTRY_DSN` - Error tracking DSN from Sentry.io
- `SENTRY_AUTH_TOKEN` - For uploading source maps during builds
- `SENTRY_ORG` - Your Sentry organization slug
- `SENTRY_PROJECT` - Your Sentry project slug

**Braintrust (Optional):**

- `BRAINTRUST_API_KEY` - For LLM agentic loop functionality
- `BRAINTRUST_PROJECT_ID` - Braintrust project identifier

**Reconciliation (Optional overrides):**

- `WORKSPACE_RECONCILE_INTERVAL_MS` - Override the default 5 minute reconciliation cadence.

### Render Preview Endpoint Wiring

For Render PR preview environments, the server now auto-derives PR-specific worker endpoints when `IS_PULL_REQUEST=true`.

Required Render env var:

- `CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN` - Workers.dev subdomain used to construct:
  - `https://lifebuild-auth-pr-<PR_NUMBER>.<SUBDOMAIN>.workers.dev`
  - `wss://lifebuild-sync-pr-<PR_NUMBER>.<SUBDOMAIN>.workers.dev`

Optional Render env vars:

- `PREVIEW_AUTH_WORKER_PREFIX` - Override default `lifebuild-auth-pr`
- `PREVIEW_SYNC_WORKER_PREFIX` - Override default `lifebuild-sync-pr`

PR number detection order:

1. `RENDER_PULL_REQUEST` (if present)
2. Parsed from Render metadata (`RENDER_SERVICE_NAME`, `RENDER_EXTERNAL_HOSTNAME`, `RENDER_EXTERNAL_URL`, `RENDER_GIT_BRANCH`)

When resolved, the server applies runtime overrides for:

- `AUTH_WORKER_INTERNAL_URL`
- `LIVESTORE_SYNC_URL`
- `STORE_IDS` (forced to empty in preview environments)

### Source Maps

The server build automatically uploads source maps to Sentry when:

- `NODE_ENV=production`
- `SENTRY_AUTH_TOKEN` is configured

This provides readable stack traces in Sentry for production errors.

## Security Notes

- Never commit API tokens or secrets to the repository
- Use GitHub secrets for all sensitive configuration
- Use Render environment variables for server secrets
- Regularly rotate Cloudflare API tokens and Sentry auth tokens
- Monitor deployment logs for any security issues
