import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getAllSettings$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { SETTINGS_KEYS, DEFAULT_SETTINGS } from '@lifebuild/shared'
import { SystemPromptEditor } from './SystemPromptEditor.js'
import { RecurringTaskPromptEditor } from './RecurringTaskPromptEditor.js'
import { LoadingSpinner } from '../ui/LoadingSpinner.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { useSnackbar } from '../ui/Snackbar/Snackbar.js'
import {
  inviteWorkspaceMember,
  revokeWorkspaceInvitation,
  acceptWorkspaceInvitation,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from '../../utils/auth.js'
import { getStoreIdFromUrl } from '../../utils/navigation.js'
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

export const SettingsPage: React.FC = () => {
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
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
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
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='space-y-6'>
          {/* Header */}
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Settings</h1>
            <p className='mt-2 text-gray-600'>Configure your Work Squared instance</p>
          </div>

          {/* Settings Form */}
          <div className='bg-white shadow rounded-lg'>
            <div className='px-6 py-6 space-y-8'>
              {/* Instance Name */}
              <div>
                <label
                  htmlFor='instance-name'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Instance Name
                </label>
                <p className='text-sm text-gray-500 mb-3'>
                  The name displayed for your Work Squared instance
                </p>
                <input
                  type='text'
                  id='instance-name'
                  value={instanceName}
                  onChange={e => setInstanceName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Enter instance name'
                />
              </div>

              {/* System Prompt */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Global System Prompt
                </label>
                <p className='text-sm text-gray-500 mb-3'>
                  The default system prompt used for all AI chats (unless overridden by a specific
                  worker)
                </p>
                <SystemPromptEditor value={systemPrompt} onChange={setSystemPrompt} />
              </div>

              {/* Recurring Task Prompt */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Recurring Task Custom Prompt
                </label>
                <p className='text-sm text-gray-500 mb-3'>
                  Custom prompt template that will be prepended to the system prompt when executing
                  recurring tasks. Use variable placeholders like{' '}
                  <code className='bg-gray-100 px-1 rounded'>{'{{name}}'}</code> to include task
                  data.
                </p>
                <RecurringTaskPromptEditor
                  value={recurringTaskPrompt}
                  onChange={setRecurringTaskPrompt}
                />
              </div>
            </div>

            {/* Actions */}
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center'>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={handleReset}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                >
                  Reset to Defaults
                </button>
                {hasChanges && (
                  <button
                    type='button'
                    onClick={handleDiscard}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  >
                    Discard Changes
                  </button>
                )}
              </div>

              <button
                type='button'
                onClick={handleSave}
                disabled={!hasChanges || isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  hasChanges && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className='flex items-center'>
                    <div className='mr-2'>
                      <LoadingSpinner size='sm' />
                    </div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Membership */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-6 space-y-6'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Workspace Members</h2>
                <p className='text-sm text-gray-500'>
                  {currentWorkspaceId
                    ? `Manage access for workspace ${currentWorkspaceId}.`
                    : 'Select a workspace to manage invitations and roles.'}
                </p>
              </div>
              {currentInstance ? (
                <span className='inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'>
                  Your role: {ROLE_LABELS[currentRole]}
                </span>
              ) : null}
            </div>

            {membershipError ? (
              <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                {membershipError}
              </div>
            ) : null}

            {!currentWorkspaceId ? (
              <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600'>
                Select a workspace to view members and invitations.
              </div>
            ) : !workspaceSnapshot ? (
              <div className='rounded-md border border-blue-200 bg-blue-50 px-3 py-4 text-sm text-blue-800'>
                Loading workspace membership data…
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 text-sm'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th scope='col' className='px-4 py-2 text-left font-medium text-gray-700'>
                          Member
                        </th>
                        <th scope='col' className='px-4 py-2 text-left font-medium text-gray-700'>
                          Role
                        </th>
                        <th scope='col' className='px-4 py-2 text-right font-medium text-gray-700'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {sortedMembers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className='px-4 py-6 text-center text-sm text-gray-500'>
                            No members found for this workspace.
                          </td>
                        </tr>
                      ) : (
                        sortedMembers.map(member => (
                          <tr key={member.userId}>
                            <td className='px-4 py-3'>
                              <div className='font-medium text-gray-900'>{member.email}</div>
                              <div className='text-xs text-gray-500'>
                                {member.userId === user?.id
                                  ? 'This is you'
                                  : `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                              </div>
                            </td>
                            <td className='px-4 py-3'>
                              {isOwner && member.userId !== user?.id ? (
                                <div className='flex items-center gap-3'>
                                  <select
                                    className='rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={member.role}
                                    disabled={
                                      updatingMemberId === member.userId ||
                                      removingMemberId === member.userId
                                    }
                                    onChange={event =>
                                      handleRoleChange(
                                        member.userId,
                                        event.target.value as WorkspaceRole
                                      )
                                    }
                                  >
                                    {ROLE_OPTIONS.map(role => (
                                      <option key={role} value={role}>
                                        {ROLE_LABELS[role]}
                                      </option>
                                    ))}
                                  </select>
                                  {updatingMemberId === member.userId ? (
                                    <LoadingSpinner size='sm' />
                                  ) : null}
                                </div>
                              ) : (
                                <span className='inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700'>
                                  {ROLE_LABELS[member.role]}
                                </span>
                              )}
                            </td>
                            <td className='px-4 py-3 text-right'>
                              {isOwner && member.userId !== user?.id ? (
                                <button
                                  type='button'
                                  onClick={() => handleRemoveMember(member.userId)}
                                  disabled={removingMemberId === member.userId}
                                  className='inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60'
                                >
                                  {removingMemberId === member.userId ? (
                                    <>
                                      <LoadingSpinner size='sm' />
                                      <span>Removing…</span>
                                    </>
                                  ) : (
                                    'Remove'
                                  )}
                                </button>
                              ) : (
                                <span className='text-xs text-gray-400'>—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {isOwner ? (
                  <form
                    onSubmit={handleInviteSubmit}
                    className='space-y-4 rounded-md border border-gray-200 px-4 py-4'
                  >
                    <div>
                      <h3 className='text-sm font-medium text-gray-900'>Invite a teammate</h3>
                      <p className='text-xs text-gray-500'>
                        Send an email invitation to join this workspace.
                      </p>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-3'>
                      <div className='sm:col-span-2'>
                        <label
                          htmlFor='invite-email'
                          className='block text-xs font-medium text-gray-700'
                        >
                          Email address
                        </label>
                        <input
                          id='invite-email'
                          type='email'
                          value={inviteEmail}
                          onChange={event => setInviteEmail(event.target.value)}
                          className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='name@example.com'
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor='invite-role'
                          className='block text-xs font-medium text-gray-700'
                        >
                          Role
                        </label>
                        <select
                          id='invite-role'
                          value={inviteRole}
                          onChange={event => setInviteRole(event.target.value as WorkspaceRole)}
                          className='mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          {ROLE_OPTIONS.map(role => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className='flex justify-end'>
                      <button
                        type='submit'
                        disabled={isInviting}
                        className='inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        {isInviting ? <LoadingSpinner size='sm' /> : null}
                        <span>{isInviting ? 'Sending…' : 'Send invitation'}</span>
                      </button>
                    </div>
                  </form>
                ) : null}

                {invitations.length > 0 ? (
                  <div className='space-y-3 border-t border-gray-200 pt-4'>
                    <h3 className='text-sm font-medium text-gray-900'>Pending invitations</h3>
                    <ul className='space-y-2'>
                      {invitations.map(invitation => (
                        <li
                          key={invitation.id}
                          className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm'
                        >
                          <div>
                            <p className='font-medium text-gray-900'>{invitation.email}</p>
                            <p className='text-xs text-gray-500'>
                              Role: {ROLE_LABELS[invitation.role]} • Sent by{' '}
                              {invitation.invitedByEmail}
                            </p>
                          </div>
                          {isOwner ? (
                            <button
                              type='button'
                              onClick={() => handleRevokeInvitation(invitation.id)}
                              disabled={revokingInvitationId === invitation.id}
                              className='inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60'
                            >
                              {revokingInvitationId === invitation.id ? (
                                <>
                                  <LoadingSpinner size='sm' />
                                  <span>Revoking…</span>
                                </>
                              ) : (
                                'Revoke'
                              )}
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}

            {pendingInvitations.length > 0 ? (
              <div className='space-y-3 border-t border-gray-200 pt-4'>
                <h3 className='text-sm font-medium text-gray-900'>Invitations waiting for you</h3>
                <ul className='space-y-2'>
                  {pendingInvitations.map(invitation => (
                    <li
                      key={invitation.id}
                      className='flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900'
                    >
                      <div>
                        <p className='font-medium'>
                          {invitation.workspaceName || 'Workspace'} ({ROLE_LABELS[invitation.role]})
                        </p>
                        <p className='text-xs opacity-80'>
                          Invited by {invitation.invitedByEmail} • Expires{' '}
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleAcceptInvitation(invitation.token)}
                        disabled={acceptingInvitationToken === invitation.token}
                        className='inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        {acceptingInvitationToken === invitation.token ? (
                          <>
                            <LoadingSpinner size='sm' />
                            <span>Joining…</span>
                          </>
                        ) : (
                          'Accept'
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
