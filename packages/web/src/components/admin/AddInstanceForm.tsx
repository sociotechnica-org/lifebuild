import React, { useState } from 'react'

interface AddInstanceFormProps {
  onAddInstance: (storeId: string) => void
  disabled?: boolean
}

export const AddInstanceForm: React.FC<AddInstanceFormProps> = ({
  onAddInstance,
  disabled = false,
}) => {
  const [newStoreId, setNewStoreId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newStoreId.trim()) {
      onAddInstance(newStoreId.trim())
      setNewStoreId('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex gap-3'>
      <input
        type='text'
        value={newStoreId}
        onChange={e => setNewStoreId(e.target.value)}
        placeholder='store_abc123'
        className='flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
        disabled={disabled}
      />
      <button
        type='submit'
        disabled={disabled || !newStoreId.trim()}
        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed'
      >
        {disabled ? 'Adding...' : 'Add Instance'}
      </button>
    </form>
  )
}
