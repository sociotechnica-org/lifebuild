import React, { useState, useRef, useEffect } from 'react'

interface ComboboxOption {
  id: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
  className?: string
}

export function Combobox({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select options...',
  className = '',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOptions = options.filter(option => selectedIds.includes(option.id))

  const toggleOption = (optionId: string) => {
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId]
    onSelectionChange(newSelectedIds)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className='w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-label='Select assignees'
      >
        <div className='flex items-center justify-between'>
          <div className='flex flex-wrap gap-1'>
            {selectedOptions.length > 0 ? (
              selectedOptions.map(option => (
                <span
                  key={option.id}
                  className='inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'
                >
                  {option.label}
                </span>
              ))
            ) : (
              <span className='text-gray-500'>{placeholder}</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg'>
          <ul role='listbox' className='py-1 max-h-60 overflow-auto'>
            {options.map(option => {
              const isSelected = selectedIds.includes(option.id)
              return (
                <li key={option.id}>
                  <button
                    type='button'
                    onClick={() => toggleOption(option.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`}
                    role='option'
                    aria-selected={isSelected}
                  >
                    <div className='flex items-center justify-between'>
                      <span>{option.label}</span>
                      {isSelected && (
                        <svg
                          className='w-5 h-5 text-blue-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
