import React, { useState, FormEvent } from 'react'

interface ContactFormProps {
  onSubmit: (name: string, email: string) => Promise<boolean>
  isLoading?: boolean
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, isLoading = false }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Validation
    if (!email.trim()) {
      setValidationError('Email is required')
      return
    }

    if (!validateEmail(email.trim())) {
      setValidationError('Please enter a valid email address')
      return
    }

    // Submit
    const success = await onSubmit(name.trim() || 'Unnamed Contact', email.trim())
    if (success) {
      setName('')
      setEmail('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
            Name
          </label>
          <input
            id='name'
            type='text'
            value={name}
            onChange={e => setName(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Enter contact name'
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
            Email *
          </label>
          <input
            id='email'
            type='text'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Enter email address'
            disabled={isLoading}
          />
        </div>
      </div>

      {validationError && (
        <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2'>
          {validationError}
        </div>
      )}

      <div>
        <button
          type='submit'
          disabled={isLoading || !email.trim()}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              Adding...
            </>
          ) : (
            'Add Contact'
          )}
        </button>
      </div>
    </form>
  )
}
