import type { AuthInstance, WorkspaceJWTClaim, WorkspaceRole } from './types.js'

export const WORKSPACE_CLAIMS_VERSION_KEY_PREFIX = 'workspace-claims-version:'
export const WORKSPACE_CLAIMS_MAX_BYTES = 4096

/**
 * Build compact workspace claims that can be embedded inside JWT payloads.
 */
export function buildWorkspaceClaims(instances: AuthInstance[] = []): WorkspaceJWTClaim[] {
  return instances
    .filter(instance => typeof instance?.id === 'string')
    .map(instance => ({
      id: instance.id,
      role: normalizeRole(instance.role),
    }))
}

function normalizeRole(role?: WorkspaceRole): WorkspaceRole {
  if (role === 'owner' || role === 'admin' || role === 'member') {
    return role
  }
  return 'member'
}

/**
 * Approximate the encoded byte size of the workspace claims payload.
 */
export function measureWorkspaceClaimsBytes(claims: WorkspaceJWTClaim[]): number {
  if (claims.length === 0) {
    return 2 // JSON for [] is 2 bytes
  }
  const encoder = new TextEncoder()
  return encoder.encode(JSON.stringify(claims)).length
}

export function isWorkspaceClaimsPayloadWithinLimit(
  claims: WorkspaceJWTClaim[],
  maxBytes = WORKSPACE_CLAIMS_MAX_BYTES
): { byteSize: number; withinLimit: boolean } {
  const byteSize = measureWorkspaceClaimsBytes(claims)
  return {
    byteSize,
    withinLimit: byteSize <= maxBytes,
  }
}

export function getWorkspaceClaimsVersionKey(userId: string): string {
  return `${WORKSPACE_CLAIMS_VERSION_KEY_PREFIX}${userId}`
}
