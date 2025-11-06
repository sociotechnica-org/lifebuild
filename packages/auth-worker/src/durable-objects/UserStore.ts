import {
  User,
  Instance,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceInvitationSummary,
  WorkspaceRole,
  WorkspaceInvitationStatus,
} from '../types.js'
import { hashPassword, verifyPassword } from '../utils/crypto.js'

const DEFAULT_MAX_INSTANCES = 10
const DEFAULT_INSTANCE_NAME = 'Personal Workspace'
const INVITATION_EXPIRATION_DAYS = 7
const INVITATION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const INVITATION_RATE_LIMIT_MAX = 10
const WORKSPACE_AUDIT_LOG_MAX_ENTRIES = 100

type InvitationIndexEntry = {
  workspaceId: string
  invitationId: string
}

interface InviteRateLimitState {
  count: number
  windowExpiresAt: number
}

interface WorkspaceAuditEntry {
  id: string
  workspaceId: string
  actorUserId: string
  action: string
  targetUserId?: string
  targetEmail?: string
  details?: Record<string, unknown>
  timestamp: string
}

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

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value)
  }

  private workspaceMembersKey(workspaceId: string): string {
    return `workspace:members:${workspaceId}`
  }

  private workspaceInvitationsKey(workspaceId: string): string {
    return `workspace:invitations:${workspaceId}`
  }

  private invitationIndexKey(email: string): string {
    return `invitation:index:${email.toLowerCase()}`
  }

  private invitationTokenKey(token: string): string {
    return `invitation:token:${token}`
  }

  private inviteRateLimitKey(userId: string): string {
    return `invite:ratelimit:${userId}`
  }

  private workspaceAuditLogKey(workspaceId: string): string {
    return `workspace:audit:${workspaceId}`
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

  private normalizeMember(member: WorkspaceMember): WorkspaceMember {
    return {
      ...member,
      joinedAt: this.toDate(member.joinedAt),
    }
  }

  private normalizeInvitation(invitation: WorkspaceInvitation): WorkspaceInvitation {
    return {
      ...invitation,
      createdAt: this.toDate(invitation.createdAt),
      expiresAt: this.toDate(invitation.expiresAt),
    }
  }

  private async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const key = this.workspaceMembersKey(workspaceId)
    const stored = await this.storage.get<WorkspaceMember[]>(key)
    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map(member => this.normalizeMember(member))
    }
    const rebuilt = await this.rebuildWorkspaceMembers(workspaceId)
    await this.storage.put(key, rebuilt)
    return rebuilt
  }

  private async rebuildWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const members: WorkspaceMember[] = []
    const userList = await this.storage.list({ prefix: 'user:' })
    for (const [key, value] of userList) {
      if (key.startsWith('user:id:')) {
        continue
      }
      const user = value as User | undefined
      if (!user) {
        continue
      }
      const instance = user.instances.find(inst => inst.id === workspaceId)
      if (!instance) {
        continue
      }
      members.push(
        this.normalizeMember({
          userId: user.id,
          email: user.email,
          role: instance.role ?? 'owner',
          joinedAt: instance.createdAt,
        })
      )
    }
    return members
  }

  private async saveWorkspaceMembers(
    workspaceId: string,
    members: WorkspaceMember[]
  ): Promise<void> {
    await this.storage.put(
      this.workspaceMembersKey(workspaceId),
      members.map(member => ({
        ...member,
        joinedAt: this.toDate(member.joinedAt),
      }))
    )
  }

  private async upsertWorkspaceMember(
    workspaceId: string,
    member: WorkspaceMember
  ): Promise<WorkspaceMember[]> {
    const members = await this.getWorkspaceMembers(workspaceId)
    const existingIndex = members.findIndex(existing => existing.userId === member.userId)
    if (existingIndex >= 0) {
      members[existingIndex] = this.normalizeMember(member)
    } else {
      members.push(this.normalizeMember(member))
    }
    await this.saveWorkspaceMembers(workspaceId, members)
    return members
  }

  private async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    const members = await this.getWorkspaceMembers(workspaceId)
    const filtered = members.filter(member => member.userId !== userId)
    await this.saveWorkspaceMembers(workspaceId, filtered)
  }

  private async getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    const stored = await this.storage.get<WorkspaceInvitation[]>(
      this.workspaceInvitationsKey(workspaceId)
    )
    if (!Array.isArray(stored)) {
      return []
    }
    const filtered = stored
      .map(invite => this.normalizeInvitation(invite))
      .map(invite => this.ensureInvitationStatus(invite))
      .filter(invite => invite.status === 'pending' || invite.status === 'accepted')
    await this.saveWorkspaceInvitations(workspaceId, filtered)
    return filtered
  }

  private ensureInvitationStatus(invitation: WorkspaceInvitation): WorkspaceInvitation {
    if (invitation.status !== 'pending') {
      return invitation
    }
    const now = new Date()
    if (invitation.expiresAt.getTime() < now.getTime()) {
      return { ...invitation, status: 'expired' }
    }
    return invitation
  }

  private async saveWorkspaceInvitations(
    workspaceId: string,
    invitations: WorkspaceInvitation[]
  ): Promise<void> {
    await this.storage.put(
      this.workspaceInvitationsKey(workspaceId),
      invitations.map(invite => ({
        ...invite,
        createdAt: this.toDate(invite.createdAt),
        expiresAt: this.toDate(invite.expiresAt),
      }))
    )
  }

  private async indexInvitation(invitation: WorkspaceInvitation): Promise<void> {
    const emailKey = this.invitationIndexKey(invitation.email)
    const tokenKey = this.invitationTokenKey(invitation.token)
    const existingIndex = (await this.storage.get<InvitationIndexEntry[]>(emailKey)) ?? []
    existingIndex.push({ workspaceId: invitation.workspaceId, invitationId: invitation.id })
    await this.storage.put(emailKey, existingIndex)
    await this.storage.put(tokenKey, {
      workspaceId: invitation.workspaceId,
      invitationId: invitation.id,
      email: invitation.email,
    })
  }

  private async unindexInvitation(invitation: WorkspaceInvitation): Promise<void> {
    const emailKey = this.invitationIndexKey(invitation.email)
    const tokenKey = this.invitationTokenKey(invitation.token)
    const existingIndex = (await this.storage.get<InvitationIndexEntry[]>(emailKey)) ?? []
    const filtered = existingIndex.filter(
      entry =>
        !(entry.workspaceId === invitation.workspaceId && entry.invitationId === invitation.id)
    )
    await this.storage.put(emailKey, filtered)
    await this.storage.delete(tokenKey)
  }

  private async getInvitationByToken(
    token: string
  ): Promise<{ workspaceId: string; invitation: WorkspaceInvitation } | null> {
    const tokenKey = this.invitationTokenKey(token)
    const tokenRecord = await this.storage.get<{
      workspaceId: string
      invitationId: string
      email: string
    }>(tokenKey)
    if (!tokenRecord) {
      return null
    }
    const invitations = await this.getWorkspaceInvitations(tokenRecord.workspaceId)
    const invitation = invitations.find(inv => inv.id === tokenRecord.invitationId)
    if (!invitation) {
      return null
    }
    return { workspaceId: tokenRecord.workspaceId, invitation }
  }

  private async getPendingInvitationsForEmail(email: string): Promise<WorkspaceInvitation[]> {
    const emailKey = this.invitationIndexKey(email)
    const entries = (await this.storage.get<InvitationIndexEntry[]>(emailKey)) ?? []
    const invitations: WorkspaceInvitation[] = []
    for (const entry of entries) {
      const workspaceInvites = await this.getWorkspaceInvitations(entry.workspaceId)
      const invitation = workspaceInvites.find(inv => inv.id === entry.invitationId)
      if (invitation && invitation.status === 'pending') {
        invitations.push(invitation)
      }
    }
    return invitations
  }

  private async logWorkspaceEvent(entry: WorkspaceAuditEntry): Promise<void> {
    const key = this.workspaceAuditLogKey(entry.workspaceId)
    const existing = (await this.storage.get<WorkspaceAuditEntry[]>(key)) ?? []
    const updated = [...existing, entry].slice(-WORKSPACE_AUDIT_LOG_MAX_ENTRIES)
    await this.storage.put(key, updated)
  }

  private async checkInviteRateLimit(userId: string): Promise<void> {
    const key = this.inviteRateLimitKey(userId)
    const now = Date.now()
    const state = (await this.storage.get<InviteRateLimitState>(key)) ?? {
      count: 0,
      windowExpiresAt: now + INVITATION_RATE_LIMIT_WINDOW_MS,
    }

    if (now > state.windowExpiresAt) {
      state.count = 0
      state.windowExpiresAt = now + INVITATION_RATE_LIMIT_WINDOW_MS
    }

    if (state.count >= INVITATION_RATE_LIMIT_MAX) {
      throw new DurableObjectError('Invitation rate limit exceeded', 429)
    }

    state.count += 1
    await this.storage.put(key, state)
  }

  private async forEachWorkspaceMember(
    workspaceId: string,
    callback: (user: User, instanceIndex: number) => Promise<void> | void
  ): Promise<void> {
    const members = await this.getWorkspaceMembers(workspaceId)
    for (const member of members) {
      const user = await this.getUserById(member.userId)
      if (!user) {
        continue
      }
      const instanceIndex = user.instances.findIndex(instance => instance.id === workspaceId)
      if (instanceIndex === -1) {
        continue
      }
      const cloned = structuredClone(user)
      await callback(cloned, instanceIndex)
      await this.saveUser(cloned)
    }
  }

  private async getWorkspaceInstanceTemplate(workspaceId: string): Promise<Instance | null> {
    const members = await this.getWorkspaceMembers(workspaceId)
    for (const member of members) {
      const user = await this.getUserById(member.userId)
      if (!user) {
        continue
      }
      const instance = user.instances.find(inst => inst.id === workspaceId)
      if (instance) {
        return structuredClone(instance)
      }
    }
    return null
  }

  private async addWorkspaceToUser(
    user: User,
    workspaceId: string,
    role: WorkspaceRole
  ): Promise<Instance> {
    const existing = user.instances.find(instance => instance.id === workspaceId)
    if (existing) {
      existing.role = role
      await this.saveUser(user)
      return existing
    }

    const template = await this.getWorkspaceInstanceTemplate(workspaceId)
    const now = new Date()
    const instance: Instance = {
      id: workspaceId,
      name: template?.name ?? 'Shared Workspace',
      createdAt: template ? this.toDate(template.createdAt) : now,
      lastAccessedAt: template ? this.toDate(template.lastAccessedAt) : now,
      role,
      isDefault: user.instances.length === 0,
    }

    if (instance.isDefault) {
      user.instances.forEach(existingInstance => {
        existingInstance.isDefault = false
      })
    }

    user.instances.push(instance)
    await this.saveUser(user)
    return instance
  }

  private async countWorkspaceOwners(workspaceId: string): Promise<number> {
    const members = await this.getWorkspaceMembers(workspaceId)
    return members.filter(member => member.role === 'owner').length
  }
  private async ensureInstanceRoles(user: User): Promise<User> {
    let mutated = false
    const updatedInstances = user.instances.map(instance => {
      if (instance.role) {
        return instance
      }
      mutated = true
      return { ...instance, role: 'owner' as WorkspaceRole }
    })

    if (mutated) {
      user.instances = updatedInstances
      await this.saveUser(user)
    }

    return user
  }

  private getDefaultInstanceId(user: User): string | null {
    const defaultInstance = user.instances.find(instance => instance.isDefault)
    return defaultInstance?.id ?? user.instances[0]?.id ?? null
  }

  private async buildWorkspacePayload(user: User) {
    const normalizedUser = await this.ensureInstanceRoles(user)
    const workspaces: Record<
      string,
      {
        workspaceId: string
        members: WorkspaceMember[]
        invitations: WorkspaceInvitationSummary[]
      }
    > = {}

    for (const instance of normalizedUser.instances) {
      const members = await this.getWorkspaceMembers(instance.id)
      const invitations = await this.getWorkspaceInvitations(instance.id)
      const invitationSummaries: WorkspaceInvitationSummary[] = invitations.map(
        ({ token: _token, ...rest }) => ({
          ...rest,
        })
      )
      workspaces[instance.id] = {
        workspaceId: instance.id,
        members,
        invitations: invitationSummaries,
      }
    }

    const pendingInvitations = await this.getPendingInvitationsForEmail(normalizedUser.email)

    return {
      instances: normalizedUser.instances,
      defaultInstanceId: this.getDefaultInstanceId(normalizedUser),
      workspaces,
      pendingInvitations,
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

  private ensureUserHasRole(user: User, instanceId: string, allowedRoles: WorkspaceRole[]): void {
    const instance = user.instances.find(inst => inst.id === instanceId)
    if (!instance) {
      throw new DurableObjectError('Instance not found', 404)
    }
    const role = instance.role ?? 'member'
    if (!allowedRoles.includes(role)) {
      throw new DurableObjectError('Forbidden', 403)
    }
  }

  private isValidRole(role: string): role is WorkspaceRole {
    return role === 'owner' || role === 'admin' || role === 'member'
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
      role: 'owner',
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
    return this.jsonResponse(await this.buildWorkspacePayload(user))
  }

  private async handleCreateWorkspace(request: Request): Promise<Response> {
    const { userId, name } = await request.json()
    if (!userId) {
      return this.errorResponse('userId is required', 400)
    }

    const user = await this.requireUserById(userId)
    const instance = this.appendInstance(user, name)
    await this.saveUser(user)
    await this.saveWorkspaceInvitations(instance.id, [])
    await this.upsertWorkspaceMember(instance.id, {
      userId: user.id,
      email: user.email,
      role: 'owner',
      joinedAt: instance.createdAt,
    })
    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: instance.id,
      actorUserId: user.id,
      action: 'workspace.created',
      targetUserId: user.id,
      targetEmail: user.email,
      timestamp: new Date().toISOString(),
    })
    const workspacePayload = await this.buildWorkspacePayload(user)

    return this.jsonResponse(
      {
        instance,
        ...workspacePayload,
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
    await this.forEachWorkspaceMember(instanceId, async (memberUser, index) => {
      memberUser.instances[index].name = instance.name
    })
    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: instanceId,
      actorUserId: user.id,
      action: 'workspace.renamed',
      targetEmail: undefined,
      timestamp: new Date().toISOString(),
      details: { name: instance.name },
    })
    const workspacePayload = await this.buildWorkspacePayload(user)

    return this.jsonResponse({
      instance,
      ...workspacePayload,
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
    const workspacePayload = await this.buildWorkspacePayload(user)

    return this.jsonResponse({
      instance,
      ...workspacePayload,
    })
  }

  private async handleDeleteWorkspace(request: Request): Promise<Response> {
    const { userId, instanceId } = await request.json()
    if (!userId || !instanceId) {
      return this.errorResponse('userId and instanceId are required', 400)
    }

    const user = await this.requireUserById(userId)
    this.ensureUserHasRole(user, instanceId, ['owner'])

    const members = await this.getWorkspaceMembers(instanceId)
    const invitations = await this.getWorkspaceInvitations(instanceId)

    for (const member of members) {
      if (member.userId === user.id) {
        continue
      }
      const memberUser = await this.requireUserById(member.userId)
      const remainingInstances = memberUser.instances.filter(inst => inst.id !== instanceId)
      if (remainingInstances.length === 0) {
        throw new DurableObjectError(
          `Cannot delete workspace; member ${member.email} would have no remaining workspaces`,
          400
        )
      }
    }

    this.deleteInstance(user, instanceId)
    await this.saveUser(user)

    for (const member of members) {
      if (member.userId === user.id) {
        continue
      }
      const memberUser = await this.requireUserById(member.userId)
      memberUser.instances = memberUser.instances.filter(inst => inst.id !== instanceId)
      await this.saveUser(memberUser)
    }

    for (const invitation of invitations) {
      await this.unindexInvitation(invitation)
    }

    await this.storage.delete(this.workspaceMembersKey(instanceId))
    await this.storage.delete(this.workspaceInvitationsKey(instanceId))
    await this.storage.delete(this.workspaceAuditLogKey(instanceId))

    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: instanceId,
      actorUserId: user.id,
      action: 'workspace.deleted',
      timestamp: new Date().toISOString(),
    })

    const workspacePayload = await this.buildWorkspacePayload(user)
    return this.jsonResponse(workspacePayload)
  }

  private async handleTouchWorkspace(request: Request): Promise<Response> {
    const { userId, instanceId } = await request.json()
    if (!userId || !instanceId) {
      return this.errorResponse('userId and instanceId are required', 400)
    }

    const user = await this.requireUserById(userId)
    const instance = this.touchInstance(user, instanceId)
    await this.saveUser(user)
    const workspacePayload = await this.buildWorkspacePayload(user)

    return this.jsonResponse({
      instance,
      ...workspacePayload,
    })
  }

  private async handleInviteWorkspaceMember(request: Request): Promise<Response> {
    const { userId, instanceId, email, role } = await request.json()

    if (!userId || !instanceId || typeof email !== 'string') {
      return this.errorResponse('userId, instanceId, and email are required', 400)
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      return this.errorResponse('Valid email is required', 400)
    }

    const requestedRole = typeof role === 'string' ? role.toLowerCase() : 'member'
    if (!this.isValidRole(requestedRole)) {
      return this.errorResponse('Invalid role', 400)
    }

    const user = await this.requireUserById(userId)
    this.ensureUserHasRole(user, instanceId, ['owner'])

    const workspaceInstance = user.instances.find(instance => instance.id === instanceId)
    if (!workspaceInstance) {
      throw new DurableObjectError('Workspace not found', 404)
    }

    if (user.email.toLowerCase() === normalizedEmail) {
      return this.errorResponse('Cannot invite yourself', 400)
    }

    await this.checkInviteRateLimit(user.id)

    const members = await this.getWorkspaceMembers(instanceId)
    if (members.some(member => member.email.toLowerCase() === normalizedEmail)) {
      return this.errorResponse('User is already a member of this workspace', 400)
    }

    const invitations = await this.getWorkspaceInvitations(instanceId)
    if (
      invitations.some(
        invitation =>
          invitation.email.toLowerCase() === normalizedEmail && invitation.status === 'pending'
      )
    ) {
      return this.errorResponse('An invitation is already pending for this email', 400)
    }

    const now = new Date()
    const expiration = new Date(now.getTime() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
    const invitation: WorkspaceInvitation = {
      id: crypto.randomUUID(),
      workspaceId: instanceId,
      email: normalizedEmail,
      role: requestedRole,
      invitedBy: user.id,
      invitedByEmail: user.email,
      workspaceName: workspaceInstance.name,
      createdAt: now,
      expiresAt: expiration,
      status: 'pending',
      token: crypto.randomUUID(),
    }

    invitations.push(invitation)
    await this.saveWorkspaceInvitations(instanceId, invitations)
    await this.indexInvitation(invitation)

    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: instanceId,
      actorUserId: user.id,
      action: 'workspace.invitation.created',
      targetEmail: normalizedEmail,
      timestamp: now.toISOString(),
      details: { role: requestedRole },
    })

    const workspacePayload = await this.buildWorkspacePayload(user)
    return this.jsonResponse(
      {
        invitation,
        ...workspacePayload,
      },
      201
    )
  }

  private async handleAcceptWorkspaceInvitation(request: Request): Promise<Response> {
    const { userId, token } = await request.json()
    if (!userId || typeof token !== 'string' || !token) {
      return this.errorResponse('userId and token are required', 400)
    }

    const user = await this.requireUserById(userId)
    const resolved = await this.getInvitationByToken(token)

    if (!resolved) {
      return this.errorResponse('Invitation not found', 404)
    }

    const { workspaceId, invitation } = resolved
    const normalizedEmail = invitation.email.toLowerCase()
    if (normalizedEmail !== user.email.toLowerCase()) {
      return this.errorResponse('Invitation does not belong to this user', 403)
    }

    if (invitation.status !== 'pending') {
      return this.errorResponse('Invitation is no longer available', 400)
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.unindexInvitation(invitation)
      const invitations = await this.getWorkspaceInvitations(workspaceId)
      const updated = invitations.map(invite =>
        invite.id === invitation.id
          ? { ...invite, status: 'expired' as WorkspaceInvitationStatus }
          : invite
      )
      await this.saveWorkspaceInvitations(workspaceId, updated)
      return this.errorResponse('Invitation has expired', 410)
    }

    await this.upsertWorkspaceMember(workspaceId, {
      userId: user.id,
      email: user.email,
      role: invitation.role,
      joinedAt: new Date(),
    })

    await this.addWorkspaceToUser(user, workspaceId, invitation.role)

    const invitations = await this.getWorkspaceInvitations(workspaceId)
    const updatedInvitations = invitations.map(invite =>
      invite.id === invitation.id
        ? { ...invite, status: 'accepted' as WorkspaceInvitationStatus }
        : invite
    )
    await this.saveWorkspaceInvitations(workspaceId, updatedInvitations)
    await this.unindexInvitation(invitation)

    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId,
      actorUserId: user.id,
      action: 'workspace.invitation.accepted',
      targetEmail: user.email,
      timestamp: new Date().toISOString(),
      details: { role: invitation.role },
    })

    const workspacePayload = await this.buildWorkspacePayload(user)
    return this.jsonResponse({
      accepted: {
        workspaceId,
        role: invitation.role,
      },
      ...workspacePayload,
    })
  }

  private async handleRevokeWorkspaceInvitation(request: Request): Promise<Response> {
    const { userId, instanceId, invitationId } = await request.json()
    if (!userId || !instanceId || !invitationId) {
      return this.errorResponse('userId, instanceId, and invitationId are required', 400)
    }

    const user = await this.requireUserById(userId)
    this.ensureUserHasRole(user, instanceId, ['owner'])

    const invitations = await this.getWorkspaceInvitations(instanceId)
    const target = invitations.find(invite => invite.id === invitationId)
    if (!target) {
      return this.errorResponse('Invitation not found', 404)
    }

    if (target.status !== 'pending') {
      return this.errorResponse('Only pending invitations can be revoked', 400)
    }

    const updatedInvitations = invitations.map(invite =>
      invite.id === invitationId
        ? { ...invite, status: 'revoked' as WorkspaceInvitationStatus }
        : invite
    )
    await this.saveWorkspaceInvitations(instanceId, updatedInvitations)
    await this.unindexInvitation(target)

    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: instanceId,
      actorUserId: user.id,
      action: 'workspace.invitation.revoked',
      targetEmail: target.email,
      timestamp: new Date().toISOString(),
    })

    const workspacePayload = await this.buildWorkspacePayload(user)
    return this.jsonResponse({
      revokedInvitationId: invitationId,
      ...workspacePayload,
    })
  }

  private async handleRemoveWorkspaceMember(request: Request): Promise<Response> {
    const { userId, instanceId, targetUserId } = await request.json()
    if (!userId || !instanceId || !targetUserId) {
      return this.errorResponse('userId, instanceId, and targetUserId are required', 400)
    }

    const user = await this.requireUserById(userId)
    this.ensureUserHasRole(user, instanceId, ['owner'])

    if (userId === targetUserId) {
      return this.errorResponse('Use workspace delete or leave action to remove yourself', 400)
    }

    const members = await this.getWorkspaceMembers(instanceId)
    const targetMember = members.find(member => member.userId === targetUserId)
    if (!targetMember) {
      return this.errorResponse('Target user is not a member of this workspace', 404)
    }

    if (targetMember.role === 'owner') {
      const ownerCount = await this.countWorkspaceOwners(instanceId)
      if (ownerCount <= 1) {
        return this.errorResponse('Cannot remove the last workspace owner', 400)
      }
    }

    const targetUser = await this.requireUserById(targetUserId)
    const remainingInstances = targetUser.instances.filter(inst => inst.id !== instanceId)
    if (remainingInstances.length === targetUser.instances.length) {
      return this.errorResponse('Target user is not a member of this workspace', 404)
    }

    if (remainingInstances.length === 0) {
      return this.errorResponse(
        'Cannot remove member because it would leave them without a workspace',
        400
      )
    }

    targetUser.instances = remainingInstances
    await this.saveUser(targetUser)
    await this.removeWorkspaceMember(instanceId, targetUserId)

    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: instanceId,
      actorUserId: user.id,
      action: 'workspace.member.removed',
      targetUserId,
      targetEmail: targetUser.email,
      timestamp: new Date().toISOString(),
      details: { previousRole: targetMember.role },
    })

    const workspacePayload = await this.buildWorkspacePayload(user)
    return this.jsonResponse({
      removedUserId: targetUserId,
      ...workspacePayload,
    })
  }

  private async handleUpdateWorkspaceMemberRole(request: Request): Promise<Response> {
    const { userId, instanceId, targetUserId, role } = await request.json()
    if (!userId || !instanceId || !targetUserId || typeof role !== 'string') {
      return this.errorResponse('userId, instanceId, targetUserId, and role are required', 400)
    }

    const targetRole = role.toLowerCase()
    if (!this.isValidRole(targetRole)) {
      return this.errorResponse('Invalid role', 400)
    }

    const actor = await this.requireUserById(userId)
    this.ensureUserHasRole(actor, instanceId, ['owner'])

    const members = await this.getWorkspaceMembers(instanceId)
    const targetMember = members.find(member => member.userId === targetUserId)
    if (!targetMember) {
      return this.errorResponse('Target user is not a member of this workspace', 404)
    }

    if (targetMember.role === targetRole) {
      return this.errorResponse('User already has this role', 400)
    }

    if (targetMember.role === 'owner' && targetRole !== 'owner') {
      const ownerCount = await this.countWorkspaceOwners(instanceId)
      if (ownerCount <= 1) {
        return this.errorResponse('Cannot demote the last workspace owner', 400)
      }
    }

    const targetUser = await this.requireUserById(targetUserId)
    const instanceIndex = targetUser.instances.findIndex(instance => instance.id === instanceId)
    if (instanceIndex === -1) {
      return this.errorResponse('Target user is not a member of this workspace', 404)
    }

    targetUser.instances[instanceIndex].role = targetRole
    await this.saveUser(targetUser)
    await this.upsertWorkspaceMember(instanceId, {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetRole,
      joinedAt: targetMember.joinedAt,
    })

    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: instanceId,
      actorUserId: actor.id,
      action: 'workspace.member.role_updated',
      targetUserId,
      targetEmail: targetUser.email,
      timestamp: new Date().toISOString(),
      details: { previousRole: targetMember.role, newRole: targetRole },
    })

    const workspacePayload = await this.buildWorkspacePayload(actor)
    return this.jsonResponse({
      updatedUserId: targetUserId,
      role: targetRole,
      ...workspacePayload,
    })
  }

  private async handleInternalInstances(request: Request): Promise<Response> {
    const { userId } = await request.json()
    if (!userId) {
      return this.errorResponse('userId is required', 400)
    }

    const user = await this.requireUserById(userId)
    return this.jsonResponse(await this.buildWorkspacePayload(user))
  }

  private async handleInternalListWorkspaces(request: Request): Promise<Response> {
    // Consume and ignore the request body to keep the interface consistent with other handlers
    try {
      await request.json()
    } catch {
      // Ignore JSON parse errors for empty bodies
    }

    const userList = await this.storage.list({ prefix: 'user:' })
    const workspaces: Array<{
      instanceId: string
      userId: string
      name: string
      createdAt: string
      lastAccessedAt: string
      isDefault?: boolean
    }> = []

    for (const [key, value] of userList) {
      if (key.startsWith('user:id:')) {
        continue
      }

      const user = value as User | undefined
      if (!user) {
        continue
      }

      for (const instance of user.instances ?? []) {
        workspaces.push({
          instanceId: instance.id,
          userId: user.id,
          name: instance.name,
          createdAt: new Date(instance.createdAt).toISOString(),
          lastAccessedAt: new Date(instance.lastAccessedAt).toISOString(),
          isDefault: instance.isDefault,
        })
      }
    }

    return this.jsonResponse({
      workspaces,
      metadata: {
        totalUsers: workspaces.length === 0 ? 0 : new Set(workspaces.map(ws => ws.userId)).size,
        totalWorkspaces: workspaces.length,
      },
    })
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
        case '/workspaces/invite-member':
          return await this.handleInviteWorkspaceMember(request)
        case '/workspaces/accept-invitation':
          return await this.handleAcceptWorkspaceInvitation(request)
        case '/workspaces/revoke-invitation':
          return await this.handleRevokeWorkspaceInvitation(request)
        case '/workspaces/remove-member':
          return await this.handleRemoveWorkspaceMember(request)
        case '/workspaces/update-role':
          return await this.handleUpdateWorkspaceMemberRole(request)
        case '/internal/instances':
          return await this.handleInternalInstances(request)
        case '/internal/workspaces':
          return await this.handleInternalListWorkspaces(request)
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
      role: 'owner',
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
    await this.saveWorkspaceInvitations(defaultInstance.id, [])
    await this.upsertWorkspaceMember(defaultInstance.id, {
      userId,
      email,
      role: 'owner',
      joinedAt: now,
    })
    await this.logWorkspaceEvent({
      id: crypto.randomUUID(),
      workspaceId: defaultInstance.id,
      actorUserId: userId,
      action: 'workspace.created',
      targetUserId: userId,
      targetEmail: email,
      timestamp: now.toISOString(),
    })

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
        role: 'owner',
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

    for (const instance of user.instances ?? []) {
      await this.removeWorkspaceMember(instance.id, user.id)
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
