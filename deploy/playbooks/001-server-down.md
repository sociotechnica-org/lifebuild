# Playbook 001: Agentic Server Down

## Symptoms

- AI assistant not responding in the app
- Health check failures on Render
- Render dashboard shows service as "Failed" or "Deploy failed"
- Users report that AI features are broken

## Prerequisites

Before starting diagnosis:

```bash
# Ensure Render CLI is authenticated
render whoami

# If not authenticated:
render login
render workspace set
```

## Phase 1: Gather Information (Read-Only)

### 1.1 Check Render Service Status

```bash
# List all services to find the agentic server
render services list --output json

# Note the service ID for subsequent commands
```

### 1.2 View Recent Deploys

```bash
# Check if a recent deploy might have caused the issue
render deploys list --service-id <SERVICE_ID> --output json
```

Look for:
- Recent deploy that coincides with the outage
- Deploy status (failed, canceled, succeeded)
- Commit SHA of the last successful deploy

### 1.3 View Logs

```bash
# Tail live logs
render logs --service-id <SERVICE_ID> --tail

# Or view recent logs
render logs --service-id <SERVICE_ID>
```

Look for:
- Startup errors
- Unhandled exceptions
- Connection failures to sync worker
- Missing environment variables
- Memory/resource issues

### 1.4 Check Related Services

The agentic server depends on:

1. **Sync Worker** (`sync.lifebuild.me`)
   ```bash
   # Check if sync worker is responding
   curl -I https://sync.lifebuild.me

   # View sync worker logs
   wrangler tail lifebuild-worker
   ```

2. **Auth Worker** (`auth.lifebuild.me`)
   ```bash
   curl https://auth.lifebuild.me/health
   ```

### 1.5 Review Recent Code Changes

```bash
# From repo root - check recent commits to packages/server
git log --oneline -20 -- packages/server/

# Check what changed in the last deploy
git diff <LAST_GOOD_COMMIT>..HEAD -- packages/server/
```

## Phase 2: Diagnosis

Based on logs and information gathered, identify the root cause:

### Common Causes

| Symptom in Logs | Likely Cause | Resolution Path |
|-----------------|--------------|-----------------|
| `ECONNREFUSED` to sync URL | Sync worker down | Check sync worker status |
| `Invalid token` | `SERVER_BYPASS_TOKEN` mismatch | Verify env vars |
| `Cannot find module` | Build/dependency issue | Check package.json, rebuild |
| `ENOMEM` | Out of memory | Check Render plan limits |
| Crash loop with no logs | Startup crash before logging | Check env vars, review code |
| `Sentry init failed` | Missing `SENTRY_DSN` | Check env vars |

### Environment Variable Checklist

Required vars (check in Render dashboard):
- [ ] `NODE_ENV=production`
- [ ] `STORE_IDS` - comma-separated workspace IDs
- [ ] `AUTH_TOKEN`
- [ ] `LIVESTORE_SYNC_URL=wss://sync.lifebuild.me`
- [ ] `SERVER_BYPASS_TOKEN`
- [ ] `AUTH_WORKER_INTERNAL_URL`

## Phase 3: Resolution (Requires Approval)

Based on diagnosis, choose the appropriate resolution:

### Option A: Restart Service

If the issue appears transient (network blip, resource exhaustion):

```bash
# REQUIRES APPROVAL
render restart --service-id <SERVICE_ID>
```

### Option B: Rollback to Previous Deploy

If a recent deploy caused the issue:

```bash
# View deploy history to find last good deploy
render deploys list --service-id <SERVICE_ID> --output json

# Rollback via Render dashboard (no CLI command)
# Go to: Render Dashboard > Service > Deploys > [Good Deploy] > Rollback
```

### Option C: Fix Code and Redeploy

If the issue is a code bug:

1. Create a fix branch
2. Make the fix
3. Run tests locally
4. Create PR
5. Merge to main (triggers auto-deploy)

```bash
# Standard SDLC process
git checkout -b fix/server-startup-issue
# ... make changes ...
pnpm --filter @lifebuild/server lint-all
pnpm --filter @lifebuild/server build
git add . && git commit -m "Fix: server startup issue"
git push -u origin fix/server-startup-issue
gh pr create --title "Fix: server startup issue" --body "..."
```

### Option D: Fix Environment Variables

If env vars are misconfigured:

1. Go to Render Dashboard
2. Navigate to the service
3. Environment tab
4. Fix the variable
5. Save (triggers redeploy)

**Note**: This must be done through Render UI - the agent cannot modify production env vars directly.

## Phase 4: Verification

After resolution:

```bash
# Check service is running
render services list --output json | jq '.[] | select(.name | contains("server"))'

# Verify logs show healthy startup
render logs --service-id <SERVICE_ID> --tail

# Check health endpoint (if exposed)
# The health endpoint may only be accessible internally
```

## Escalation

Escalate to human operator if:

- Cannot access Render dashboard/CLI
- Issue requires env var changes (must be done in UI)
- Root cause is unclear after Phase 2
- Issue affects multiple services
- Data integrity concerns

## Post-Incident

After resolution:

1. Document what happened and the fix
2. Consider if monitoring could catch this earlier
3. If code fix, ensure tests cover the failure mode
4. Update this playbook if new failure modes discovered
