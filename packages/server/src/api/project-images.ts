import type { IncomingMessage, ServerResponse } from 'http'
import {
  AuthErrorCode,
  DEFAULT_GRACE_PERIOD_SECONDS,
  DEV_AUTH,
  isWithinGracePeriod,
  verifyJWT,
} from '@lifebuild/shared/auth'
import type { ProjectImageService } from '../services/project-image-service.js'
import { operationLogger } from '../utils/logger.js'

interface ProjectImageRegeneratePayload {
  storeId?: string
  projectId?: string
}

const respondJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const readRequestBody = async (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })

const extractBearerToken = (req: IncomingMessage): string | null => {
  const authHeader = req.headers['authorization']
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader
  if (typeof headerValue === 'string' && headerValue.toLowerCase().startsWith('bearer ')) {
    return headerValue.slice(7).trim()
  }
  return null
}

const authenticateRequest = async (
  req: IncomingMessage
): Promise<{ userId: string } | { error: string; code: string }> => {
  const requireAuth = process.env.REQUIRE_AUTH === 'true' || process.env.NODE_ENV === 'production'

  if (!requireAuth) {
    return { userId: DEV_AUTH.DEFAULT_USER_ID }
  }

  const token = extractBearerToken(req)
  if (!token) {
    return { error: 'Authentication required', code: AuthErrorCode.TOKEN_MISSING }
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return { error: 'JWT secret not configured', code: AuthErrorCode.AUTH_SERVICE_ERROR }
  }

  if (token === DEV_AUTH.INSECURE_TOKEN && process.env.NODE_ENV !== 'production') {
    return { userId: DEV_AUTH.DEFAULT_USER_ID }
  }

  const payload = await verifyJWT(token, jwtSecret)
  if (!payload) {
    return { error: 'Invalid JWT token', code: AuthErrorCode.TOKEN_INVALID }
  }

  const gracePeriodSeconds = Number.parseInt(
    process.env.GRACE_PERIOD_SECONDS || DEFAULT_GRACE_PERIOD_SECONDS.toString(),
    10
  )

  if (!isWithinGracePeriod(payload, gracePeriodSeconds)) {
    return { error: 'Token expired beyond grace period', code: AuthErrorCode.GRACE_PERIOD_EXPIRED }
  }

  return { userId: payload.userId }
}

export const createProjectImageRegenerateHandler =
  (projectImageService: ProjectImageService) =>
  async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      respondJson(res, 405, { error: 'Method not allowed' })
      return
    }

    const authResult = await authenticateRequest(req)
    if ('error' in authResult) {
      respondJson(res, 401, { error: authResult.error, code: authResult.code })
      return
    }

    let payload: ProjectImageRegeneratePayload = {}

    try {
      const body = await readRequestBody(req)
      payload = body ? (JSON.parse(body) as ProjectImageRegeneratePayload) : {}
    } catch {
      respondJson(res, 400, { error: 'Invalid JSON payload' })
      return
    }

    const storeId = payload.storeId
    const projectId = payload.projectId

    if (!storeId || !projectId) {
      respondJson(res, 400, { error: 'storeId and projectId are required' })
      return
    }

    const log = operationLogger('project_image_regenerate', { storeId, projectId })

    try {
      const coverImageUrl = await projectImageService.regenerateProjectImage(
        storeId,
        projectId,
        authResult.userId
      )
      log.info({ coverImageUrl }, 'Project image regenerated')
      respondJson(res, 200, { success: true, coverImageUrl })
    } catch (error) {
      log.error({ error }, 'Project image regeneration failed')
      respondJson(res, 500, {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate image',
      })
    }
  }
