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

  // Check if user has admin flag or is bootstrap admin via environment
  const bootstrapAdminEmail = import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL

  return user.isAdmin === true || (bootstrapAdminEmail && user.email === bootstrapAdminEmail)
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
