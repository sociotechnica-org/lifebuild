import { describe, it, expect } from 'vitest'
import type { JWTPayload } from '@lifebuild/shared/auth'
import {
  getWorkspaceClaimForInstance,
  getWorkspaceClaimsByteSize,
} from '../src/auth/workspace-claims.js'

function makePayload(overrides: Partial<JWTPayload> = {}): JWTPayload {
  return {
    userId: 'user-1',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600,
    iss: 'work-squared-auth',
    workspaces: [],
    workspaceClaimsVersion: 1,
    workspaceClaimsIssuedAt: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

describe('workspace claim helpers', () => {
  it('returns claim when instance is present', () => {
    const payload = makePayload({
      workspaces: [
        { id: 'ws-1', role: 'owner' },
        { id: 'ws-2', role: 'member' },
      ],
    })

    const result = getWorkspaceClaimForInstance(payload, 'ws-2')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.claim.role).toBe('member')
    }
  })

  it('returns missing_claims when claim array absent', () => {
    const payload = makePayload({ workspaces: undefined })
    const result = getWorkspaceClaimForInstance(payload, 'ws-1')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('missing_claims')
    }
  })

  it('returns workspace_not_found when claim missing', () => {
    const payload = makePayload({
      workspaces: [{ id: 'ws-1', role: 'owner' }],
    })
    const result = getWorkspaceClaimForInstance(payload, 'ws-3')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('workspace_not_found')
    }
  })

  it('estimates claims byte size', () => {
    const payload = makePayload({
      workspaces: [
        { id: 'ws-1', role: 'owner' },
        { id: 'ws-2', role: 'member' },
      ],
    })
    const size = getWorkspaceClaimsByteSize(payload)
    expect(size).toBeGreaterThan(0)
  })
})
