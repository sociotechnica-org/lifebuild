import { User } from '../types.js'

/**
 * Check if a user is an admin based on bootstrap email or isAdmin flag
 * @param user - User object to check
 * @param bootstrapAdminEmail - Bootstrap admin email from environment
 * @returns true if user is an admin
 */
export function isUserAdmin(user: User, bootstrapAdminEmail?: string): boolean {
  // Check bootstrap admin email first
  if (bootstrapAdminEmail && user.email === bootstrapAdminEmail) {
    return true
  }
  
  // Check isAdmin flag
  return user.isAdmin === true
}

/**
 * Check if an email is the bootstrap admin
 * @param email - Email to check
 * @param bootstrapAdminEmail - Bootstrap admin email from environment
 * @returns true if email matches bootstrap admin
 */
export function isBootstrapAdmin(email: string, bootstrapAdminEmail?: string): boolean {
  return bootstrapAdminEmail ? email === bootstrapAdminEmail : false
}