export interface Env {
  POSTHOG_HOST: string
  POSTHOG_PROJECT_API_KEY: string
  ALLOW_ORIGIN?: string
}

const ok = (body: any, env: Env, init = 200) =>
  new Response(JSON.stringify(body), {
    status: init,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': env.ALLOW_ORIGIN || '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    },
  })

const notFound = () => new Response('Not found', { status: 404 })

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)

    if (req.method === 'OPTIONS') return ok({}, env)

    if (req.method !== 'POST') return notFound()

    if (env.ALLOW_ORIGIN) {
      const origin = req.headers.get('origin') || ''
      if (origin !== env.ALLOW_ORIGIN) return new Response('forbidden', { status: 403 })
    }

    const endpoint = pathname.endsWith('/batch')
      ? '/batch/'
      : pathname.endsWith('/capture')
        ? '/capture/'
        : null
    if (!endpoint) return notFound()

    const body = await req.json()

    const forward =
      endpoint === '/batch/'
        ? {
            api_key: env.POSTHOG_PROJECT_API_KEY,
            batch: body.batch ?? [],
            sent_at: new Date().toISOString(),
          }
        : { api_key: env.POSTHOG_PROJECT_API_KEY, ...body }

    const res = await fetch(`${env.POSTHOG_HOST}${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(forward),
    })

    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': env.ALLOW_ORIGIN || '*',
      },
    })
  },
}
