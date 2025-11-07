import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'

export interface InlineEditTextProps {
  /** Current value to display/edit */
  value: string
  /** Callback when value is saved */
  onSave: (value: string) => void
  /** Optional callback when edit is cancelled */
  onCancel?: () => void
  /** Placeholder text when empty */
  placeholder?: string
  /** Class name for the container */
  className?: string
  /** Class name for the display text */
  displayClassName?: string
  /** Class name for the input field */
  inputClassName?: string
  /** Whether the field is required (can't be empty) */
  required?: boolean
  /** Maximum length of the input */
  maxLength?: number
  /** Whether to show character count */
  showCharCount?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Validation function - returns error message or null */
  validate?: (value: string) => string | null
  /** Auto-focus the input when entering edit mode */
  autoFocus?: boolean
  /** Custom display renderer when not editing */
  renderDisplay?: (value: string) => React.ReactNode
}

/**
 * InlineEditText - A reusable component for inline text editing
 *
 * UX Best Practices:
 * - Click to edit: No separate edit button needed
 * - Auto-save on blur or Enter key
 * - Cancel on Escape key
 * - Visual feedback when hovering
 * - Input auto-focuses and selects text
 * - Validation support with error messages
 * - Reverts to original value on cancel
 */
export const InlineEditText: React.FC<InlineEditTextProps> = ({
  value,
  onSave,
  onCancel,
  placeholder = 'Click to edit',
  className = '',
  displayClassName = '',
  inputClassName = '',
  required = false,
  maxLength,
  showCharCount = false,
  disabled = false,
  validate,
  autoFocus = true,
  renderDisplay,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update edit value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && autoFocus && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing, autoFocus])

  const handleClick = () => {
    if (!disabled && !isEditing) {
      setIsEditing(true)
      setError(null)
    }
  }

  const handleSave = () => {
    // Validate
    if (required && !editValue.trim()) {
      setError('This field is required')
      return
    }

    if (validate) {
      const validationError = validate(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // Only save if value changed
    if (editValue !== value) {
      onSave(editValue)
    }

    setIsEditing(false)
    setError(null)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError(null)
    onCancel?.()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    // Small delay to allow click events on buttons to fire first
    setTimeout(() => {
      if (isEditing) {
        handleSave()
      }
    }, 100)
  }

  if (isEditing) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type='text'
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          maxLength={maxLength}
          className={`${inputClassName} ${error ? 'border-red-500' : ''}`}
          disabled={disabled}
        />
        {showCharCount && maxLength && (
          <div className='text-xs text-gray-500 mt-1'>
            {editValue.length} / {maxLength}
          </div>
        )}
        {error && <div className='text-xs text-red-500 mt-1'>{error}</div>}
        <div className='text-xs text-gray-500 mt-1'>Press Enter to save, Esc to cancel</div>
      </div>
    )
  }

  const displayValue = value || placeholder
  const displayClasses = `${displayClassName} ${
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
  } ${!value ? 'text-gray-400 italic' : ''}`

  return (
    <div
      onClick={handleClick}
      className={`${className} ${displayClasses}`}
      role='button'
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {renderDisplay ? renderDisplay(displayValue) : displayValue}
    </div>
  )
}
