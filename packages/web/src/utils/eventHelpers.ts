/**
 * Event helpers for automatically injecting metadata into events
 */

import { getCurrentUser } from './auth.js'
import { DEV_AUTH } from '@work-squared/shared/auth'

/**
 * Creates metadata for events based on current authenticated user
 */
export function createEventMetadata() {
  const user = getCurrentUser()
  return {
    userId: user?.id || DEV_AUTH.DEFAULT_USER_ID,
    timestamp: Date.now()
  }
}

/**
 * Wraps an event with metadata if not already present
 */
export function withMetadata<T extends { args: any }>(event: T): T {
  if (!event.args.metadata) {
    event.args.metadata = createEventMetadata()
  }
  return event
}