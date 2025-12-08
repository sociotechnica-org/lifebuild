import React, { useMemo } from 'react'
import { useQuery } from '@livestore/react'
import { getUsers$, getWorkers$ } from '@lifebuild/shared/queries'
import { Combobox } from '../Combobox/Combobox.js'
import { getAvatarColor } from '../../../utils/avatarColors.js'
import type { User, Worker } from '@lifebuild/shared/schema'

interface AssigneeSelectorProps {
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  placeholder = 'Select assignees...',
  className,
  disabled: _disabled = false,
}) => {
  const users = useQuery(getUsers$) ?? []
  const workers = useQuery(getWorkers$) ?? []

  // Combine users and workers into assignee options
  const assigneeOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; type: 'user' | 'worker'; avatar?: string }> =
      []

    // Add users with their email or name (exclude Default User)
    users
      .filter((user: User) => user.name !== 'Default User' && user.email !== 'default@example.com')
      .forEach((user: User) => {
        options.push({
          id: user.id,
          label: user.name ? user.name : user.email ? user.email : '',
          type: 'user',
          avatar: user.avatarUrl || undefined,
        })
      })

    // Add active AI workers with a badge
    workers
      .filter((worker: Worker) => worker.isActive)
      .forEach((worker: Worker) => {
        options.push({
          id: worker.id,
          label: `${worker.name}${worker.roleDescription ? ` - ${worker.roleDescription}` : ''}`,
          type: 'worker',
          avatar: worker.avatar || undefined,
        })
      })

    return options
  }, [users, workers])

  return (
    <Combobox
      options={assigneeOptions}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      className={className}
    />
  )
}

// Helper component to display assignee avatars
export const AssigneeAvatars: React.FC<{ assigneeIds: string[]; maxDisplay?: number }> = ({
  assigneeIds,
  maxDisplay = 3,
}) => {
  const users = useQuery(getUsers$) ?? []
  const workers = useQuery(getWorkers$) ?? []

  const assignees = useMemo(() => {
    const result: Array<{ id: string; name: string; type: 'user' | 'worker'; avatar?: string }> = []

    assigneeIds.forEach(id => {
      const user = users.find((u: User) => u.id === id)
      if (user) {
        result.push({
          id: user.id,
          name: user.name || user.email || '',
          type: 'user',
          avatar: user.avatarUrl || undefined,
        })
        return
      }

      const worker = workers.find((w: Worker) => w.id === id)
      if (worker) {
        result.push({
          id: worker.id,
          name: worker.name,
          type: 'worker',
          avatar: worker.avatar || undefined,
        })
      }
    })

    return result
  }, [assigneeIds, users, workers])

  if (assignees.length === 0) {
    return <span className='text-gray-400 text-sm'>Unassigned</span>
  }

  const displayAssignees = assignees.slice(0, maxDisplay)
  const remainingCount = assignees.length - maxDisplay

  return (
    <div className='flex items-center gap-1'>
      {displayAssignees.map(assignee => (
        <div
          key={assignee.id}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            assignee.type === 'worker'
              ? `${getAvatarColor(assignee.id)} text-white`
              : assignee.avatar
                ? 'bg-transparent'
                : 'bg-gray-300 text-gray-700'
          }`}
          title={assignee.name}
        >
          {assignee.type === 'worker' ? (
            <span>{assignee.avatar || '🤖'}</span>
          ) : assignee.avatar ? (
            <img src={assignee.avatar} alt={assignee.name} className='w-full h-full rounded-full' />
          ) : (
            <span>{assignee.name ? assignee.name.charAt(0).toUpperCase() : '?'}</span>
          )}
        </div>
      ))}
      {remainingCount > 0 && <span className='text-xs text-gray-500'>+{remainingCount}</span>}
    </div>
  )
}
