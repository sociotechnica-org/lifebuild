import { beforeEach, describe, expect, it } from 'vitest'
import { UserStore } from './UserStore.js'
import type { Instance, User } from '../types.js'

class InMemoryStorage {
  private store = new Map<string, unknown>()

  async get<T = unknown>(key: string): Promise<T | undefined> {
    if (!this.store.has(key)) {
      return undefined
    }
    return cloneValue(this.store.get(key)) as T
  }

  async put(key: string, value: unknown): Promise<void> {
    this.store.set(key, cloneValue(value))
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key)
  }

  async list(options?: { prefix?: string }): Promise<Map<string, unknown>> {
    const result = new Map<string, unknown>()
    for (const [key, value] of this.store.entries()) {
      if (!options?.prefix || key.startsWith(options.prefix)) {
        result.set(key, cloneValue(value))
      }
    }
    return result
  }
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

function createRequest(path: string, body: Record<string, unknown>) {
  return new Request(`http://userstore${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const USER_ID = 'user-1'
const USER_EMAIL = 'owner@example.com'
const DEFAULT_INSTANCE_ID = 'instance-default'
const MEMBER_USER_ID = 'user-2'
const MEMBER_EMAIL = 'member@example.com'
const MEMBER_DEFAULT_INSTANCE_ID = 'member-instance-default'
type SerializedInstance = {
  id: string
  name: string
  createdAt: string
  lastAccessedAt: string
  isDefault?: boolean
  role?: string
}

describe('UserStore workspace operations', () => {
  let storage: InMemoryStorage
  let userStore: UserStore

  const createDefaultUser = (): User => {
    const now = new Date()
    const defaultInstance: Instance = {
      id: DEFAULT_INSTANCE_ID,
      name: 'Personal Workspace',
      createdAt: now,
      lastAccessedAt: now,
      role: 'owner',
      isDefault: true,
    }

    return {
      id: USER_ID,
      email: USER_EMAIL,
      hashedPassword: 'hashed',
      createdAt: now,
      instances: [defaultInstance],
    }
  }

  const setup = async (maxInstances = 3) => {
    storage = new InMemoryStorage()
    userStore = new UserStore({ storage } as any, { MAX_INSTANCES_PER_USER: maxInstances } as any)
    const user = createDefaultUser()
    await storage.put(`user:${USER_EMAIL}`, user)
    await storage.put(`user:id:${USER_ID}`, user)
    return user
  }

  const createMemberUser = async (): Promise<User> => {
    const now = new Date()
    const defaultInstance: Instance = {
      id: MEMBER_DEFAULT_INSTANCE_ID,
      name: 'Member Personal Workspace',
      createdAt: now,
      lastAccessedAt: now,
      role: 'owner',
      isDefault: true,
    }

    const member: User = {
      id: MEMBER_USER_ID,
      email: MEMBER_EMAIL,
      hashedPassword: 'hashed-member',
      createdAt: now,
      instances: [defaultInstance],
    }

    await storage.put(`user:${MEMBER_EMAIL}`, member)
    await storage.put(`user:id:${MEMBER_USER_ID}`, member)
    return member
  }

  const inviteMember = async (role: string = 'member') => {
    await createMemberUser()
    const inviteResponse = await userStore.fetch(
      createRequest('/workspaces/invite-member', {
        userId: USER_ID,
        instanceId: DEFAULT_INSTANCE_ID,
        email: MEMBER_EMAIL,
        role,
      })
    )
    const payload = await inviteResponse.json()
    return { inviteResponse, payload }
  }

  const inviteAndAcceptMember = async (role: string = 'member') => {
    const { payload } = await inviteMember(role)
    const invitation = payload.invitation
    expect(invitation?.token).toBeDefined()
    expect(invitation.workspaceName).toBe('Personal Workspace')

    const acceptResponse = await userStore.fetch(
      createRequest('/workspaces/accept-invitation', {
        userId: MEMBER_USER_ID,
        token: invitation.token,
      })
    )
    const acceptPayload = await acceptResponse.json()
    return { invitation, acceptResponse, acceptPayload }
  }

  beforeEach(async () => {
    await setup()
  })

  it('lists workspaces with the server-selected default instance', async () => {
    const response = await userStore.fetch(createRequest('/workspaces/list', { userId: USER_ID }))
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.instances).toHaveLength(1)
    expect(payload.defaultInstanceId).toBe(DEFAULT_INSTANCE_ID)
    expect(payload.workspaces).toBeDefined()
    expect(payload.workspaces[DEFAULT_INSTANCE_ID].members).toHaveLength(1)
    expect(payload.workspaces[DEFAULT_INSTANCE_ID].members[0].role).toBe('owner')
    expect(payload.pendingInvitations).toEqual([])
  })

  it('creates additional workspaces until the instance limit is reached', async () => {
    await setup(2)
    const createResponse = await userStore.fetch(
      createRequest('/workspaces/create', { userId: USER_ID, name: 'Team Workspace' })
    )
    expect(createResponse.status).toBe(201)
    const createdPayload = await createResponse.json()
    expect(createdPayload.instances).toHaveLength(2)
    const newWorkspaceId = createdPayload.instance.id
    expect(createdPayload.workspaces[newWorkspaceId].members).toHaveLength(1)
    expect(createdPayload.workspaces[newWorkspaceId].members[0].role).toBe('owner')

    const limitResponse = await userStore.fetch(
      createRequest('/workspaces/create', { userId: USER_ID, name: 'Overflow Workspace' })
    )
    expect(limitResponse.status).toBe(400)
    const limitPayload = await limitResponse.json()
    expect(limitPayload.error).toMatch(/Instance limit/)
  })

  it('renames workspaces with trimmed unique names', async () => {
    const createResponse = await userStore.fetch(
      createRequest('/workspaces/create', { userId: USER_ID })
    )
    const creation = await createResponse.json()
    const newInstanceId = creation.instance.id

    const renameResponse = await userStore.fetch(
      createRequest('/workspaces/rename', {
        userId: USER_ID,
        instanceId: newInstanceId,
        name: '  Shared Space  ',
      })
    )
    expect(renameResponse.status).toBe(200)
    const renamePayload = await renameResponse.json()
    expect(renamePayload.instance.name).toBe('Shared Space')

    const duplicateResponse = await userStore.fetch(
      createRequest('/workspaces/rename', {
        userId: USER_ID,
        instanceId: newInstanceId,
        name: 'Personal Workspace',
      })
    )
    expect(duplicateResponse.status).toBe(400)
  })

  it('updates default workspace selection and timestamps', async () => {
    const createResponse = await userStore.fetch(
      createRequest('/workspaces/create', { userId: USER_ID })
    )
    const creation = await createResponse.json()
    const newInstanceId = creation.instance.id
    const previousAccessed = creation.instance.lastAccessedAt

    const setDefaultResponse = await userStore.fetch(
      createRequest('/workspaces/set-default', { userId: USER_ID, instanceId: newInstanceId })
    )
    expect(setDefaultResponse.status).toBe(200)
    const defaultPayload = await setDefaultResponse.json()
    const updatedInstance = defaultPayload.instances.find(
      (instance: SerializedInstance) => instance.id === newInstanceId
    )
    expect(updatedInstance?.isDefault).toBe(true)
    const priorDefault = defaultPayload.instances.find(
      (instance: SerializedInstance) => instance.id === DEFAULT_INSTANCE_ID
    )
    expect(priorDefault?.isDefault).toBe(false)
    expect(new Date(updatedInstance!.lastAccessedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(previousAccessed).getTime()
    )
  })

  it('rejects deletion of the default workspace but removes non-default ones', async () => {
    const defaultDeleteResponse = await userStore.fetch(
      createRequest('/workspaces/delete', { userId: USER_ID, instanceId: DEFAULT_INSTANCE_ID })
    )
    expect(defaultDeleteResponse.status).toBe(400)

    const createResponse = await userStore.fetch(
      createRequest('/workspaces/create', { userId: USER_ID })
    )
    const creation = await createResponse.json()
    const removableId = creation.instance.id

    const deleteResponse = await userStore.fetch(
      createRequest('/workspaces/delete', { userId: USER_ID, instanceId: removableId })
    )
    expect(deleteResponse.status).toBe(200)
    const deletePayload = await deleteResponse.json()
    expect(deletePayload.instances).toHaveLength(1)
    expect((deletePayload.instances as SerializedInstance[])[0].id).toBe(DEFAULT_INSTANCE_ID)
    expect(deletePayload.workspaces[DEFAULT_INSTANCE_ID].members).toHaveLength(1)
  })

  it('invites members and prevents duplicate pending invitations', async () => {
    const { inviteResponse, payload } = await inviteMember()
    expect(inviteResponse.status).toBe(201)
    expect(payload.workspaces[DEFAULT_INSTANCE_ID].invitations).toHaveLength(1)
    expect(payload.invitation.workspaceName).toBe('Personal Workspace')

    const duplicateInvite = await userStore.fetch(
      createRequest('/workspaces/invite-member', {
        userId: USER_ID,
        instanceId: DEFAULT_INSTANCE_ID,
        email: MEMBER_EMAIL,
        role: 'member',
      })
    )
    expect(duplicateInvite.status).toBe(400)
  })

  it('accepts invitation and syncs membership for invitee and owner', async () => {
    const { invitation, acceptResponse } = await inviteAndAcceptMember()
    expect(acceptResponse.status).toBe(200)

    const memberListResponse = await userStore.fetch(
      createRequest('/workspaces/list', { userId: MEMBER_USER_ID })
    )
    const memberPayload = await memberListResponse.json()
    expect(
      memberPayload.instances.some(
        (instance: SerializedInstance) => instance.id === DEFAULT_INSTANCE_ID
      )
    ).toBe(true)

    const ownerListResponse = await userStore.fetch(
      createRequest('/workspaces/list', { userId: USER_ID })
    )
    const ownerPayload = await ownerListResponse.json()
    const members = ownerPayload.workspaces[DEFAULT_INSTANCE_ID].members
    expect(members.some((member: any) => member.userId === MEMBER_USER_ID)).toBe(true)
    expect(invitation.role).toBe('member')
  })

  it('allows workspace owners to update member roles with safeguards', async () => {
    await inviteAndAcceptMember()

    const updateResponse = await userStore.fetch(
      createRequest('/workspaces/update-role', {
        userId: USER_ID,
        instanceId: DEFAULT_INSTANCE_ID,
        targetUserId: MEMBER_USER_ID,
        role: 'admin',
      })
    )
    expect(updateResponse.status).toBe(200)
    const updatePayload = await updateResponse.json()
    const members = updatePayload.workspaces[DEFAULT_INSTANCE_ID].members
    const updatedMember = members.find((member: any) => member.userId === MEMBER_USER_ID)
    expect(updatedMember?.role).toBe('admin')
  })

  it('allows workspace owners to remove members while preserving invariants', async () => {
    await inviteAndAcceptMember()

    const removeResponse = await userStore.fetch(
      createRequest('/workspaces/remove-member', {
        userId: USER_ID,
        instanceId: DEFAULT_INSTANCE_ID,
        targetUserId: MEMBER_USER_ID,
      })
    )
    expect(removeResponse.status).toBe(200)
    const removePayload = await removeResponse.json()
    const members = removePayload.workspaces[DEFAULT_INSTANCE_ID].members
    expect(members.some((member: any) => member.userId === MEMBER_USER_ID)).toBe(false)

    const memberListResponse = await userStore.fetch(
      createRequest('/workspaces/list', { userId: MEMBER_USER_ID })
    )
    const memberPayload = await memberListResponse.json()
    expect(
      memberPayload.instances.some(
        (instance: SerializedInstance) => instance.id === DEFAULT_INSTANCE_ID
      )
    ).toBe(false)
  })

  it('allows workspace owners to revoke pending invitations', async () => {
    const { payload } = await inviteMember()
    const invitationId = payload.invitation.id

    const revokeResponse = await userStore.fetch(
      createRequest('/workspaces/revoke-invitation', {
        userId: USER_ID,
        instanceId: DEFAULT_INSTANCE_ID,
        invitationId,
      })
    )
    expect(revokeResponse.status).toBe(200)
    const revokePayload = await revokeResponse.json()
    expect(revokePayload.workspaces[DEFAULT_INSTANCE_ID].invitations).toHaveLength(0)
  })
})
