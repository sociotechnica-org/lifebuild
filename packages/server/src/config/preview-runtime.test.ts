import { describe, expect, it } from 'vitest'
import { applyRenderPreviewOverrides, resolveRenderPreviewOverrides } from './preview-runtime.js'

describe('preview runtime overrides', () => {
  it('does not apply outside Render preview environments', () => {
    const env: NodeJS.ProcessEnv = {}

    const result = resolveRenderPreviewOverrides(env)

    expect(result.applied).toBe(false)
    expect(result.isPreview).toBe(false)
  })

  it('applies overrides when Render preview env and explicit PR number are provided', () => {
    const env: NodeJS.ProcessEnv = {
      IS_PULL_REQUEST: 'true',
      RENDER_PULL_REQUEST: '536',
      CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN: 'exampleteam',
      STORE_IDS: 'production-store-id',
    }

    const result = applyRenderPreviewOverrides(env)

    expect(result.applied).toBe(true)
    expect(result.pullRequestNumber).toBe('536')
    expect(result.authWorkerInternalUrl).toBe(
      'https://lifebuild-auth-pr-536.exampleteam.workers.dev'
    )
    expect(result.liveStoreSyncUrl).toBe('wss://lifebuild-sync-pr-536.exampleteam.workers.dev')
    expect(env.AUTH_WORKER_INTERNAL_URL).toBe(
      'https://lifebuild-auth-pr-536.exampleteam.workers.dev'
    )
    expect(env.LIVESTORE_SYNC_URL).toBe('wss://lifebuild-sync-pr-536.exampleteam.workers.dev')
    expect(env.STORE_IDS).toBe('')
  })

  it('extracts PR number from Render service name when explicit PR var is unavailable', () => {
    const env: NodeJS.ProcessEnv = {
      IS_PULL_REQUEST: 'true',
      RENDER_SERVICE_NAME: 'lifebuild-server-pr-712',
      CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN: 'exampleteam',
    }

    const result = resolveRenderPreviewOverrides(env)

    expect(result.applied).toBe(true)
    expect(result.pullRequestNumber).toBe('712')
    expect(result.liveStoreSyncUrl).toBe('wss://lifebuild-sync-pr-712.exampleteam.workers.dev')
  })

  it('supports custom worker prefixes', () => {
    const env: NodeJS.ProcessEnv = {
      IS_PULL_REQUEST: 'true',
      RENDER_PULL_REQUEST: '9',
      CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN: 'exampleteam',
      PREVIEW_AUTH_WORKER_PREFIX: 'custom-auth',
      PREVIEW_SYNC_WORKER_PREFIX: 'custom-sync',
    }

    const result = applyRenderPreviewOverrides(env)

    expect(result.applied).toBe(true)
    expect(result.authWorkerInternalUrl).toBe('https://custom-auth-9.exampleteam.workers.dev')
    expect(result.liveStoreSyncUrl).toBe('wss://custom-sync-9.exampleteam.workers.dev')
    expect(env.STORE_IDS).toBe('')
  })

  it('does not apply when workers subdomain is missing', () => {
    const env: NodeJS.ProcessEnv = {
      IS_PULL_REQUEST: 'true',
      RENDER_PULL_REQUEST: '536',
    }

    const result = resolveRenderPreviewOverrides(env)

    expect(result.applied).toBe(false)
    expect(result.isPreview).toBe(true)
    expect(result.reason).toContain('CLOUDFLARE_PREVIEW_WORKERS_SUBDOMAIN')
  })
})
