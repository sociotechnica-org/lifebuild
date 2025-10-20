/**
 * PostHog Analytics Proxy Worker
 *
 * This worker acts as a reverse proxy for PostHog analytics requests,
 * allowing analytics to work in browsers with strict privacy filters
 * (like Brave and Arc) by routing requests through a first-party domain.
 *
 * Implementation based on PostHog's official Cloudflare proxy guide:
 * https://posthog.com/docs/advanced/proxy/cloudflare
 */

const API_HOST = 'us.i.posthog.com'
const ASSET_HOST = 'us-assets.i.posthog.com'

interface CloudflareEnv {
  CACHE: CacheStorage
}

async function handleRequest(request: Request, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname
  const search = url.search
  const pathWithParams = pathname + search

  if (pathname.startsWith('/static/')) {
    return retrieveStatic(request, pathWithParams, ctx)
  } else {
    return forwardRequest(request, pathWithParams)
  }
}

async function retrieveStatic(
  request: Request,
  pathname: string,
  ctx: ExecutionContext
): Promise<Response> {
  let response = await caches.default.match(request)
  if (!response) {
    response = await fetch(`https://${ASSET_HOST}${pathname}`)
    ctx.waitUntil(caches.default.put(request, response.clone()))
  }
  return response
}

async function forwardRequest(request: Request, pathWithSearch: string): Promise<Response> {
  const originRequest = new Request(request)
  originRequest.headers.delete('cookie')
  return await fetch(`https://${API_HOST}${pathWithSearch}`, originRequest)
}

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, ctx)
  },
}
