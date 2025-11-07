import React, { useMemo } from 'react'
import { useQuery } from '@livestore/react'
import { getUsers$, getWorkers$ } from '@work-squared/shared/queries'
import { getAvatarColor } from '../../../utils/avatarColors.js'
import type { User, Worker } from '@work-squared/shared/schema'

interface AssigneeSelectorProps {
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  currentUserId?: string // For determining creator quick-access
}

export interface AssigneeOption {
  id: string
  name: string
  type: 'user' | 'worker'
  avatar?: string
  email?: string
  roleDescription?: string
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  placeholder = 'Select assignees...',
  className,
  disabled = false,
  currentUserId,
}) => {
  const users = useQuery(getUsers$) ?? []
  const workers = useQuery(getWorkers$) ?? []

  // Prepare assignee data
  const { recommendedAssignee, currentUser, humanUsers, aiWorkers } = useMemo(() => {
    // Filter valid users (exclude Default User)
    const validUsers = users.filter(
      (user: User) => user.name !== 'Default User' && user.email !== 'default@example.com'
    )

    // Filter active workers
    const activeWorkers = workers.filter((worker: Worker) => worker.isActive)

    // Determine recommended assignee (most recently created active worker)
    const recommended = activeWorkers.length > 0 ? activeWorkers[0] : null

    // Find current user
    const currentUserData = currentUserId
      ? validUsers.find((user: User) => user.id === currentUserId)
      : null

    return {
      recommendedAssignee: recommended,
      currentUser: currentUserData,
      humanUsers: validUsers,
      aiWorkers: activeWorkers,
    }
  }, [users, workers, currentUserId])

  const toggleAssignee = (assigneeId: string) => {
    const newSelectedIds = selectedIds.includes(assigneeId)
      ? selectedIds.filter(id => id !== assigneeId)
      : [...selectedIds, assigneeId]
    onSelectionChange(newSelectedIds)
  }

  return (
    <div className={className}>
      {/* Quick Access Cards */}
      <div className='flex gap-2 mb-3'>
        {recommendedAssignee && (
          <QuickAssignCard
            assignee={{
              id: recommendedAssignee.id,
              name: recommendedAssignee.name,
              type: 'worker',
              avatar: recommendedAssignee.avatar || undefined,
              roleDescription: recommendedAssignee.roleDescription || undefined,
            }}
            label='Recommended'
            isSelected={selectedIds.includes(recommendedAssignee.id)}
            onClick={() => toggleAssignee(recommendedAssignee.id)}
          />
        )}
        {currentUser && (
          <QuickAssignCard
            assignee={{
              id: currentUser.id,
              name: currentUser.name || currentUser.email || '',
              type: 'user',
              avatar: currentUser.avatarUrl || undefined,
              email: currentUser.email || undefined,
            }}
            label='Assign to Me'
            isSelected={selectedIds.includes(currentUser.id)}
            onClick={() => toggleAssignee(currentUser.id)}
          />
        )}
      </div>

      {/* Assignee Dropdown */}
      <AssigneeDropdown
        humanUsers={humanUsers}
        aiWorkers={aiWorkers}
        selectedIds={selectedIds}
        onToggle={toggleAssignee}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
}

// Quick Access Assignment Card
interface QuickAssignCardProps {
  assignee: AssigneeOption
  label: string
  isSelected: boolean
  onClick: () => void
}

const QuickAssignCard: React.FC<QuickAssignCardProps> = ({
  assignee,
  label,
  isSelected,
  onClick,
}) => {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex-1 p-3 border rounded-lg text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <div className='text-xs text-gray-500 mb-1'>{label}</div>
      <div className='flex items-center gap-2'>
        <AssigneeAvatar assignee={assignee} size='sm' />
        <div className='flex-1 min-w-0'>
          <div className='text-sm font-medium text-gray-900 truncate'>{assignee.name}</div>
          {assignee.type === 'user' && assignee.email && (
            <div className='text-xs text-gray-500 truncate'>{assignee.email}</div>
          )}
          {assignee.type === 'worker' && assignee.roleDescription && (
            <div className='text-xs text-gray-500 truncate'>{assignee.roleDescription}</div>
          )}
        </div>
        <span className='text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600'>
          {assignee.type === 'user' ? 'Human' : 'AI'}
        </span>
      </div>
    </button>
  )
}

