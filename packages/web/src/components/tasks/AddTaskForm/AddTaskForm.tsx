import React, { useState, useRef } from 'react'

interface AddTaskFormProps {
  onSubmit: (title: string) => void
  onCancel: () => void
}

export function AddTaskForm({ onSubmit, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim())
      setTitle('')
      // Refocus input immediately for rapid card entry
      setTimeout(() => inputRef.current?.focus(), 0)
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
        ref={inputRef}
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
