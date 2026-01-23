import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useStore } from '../../../livestore-compat.js'
import { getAllSettings$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { SETTINGS_KEYS, DEFAULT_SETTINGS } from '@lifebuild/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { useSnackbar } from '../../ui/Snackbar/Snackbar.js'
import {
  inviteWorkspaceMember,
  revokeWorkspaceInvitation,
  acceptWorkspaceInvitation,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from '../../../utils/auth.js'
import { getStoreIdFromUrl } from '../../../utils/navigation.js'
import type {
  WorkspaceRole,
  AuthWorkspaceInvitation,
  AuthWorkspaceMember,
} from '@lifebuild/shared/auth'

const ROLE_OPTIONS: WorkspaceRole[] = ['owner', 'admin', 'member']
const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}
const ROLE_ORDER: Record<WorkspaceRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
}

export const Settings: React.FC = () => {
  const { store } = useStore()
  const allSettings = useQuery(getAllSettings$) ?? []
  const [instanceName, setInstanceName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [recurringTaskPrompt, setRecurringTaskPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { user, refreshUser } = useAuth()
  const { showSnackbar } = useSnackbar()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null)
  const [acceptingInvitationToken, setAcceptingInvitationToken] = useState<string | null>(null)

  const currentWorkspaceId = useMemo(() => {
    if (!user?.instances?.length) {
      return null
    }
    const fromUrl = getStoreIdFromUrl()
    if (fromUrl && user.instances.some(instance => instance.id === fromUrl)) {
      return fromUrl
    }
    if (
      user.defaultInstanceId &&
      user.instances.some(instance => instance.id === user.defaultInstanceId)
    ) {
      return user.defaultInstanceId
    }
    return user.instances[0]?.id ?? null
  }, [user])

  const currentInstance = useMemo(
    () =>
      currentWorkspaceId
        ? user?.instances.find(instance => instance.id === currentWorkspaceId)
        : undefined,
    [currentWorkspaceId, user?.instances]
  )
  const currentRole: WorkspaceRole = currentInstance?.role ?? 'member'
  const isOwner = currentRole === 'owner'
  const workspaceSnapshot = currentWorkspaceId ? user?.workspaces?.[currentWorkspaceId] : undefined

  const sortedMembers = useMemo(() => {
    if (!workspaceSnapshot?.members) {
      return []
    }
    const members: AuthWorkspaceMember[] = [...workspaceSnapshot.members]
    return members.sort((a, b) => {
      if (a.userId === user?.id) return -1
      if (b.userId === user?.id) return 1
      if (a.role !== b.role) {
        return ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
      }
      return a.email.localeCompare(b.email)
    })
  }, [workspaceSnapshot?.members, user?.id])

  const invitations = workspaceSnapshot?.invitations ?? []
  const pendingInvitations: AuthWorkspaceInvitation[] = user?.pendingInvitations ?? []

  useEffect(() => {
    if (currentWorkspaceId && !workspaceSnapshot) {
      void refreshUser()
    }
  }, [currentWorkspaceId, workspaceSnapshot, refreshUser])

  const handleInviteSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!currentWorkspaceId) {
      setMembershipError('Select a workspace before sending an invitation.')
      return
    }

    const trimmedEmail = inviteEmail.trim()
    if (!trimmedEmail) {
      setMembershipError('Invitation email is required.')
      return
    }

    setIsInviting(true)
    setMembershipError(null)
    try {
      await inviteWorkspaceMember({
        workspaceId: currentWorkspaceId,
        email: trimmedEmail,
        role: inviteRole,
      })
      const refreshed = await refreshUser()
      showSnackbar({
        message: refreshed
          ? 'Invitation sent successfully.'
          : 'Invitation sent, but we could not refresh workspace data automatically.',
        type: refreshed ? 'success' : 'warning',
      })
      setInviteEmail('')
      setInviteRole('member')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send invitation. Please try again.'
      setMembershipError(message)
      showSnackbar({ message, type: 'error' })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (memberId: string, role: WorkspaceRole) => {
    if (!currentWorkspaceId) {
      return
    }
    setUpdatingMemberId(memberId)
    setMembershipError(null)
    try {
      await updateWorkspaceMemberRole({
        workspaceId: currentWorkspaceId,
        userId: memberId,
        role,
      })
      const refreshed = await refreshUser()
      showSnackbar({
        message: refreshed
          ? 'Member role updated.'
          : 'Role updated, but workspace data may be stale.',
        type: refreshed ? 'success' : 'warning',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update member role.'
      setMembershipError(message)
      showSnackbar({ message, type: 'error' })
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!currentWorkspaceId) {
      return
    }
    setRemovingMemberId(memberId)
    setMembershipError(null)
    try {
      await removeWorkspaceMember({ workspaceId: currentWorkspaceId, userId: memberId })
      const refreshed = await refreshUser()
      showSnackbar({
        message: refreshed
          ? 'Member removed from workspace.'
          : 'Member removed, but workspace data may be out of date.',
        type: refreshed ? 'success' : 'warning',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove workspace member.'
      setMembershipError(message)
      showSnackbar({ message, type: 'error' })
    } finally {
      setRemovingMemberId(null)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!currentWorkspaceId) {
      return
    }
    setRevokingInvitationId(invitationId)
    setMembershipError(null)
    try {
      await revokeWorkspaceInvitation({
        workspaceId: currentWorkspaceId,
        invitationId,
      })
      const refreshed = await refreshUser()
      showSnackbar({
        message: refreshed
          ? 'Invitation revoked.'
          : 'Invitation revoked, but workspace data may not be current.',
        type: refreshed ? 'success' : 'warning',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke invitation.'
      setMembershipError(message)
      showSnackbar({ message, type: 'error' })
    } finally {
      setRevokingInvitationId(null)
    }
  }

  const handleAcceptInvitation = async (token?: string | null) => {
    if (!token) {
      setMembershipError('Invitation token is missing.')
      return
    }
    setAcceptingInvitationToken(token)
    setMembershipError(null)
    try {
      await acceptWorkspaceInvitation(token)
      const refreshed = await refreshUser()
      showSnackbar({
        message: refreshed
          ? 'Invitation accepted.'
          : 'Invitation accepted, but workspace data may not have refreshed.',
        type: refreshed ? 'success' : 'warning',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept invitation.'
      setMembershipError(message)
      showSnackbar({ message, type: 'error' })
    } finally {
      setAcceptingInvitationToken(null)
    }
  }

  // Convert settings array to a map for easier access
  const settingsMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    allSettings.forEach(setting => {
      map[setting.key] = setting.value
    })
    return map
  }, [allSettings])

  // Initialize form values from settings or defaults
  useEffect(() => {
    const currentInstanceName =
      settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
    const currentSystemPrompt =
      settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]
    const currentRecurringTaskPrompt =
      settingsMap[SETTINGS_KEYS.RECURRING_TASK_PROMPT] ||
      DEFAULT_SETTINGS[SETTINGS_KEYS.RECURRING_TASK_PROMPT]

    setInstanceName(currentInstanceName)
    setSystemPrompt(currentSystemPrompt)
    setRecurringTaskPrompt(currentRecurringTaskPrompt)
  }, [settingsMap])

  // Track changes
  useEffect(() => {
    const originalInstanceName =
      settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
    const originalSystemPrompt =
      settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]
    const originalRecurringTaskPrompt =
      settingsMap[SETTINGS_KEYS.RECURRING_TASK_PROMPT] ||
      DEFAULT_SETTINGS[SETTINGS_KEYS.RECURRING_TASK_PROMPT]

    const hasInstanceNameChanged = instanceName !== originalInstanceName
    const hasSystemPromptChanged = systemPrompt !== originalSystemPrompt
    const hasRecurringTaskPromptChanged = recurringTaskPrompt !== originalRecurringTaskPrompt

    setHasChanges(hasInstanceNameChanged || hasSystemPromptChanged || hasRecurringTaskPromptChanged)
  }, [instanceName, systemPrompt, recurringTaskPrompt, settingsMap])

  const handleSave = async () => {
    if (!hasChanges) return

    setIsSubmitting(true)
    try {
      const updates = []

      // Update instance name if changed
      const originalInstanceName =
        settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
      if (instanceName !== originalInstanceName) {
        updates.push(
          events.settingUpdated({
            key: SETTINGS_KEYS.INSTANCE_NAME,
            value: instanceName,
            updatedAt: new Date(),
          })
        )
      }

      // Update system prompt if changed
      const originalSystemPrompt =
        settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]
      if (systemPrompt !== originalSystemPrompt) {
        updates.push(
          events.settingUpdated({
            key: SETTINGS_KEYS.SYSTEM_PROMPT,
            value: systemPrompt,
            updatedAt: new Date(),
          })
        )
      }

      // Update recurring task prompt if changed
      const originalRecurringTaskPrompt =
        settingsMap[SETTINGS_KEYS.RECURRING_TASK_PROMPT] ||
        DEFAULT_SETTINGS[SETTINGS_KEYS.RECURRING_TASK_PROMPT]
      if (recurringTaskPrompt !== originalRecurringTaskPrompt) {
        updates.push(
          events.settingUpdated({
            key: SETTINGS_KEYS.RECURRING_TASK_PROMPT,
            value: recurringTaskPrompt,
            updatedAt: new Date(),
          })
        )
      }

      if (updates.length > 0) {
        await Promise.all(updates.map(update => store.commit(update)))
        showSnackbar({ message: 'Settings saved successfully.', type: 'success' })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showSnackbar({ message: 'Failed to save settings.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setInstanceName(DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME])
    setSystemPrompt(DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT])
    setRecurringTaskPrompt(DEFAULT_SETTINGS[SETTINGS_KEYS.RECURRING_TASK_PROMPT])
  }

  const handleDiscard = () => {
    const originalInstanceName =
      settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
    const originalSystemPrompt =
      settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]
    const originalRecurringTaskPrompt =
      settingsMap[SETTINGS_KEYS.RECURRING_TASK_PROMPT] ||
      DEFAULT_SETTINGS[SETTINGS_KEYS.RECURRING_TASK_PROMPT]

    setInstanceName(originalInstanceName)
    setSystemPrompt(originalSystemPrompt)
    setRecurringTaskPrompt(originalRecurringTaskPrompt)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2f2b27] font-['Source_Serif_4',Georgia,serif]">
          Settings
        </h1>
        <p className='mt-1 text-sm text-[#8b8680]'>Configure your LifeBuild instance</p>
      </div>

      {/* Instance Settings Card */}
      <div className='bg-white border border-[#e8e4de] rounded-2xl'>
        <div className='p-6 space-y-6'>
          {/* Instance Name */}
          <div>
            <label
              htmlFor='instance-name'
              className='block text-sm font-semibold text-[#2f2b27] mb-1.5'
            >
              Instance Name
            </label>
            <p className='text-sm text-[#8b8680] mb-3'>
              The name displayed for your LifeBuild instance
            </p>
            <input
              type='text'
              id='instance-name'
              value={instanceName}
              onChange={e => setInstanceName(e.target.value)}
              className='w-full py-2.5 px-3 border border-[#e8e4de] rounded-lg text-sm text-[#2f2b27] placeholder:text-[#8b8680] focus:outline-none focus:border-[#d0ccc5] transition-colors'
              placeholder='Enter instance name'
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Global System Prompt
            </label>
            <p className='text-sm text-[#8b8680] mb-3'>
              The default system prompt used for all AI chats (unless overridden by a specific
              worker)
            </p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={6}
              className='w-full py-2.5 px-3 border border-[#e8e4de] rounded-lg text-sm text-[#2f2b27] placeholder:text-[#8b8680] focus:outline-none focus:border-[#d0ccc5] transition-colors resize-y'
              placeholder='Enter system prompt...'
            />
          </div>

          {/* Recurring Task Prompt */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Recurring Task Custom Prompt
            </label>
            <p className='text-sm text-[#8b8680] mb-3'>
              Custom prompt template that will be prepended to the system prompt when executing
              recurring tasks. Use variable placeholders like{' '}
              <code className='bg-[#f5f3f0] px-1.5 py-0.5 rounded text-xs'>{'{{name}}'}</code> to
              include task data.
            </p>
            <textarea
              value={recurringTaskPrompt}
              onChange={e => setRecurringTaskPrompt(e.target.value)}
              rows={4}
              className='w-full py-2.5 px-3 border border-[#e8e4de] rounded-lg text-sm text-[#2f2b27] placeholder:text-[#8b8680] focus:outline-none focus:border-[#d0ccc5] transition-colors resize-y'
              placeholder='Enter recurring task prompt...'
            />
          </div>
        </div>

        {/* Actions */}
        <div className='px-6 py-4 border-t border-[#e8e4de] flex justify-between items-center'>
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={handleReset}
              className='py-2.5 px-4 text-sm font-semibold text-[#8b8680] bg-transparent border border-[#e8e4de] rounded-lg hover:border-[#d0ccc5] hover:text-[#2f2b27] transition-colors'
            >
              Reset to Defaults
            </button>
            {hasChanges && (
              <button
                type='button'
                onClick={handleDiscard}
                className='py-2.5 px-4 text-sm font-semibold text-[#8b8680] bg-transparent border border-[#e8e4de] rounded-lg hover:border-[#d0ccc5] hover:text-[#2f2b27] transition-colors'
              >
                Discard Changes
              </button>
            )}
          </div>

          <button
            type='button'
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
            className={`py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors ${
              hasChanges && !isSubmitting
                ? 'bg-[#2f2b27] text-[#faf9f7] hover:bg-[#4a4540]'
                : 'bg-[#e8e4de] text-[#8b8680] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* TODO: Workspace Membership Card - hidden for now, functionality preserved for future use */}
    </div>
  )
}
