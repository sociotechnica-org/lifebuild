/**
 * Sentry Tunnel Function
 *
 * This function proxies Sentry events from the client to Sentry's ingest endpoint.
 * It bypasses browser tracking prevention by routing through the same domain.
 *
 * The Sentry JavaScript SDK will POST to /.sentry-tunnel, and this function
 * forwards the request to the actual Sentry endpoint.
 */

interface SentryTunnelRequest {
  dsn?: string
  [key: string]: unknown
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

    // Parse DSN to extract the endpoint
    // DSN format: https://<key>@<host>/api/<project>/
    const dsnUrl = new URL(dsn)
    const sentryEndpoint = `${dsnUrl.protocol}//${dsnUrl.host}/api/${dsnUrl.pathname.split('/').pop()}/envelope/`

    // Forward the request to Sentry
    const response = await fetch(sentryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body,
    })

    // Return Sentry's response
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Sentry tunnel error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
