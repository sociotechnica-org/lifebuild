import React from 'react'

interface AdminToggleProps {
  isAdmin: boolean
  onToggle: (isAdmin: boolean) => void
  disabled?: boolean
}

export const AdminToggle: React.FC<AdminToggleProps> = ({
  isAdmin,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className='bg-white border border-gray-200 rounded-lg p-6'>
      <h2 className='text-lg font-medium text-gray-900 mb-4'>Admin Status</h2>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-900'>Admin Access</p>
          <p className='text-sm text-gray-500'>
            {isAdmin
              ? 'This user has administrator privileges'
              : 'This user does not have administrator privileges'}
          </p>
        </div>
        <button
          onClick={() => onToggle(!isAdmin)}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
            isAdmin ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isAdmin ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
