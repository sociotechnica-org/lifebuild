import React from 'react'

interface UserInitializerProps {
  children: React.ReactNode
}

// Simplified UserInitializer - no longer creates default users
// Auth users are synced via AuthUserSync, AI workers don't need user entries
export const UserInitializer: React.FC<UserInitializerProps> = ({ children }) => {
  // This component is kept for backwards compatibility but no longer creates default users
  // User creation is now handled by:
  // 1. AuthUserSync - syncs authenticated users from auth server
  // 2. Manual user creation in admin interface
  return <>{children}</>
}

// Export function to reset global state (for testing)
export const resetUserInitializationState = () => {
  // No longer needed but kept for test compatibility
}
