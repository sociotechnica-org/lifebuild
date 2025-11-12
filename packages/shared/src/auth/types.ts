/**
 * Shared authentication types for Work Squared
 */

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type WorkspaceInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export interface WorkspaceJWTClaim {
  id: string
  role: WorkspaceRole
  rev?: number
  exp?: number
}

export interface AuthWorkspaceMember {
  userId: string
  email: string
  role: WorkspaceRole
  joinedAt: Date
}

export interface AuthWorkspaceInvitation {
  id: string
  workspaceId: string
  email: string
  role: WorkspaceRole
  invitedBy: string
  invitedByEmail: string
  workspaceName: string
  createdAt: Date
  expiresAt: Date
  status: WorkspaceInvitationStatus
  token?: string
}

export interface AuthWorkspaceSnapshot {
  workspaceId: string
  members: AuthWorkspaceMember[]
  invitations: AuthWorkspaceInvitation[]
}

export interface AuthInstance {
  id: string
  name: string
  createdAt: Date
  lastAccessedAt: Date
  role: WorkspaceRole
  isDefault?: boolean
}

export interface AuthUser {
  id: string
  email: string
  instances: AuthInstance[]
  isAdmin?: boolean
  workspaces?: Record<string, AuthWorkspaceSnapshot>
  pendingInvitations?: AuthWorkspaceInvitation[]
  defaultInstanceId?: string | null
  workspaceClaimsVersion?: number
}

export interface AuthWorkspaceSelection {
  instances: AuthInstance[]
  defaultInstanceId: string | null
  workspaces?: Record<string, AuthWorkspaceSnapshot>
  pendingInvitations?: AuthWorkspaceInvitation[]
  workspaceClaimsVersion?: number
}

export interface SyncPayload {
  instanceId: string
  authToken?: string
  [key: string]: any // Allow additional properties for LiveStore compatibility
}

export interface EventMetadata {
  userId: string
  timestamp: number
}

// Auth error codes for consistent handling
export enum AuthErrorCode {
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_MALFORMED = 'TOKEN_MALFORMED',
  TOKEN_VERSION_STALE = 'TOKEN_VERSION_STALE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  GRACE_PERIOD_EXPIRED = 'GRACE_PERIOD_EXPIRED',
  AUTH_SERVICE_ERROR = 'AUTH_SERVICE_ERROR',
  FORBIDDEN = 'FORBIDDEN',
}

export interface AuthError {
  code: AuthErrorCode
  message: string
  details?: any
}

// Connection states for sync
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export interface ConnectionInfo {
  state: ConnectionState
  userId?: string
  error?: AuthError
  lastConnected?: Date
}
