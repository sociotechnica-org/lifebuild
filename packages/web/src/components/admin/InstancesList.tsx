import React from 'react'
import { InstanceCard, Instance } from './InstanceCard.js'

export interface InstancesListProps {
  instances: Instance[]
  onRemoveInstance?: (instanceId: string) => void
  removing?: boolean
}

export const InstancesList: React.FC<InstancesListProps> = ({
  instances,
  onRemoveInstance,
  removing = false,
}) => {
  if (instances.length === 0) {
    return (
      <div className='text-center py-6'>
        <p className='text-gray-500'>No instances found for this user.</p>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {instances.map(instance => (
        <InstanceCard
          key={instance.id}
          instance={instance}
          onRemove={onRemoveInstance}
          removing={removing}
        />
      ))}
    </div>
  )
}
