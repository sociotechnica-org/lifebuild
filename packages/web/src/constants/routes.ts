/**
 * Centralized route definitions for the application
 * This helps maintain consistency and makes refactoring easier
 */
export const ROUTES = {
  HOME: '/',
  // App routes
  LIFE_MAP: '/life-map',
  SORTING_ROOM: '/sorting-room',
  SORTING_ROOM_STREAM: '/sorting-room/:stream',
  PROJECTS: '/projects',
  PROJECT: '/projects/:projectId',
  // Auth and admin routes (unchanged)
  ADMIN: '/admin',
  ADMIN_USER: '/admin/users/:userEmail',
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const

/**
 * Route generators for dynamic routes
 */
export const generateRoute = {
  // App routes
  lifeMap: () => '/life-map',
  sortingRoom: (stream?: 'gold' | 'silver' | 'bronze') =>
    stream ? `/sorting-room/${stream}` : '/sorting-room',
  project: (id: string) => `/projects/${id}`,
  // Admin routes
  adminUser: (userEmail: string) => `/admin/users/${encodeURIComponent(userEmail)}`,
} as const

/**
 * Route patterns for matching
 */
export const ROUTE_PATTERNS = {
  PROJECT: '/projects/',
} as const
