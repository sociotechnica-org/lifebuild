/**
 * Shared authentication types for Work Squared
 */

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  email: string
  instances: AuthInstance[]
  isAdmin?: boolean
}

export interface AuthInstance {
  id: string
  name: string
  createdAt: Date
  lastAccessedAt: Date
  isDefault?: boolean
}

export interface SyncPayload {
  instanceId: string
  authToken?: string
  [key: string]: any  // Allow additional properties for LiveStore compatibility
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
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  GRACE_PERIOD_EXPIRED = 'GRACE_PERIOD_EXPIRED',
  AUTH_SERVICE_ERROR = 'AUTH_SERVICE_ERROR',
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