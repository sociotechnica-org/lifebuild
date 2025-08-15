/**
 * Admin utilities for frontend
 */

import React from 'react'
import { AuthUser } from '@work-squared/shared/auth'

/**
 * Check if the current user is an admin
 */
export function isCurrentUserAdmin(user: AuthUser | null): boolean {
  if (!user) return false

  // Admin status is already computed and included in the JWT token by the auth service
  return user.isAdmin === true
}

/**
 * Higher-order component for admin-only routes
 */
export function requireAdmin<P extends object>(Component: React.ComponentType<P>) {
  return function AdminProtectedComponent(props: P) {
    const user = null // TODO: Get from auth context

    if (!isCurrentUserAdmin(user)) {
      return <div className='p-6 text-red-600'>Access denied. Admin privileges required.</div>
    }

    return <Component {...props} />
  }
}
