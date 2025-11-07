import React, { useId } from 'react'
import { a11yTokens } from '../../../utils/a11y-tokens.js'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  fullWidth?: boolean
}

/**
 * Accessible input component with proper label association, error states, and ARIA attributes
 * Follows WCAG 2.2 Level AA guidelines
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      fullWidth = false,
      className = '',
      id: providedId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = providedId || generatedId
    const errorId = `${inputId}-error`
    const helperTextId = `${inputId}-helper`
    const hasError = Boolean(error)

    const baseClasses =
      'px-3 py-2 border rounded-md transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent'

    const stateClasses = hasError
      ? 'border-red-500 focus-visible:ring-red-500'
      : 'border-gray-300 focus-visible:ring-blue-500'

    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'

    const widthClass = fullWidth ? 'w-full' : ''

    const inputClasses = [baseClasses, stateClasses, disabledClasses, widthClass, className]
      .filter(Boolean)
      .join(' ')

    const describedBy = [error && errorId, helperText && helperTextId].filter(Boolean).join(' ')

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className='block text-sm font-medium text-gray-700 mb-1'>
            {label}
            {required && (
              <span className='text-red-600 ml-1' aria-label='required'>
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          aria-required={required}
          {...props}
        />
        {helperText && !error && (
          <p id={helperTextId} className='mt-1 text-sm text-gray-600'>
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className='mt-1 text-sm text-red-600' role='alert'>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
