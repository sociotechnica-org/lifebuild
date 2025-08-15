# Deployment Guide

This document covers deployment setup and processes for Work Squared.

## Automatic Deployment

Work Squared uses GitHub Actions for automatic deployment to Cloudflare Workers when code is merged to the `main` branch. Deployments typically complete within 2-3 minutes.

### GitHub Secrets Setup

The deployment workflow requires the following GitHub secrets to be configured:

#### Required Secrets

1. **`CLOUDFLARE_API_TOKEN`** - Cloudflare API token with Worker deployment permissions

### Setting up Cloudflare API Token

1. Go to [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Click "Get started" next to "Custom token"
4. Configure the token with these exact permissions:
   
   **Account Permissions:**
   - `Account:Cloudflare Workers Scripts:Edit`
   - `Account:Account Settings:Read`
   
   **User Permissions:**
   - `User:Memberships:Read`
   
5. Under "Account Resources", select:
   - Include → Your specific account name
6. Leave "Zone Resources" blank (not needed for Workers)
7. Copy the generated token

### Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add the secret:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Secret: (paste your Cloudflare API token)
5. Click **Add secret**

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

- Verify `CLOUDFLARE_API_TOKEN` is set correctly in GitHub secrets
- Ensure token has necessary permissions (Workers:Edit)

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

## Security Notes

- Never commit API tokens or secrets to the repository
- Use GitHub secrets for all sensitive configuration
- Regularly rotate Cloudflare API tokens
- Monitor deployment logs for any security issues
