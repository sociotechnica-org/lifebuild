# PostHog Analytics Proxy Worker

A dedicated Cloudflare Worker that acts as a first-party reverse proxy for PostHog analytics. This enables analytics tracking to work in privacy-focused browsers (Brave, Arc) and with strict ad blocker configurations.

## Overview

This worker routes all PostHog analytics requests through a first-party domain (`coconut.app.worksquared.ai`) instead of directly to PostHog's domain, bypassing browser privacy filters and ad blockers that typically block third-party analytics services.

## Architecture

```
Browser with privacy filters
         ↓
coconut.app.worksquared.ai (first-party ✅)
         ↓
PostHog Analytics Worker
         ↓
us.i.posthog.com (origin request, not browser)
```

## Key Features

- ✅ **First-Party Domain**: Analytics requests appear to come from your app's domain
- ✅ **Asset Caching**: `/static/*` requests cached for performance
- ✅ **Security**: Request cookies removed before forwarding
- ✅ **Privacy Filter Bypass**: Works in Brave, Arc, Firefox Strict Tracking Protection
- ✅ **Independent Deployment**: Separate from main sync server
- ✅ **Based on PostHog Guide**: Implementation follows [official Cloudflare proxy guide](https://posthog.com/docs/advanced/proxy/cloudflare)

## Deployment

### Automatic (GitHub Actions)

Deploys automatically when code is pushed to `main` branch.

### Manual Deployment

```bash
# Authenticate with Cloudflare (one-time)
wrangler auth login

# Deploy to production
wrangler deploy
```

### Environment

Configure in `wrangler.toml`:

```toml
[env.production]
name = "work-squared-posthog-prod"
route = "coconut.app.worksquared.ai/*"
zone_name = "worksquared.ai"
```

## Configuration

The worker is configured through:

1. **`wrangler.toml`**: Cloudflare Worker routing and environment setup
2. **Frontend env var**: `VITE_PUBLIC_POSTHOG_HOST=https://coconut.app.worksquared.ai`
3. **CSP Headers**: `connect-src` allows `coconut.app.worksquared.ai`

## How It Works

### Request Flow

```
1. Browser sends analytics request:
   POST https://coconut.app.worksquared.ai/decide

2. PostHog Worker intercepts
   - Routes `/static/*` through cache
   - Strips cookies from request
   - Forwards other requests to PostHog API

3. Response returned to browser
   - Cached if `/static/*`
   - With proper CORS headers
```

### Static Asset Caching

The worker caches PostHog's static assets (JavaScript, CSS) using Cloudflare's cache:

```typescript
if (pathname.startsWith('/static/')) {
  // Check cache first
  let response = await caches.default.match(request)
  if (!response) {
    // Fetch from PostHog and cache
    response = await fetch(`https://${ASSET_HOST}${pathname}`)
    ctx.waitUntil(caches.default.put(request, response.clone()))
  }
  return response
}
```

## Subdomain Choice

The proxy uses `coconut.app.worksquared.ai` (random, non-generic name) as the subdomain because:

- ✅ Unlikely to appear in ad blocker filter lists
- ✅ Non-obvious, not a generic term like "analytics", "tracking", or "posthog"
- ✅ Easy to change if needed (just update `wrangler.toml` and frontend env var)

**If blocked in the future**, simply change to a different random subdomain:

- `pineapple.app.worksquared.ai`
- `mushroom.app.worksquared.ai`
- `watermelon.app.worksquared.ai`

## Local Development

### Test Locally

```bash
# Start development server
pnpm run dev

# Test proxy endpoint
curl http://localhost:8787/decide

# Test with PostHog's SDK (if needed)
# Configure VITE_PUBLIC_POSTHOG_HOST=http://localhost:8787 in web package
```

### Dry Run Deployment

```bash
wrangler deploy --dry-run
```

## Production URLs

- **Production**: `https://coconut.app.worksquared.ai`
- **Worker Status**: Check in [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers

## Related Documentation

- **Architecture**: [docs/architecture.md](../../docs/architecture.md) - System overview
- **Deployment**: [docs/deployment.md](../../docs/deployment.md) - Full deployment guide
- **ADR-007**: [docs/adrs/007-analytics-implementation-approach.md](../../docs/adrs/007-analytics-implementation-approach.md) - Decision rationale
- **Plan 025**: [docs/plans/025-posthog-first-party-proxy-worker.md](../../docs/plans/025-posthog-first-party-proxy-worker.md) - Implementation plan

## Troubleshooting

### Analytics Not Captured

1. **Check worker deployment**: Visit `https://coconut.app.worksquared.ai/status`
2. **Verify frontend config**: Check that `VITE_PUBLIC_POSTHOG_HOST` is set correctly
3. **Check CSP headers**: Browser console should show analytics requests to `coconut.app.worksquared.ai`
4. **Check PostHog key**: Verify `VITE_PUBLIC_POSTHOG_KEY` secret is set in GitHub

### Analytics Still Blocked in Privacy Browser

If ad blocker still blocks requests:

1. Update subdomain in `wrangler.toml` to different random name
2. Update frontend `VITE_PUBLIC_POSTHOG_HOST` env var
3. Redeploy both worker and web app

### 502 or Timeout Errors

- Check Cloudflare status page for incidents
- Verify `us.i.posthog.com` is reachable
- Check worker logs: `wrangler tail work-squared-posthog-prod`

## Implementation Reference

- [PostHog Cloudflare Proxy Guide](https://posthog.com/docs/advanced/proxy/cloudflare)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## Future Considerations

The first-party proxy approach is flexible and enables future changes:

1. **Regional Support**: Add environment variable to switch between `us.i.posthog.com` and `eu.i.posthog.com`
2. **Different Analytics**: Replace proxy target without changing frontend code
3. **Managed Proxy**: Switch to PostHog's managed service if needed
4. **Disable Analytics**: Remove worker deployment to stop tracking

## Security Notes

- ✅ Cookies removed from forwarded requests
- ✅ Cloudflare edge provides DDoS protection
- ✅ No sensitive data stored in worker
- ✅ No custom authentication required (transparent proxy)

## Performance Impact

- **Negligible**: Worker adds minimal latency
- **Caching**: Static assets cached aggressively
- **Bandwidth**: Proxy may reduce outbound bandwidth due to edge processing
- **Load**: Free tier supports 100k requests/day per Cloudflare pricing
