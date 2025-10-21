/**
 * PostHog analytics integration
 *
 * This module exports the usePostHog hook from posthog-js/react.
 * PostHog is initialized via PostHogProvider in main.tsx.
 *
 * Usage:
 *   import { usePostHog } from './lib/analytics'
 *
 *   const posthog = usePostHog()
 *   posthog?.capture('event_name', { property: 'value' })
 */
export { usePostHog } from 'posthog-js/react'
