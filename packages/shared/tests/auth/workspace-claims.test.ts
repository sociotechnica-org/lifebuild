import { describe, it, expect } from 'vitest'
import {
  buildWorkspaceClaims,
  getWorkspaceClaimsVersionKey,
  isWorkspaceClaimsPayloadWithinLimit,
  measureWorkspaceClaimsBytes,
  WORKSPACE_CLAIMS_MAX_BYTES,
} from '../../src/auth/workspace-claims.js'

describe('workspace claims helpers', () => {
  it('builds compact claims from instances', () => {
    const claims = buildWorkspaceClaims([
      {
        id: 'ws-1',
        name: 'Workspace A',
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        role: 'owner',
      },
      {
        id: 'ws-2',
        name: 'Workspace B',
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        role: undefined as any,
      },
    ])

    expect(claims).toEqual([
      { id: 'ws-1', role: 'owner' },
      { id: 'ws-2', role: 'member' },
    ])
  })

  it('calculates encoded byte sizes for claims', () => {
    const claims = buildWorkspaceClaims([
      {
        id: 'ws-123',
        name: 'Workspace',
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        role: 'admin',
      },
    ])

    const bytes = measureWorkspaceClaimsBytes(claims)
    expect(bytes).toBeGreaterThan(0)
  })

  it('reports payload limit status', () => {
    const claims = buildWorkspaceClaims([
      {
        id: 'ws-limited',
        name: 'Workspace',
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        role: 'member',
      },
    ])

    const status = isWorkspaceClaimsPayloadWithinLimit(claims, WORKSPACE_CLAIMS_MAX_BYTES)
    expect(status.withinLimit).toBe(true)
    expect(status.byteSize).toBeLessThan(WORKSPACE_CLAIMS_MAX_BYTES)
  })

  it('generates deterministic KV keys', () => {
    expect(getWorkspaceClaimsVersionKey('user-123')).toBe('workspace-claims-version:user-123')
  })
})
