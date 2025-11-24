import React from 'react'
import { formatRegistrationDate } from '../../utils/dates.js'

export interface Instance {
  id: string
  name: string
  createdAt: string
  lastAccessedAt: string
  isDefault?: boolean
}

interface InstanceCardProps {
  instance: Instance
  onRemove?: (instanceId: string) => void
  onSetDefault?: (instanceId: string) => void
  removing?: boolean
  settingDefault?: boolean
}

export const InstanceCard: React.FC<InstanceCardProps> = ({
  instance,
  onRemove,
  onSetDefault,
  removing = false,
  settingDefault = false,
}) => {
  return (
    <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
      <div className='flex-1'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-medium text-gray-900'>{instance.name}</h3>
          {instance.isDefault && (
            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              Default
            </span>
          )}
        </div>
        <p className='text-sm text-gray-500'>ID: {instance.id}</p>
        <p className='text-xs text-gray-400'>
          Created: {formatRegistrationDate(instance.createdAt)} • Last accessed:{' '}
          {formatRegistrationDate(instance.lastAccessedAt)}
        </p>
      </div>
      <div className='ml-4 flex items-center gap-2'>
        {onSetDefault && !instance.isDefault && (
          <button
            onClick={() => onSetDefault(instance.id)}
            disabled={settingDefault || removing}
            className='inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
          >
            {settingDefault ? 'Setting...' : 'Set as Default'}
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(instance.id)}
            disabled={instance.isDefault || removing || settingDefault}
            className='inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
          >
            {instance.isDefault ? 'Default' : removing ? 'Removing...' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  )
}
