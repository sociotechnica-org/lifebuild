import React from 'react'

type RoomChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export const RoomChatInput: React.FC<RoomChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!disabled) {
      onSend()
    }
  }

  return (
    <form className='space-y-2' onSubmit={handleSubmit}>
      <textarea
        className='h-24 w-full resize-none rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none'
        placeholder='Ask something…'
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
      />
      <div className='flex justify-end'>
        <button
          type='submit'
          className='rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50'
          disabled={disabled || value.trim().length === 0}
        >
          Send
        </button>
      </div>
    </form>
  )
}
