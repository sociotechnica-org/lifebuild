import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'

export interface InlineEditTextareaProps {
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
  /** Class name for the textarea */
  textareaClassName?: string
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
  /** Auto-focus the textarea when entering edit mode */
  autoFocus?: boolean
  /** Custom display renderer when not editing */
  renderDisplay?: (value: string) => React.ReactNode
  /** Number of rows for the textarea */
  rows?: number
  /** Whether to auto-resize textarea based on content */
  autoResize?: boolean
}

/**
 * InlineEditTextarea - A reusable component for inline multi-line text editing
 *
 * UX Best Practices:
 * - Click to edit: No separate edit button needed
 * - Auto-save on blur or Ctrl/Cmd+Enter
 * - Cancel on Escape key
 * - Visual feedback when hovering
 * - Textarea auto-focuses and selects text
 * - Validation support with error messages
 * - Reverts to original value on cancel
 * - Auto-resize based on content (optional)
 */
export const InlineEditTextarea: React.FC<InlineEditTextareaProps> = ({
  value,
  onSave,
  onCancel,
  placeholder = 'Click to edit',
  className = '',
  displayClassName = '',
  textareaClassName = '',
  required = false,
  maxLength,
  showCharCount = false,
  disabled = false,
  validate,
  autoFocus = true,
  renderDisplay,
  rows = 3,
  autoResize = true,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update edit value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && autoFocus && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing, autoFocus])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (isEditing && autoResize && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [editValue, isEditing, autoResize])

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
  }

  if (isEditing) {
    return (
      <div className={className}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          maxLength={maxLength}
          rows={rows}
          className={`${textareaClassName} ${error ? 'border-red-500' : ''} ${
            autoResize ? 'resize-none overflow-hidden' : ''
          }`}
          disabled={disabled}
        />
        {showCharCount && maxLength && (
          <div className='text-xs text-gray-500 mt-1 px-3'>
            {editValue.length} / {maxLength}
          </div>
        )}
        {error && <div className='text-xs text-red-500 mt-1 px-3'>{error}</div>}
        <div className='text-xs text-gray-500 mt-1 px-3'>
          Press Ctrl+Enter (Cmd+Enter on Mac) to save, Esc to cancel
        </div>
      </div>
    )
  }

  const displayValue = value || placeholder
  const displayClasses = `${displayClassName} ${
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
  } ${!value ? 'text-gray-400 italic' : ''} whitespace-pre-wrap`

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        className={displayClasses}
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
      {/* Reserve space for help text to prevent jumping */}
      <div className='text-xs text-gray-500 mt-1 px-3 invisible'>
        Press Ctrl+Enter (Cmd+Enter on Mac) to save, Esc to cancel
      </div>
    </div>
  )
}
