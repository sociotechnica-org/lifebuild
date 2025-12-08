import type { JWTPayload, WorkspaceJWTClaim } from '@lifebuild/shared/auth'
import { measureWorkspaceClaimsBytes } from '@lifebuild/shared/auth'

export type WorkspaceClaimValidation =
  | { ok: true; claim: WorkspaceJWTClaim }
  | { ok: false; reason: 'missing_claims' | 'workspace_not_found' }

export function getWorkspaceClaimForInstance(
  payload: JWTPayload,
  instanceId: string
): WorkspaceClaimValidation {
  if (!Array.isArray(payload.workspaces) || payload.workspaces.length === 0) {
    return { ok: false, reason: 'missing_claims' }
  }

  const claim = payload.workspaces.find(entry => entry.id === instanceId)
  if (!claim) {
    return { ok: false, reason: 'workspace_not_found' }
  }

  return { ok: true, claim }
}

export function getWorkspaceClaimsByteSize(payload: JWTPayload): number {
  return measureWorkspaceClaimsBytes(payload.workspaces ?? [])
}
