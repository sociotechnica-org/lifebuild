import { User, Instance } from '../types.js'
import { hashPassword, verifyPassword } from '../utils/crypto.js'

/**
 * UserStore Durable Object handles user data persistence and operations
 */
export class UserStore implements DurableObject {
  private storage: DurableObjectStorage

  constructor(state: DurableObjectState, env: Env) {
    this.storage = state.storage
  }

  /**
   * Handle HTTP requests to the UserStore
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    try {
      switch (path) {
        case '/create-user':
          return await this.handleCreateUser(request)
        case '/get-user-by-email':
          return await this.handleGetUserByEmail(request)
        case '/get-user-by-id':
          return await this.handleGetUserById(request)
        case '/verify-credentials':
          return await this.handleVerifyCredentials(request)
        case '/update-user':
          return await this.handleUpdateUser(request)
        case '/list-all-users':
          return await this.handleListAllUsers(request)
        default:
          return new Response('Not found', { status: 404 })
      }
    } catch (error) {
      console.error('UserStore error:', error)
      return new Response('Internal error', { status: 500 })
    }
  }

  /**
   * Create a new user
   */
  private async handleCreateUser(request: Request): Promise<Response> {
    const { email, password } = await request.json()

    // Check if user already exists
    const existingUser = await this.storage.get<User>(`user:${email}`)
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create new user
    const userId = crypto.randomUUID()
    const hashedPassword = await hashPassword(password)
    const now = new Date()

    // Create default instance
    const defaultInstance: Instance = {
      id: crypto.randomUUID(),
      name: 'Personal Workspace',
      createdAt: now,
      lastAccessedAt: now,
      isDefault: true,
    }

    const user: User = {
      id: userId,
      email,
      hashedPassword,
      createdAt: now,
      instances: [defaultInstance],
    }

    // Store user by email and by ID
    await this.storage.put(`user:${email}`, user)
    await this.storage.put(`user:id:${userId}`, user)

    // Return user without password
    const { hashedPassword: _, ...userResponse } = user
    return new Response(JSON.stringify({ user: userResponse }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Get user by email
   */
  private async handleGetUserByEmail(request: Request): Promise<Response> {
    const { email } = await request.json()
    const user = await this.storage.get<User>(`user:${email}`)

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { hashedPassword: _, ...userResponse } = user
    return new Response(JSON.stringify({ user: userResponse }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Get user by ID
   */
  private async handleGetUserById(request: Request): Promise<Response> {
    const { userId } = await request.json()
    const user = await this.storage.get<User>(`user:id:${userId}`)

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { hashedPassword: _, ...userResponse } = user
    return new Response(JSON.stringify({ user: userResponse }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Verify user credentials
   */
  private async handleVerifyCredentials(request: Request): Promise<Response> {
    const { email, password } = await request.json()
    const user = await this.storage.get<User>(`user:${email}`)

    if (!user) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const isValid = await verifyPassword(password, user.hashedPassword)

    if (isValid) {
      const { hashedPassword: _, ...userResponse } = user
      return new Response(JSON.stringify({ valid: true, user: userResponse }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  /**
   * Update user data
   */
  private async handleUpdateUser(request: Request): Promise<Response> {
    const { userId, updates } = await request.json()
    const user = await this.storage.get<User>(`user:id:${userId}`)

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update user data
    const updatedUser = { ...user, ...updates }

    // Store updated user by both email and ID
    await this.storage.put(`user:${user.email}`, updatedUser)
    await this.storage.put(`user:id:${userId}`, updatedUser)

    const { hashedPassword: _, ...userResponse } = updatedUser
    return new Response(JSON.stringify({ user: userResponse }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * List all users for admin purposes
   */
  private async handleListAllUsers(request: Request): Promise<Response> {
    // Get all user keys with the 'user:' prefix (but not 'user:id:' prefix)
    const userList = await this.storage.list({ prefix: 'user:' })
    const users: any[] = []

    for (const [key, user] of userList) {
      // Skip the 'user:id:' entries to avoid duplicates
      if (key.startsWith('user:id:')) continue

      const userData = user as User
      const { hashedPassword: _, ...userResponse } = userData

      // Format the response to match the API specification
      users.push({
        email: userResponse.email,
        createdAt: userResponse.createdAt,
        storeIds: userResponse.instances.map(instance => instance.id), // Map instances to storeIds
        instanceCount: userResponse.instances.length,
      })
    }

    return new Response(JSON.stringify({ users }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Environment interface for TypeScript
interface Env {
  USER_STORE: any
}

interface DurableObject {
  fetch(request: Request): Promise<Response>
}

interface DurableObjectState {
  storage: DurableObjectStorage
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>
  put(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<boolean>
  list(options?: { prefix?: string; limit?: number }): Promise<Map<string, unknown>>
}
