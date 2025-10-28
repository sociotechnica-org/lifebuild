import type { IncomingMessage, ServerResponse } from 'http'
import { operationLogger } from '../utils/logger.js'
import type { WorkspaceOrchestrator } from '../services/workspace-orchestrator.js'

const logger = operationLogger('workspace_webhook')

export interface WorkspaceWebhookOptions {
  orchestrator: WorkspaceOrchestrator
  secret?: string
}

interface WorkspaceWebhookPayload {
  event: 'workspace.created' | 'workspace.deleted'
  instanceId: string
  userId: string
  timestamp: string
}

export async function handleWorkspaceWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  options: WorkspaceWebhookOptions
): Promise<void> {
  if (req.method !== 'POST') {
    respond(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!options.secret) {
    logger.error('Workspace webhook secret is not configured')
    respond(res, 500, { error: 'Webhook secret not configured' })
    return
  }

  const providedSecret = extractSecret(req)
  if (providedSecret !== options.secret) {
    logger.warn('Workspace webhook secret mismatch')
    respond(res, 401, { error: 'Unauthorized' })
    return
  }

  let payload: WorkspaceWebhookPayload
  try {
    payload = await parsePayload(req)
  } catch (error) {
    logger.warn({ error }, 'Failed to parse workspace webhook payload')
    respond(res, 400, { error: 'Invalid JSON payload' })
    return
  }

  const validationError = validatePayload(payload)
  if (validationError) {
    logger.warn({ validationError }, 'Workspace webhook payload validation failed')
    respond(res, 400, { error: validationError })
    return
  }

  const receivedAt = new Date().toISOString()
  const { orchestrator } = options
  const wasMonitoring = orchestrator.listMonitored().includes(payload.instanceId)

  try {
    let status: string
    if (payload.event === 'workspace.created') {
      await orchestrator.ensureMonitored(payload.instanceId)
      const isMonitoring = orchestrator.listMonitored().includes(payload.instanceId)
      status = isMonitoring && !wasMonitoring ? 'monitoring_started' : 'already_monitored'
    } else {
      await orchestrator.stopMonitoring(payload.instanceId)
      const isMonitoring = orchestrator.listMonitored().includes(payload.instanceId)
      status = wasMonitoring && !isMonitoring ? 'monitoring_stopped' : 'already_stopped'
    }

    logger.info(
      { event: payload.event, status, instanceId: payload.instanceId },
      'Workspace webhook processed'
    )
    respond(res, 200, { status, receivedAt })
  } catch (error) {
    logger.error({ error, event: payload.event }, 'Workspace webhook handling failed')
    respond(res, 500, { error: 'Internal server error' })
  }
}

function extractSecret(req: IncomingMessage): string | undefined {
  const header = req.headers['x-webhook-secret']
  if (Array.isArray(header)) {
    return header[0]
  }
  return header ?? undefined
}

async function parsePayload(req: IncomingMessage): Promise<WorkspaceWebhookPayload> {
  const body = await readRequestBody(req)
  return JSON.parse(body)
}

function validatePayload(payload: WorkspaceWebhookPayload): string | null {
  if (!payload || typeof payload !== 'object') {
    return 'Payload must be an object'
  }

  if (!payload.event || !['workspace.created', 'workspace.deleted'].includes(payload.event)) {
    return 'Unsupported event type'
  }

  if (!payload.instanceId || typeof payload.instanceId !== 'string') {
    return 'instanceId is required'
  }

  if (!payload.userId || typeof payload.userId !== 'string') {
    return 'userId is required'
  }

  if (!payload.timestamp || typeof payload.timestamp !== 'string') {
    return 'timestamp is required'
  }

  return null
}

function respond(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []

  return await new Promise<string>((resolve, reject) => {
    req
      .on('data', chunk => {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
      })
      .on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'))
      })
      .on('error', reject)
  })
}
