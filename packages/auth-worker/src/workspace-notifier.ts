const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 500

export type WorkspaceEnv = {
  SERVER_WEBHOOK_URL?: string
  WEBHOOK_SECRET?: string
}

type WorkspaceEventType = 'workspace.created' | 'workspace.deleted'

export interface WorkspaceEventPayload {
  event: WorkspaceEventType
  instanceId: string
  userId: string
  timestamp: string
}

const WEBHOOK_SECRET_HEADER = 'X-Webhook-Secret'
const CLIENT_HEADER = 'X-Client-Name'

export async function notifyWorkspaceEvent(
  env: WorkspaceEnv,
  payload: WorkspaceEventPayload
): Promise<void> {
  const url = env.SERVER_WEBHOOK_URL?.trim()
  if (!url) {
    console.debug('Workspace webhook skipped: SERVER_WEBHOOK_URL not configured', payload.event)
    return
  }

  const secret = env.WEBHOOK_SECRET?.trim()
  if (!secret) {
    console.warn('Workspace webhook skipped: WEBHOOK_SECRET not configured', payload.event)
    return
  }

  let attempt = 0
  while (attempt < MAX_ATTEMPTS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [WEBHOOK_SECRET_HEADER]: secret,
          [CLIENT_HEADER]: 'lifebuild-auth-worker',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        if (attempt > 0) {
          console.info('Workspace webhook delivered after retry', {
            event: payload.event,
            attempt: attempt + 1,
          })
        }
        return
      }

      const body = await safeReadBody(response)
      console.warn('Workspace webhook failed', {
        event: payload.event,
        status: response.status,
        attempt: attempt + 1,
        body,
      })
    } catch (error) {
      console.error('Workspace webhook error', {
        event: payload.event,
        attempt: attempt + 1,
        error,
      })
    }

    attempt++
    if (attempt < MAX_ATTEMPTS) {
      await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1))
    }
  }
}

async function safeReadBody(response: Response): Promise<string | undefined> {
  try {
    const clone = response.clone()
    const text = await clone.text()
    return text.slice(0, 512)
  } catch {
    return undefined
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}
