import React from 'react'

type RoomChatToggleProps = {
  isOpen: boolean
  onToggle: () => void
}

export const RoomChatToggle: React.FC<RoomChatToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <button
      type='button'
      onClick={onToggle}
      className='rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100'
    >
      {isOpen ? 'Hide Chat' : 'Show Chat'}
    </button>
  )
}
