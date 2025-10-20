# ADR-007: Analytics Implementation Approach

## Status

Accepted & **Updated** - October 20, 2025

## Last Updated

2025-10-20

## Context

Work Squared needs analytics to understand user behavior, track feature usage, and make data-driven product decisions. We evaluated several approaches for integrating PostHog analytics into our application.

## Options Considered

### Option 1: Direct PostHog Integration

Use PostHog's JavaScript SDK directly with their hosted service.

- **Pros:** Zero infrastructure, battle-tested SDK, full feature access
- **Cons:** Third-party domain, less control over requests

### Option 2: Simple Proxy Worker

Minimal Cloudflare Worker that forwards analytics requests to PostHog.

- **Pros:** First-party domain, minimal complexity
- **Cons:** Additional infrastructure to maintain

### Option 3: Custom Analytics Infrastructure

Custom Cloudflare Worker with offline queueing, retry logic, and LiveStore integration.

- **Pros:** Maximum control, custom integrations, sophisticated offline handling
- **Cons:** High complexity, significant maintenance burden, extensive testing requirements

### Option 4: Self-hosted PostHog

Run PostHog instance on our own infrastructure.

- **Pros:** Full control over data and infrastructure
- **Cons:** Operational overhead, scaling complexity, maintenance burden

## Decision

We chose **Option 2: First-Party Proxy via Dedicated Cloudflare Worker** (evolved from Option 1).

### Initial Implementation (Option 1)

Initially deployed direct PostHog integration using their standard JavaScript SDK. This approach worked well but had a critical limitation: analytics requests were blocked by privacy-focused browsers (Brave, Arc) and some ad blockers.

### Evolution to Option 2 (Current Implementation - October 2025)

After discovering that team members using privacy-focused browsers couldn't send analytics, we implemented **Option 2 as a dedicated Cloudflare Worker** to enable first-party analytics collection:

**New Architecture:**
- Dedicated `packages/posthog-worker` Cloudflare Worker
- Routes all analytics through first-party domain: `coconut.app.worksquared.ai`
- Clean separation from main sync server
- Based on [PostHog's official Cloudflare proxy guide](https://posthog.com/docs/advanced/proxy/cloudflare)

### Why This Approach (vs. staying with Option 1)

**Business Driver**: Team members using Brave browser couldn't send analytics data

**Technical Benefits**:
- ✅ Bypasses ad blockers and privacy filters (works in Brave, Arc, Firefox Strict Tracking Protection)
- ✅ First-party domain appears trustworthy to browser privacy features
- ✅ Minimal complexity (simple reverse proxy)
- ✅ Independent deployment lifecycle
- ✅ Can easily migrate to other solutions later

**Why Separate Worker**:
- Single responsibility principle (analytics only)
- Independent scaling and deployment
- No path conflicts with sync server
- Matches PostHog's recommended architecture

### Key Implementation Details

**Proxy Design:**
- `/static/*` requests cached for performance
- Request cookies removed for security
- All requests forwarded to `us.i.posthog.com`
- Unique non-generic subdomain (`coconut`) to avoid ad blocker blocklists

**Configuration:**
- Frontend points `VITE_PUBLIC_POSTHOG_HOST` to first-party proxy URL
- CSP headers updated to allow proxy domain
- GitHub Actions deploys PostHog worker in deployment pipeline

## Consequences

### Downsides (Previous Option 1)

- ~~Third-party domain blocks analytics in privacy-focused browsers~~
- ~~Less control over requests~~

### Benefits (Current Option 2)

- **Works everywhere**: Analytics captured in Brave, Arc, and other privacy-focused browsers
- **Minimal complexity**: Simple reverse proxy based on proven pattern
- **First-party trust**: Requests appear to come from app domain
- **Independent deployment**: Separate worker, separate deployment lifecycle
- **Security**: Cookies removed, Cloudflare edge protection
- **Performance**: Static assets cached efficiently
- **Backward compatible**: PostHog SDK unchanged, works seamlessly
- **Easy to migrate**: Can switch to other solutions without code changes

## Migration Path

If requirements change in the future:

1. **PostHog Managed Proxy**: Switch to their managed service
2. **PostHog EU Hosting**: Change proxy target to `eu.i.posthog.com`
3. **Different Analytics**: Replace proxy target without touching frontend code
4. **Turn off analytics**: Simply remove worker deployment

The first-party proxy approach is flexible and doesn't lock us into any specific provider.
