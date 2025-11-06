export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type WorkspaceInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export interface User {
  id: string
  email: string
  hashedPassword: string
  createdAt: Date
  instances: Instance[]
  isAdmin?: boolean
}

export interface Instance {
  id: string
  name: string
  createdAt: Date
  lastAccessedAt: Date
  role: WorkspaceRole
  isDefault?: boolean
}

export interface JWTPayload {
  userId: string
  email: string
  isAdmin?: boolean
  jti?: string // JWT ID for uniqueness
  iat: number
  exp: number
  iss: string
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat: number
  exp: number
  iss: string
}

export interface AuthResponse {
  success: boolean
  user?: {
    id: string
    email: string
    instances: Instance[]
    isAdmin: boolean
    defaultInstanceId?: string | null
    workspaces?: Record<
      string,
      {
        workspaceId: string
        members: WorkspaceMember[]
        invitations: WorkspaceInvitationSummary[]
      }
    >
    pendingInvitations?: WorkspaceInvitation[]
  }
  accessToken?: string
  refreshToken?: string
  error?: {
    code: string
    message: string
  }
}

export interface WorkspaceMember {
  userId: string
  email: string
  role: WorkspaceRole
  joinedAt: Date
}

export interface WorkspaceInvitation {
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
  token: string
}

export type WorkspaceInvitationSummary = Omit<WorkspaceInvitation, 'token'>

export interface SignupRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken: string
}

export enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  FORBIDDEN = 'FORBIDDEN',
}