// Assignee Dropdown with Sections
interface AssigneeDropdownProps {
  humanUsers: User[]
  aiWorkers: Worker[]
  selectedIds: string[]
  onToggle: (id: string) => void
  placeholder: string
  disabled: boolean
}

const AssigneeDropdown: React.FC<AssigneeDropdownProps> = ({
  humanUsers,
  aiWorkers,
  selectedIds,
  onToggle,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedCount = selectedIds.length
  const displayText =
    selectedCount === 0 ? placeholder : `${selectedCount} assignee${selectedCount > 1 ? 's' : ''}`

  return (
    <div ref={dropdownRef} className='relative'>
      <button
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md text-left flex items-center justify-between ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white hover:border-gray-400 cursor-pointer'
        } ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}
      >
        <span className={selectedCount === 0 ? 'text-gray-400' : 'text-gray-900'}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {isOpen && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto'>
          {/* Human Users Section */}
          {humanUsers.length > 0 && (
            <div>
              <div className='px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0'>
                HUMAN USERS
              </div>
              {humanUsers.map((user: User) => (
                <AssigneeOptionItem
                  key={user.id}
                  assignee={{
                    id: user.id,
                    name: user.name || user.email || '',
                    type: 'user',
                    avatar: user.avatarUrl || undefined,
                    email: user.email || undefined,
                  }}
                  isSelected={selectedIds.includes(user.id)}
                  onToggle={() => onToggle(user.id)}
                />
              ))}
            </div>
          )}

          {/* AI Workers Section */}
          {aiWorkers.length > 0 && (
            <div>
              <div className='px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0'>
                AI AGENTS
              </div>
              {aiWorkers.map((worker: Worker) => (
                <AssigneeOptionItem
                  key={worker.id}
                  assignee={{
                    id: worker.id,
                    name: worker.name,
                    type: 'worker',
                    avatar: worker.avatar || undefined,
                    roleDescription: worker.roleDescription || undefined,
                  }}
                  isSelected={selectedIds.includes(worker.id)}
                  onToggle={() => onToggle(worker.id)}
                />
              ))}
            </div>
          )}

          {humanUsers.length === 0 && aiWorkers.length === 0 && (
            <div className='px-3 py-2 text-sm text-gray-500'>No assignees available</div>
          )}
        </div>
      )}
    </div>
  )
}

// Assignee Option Item in Dropdown
interface AssigneeOptionItemProps {
  assignee: AssigneeOption
  isSelected: boolean
  onToggle: () => void
}

const AssigneeOptionItem: React.FC<AssigneeOptionItemProps> = ({
  assignee,
  isSelected,
  onToggle,
}) => {
  return (
    <button
      type='button'
      onClick={onToggle}
      className='w-full px-3 py-2 hover:bg-gray-50 flex items-center gap-3 text-left'
    >
      <div
        className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
        }`}
      >
        {isSelected && (
          <svg className='w-3 h-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
              clipRule='evenodd'
            />
          </svg>
        )}
      </div>
      <AssigneeAvatar assignee={assignee} size='sm' />
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-medium text-gray-900 truncate'>{assignee.name}</div>
        {assignee.type === 'user' && assignee.email && (
          <div className='text-xs text-gray-500 truncate'>{assignee.email}</div>
        )}
        {assignee.type === 'worker' && assignee.roleDescription && (
          <div className='text-xs text-gray-500 truncate'>{assignee.roleDescription}</div>
        )}
      </div>
      <span className='text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0'>
        {assignee.type === 'user' ? 'Human' : 'AI'}
      </span>
    </button>
  )
}

// Assignee Avatar Component
interface AssigneeAvatarProps {
  assignee: AssigneeOption
  size?: 'sm' | 'md'
}

const AssigneeAvatar: React.FC<AssigneeAvatarProps> = ({ assignee, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center font-medium flex-shrink-0 ${
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
