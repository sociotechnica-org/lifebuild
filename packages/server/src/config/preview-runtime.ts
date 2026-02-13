export interface RenderPreviewOverrides {
  applied: boolean
  isPreview: boolean
  pullRequestNumber?: string
  authWorkerInternalUrl?: string
  liveStoreSyncUrl?: string
  serverBypassTokenOverridden?: boolean
  reason?: string
}

function normalizeBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true'
}

function isPositiveInteger(value: string | undefined): value is string {
  return typeof value === 'string' && /^[1-9][0-9]*$/.test(value)
}

function detectPrNumberFromValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const patterns = [
    /(?:^|[-_.])pr-(\d+)(?:$|[-_.])/i,
    /^pr-(\d+)$/i,
    /(?:^|\/)pull\/(\d+)(?:\/|$)/i,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[1] && isPositiveInteger(match[1])) {
      return match[1]
    }
  }

  return undefined
}

function detectRenderPullRequestNumber(env: NodeJS.ProcessEnv): string | undefined {
  if (isPositiveInteger(env.RENDER_PULL_REQUEST)) {
    return env.RENDER_PULL_REQUEST
  }

  if (isPositiveInteger(env.PREVIEW_PULL_REQUEST_NUMBER)) {
    return env.PREVIEW_PULL_REQUEST_NUMBER
  }

  const candidates = [
    env.RENDER_SERVICE_NAME,
    env.RENDER_EXTERNAL_HOSTNAME,
    env.RENDER_EXTERNAL_URL,
    env.RENDER_GIT_BRANCH,
  ]

  for (const candidate of candidates) {
    const parsed = detectPrNumberFromValue(candidate)
    if (parsed) {
      return parsed
    }
  }

  return undefined
}

function detectRenderPreviewEnvironment(env: NodeJS.ProcessEnv): boolean {
  // Render documents this variable for service previews.
  if (normalizeBoolean(env.IS_PULL_REQUEST_PREVIEW)) {
    return true
  }

  // Backward compatibility for older configs.
  if (normalizeBoolean(env.IS_PULL_REQUEST)) {
    return true
  }

  // Some environments expose PR number metadata without the boolean flag.
  if (
    isPositiveInteger(env.RENDER_PULL_REQUEST) ||
    isPositiveInteger(env.PREVIEW_PULL_REQUEST_NUMBER)
  ) {
    return true
  }

  // Final fallback: infer preview from Render metadata containing "pr-<number>".
  const metadataCandidates = [
    env.RENDER_SERVICE_NAME,
    env.RENDER_EXTERNAL_HOSTNAME,
    env.RENDER_EXTERNAL_URL,
    env.RENDER_GIT_BRANCH,
  ]

  return metadataCandidates.some(candidate => detectPrNumberFromValue(candidate) !== undefined)
}

function normalizeWorkerPrefix(prefix: string | undefined, fallback: string): string {
  if (!prefix || prefix.trim() === '') {
    return fallback
  }

  return prefix.trim().replace(/-+$/, '')
}

export function resolveRenderPreviewOverrides(
  env: NodeJS.ProcessEnv = process.env
): RenderPreviewOverrides {
  const isPreview = detectRenderPreviewEnvironment(env)
  if (!isPreview) {
    return {
      applied: false,
      isPreview: false,
      reason: 'Not a Render pull-request preview environment',
    }
  }

  const pullRequestNumber = detectRenderPullRequestNumber(env)
  if (!pullRequestNumber) {
    return {
      applied: false,
      isPreview: true,
      reason: 'Unable to determine preview pull request number from Render environment variables',
    }
  }

  const workersSubdomain = env.CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN ?? env.PREVIEW_WORKERS_SUBDOMAIN
  if (!workersSubdomain || workersSubdomain.trim() === '') {
    return {
      applied: false,
      isPreview: true,
      pullRequestNumber,
      reason: 'CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN is required for Render preview URL resolution',
    }
  }

  const authWorkerPrefix = normalizeWorkerPrefix(
    env.PREVIEW_AUTH_WORKER_PREFIX,
    'lifebuild-auth-pr'
  )
  const syncWorkerPrefix = normalizeWorkerPrefix(
    env.PREVIEW_SYNC_WORKER_PREFIX,
    'lifebuild-sync-pr'
  )

  const authWorkerName = `${authWorkerPrefix}-${pullRequestNumber}`
  const syncWorkerName = `${syncWorkerPrefix}-${pullRequestNumber}`
  const trimmedSubdomain = workersSubdomain.trim()

  return {
    applied: true,
    isPreview: true,
    pullRequestNumber,
    authWorkerInternalUrl: `https://${authWorkerName}.${trimmedSubdomain}.workers.dev`,
    liveStoreSyncUrl: `wss://${syncWorkerName}.${trimmedSubdomain}.workers.dev`,
  }
}

export function applyRenderPreviewOverrides(
  env: NodeJS.ProcessEnv = process.env
): RenderPreviewOverrides {
  const resolved = resolveRenderPreviewOverrides(env)
  if (resolved.isPreview) {
    // Preview server instances should never bootstrap production store IDs.
    env.STORE_IDS = ''

    // Never allow preview instances to inherit production endpoints or bypass tokens.
    delete env.AUTH_WORKER_INTERNAL_URL
    delete env.AUTH_WORKER_URL
    delete env.LIVESTORE_SYNC_URL
    delete env.SERVER_BYPASS_TOKEN

    const previewServerBypassToken = env.PREVIEW_SERVER_BYPASS_TOKEN?.trim()
    if (previewServerBypassToken) {
      env.SERVER_BYPASS_TOKEN = previewServerBypassToken
      resolved.serverBypassTokenOverridden = true
    }
  }

  if (!resolved.applied) {
    return resolved
  }

  env.AUTH_WORKER_INTERNAL_URL = resolved.authWorkerInternalUrl
  env.LIVESTORE_SYNC_URL = resolved.liveStoreSyncUrl

  return resolved
}
