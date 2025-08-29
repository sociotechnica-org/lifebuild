import posthog from 'posthog-js'

export function initAnalytics() {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY

  if (!posthogKey) {
    console.warn('VITE_POSTHOG_KEY not found, analytics disabled')
    return
  }

  posthog.init(posthogKey, {
    api_host: 'https://app.posthog.com',
    capture_pageview: false, // We'll manually track page views
    persistence: 'localStorage+cookie',
    debug: import.meta.env.DEV,
  })
}

export function capture(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(event, properties)
  }
}

export function identify(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, properties)
  }
}

export function pageView(path?: string) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture('$pageview', { $current_url: path || window.location.href })
  }
}
