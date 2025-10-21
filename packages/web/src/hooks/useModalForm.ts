import { useState, useEffect, useCallback } from 'react'

export interface UseModalFormOptions<T> {
  /** Initial form values */
  initialValues: T
  /** Whether the modal is open */
  isOpen: boolean
  /** Validation function - return empty object if valid, or object with field errors */
  validate?: (values: T) => Partial<Record<keyof T, string>>
  /** Submit handler - can be async */
  onSubmit: (values: T) => void | Promise<void>
  /** Callback when form is closed */
  onClose?: () => void
  /** Reset form when modal closes (default: true) */
  resetOnClose?: boolean
}

export interface UseModalFormReturn<T> {
  /** Current form values */
  values: T
  /** Current form errors */
  errors: Partial<Record<keyof T, string>>
  /** Whether form is submitting */
  isSubmitting: boolean
  /** Update a single field value */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  /** Update a single field error */
  setFieldError: <K extends keyof T>(field: K, error: string | undefined) => void
  /** Handle form submission */
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  /** Reset form to initial values */
  reset: () => void
  /** Handle field change event */
  handleChange: <K extends keyof T>(
    field: K
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

/**
 * Hook for managing modal form state with validation, submission, and reset logic.
 *
 * @example
 * ```tsx
 * interface FormValues {
 *   name: string
 *   email: string
 * }
 *
 * const { values, errors, handleChange, handleSubmit, isSubmitting } = useModalForm({
 *   initialValues: { name: '', email: '' },
 *   isOpen,
 *   validate: (values) => {
 *     const errors: Partial<Record<keyof FormValues, string>> = {}
 *     if (!values.name) errors.name = 'Name is required'
 *     if (!values.email) errors.email = 'Email is required'
 *     return errors
 *   },
 *   onSubmit: async (values) => {
 *     await saveData(values)
 *     onClose()
 *   },
 * })
 * ```
 */
export function useModalForm<T extends Record<string, any>>({
  initialValues,
  isOpen,
  validate,
  onSubmit,
  onClose,
  resetOnClose = true,
}: UseModalFormOptions<T>): UseModalFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues)
      setErrors({})
      setIsSubmitting(false)
    } else if (resetOnClose) {
      setValues(initialValues)
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, resetOnClose]) // intentionally not including initialValues to avoid infinite loops

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string | undefined) => {
    setErrors(prev => {
      if (error === undefined) {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      }
      return { ...prev, [field]: error }
    })
  }, [])

  const handleChange = useCallback(
    <K extends keyof T>(field: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.value as T[K]
        setFieldValue(field, value)
      },
    [setFieldValue]
  )

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      // Validate if validation function provided
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          return
        }
      }

      setIsSubmitting(true)
      try {
        await onSubmit(values)
        // Don't reset here - let the parent component close the modal
        // which will trigger the reset via the isOpen effect
      } catch (error) {
        // Let the error bubble up to the parent component
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit]
  )

  return {
    values,
    errors,
    isSubmitting,
    setFieldValue,
    setFieldError,
    handleSubmit,
    reset,
    handleChange,
  }
}
