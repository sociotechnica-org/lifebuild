import React, { useState } from 'react'

interface AddTaskFormProps {
  onSubmit: (title: string) => void
  onCancel: () => void
}

export function AddTaskForm({ onSubmit, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim())
      setTitle('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className='mb-2'>
      <input
        type='text'
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Task name'
        className='w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        autoFocus
      />
      <div className='flex gap-2 mt-2'>
        <button
          type='submit'
          disabled={!title.trim()}
          className='px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
        >
          Add Card
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
