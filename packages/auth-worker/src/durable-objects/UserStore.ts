import { User, Instance } from '../types.js'
import { hashPassword, verifyPassword } from '../utils/crypto.js'

const DEFAULT_MAX_INSTANCES = 10
const DEFAULT_INSTANCE_NAME = 'Personal Workspace'

class DurableObjectError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'DurableObjectError'
    this.status = status
  }
}

/**
 * UserStore Durable Object handles user data persistence and operations
 */
export class UserStore implements DurableObject {
  private storage: DurableObjectStorage
  private maxInstances: number

  constructor(state: DurableObjectState, env: Env) {
    this.storage = state.storage
    const configuredMax = Number(env?.MAX_INSTANCES_PER_USER)
    this.maxInstances =
      Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : DEFAULT_MAX_INSTANCES
  }

  private async getUserByEmail(email: string): Promise<User | undefined> {
    return this.storage.get<User>(`user:${email}`)
  }

  private async getUserById(userId: string): Promise<User | undefined> {
    return this.storage.get<User>(`user:id:${userId}`)
  }

  private async requireUserById(userId: string): Promise<User> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new DurableObjectError('User not found', 404)
    }
    return structuredClone(user)
  }

  private async requireUserByEmail(email: string): Promise<User> {
    const user = await this.getUserByEmail(email)
    if (!user) {
      throw new DurableObjectError('User not found', 404)
    }
    return structuredClone(user)
  }

  private async saveUser(user: User): Promise<void> {
    await this.storage.put(`user:${user.email}`, user)
    await this.storage.put(`user:id:${user.id}`, user)
  }

  private getDefaultInstanceId(user: User): string | null {
    const defaultInstance = user.instances.find(instance => instance.isDefault)
    return defaultInstance?.id ?? user.instances[0]?.id ?? null
  }

  private buildWorkspacePayload(user: User) {
    return {
      instances: user.instances,
      defaultInstanceId: this.getDefaultInstanceId(user),
    }
  }

  private ensureInstanceLimit(user: User): void {
    if (user.instances.length >= this.maxInstances) {
      throw new DurableObjectError(`Instance limit reached (max ${this.maxInstances})`, 400)
    }
  }

  private normalizeName(name: string | undefined, fallback: string): string {
    const trimmed = (name ?? '').trim()
    const candidate = trimmed.length > 0 ? trimmed : fallback
    return candidate
  }

  private assertUniqueName(user: User, name: string, ignoreId?: string): void {
    const lowerName = name.toLowerCase()
    const conflict = user.instances.find(
      instance => instance.id !== ignoreId && instance.name.toLowerCase() === lowerName
    )
    if (conflict) {
      throw new DurableObjectError('Workspace name already in use', 400)
    }
  }

  private appendInstance(user: User, name?: string): Instance {
    this.ensureInstanceLimit(user)
    const fallbackName =
      name ??
      (user.instances.length === 0
        ? DEFAULT_INSTANCE_NAME
        : `Workspace ${user.instances.length + 1}`)
    const resolvedName = this.normalizeName(fallbackName, fallbackName)
    this.assertUniqueName(user, resolvedName)

    const now = new Date()
    const instance: Instance = {
      id: crypto.randomUUID(),
      name: resolvedName,
      createdAt: now,
      lastAccessedAt: now,
      isDefault: user.instances.length === 0 || user.instances.every(i => !i.isDefault),
    }

    if (instance.isDefault) {
      user.instances.forEach(existing => {
        existing.isDefault = false
      })
    }

    user.instances.push(instance)
    return instance
  }

  private renameInstance(user: User, instanceId: string, name: string): Instance {
    const target = user.instances.find(instance => instance.id === instanceId)
    if (!target) {
      throw new DurableObjectError('Instance not found', 404)
    }

    const resolvedName = this.normalizeName(name, target.name)
    this.assertUniqueName(user, resolvedName, target.id)
    target.name = resolvedName
    return target
  }

  private setDefaultInstance(user: User, instanceId: string): Instance {
    const target = user.instances.find(instance => instance.id === instanceId)
    if (!target) {
      throw new DurableObjectError('Instance not found', 404)
    }

    user.instances.forEach(instance => {
      instance.isDefault = instance.id === instanceId
    })

    target.lastAccessedAt = new Date()
    return target
  }

  private deleteInstance(user: User, instanceId: string): void {
    const index = user.instances.findIndex(instance => instance.id === instanceId)
    if (index === -1) {
      throw new DurableObjectError('Instance not found', 404)
    }

    if (user.instances[index].isDefault) {
      throw new DurableObjectError('Cannot remove default instance', 400)
    }

    if (user.instances.length <= 1) {
      throw new DurableObjectError('Cannot remove the last instance', 400)
    }

    user.instances.splice(index, 1)
  }

  private touchInstance(user: User, instanceId: string): Instance {
    const target = user.instances.find(instance => instance.id === instanceId)
    if (!target) {
      throw new DurableObjectError('Instance not found', 404)
    }
    target.lastAccessedAt = new Date()
    return target
  }

  private jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  private errorResponse(message: string, status = 400): Response {
    return this.jsonResponse({ error: message }, status)
  }

  private async handleListWorkspaces(request: Request): Promise<Response> {
    const { userId } = await request.json()
    if (!userId) {
      return this.errorResponse('userId is required', 400)
    }

    const user = await this.requireUserById(userId)
    return this.jsonResponse(this.buildWorkspacePayload(user))
  }

  private async handleCreateWorkspace(request: Request): Promise<Response> {
    const { userId, name } = await request.json()
    if (!userId) {
      return this.errorResponse('userId is required', 400)
    }

    const user = await this.requireUserById(userId)
    const instance = this.appendInstance(user, name)
    await this.saveUser(user)

    return this.jsonResponse(
      {
        instance,
        ...this.buildWorkspacePayload(user),
      },
      201
    )
  }

  private async handleRenameWorkspace(request: Request): Promise<Response> {
    const { userId, instanceId, name } = await request.json()
    if (!userId || !instanceId || typeof name !== 'string') {
      return this.errorResponse('userId, instanceId, and name are required', 400)
    }

    const user = await this.requireUserById(userId)
    const instance = this.renameInstance(user, instanceId, name)
    await this.saveUser(user)

    return this.jsonResponse({
      instance,
      ...this.buildWorkspacePayload(user),
    })
  }

  private async handleSetDefaultWorkspace(request: Request): Promise<Response> {
    const { userId, instanceId } = await request.json()
    if (!userId || !instanceId) {
      return this.errorResponse('userId and instanceId are required', 400)
    }

    const user = await this.requireUserById(userId)
    const instance = this.setDefaultInstance(user, instanceId)
    await this.saveUser(user)

    return this.jsonResponse({
      instance,
      ...this.buildWorkspacePayload(user),
    })
  }

  private async handleDeleteWorkspace(request: Request): Promise<Response> {
    const { userId, instanceId } = await request.json()
    if (!userId || !instanceId) {
      return this.errorResponse('userId and instanceId are required', 400)
    }

    const user = await this.requireUserById(userId)
    this.deleteInstance(user, instanceId)
    await this.saveUser(user)

    return this.jsonResponse(this.buildWorkspacePayload(user))
  }

  private async handleTouchWorkspace(request: Request): Promise<Response> {
    const { userId, instanceId } = await request.json()
    if (!userId || !instanceId) {
      return this.errorResponse('userId and instanceId are required', 400)
    }

    const user = await this.requireUserById(userId)
    const instance = this.touchInstance(user, instanceId)
    await this.saveUser(user)

    return this.jsonResponse({
      instance,
      ...this.buildWorkspacePayload(user),
    })
  }

  private async handleInternalInstances(request: Request): Promise<Response> {
    const { userId } = await request.json()
    if (!userId) {
      return this.errorResponse('userId is required', 400)
    }

    const user = await this.requireUserById(userId)
    return this.jsonResponse(this.buildWorkspacePayload(user))
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
        case '/update-user-store-ids':
          return await this.handleUpdateUserStoreIds(request)
        case '/update-user-admin-status':
          return await this.handleUpdateUserAdminStatus(request)
        case '/delete-user':
          return await this.handleDeleteUser(request)
        case '/workspaces/list':
          return await this.handleListWorkspaces(request)
        case '/workspaces/create':
          return await this.handleCreateWorkspace(request)
        case '/workspaces/rename':
          return await this.handleRenameWorkspace(request)
        case '/workspaces/set-default':
          return await this.handleSetDefaultWorkspace(request)
        case '/workspaces/delete':
          return await this.handleDeleteWorkspace(request)
        case '/workspaces/touch':
          return await this.handleTouchWorkspace(request)
        case '/internal/instances':
          return await this.handleInternalInstances(request)
        default:
          return this.errorResponse('Not found', 404)
      }
    } catch (error) {
      if (error instanceof DurableObjectError) {
        return this.errorResponse(error.message, error.status)
      }
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
    const existingUser = await this.getUserByEmail(email)
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
      name: DEFAULT_INSTANCE_NAME,
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
    await this.saveUser(user)

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
    const user = await this.getUserByEmail(email)

    if (!user) {
      return this.errorResponse('User not found', 404)
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
    const user = await this.getUserById(userId)

    if (!user) {
      return this.errorResponse('User not found', 404)
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
    const user = await this.getUserByEmail(email)

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
    const user = await this.getUserById(userId)

    if (!user) {
      return this.errorResponse('User not found', 404)
    }

    // Update user data
    const updatedUser = { ...user, ...updates }

    // Store updated user by both email and ID
    await this.saveUser(updatedUser)

    const { hashedPassword: _, ...userResponse } = updatedUser
    return new Response(JSON.stringify({ user: userResponse }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * List all users for admin purposes
   */
  private async handleListAllUsers(_request: Request): Promise<Response> {
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
        isAdmin: userResponse.isAdmin || false,
      })
    }

    return new Response(JSON.stringify({ users }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Update user storeIds (add/remove instances)
   */
  private async handleUpdateUserStoreIds(request: Request): Promise<Response> {
    const { email, action, storeId } = await request.json()

    if (!email || !action || !storeId || !['add', 'remove'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await this.storage.get<User>(`user:${email}`)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let updatedInstances = [...user.instances]

    if (action === 'add') {
      if (updatedInstances.length >= this.maxInstances) {
        return this.errorResponse(`Instance limit reached (max ${this.maxInstances})`, 400)
      }
      // Check if instance already exists
      if (updatedInstances.some(instance => instance.id === storeId)) {
        return new Response(JSON.stringify({ error: 'Instance already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Add new instance
      const newInstance: Instance = {
        id: storeId,
        name: `Instance ${updatedInstances.length + 1}`,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        isDefault: false,
      }
      updatedInstances.push(newInstance)
    } else if (action === 'remove') {
      // Check if this is the default instance
      const instanceToRemove = updatedInstances.find(instance => instance.id === storeId)
      if (instanceToRemove?.isDefault) {
        return new Response(JSON.stringify({ error: 'Cannot remove default instance' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Remove instance
      updatedInstances = updatedInstances.filter(instance => instance.id !== storeId)

      if (updatedInstances.length === 0) {
        return new Response(JSON.stringify({ error: 'Cannot remove all instances' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Update user
    const updatedUser: User = { ...user, instances: updatedInstances }

    // Store updated user by both email and ID
    await this.saveUser(updatedUser)

    const { hashedPassword: _, ...userResponse } = updatedUser
    return new Response(
      JSON.stringify({
        success: true,
        user: userResponse,
        message: `Instance ${action === 'add' ? 'added' : 'removed'} successfully`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  /**
   * Update user admin status
   */
  private async handleUpdateUserAdminStatus(request: Request): Promise<Response> {
    const { email, isAdmin } = await request.json()

    if (!email || typeof isAdmin !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await this.getUserByEmail(email)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update user admin status
    const updatedUser: User = { ...user, isAdmin }

    // Store updated user by both email and ID
    await this.saveUser(updatedUser)

    const { hashedPassword: _, ...userResponse } = updatedUser
    return new Response(
      JSON.stringify({
        success: true,
        user: userResponse,
        message: `Admin status ${isAdmin ? 'granted' : 'revoked'} successfully`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  /**
   * Delete a user (but preserve their instances)
   */
  private async handleDeleteUser(request: Request): Promise<Response> {
    const { email } = await request.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await this.storage.get<User>(`user:${email}`)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Delete user records (but not their instances - they remain accessible to other users)
    await this.storage.delete(`user:${email}`)
    await this.storage.delete(`user:id:${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User deleted successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Environment interface for TypeScript
interface Env {
  USER_STORE: any
  MAX_INSTANCES_PER_USER?: string | number
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
