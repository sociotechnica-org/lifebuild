/**
 * Authentication configuration constants
 */

// Grace period for expired tokens (24 hours in seconds)
export const DEFAULT_GRACE_PERIOD_SECONDS = 24 * 60 * 60 // 24 hours

// Token storage keys
export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'work-squared-access-token',
  REFRESH_TOKEN: 'work-squared-refresh-token',
  USER_INFO: 'work-squared-user-info',
} as const

// Auth service endpoints
export const AUTH_ENDPOINTS = {
  SIGNUP: '/signup',
  LOGIN: '/login',
  REFRESH: '/refresh',
  LOGOUT: '/logout',
  HEALTH: '/health',
} as const

// Development auth settings
export const DEV_AUTH = {
  // Default user ID for development mode when auth is disabled
  DEFAULT_USER_ID: 'dev-user-001',
  // Insecure token for development (legacy)
  INSECURE_TOKEN: 'insecure-token-change-me',
} as const

// Environment variable names
export const ENV_VARS = {
  // Whether authentication is required (production should be 'true')
  REQUIRE_AUTH: 'REQUIRE_AUTH',
  // Auth service URL for token verification
  AUTH_SERVICE_URL: 'AUTH_SERVICE_URL',
  // JWT secret for token verification
  JWT_SECRET: 'JWT_SECRET',
  // Grace period override in seconds
  GRACE_PERIOD_SECONDS: 'GRACE_PERIOD_SECONDS',
  // Environment mode
  ENVIRONMENT: 'ENVIRONMENT',
  // Server bypass token for internal connections
  SERVER_BYPASS_TOKEN: 'SERVER_BYPASS_TOKEN',
} as const
