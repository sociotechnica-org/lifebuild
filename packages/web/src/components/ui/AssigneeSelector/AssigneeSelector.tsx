import React, { useMemo } from 'react'
import { useQuery } from '@livestore/react'
import { getUsers$, getWorkers$ } from '@work-squared/shared/queries'
import { Combobox } from '../Combobox/Combobox.js'
import type { User, Worker } from '@work-squared/shared/schema'

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
  disabled = false,
}) => {
  const users = useQuery(getUsers$) ?? []
  const workers = useQuery(getWorkers$) ?? []

  // Combine users and workers into assignee options
  const assigneeOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; type: 'user' | 'worker' }> = []

    // Add users with their email or name
    users.forEach((user: User) => {
      options.push({
        id: user.id,
        label: user.email ? `${user.name} (${user.email})` : user.name,
        type: 'user',
      })
    })

    // Add active AI workers with a badge
    workers
      .filter((worker: Worker) => worker.isActive)
      .forEach((worker: Worker) => {
        options.push({
          id: worker.id,
          label: `🤖 ${worker.name}${worker.roleDescription ? ` - ${worker.roleDescription}` : ''}`,
          type: 'worker',
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
          name: user.name,
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
          className='w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium'
          title={assignee.name}
        >
          {assignee.type === 'worker' ? (
            <span>🤖</span>
          ) : assignee.avatar ? (
            <img src={assignee.avatar} alt={assignee.name} className='w-full h-full rounded-full' />
          ) : (
            <span>{assignee.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {remainingCount > 0 && <span className='text-xs text-gray-500'>+{remainingCount}</span>}
    </div>
  )
}
