import React, { useState } from 'react'

interface ProjectAttributesEditorProps {
  attributes: Record<string, string>
  onChange: (attributes: Record<string, string>) => void
  disabled?: boolean
}

export const ProjectAttributesEditor: React.FC<ProjectAttributesEditorProps> = ({
  attributes,
  onChange,
  disabled = false,
}) => {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [error, setError] = useState<string>()

  const handleAddAttribute = () => {
    if (!newKey.trim()) {
      setError('Key is required')
      return
    }

    if (attributes[newKey]) {
      setError('Key already exists')
      return
    }

    onChange({
      ...attributes,
      [newKey.trim()]: newValue.trim(),
    })

    setNewKey('')
    setNewValue('')
    setError(undefined)
  }

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...attributes }
    delete newAttributes[key]
    onChange(newAttributes)
  }

  const handleUpdateValue = (key: string, value: string) => {
    onChange({
      ...attributes,
      [key]: value,
    })
  }

  const attributeEntries = Object.entries(attributes)

  return (
    <div className='space-y-3'>
      {/* Existing Attributes */}
      {attributeEntries.length > 0 && (
        <div className='space-y-2'>
          {attributeEntries.map(([key, value]) => (
            <div key={key} className='flex items-start gap-2'>
              <div className='flex-1 grid grid-cols-2 gap-2'>
                <input
                  type='text'
                  value={key}
                  disabled
                  className='p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm'
                  placeholder='Key'
                />
                <input
                  type='text'
                  value={value}
                  onChange={e => handleUpdateValue(key, e.target.value)}
                  disabled={disabled}
                  className='p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500'
                  placeholder='Value'
                />
              </div>
              <button
                type='button'
                onClick={() => handleRemoveAttribute(key)}
                disabled={disabled}
                className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                aria-label={`Remove ${key}`}
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Attribute */}
      <div className='pt-3 border-t border-gray-200'>
        <div className='flex items-start gap-2'>
          <div className='flex-1 grid grid-cols-2 gap-2'>
            <div>
              <input
                type='text'
                value={newKey}
                onChange={e => {
                  setNewKey(e.target.value)
                  setError(undefined)
                }}
                disabled={disabled}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='New key'
              />
            </div>
            <input
              type='text'
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              disabled={disabled}
              className='p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500'
              placeholder='New value'
            />
          </div>
          <button
            type='button'
            onClick={handleAddAttribute}
            disabled={disabled}
            className='p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Add attribute'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>
        </div>
        {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
        <p className='mt-2 text-xs text-gray-500'>
          Add custom key-value attributes to your project (e.g., scale, complexity, urgency)
        </p>
      </div>

      {attributeEntries.length === 0 && (
        <p className='text-sm text-gray-500 italic'>No custom attributes yet</p>
      )}
    </div>
  )
}
