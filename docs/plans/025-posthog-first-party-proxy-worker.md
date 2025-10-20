# Plan 025: PostHog First-Party Proxy Worker

> **Status**: 🚀 **IN PROGRESS**
> **Branch**: `feature/posthog-first-party-proxy`
> **Goal**: Enable analytics tracking for users with strict browser privacy filters (Brave, Arc)

## Overview

Create a dedicated Cloudflare Worker to act as a first-party reverse proxy for PostHog analytics, allowing analytics requests to bypass ad blockers and privacy filters by routing through the app's own domain instead of PostHog's domain.

## Context & Problem Statement

### Current Issue

Users with strict privacy filters are unable to send analytics to PostHog:

- **Brave Browser**: Blocks third-party analytics domains by default
- **Arc Browser**: Has built-in privacy features that block tracking domains
- **Ad Blockers**: PostHog domains are on many blocklists (EasyList, etc.)

**Current Architecture** (broken for privacy-filtered users):

```
Browser → (blocked) → us.i.posthog.com
```

Users see: `net::ERR_BLOCKED_BY_CLIENT`

### Why This Matters

- Team members using Brave or Arc can't be tracked with current setup
- Analytics data is incomplete for privacy-conscious users
- Limits ability to understand true user behavior

### Alternative Approaches Considered

1. **Do nothing** - Accept incomplete analytics (rejected: defeats purpose of adding PostHog)
2. **PostHog's Managed Reverse Proxy** - Use their commercial service (rejected: adds cost/complexity)
3. **PostHog's DNS Proxy** - Requires Cloudflare Enterprise plan (rejected: cost prohibitive)
4. **Custom Cloudflare Worker Proxy** ✅ **SELECTED**
   - Clean separation of concerns
   - Implementation based on PostHog's official Cloudflare guide
   - Free tier compatible (100k requests/day)
   - Independent deployment lifecycle

## Target Architecture

```
Browser (with privacy filters)
  ↓
  ├─→ coconut.app.worksquared.ai/decide (first-party domain ✅ allowed)
  │   ↓
  │   [PostHog Proxy Worker - packages/posthog-worker]
  │   ↓
  └─→ us.i.posthog.com (origin request from CF, not browser)
```

**Key Benefits:**

- Requests appear to come from first-party domain → not blocked
- Static assets still cached efficiently
- Clean separation from sync worker
- Easy to scale/maintain independently
- Can switch to alternative proxy solution later without code changes

## Implementation Plan

### 1. Create `packages/posthog-worker` Package

New dedicated package structure:

```
packages/posthog-worker/
├── src/
│   └── index.ts           # PostHog proxy implementation
├── wrangler.toml          # Cloudflare Worker config
├── package.json
├── tsconfig.json
```

**Why separate worker?**

- Follows PostHog's official architecture
- Single responsibility (only handles analytics)
- Independent deployment
- No conflicts with sync server routing
- Can scale independently if needed

### 2. Proxy Implementation

Implementation based on [PostHog's official Cloudflare guide](https://posthog.com/docs/advanced/proxy/cloudflare):

```typescript
// Route pattern:
// /static/* → cached static assets from PostHog
// /* → forwarded to PostHog API

// Key behaviors:
- Delete request cookies (security)
- Cache static assets for performance
- Forward all other requests transparently
- Proper CORS headers
```

### 3. Non-Generic Subdomain

**Critical**: PostHog docs warn: "Avoid using generic paths like `/analytics`, `/tracking`, `/ingest`, `/posthog`. They will most likely be blocked."

**Solution**: Use unique subdomain `coconut.app.worksquared.ai`

- Random, non-generic name
- Unlikely to appear in ad blocker filter lists
- Can be changed without code changes (just wrangler.toml + frontend env var)

### 4. Deployment Configuration

**GitHub Actions Updates:**

- Add deploy step for `@work-squared/posthog-worker`
- Set correct environment variables
- Deploy before main worker (no dependencies)

**Frontend Configuration:**

```
VITE_PUBLIC_POSTHOG_HOST=https://coconut.app.worksquared.ai
```

**CSP Headers Update:**

```
connect-src: add coconut.app.worksquared.ai (or keep as 'self' in root domain)
```

## Open Questions & Decisions

### 1. Subdomain Name

Current: `coconut` (non-generic, random)

**Options:**

- `🍍 Keep coconut` - clear, random, memorable
- Use other random name: `pineapple`, `watermelon`, `blueberry`, `mushroom`, etc.
- Suggestion: Vote on name

### 2. CSP Header Strategy

**Option A** (recommended): Keep PostHog script/assets allowed, API goes through proxy

```
script-src: allow 'us-assets.i.posthog.com'
connect-src: remove 'us.i.posthog.com', add first-party proxy domain
```

**Option B**: Only allow proxy domain in connect-src

```
connect-src: only 'coconut.app.worksquared.ai'
```

Current approach: **Option A** (allows JS but requires proxy for API)

### 3. Region Fallback

**Current**: Hardcoded to `us.i.posthog.com`

**Future consideration**: Could add environment variable to switch regions

```
US: us.i.posthog.com
EU: eu.i.posthog.com
```

Current: US region only (can add later if needed)

### 4. Monitoring & Observability

**Options:**

- Add Sentry integration (could cause recursion?)
- Add basic logging to CloudFlare Workers
- Monitor via PostHog dashboard only

**Current**: Monitor via PostHog dashboard, basic CF logging

## Testing Plan

### Phase 1: Chrome (baseline)

- [ ] Verify analytics events captured in PostHog dashboard
- [ ] Check performance (should be transparent)

### Phase 2: Brave (target)

- [ ] Test with user (coworker with Brave)
- [ ] Verify events in PostHog dashboard
- [ ] Check no console errors

### Phase 3: Arc (target)

- [ ] Test with browser
- [ ] Verify analytics working
- [ ] Performance check

### Phase 4: Production

- [ ] Deploy to production
- [ ] Monitor for errors in worker logs
- [ ] Verify real-world analytics

## Deployment Checklist

- [ ] `packages/posthog-worker` created with proper structure
- [ ] Proxy implementation matches PostHog docs
- [ ] TypeScript typecheck passes
- [ ] GitHub Actions includes deploy step
- [ ] Frontend env vars configured
- [ ] CSP headers updated
- [ ] PR review + approval
- [ ] Merge to main
- [ ] GitHub Actions deploys all workers
- [ ] Test in multiple browsers
- [ ] Monitor for 24 hours

## Rollback Plan

If issues arise:

1. **Proxy broken but analytics needed**:
   - Change `VITE_PUBLIC_POSTHOG_HOST` to direct PostHog domain
   - Revert CSP headers to allow `us.i.posthog.com`
   - No code changes needed

2. **Worker deployment fails**:
   - No impact (separate worker, main app still works)
   - Fix code and redeploy

3. **Performance issues**:
   - Analytics data optional (not critical for app function)
   - Switch to direct PostHog temporarily
   - Profile and optimize

## Success Criteria

✅ Analytics events captured for:

- Chrome users (baseline)
- Brave users (coworker)
- Arc users (optional)

✅ No performance impact
✅ No console errors
✅ Clean separation of concerns
✅ Easy to maintain/modify

## Timeline

- PR: Today
- Merge: After review
- Production: Immediate upon merge (GitHub Actions)
- Testing: 24-48 hours
