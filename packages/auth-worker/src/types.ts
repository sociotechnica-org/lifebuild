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
  isDefault?: boolean
}

export interface JWTPayload {
  userId: string
  email: string
  isAdmin?: boolean
  jti?: string  // JWT ID for uniqueness
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
  }
  accessToken?: string
  refreshToken?: string
  error?: {
    code: string
    message: string
  }
}

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
  WEAK_PASSWORD = 'WEAK_PASSWORD'
}