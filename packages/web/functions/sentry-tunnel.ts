/**
 * Sentry Tunnel Function
 *
 * This function proxies Sentry events from the client to Sentry's ingest endpoint.
 * It bypasses browser tracking prevention by routing through the same domain.
 *
 * The Sentry JavaScript SDK will POST to /sentry-tunnel, and this function
 * forwards the request to the actual Sentry endpoint.
 */

interface SentryTunnelRequest {
  dsn?: string
  [key: string]: unknown
}

// Whitelist of allowed Sentry ingest hosts to prevent SSRF attacks
const ALLOWED_SENTRY_HOSTS = ['o4510114888220672.ingest.us.sentry.io', 'ingest.sentry.io']

/**
 * Extracts the project ID from a Sentry DSN pathname
 * Sentry DSN format: https://<key>@<host>/<project>
 * Example: https://abc123@o123.ingest.sentry.io/456789
 * Pathname: /456789
 */
function extractProjectId(pathname: string): string {
  // Remove leading/trailing slashes and get first segment (the project ID)
  const parts = pathname.split('/').filter(p => p.length > 0)
  if (parts.length === 0) {
    throw new Error(`Invalid DSN pathname: ${pathname}`)
  }
  return parts[0]
}

/**
 * Validates that the DSN host is a known Sentry host
 */
function isAllowedSentryHost(host: string): boolean {
  return ALLOWED_SENTRY_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`))
}

export const onRequest: PagesFunction = async context => {
  // Only allow POST requests
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Read the request body
    const body = await context.request.text()

    // Extract the envelope header to get the DSN
    // Sentry envelopes have the format: {header}\n{payload}
    const lines = body.split('\n')
    const header = JSON.parse(lines[0]) as SentryTunnelRequest

    // Get DSN from the request header (Sentry includes it)
    const dsn = header.dsn

    if (!dsn) {
      return new Response('Missing DSN', { status: 400 })
    }

    // Parse DSN and validate host to prevent SSRF
    const dsnUrl = new URL(dsn)

    if (!isAllowedSentryHost(dsnUrl.host)) {
      console.error(`Rejected unauthorized Sentry host: ${dsnUrl.host}`)
      return new Response('Unauthorized Sentry host', { status: 403 })
    }

    // Extract authentication credentials and project ID from DSN
    // DSN format: https://<public_key>@<host>/<project_id>
    const publicKey = dsnUrl.username
    const projectId = extractProjectId(dsnUrl.pathname)

    if (!publicKey) {
      console.error('Missing public key in DSN')
      return new Response('Invalid DSN: missing public key', { status: 400 })
    }

    // Build Sentry endpoint with authentication query parameters
    const sentryEndpoint = `${dsnUrl.protocol}//${dsnUrl.host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`

    // Forward the request to Sentry
    const response = await fetch(sentryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body,
    })

    // Preserve Sentry's response headers
    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value)
    })

    // Return Sentry's response with original headers
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Sentry tunnel error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
