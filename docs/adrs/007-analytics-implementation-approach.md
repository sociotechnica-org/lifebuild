# ADR-007: Analytics Implementation Approach

**Status:** Accepted  
**Date:** 2025-08-28  
**Authors:** Claude Code

## Context

Work Squared needs analytics to understand user behavior, track feature usage, and make data-driven product decisions. We initially explored a complex first-party analytics solution using PostHog with a custom Cloudflare Worker proxy and offline event queueing system.

The initial approach included:

- Custom Cloudflare Worker as a proxy to PostHog API
- Offline-capable event queue with dual storage (LiveStore + IndexedDB)
- Custom retry logic, batching, and delivery management
- Integration with Work Squared's LiveStore schema

## Decision

We decided to **use PostHog directly** with their standard JavaScript SDK, avoiding the custom infrastructure layer.

## Rationale

### Complexity vs. Value Analysis

The custom proxy approach introduced significant complexity:

- **Infrastructure overhead**: Additional Cloudflare Worker to deploy, monitor, and maintain
- **Custom queue logic**: 200+ lines of offline handling, retry logic, and storage management
- **Schema pollution**: Adding `analyticsQueue` table to core application schema
- **Testing burden**: Custom analytics infrastructure requires comprehensive testing
- **Debugging complexity**: Additional layer between application and analytics service

### Benefits Don't Justify Complexity

The primary benefit of the custom approach was first-party data collection (same domain), but:

1. **Privacy isn't critical for our use case** - Work Squared is primarily used by internal teams, not consumer-facing where ad-blockers and privacy concerns are paramount

2. **PostHog SDK is battle-tested** - Their JavaScript SDK already includes:
   - Automatic offline queueing and retry logic
   - Intelligent batching and delivery optimization
   - Cross-browser compatibility and edge case handling
   - Regular security updates and maintenance

3. **Focus on core value** - Engineering time is better spent on project management features rather than rebuilding analytics infrastructure

4. **Migration flexibility** - Direct PostHog integration is easier to migrate from if requirements change

## Implementation

Simple, direct integration:

```typescript
import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
  capture_pageview: false, // Manual page tracking
  persistence: 'localStorage+cookie',
})
```

## Trade-offs

### Accepted Downsides

- **Third-party domain**: Analytics requests go to `app.posthog.com` instead of our domain
- **Less control**: Cannot customize request handling or add custom logic
- **Dependency**: Reliant on PostHog's infrastructure and SDK stability

### Gained Benefits

- **Zero infrastructure maintenance**: No workers, queues, or custom logic to maintain
- **Proven reliability**: PostHog SDK handles edge cases we haven't considered
- **Feature completeness**: Access to all PostHog features (session replay, feature flags, etc.)
- **Faster development**: Integration takes hours instead of days
- **Easier debugging**: Standard PostHog tooling and documentation

## Future Considerations

If first-party data collection becomes critical (e.g., for compliance, ad-blocker avoidance, or custom analytics), we can:

1. **Simple proxy approach**: Minimal Cloudflare Worker that forwards requests without custom logic
2. **PostHog Cloud EU**: Use PostHog's EU hosting for data residency requirements
3. **Self-hosted PostHog**: Full control with managed complexity

## Alternatives Considered

1. **Custom analytics worker** (rejected) - Too complex for current needs
2. **Simple proxy worker** - Considered but unnecessary for current requirements
3. **Self-hosted PostHog** - Overkill for current scale and requirements
4. **Other analytics providers** - PostHog's feature set aligns well with product analytics needs

## Status

**Accepted** - Implementing direct PostHog integration, removing custom worker approach.
