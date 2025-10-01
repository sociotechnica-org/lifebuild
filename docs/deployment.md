# Deployment Guide

This document covers deployment setup and processes for Work Squared.

## Automatic Deployment

Work Squared uses GitHub Actions for automatic deployment to Cloudflare Workers when code is merged to the `main` branch. Deployments typically complete within 2-3 minutes after push.

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

## Manual Deployment

For manual deployment, use these commands:

```bash
# Authenticate with Cloudflare (one-time setup)
wrangler auth login

# Deploy auth worker
pnpm --filter @work-squared/auth-worker run deploy

# Deploy main worker (includes frontend)
pnpm --filter @work-squared/worker run deploy
```

## Deployment Architecture

Work Squared consists of two Cloudflare Workers:

### 1. Auth Worker

- **Purpose**: Handles user authentication, signup, login, token management
- **URL**: `https://work-squared-auth.jessmartin.workers.dev`
- **Deploy command**: `pnpm --filter @work-squared/auth-worker run deploy`
- **Configuration**: `packages/auth-worker/wrangler.toml`

### 2. Main Worker

- **Purpose**: Serves frontend app + WebSocket LiveStore sync server
- **URL**: `https://work-squared.jessmartin.workers.dev`
- **Deploy command**: `pnpm --filter @work-squared/worker run deploy`
- **Configuration**: `packages/worker/wrangler.jsonc`

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

1. **Trigger**: Push or merge to `main` branch
2. **Pre-deployment**: Run unit tests for both packages
3. **Deploy Auth Worker**: Deploy authentication service first
4. **Deploy Main Worker**: Deploy main application with frontend
5. **Verification**: Check deployment URLs for success

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

### Debug Commands

```bash
# Check wrangler authentication
wrangler auth whoami

# Test deployment locally
wrangler deploy --dry-run

# View worker logs
wrangler tail <worker-name>
```

## Node.js Server Deployment (Render.com)

The `packages/server` backend service is deployed separately to Render.com. See [ADR 002: Node.js Hosting Platform](adrs/002-nodejs-hosting-platform.md) for the architecture decision.

### Required Environment Variables (Render.com)

Configure these in your Render service dashboard:

**Required:**
- `NODE_ENV=production`
- `STORE_IDS` - Comma-separated workspace IDs to monitor
- `AUTH_TOKEN` - Authentication token for LiveStore
- `LIVESTORE_SYNC_URL` - WebSocket URL (e.g., `wss://work-squared.jessmartin.workers.dev`)
- `SERVER_BYPASS_TOKEN` - Token for internal worker communication

**Sentry (Optional but Recommended):**
- `SENTRY_DSN` - Error tracking DSN from Sentry.io
- `SENTRY_AUTH_TOKEN` - For uploading source maps during builds
- `SENTRY_ORG` - Your Sentry organization slug
- `SENTRY_PROJECT` - Your Sentry project slug

**Braintrust (Optional):**
- `BRAINTRUST_API_KEY` - For LLM agentic loop functionality
- `BRAINTRUST_PROJECT_ID` - Braintrust project identifier

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
